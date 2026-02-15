// =============================================
// RZManager – Smart Apply / Merge Engine
// =============================================
// Generates safe deployment SQL that synchronizes
// the editor's Working Project with a target SQL Server.
// Supports multiple Rappelz database versions.
// NO direct DB writes during editing — only at apply time.

import type { EnvironmentId, EnvironmentSchema, NodeSchema } from "@/lib/environment-schemas"
import { environmentSchemas } from "@/lib/environment-schemas"

// =============================================
// TYPES
// =============================================

export type DatabaseVersion =
  | "Arcadia_74"
  | "Arcadia_91"
  | "Arcadia_9.1"
  | "Custom"

export interface TargetDatabase {
  name: string
  version: DatabaseVersion
  host: string
  tables: string[]
}

// ---- Dependency Analyzer Types ----

export type DependencyStatus =
  | "FOUND_IN_PROJECT"
  | "FOUND_IN_DATABASE"
  | "MISSING_CRITICAL"
  | "MISSING_OPTIONAL"

export interface DependencyEntry {
  sourceEntity: string
  sourceEnv: EnvironmentId
  referencedId: number | string
  referencedTable: string
  referencedEnv: EnvironmentId | "external"
  fieldName: string
  status: DependencyStatus
}

export interface DependencyReport {
  entries: DependencyEntry[]
  criticalMissing: DependencyEntry[]
  optionalMissing: DependencyEntry[]
  foundInProject: DependencyEntry[]
  foundInDatabase: DependencyEntry[]
  canProceed: boolean
  timestamp: number
}

// ---- ID Resolution Types ----

export interface IdMapping {
  originalId: number
  resolvedId: number
  table: string
  wasConflict: boolean
}

export interface IdResolutionReport {
  mappings: Map<string, Map<number, number>> // table -> old -> new
  conflicts: IdMapping[]
  reservedRanges: Map<string, [number, number]>
}

// ---- Conflict Resolution Types ----

export type ConflictResolution = "update" | "generate_new_id" | "cancel"

export interface FieldDiff {
  fieldName: string
  oldValue: unknown
  newValue: unknown
  changed: boolean
}

export interface ConflictRecord {
  entityId: string
  entityName: string
  envId: EnvironmentId
  table: string
  desiredId: number
  existingDbRecord: Record<string, unknown>
  projectRecord: Record<string, unknown>
  diffs: FieldDiff[]
  changedFieldCount: number
  resolution: ConflictResolution | null
  selectedFields: Set<string> // which fields to update (when resolution=update)
  editedValues: Map<string, unknown> // manual edits from user
  generatedNewId: number | null // new ID when resolution=generate_new_id
}

export interface ConflictReport {
  conflicts: ConflictRecord[]
  totalConflicts: number
  resolvedCount: number
  allResolved: boolean
}

// ---- SQL Generation Types ----

export type SqlOperationType = "INSERT" | "UPDATE" | "MERGE"

export interface SqlStatement {
  operation: SqlOperationType
  table: string
  entityName: string
  envId: EnvironmentId
  sql: string
  order: number
  category: ExecutionCategory
  affectedId: number
  idRemapped: boolean
}

export type ExecutionCategory =
  | "base_entities"
  | "main_entities"
  | "secondary_data"
  | "relations"
  | "spawn"
  | "linking_tables"

// ---- Pipeline Types ----

export type PipelineStage =
  | "idle"
  | "validating"
  | "analyzing_dependencies"
  | "detecting_conflicts"
  | "resolving_conflicts"
  | "resolving_ids"
  | "generating_sql"
  | "preview"
  | "executing"
  | "committed"
  | "rolled_back"
  | "error"

export interface PipelineProgress {
  stage: PipelineStage
  stageIndex: number
  totalStages: number
  stageLabel: string
  stageProgress: number // 0-100
  message: string
  startedAt: number
  updatedAt: number
}

export interface ApplyResult {
  success: boolean
  statementsExecuted: number
  totalStatements: number
  dependencyReport: DependencyReport
  idResolutionReport: IdResolutionReport
  conflictReport: ConflictReport
  generatedSql: SqlStatement[]
  errors: ApplyError[]
  executionTimeMs: number
  affectedTables: string[]
}

export interface ApplyError {
  stage: PipelineStage
  message: string
  detail?: string
  statement?: SqlStatement
  isFatal: boolean
}

// ---- Working Project Types ----

export interface ProjectEntity {
  id: string // internal project id
  envId: EnvironmentId
  desiredId: number
  entityName: string
  rootNodeType: string
  fields: Record<string, unknown>
  references: ProjectReference[]
}

export interface ProjectReference {
  fieldName: string
  targetEnv: EnvironmentId
  targetId: number
  isCritical: boolean
}

export interface WorkingProject {
  name: string
  version: string
  entities: ProjectEntity[]
  targetDatabase: TargetDatabase
  createdAt: number
  modifiedAt: number
}

// =============================================
// TABLE MAPPING (Environment -> SQL Tables)
// =============================================

const ENV_TABLE_MAP: Record<EnvironmentId, string> = {
  npc: "NPCResource",
  item: "ItemResource",
  monster: "MonsterResource",
  quest: "QuestResource",
  skill: "SkillResource",
  state: "StateResource",
}

const ENV_ID_COLUMN: Record<EnvironmentId, string> = {
  npc: "id",
  item: "id",
  monster: "id",
  quest: "id",
  skill: "id",
  state: "id",
}

const EXECUTION_ORDER: Record<ExecutionCategory, number> = {
  base_entities: 1,
  main_entities: 2,
  secondary_data: 3,
  relations: 4,
  spawn: 5,
  linking_tables: 6,
}

const ENV_CATEGORY: Record<EnvironmentId, ExecutionCategory> = {
  state: "base_entities",
  skill: "base_entities",
  item: "main_entities",
  npc: "main_entities",
  monster: "main_entities",
  quest: "secondary_data",
}

// Which env types are critical references for other envs
const CRITICAL_DEPENDENCIES: Record<EnvironmentId, EnvironmentId[]> = {
  npc: ["item", "skill", "quest"],
  item: ["skill", "state"],
  monster: ["item", "skill"],
  quest: ["npc", "item", "monster"],
  skill: ["state"],
  state: [],
}

// =============================================
// DEPENDENCY ANALYZER
// =============================================

export function analyzeDependencies(
  project: WorkingProject,
  existingDbIds: Map<string, Set<number>>
): DependencyReport {
  const entries: DependencyEntry[] = []
  const projectIdsByEnv = new Map<EnvironmentId, Set<number>>()

  for (const entity of project.entities) {
    if (!projectIdsByEnv.has(entity.envId)) {
      projectIdsByEnv.set(entity.envId, new Set())
    }
    projectIdsByEnv.get(entity.envId)!.add(entity.desiredId)
  }

  for (const entity of project.entities) {
    for (const ref of entity.references) {
      const targetTable = ENV_TABLE_MAP[ref.targetEnv]
      const projectIds = projectIdsByEnv.get(ref.targetEnv)
      const dbIds = existingDbIds.get(targetTable)

      let status: DependencyStatus

      if (projectIds?.has(ref.targetId)) {
        status = "FOUND_IN_PROJECT"
      } else if (dbIds?.has(ref.targetId)) {
        status = "FOUND_IN_DATABASE"
      } else if (ref.isCritical) {
        status = "MISSING_CRITICAL"
      } else {
        status = "MISSING_OPTIONAL"
      }

      entries.push({
        sourceEntity: entity.entityName,
        sourceEnv: entity.envId,
        referencedId: ref.targetId,
        referencedTable: targetTable,
        referencedEnv: ref.targetEnv,
        fieldName: ref.fieldName,
        status,
      })
    }
  }

  const criticalMissing = entries.filter((e) => e.status === "MISSING_CRITICAL")
  const optionalMissing = entries.filter((e) => e.status === "MISSING_OPTIONAL")
  const foundInProject = entries.filter((e) => e.status === "FOUND_IN_PROJECT")
  const foundInDatabase = entries.filter((e) => e.status === "FOUND_IN_DATABASE")

  return {
    entries,
    criticalMissing,
    optionalMissing,
    foundInProject,
    foundInDatabase,
    canProceed: criticalMissing.length === 0,
    timestamp: Date.now(),
  }
}

// =============================================
// CONFLICT DETECTION & DIFF ENGINE
// =============================================

export function detectConflicts(
  project: WorkingProject,
  existingIds: Map<string, Set<number>>,
  existingDbRecords: Map<string, Map<number, Record<string, unknown>>>
): ConflictReport {
  const conflicts: ConflictRecord[] = []

  for (const entity of project.entities) {
    const table = ENV_TABLE_MAP[entity.envId]
    const existing = existingIds.get(table) ?? new Set()

    if (existing.has(entity.desiredId)) {
      // This ID exists in DB -> potential conflict
      const dbRecords = existingDbRecords.get(table)
      const dbRecord = dbRecords?.get(entity.desiredId) ?? {}

      const diffs = computeFieldDiffs(entity.fields, dbRecord)
      const changedFieldCount = diffs.filter((d) => d.changed).length

      conflicts.push({
        entityId: entity.id,
        entityName: entity.entityName,
        envId: entity.envId,
        table,
        desiredId: entity.desiredId,
        existingDbRecord: dbRecord,
        projectRecord: entity.fields,
        diffs,
        changedFieldCount,
        resolution: null,
        selectedFields: new Set(diffs.filter((d) => d.changed).map((d) => d.fieldName)),
        editedValues: new Map(),
        generatedNewId: null,
      })
    }
  }

  return {
    conflicts,
    totalConflicts: conflicts.length,
    resolvedCount: conflicts.filter((c) => c.resolution !== null).length,
    allResolved: conflicts.length === 0 || conflicts.every((c) => c.resolution !== null),
  }
}

export function computeFieldDiffs(
  projectFields: Record<string, unknown>,
  dbFields: Record<string, unknown>
): FieldDiff[] {
  const allKeys = new Set([
    ...Object.keys(projectFields),
    ...Object.keys(dbFields),
  ])

  const diffs: FieldDiff[] = []
  for (const key of allKeys) {
    if (key === "id") continue
    const oldVal = dbFields[key]
    const newVal = projectFields[key]
    diffs.push({
      fieldName: key,
      oldValue: oldVal ?? null,
      newValue: newVal ?? null,
      changed: String(oldVal ?? "") !== String(newVal ?? ""),
    })
  }

  return diffs
}

// Generate a safe new ID for a given table
export function generateSafeId(
  table: string,
  existingIds: Map<string, Set<number>>,
  maxIds: Map<string, number>,
  currentMappings?: Map<string, Map<number, number>>
): number {
  const existing = existingIds.get(table) ?? new Set()
  const max = maxIds.get(table) ?? 100000
  let newId = max + 1

  // Also avoid IDs already used in current mappings
  const mappedIds = new Set<number>()
  if (currentMappings) {
    const tableMap = currentMappings.get(table)
    if (tableMap) {
      for (const resolvedId of tableMap.values()) {
        mappedIds.add(resolvedId)
      }
    }
  }

  while (existing.has(newId) || mappedIds.has(newId)) {
    newId++
  }

  return newId
}

// Generate partial UPDATE SQL with only changed fields (diff-aware)
export function generateDiffAwareUpdate(
  table: string,
  idColumn: string,
  id: number,
  conflict: ConflictRecord
): string {
  const fieldsToUpdate: [string, unknown][] = []

  for (const diff of conflict.diffs) {
    if (!conflict.selectedFields.has(diff.fieldName)) continue
    if (!diff.changed) continue

    const value = conflict.editedValues.has(diff.fieldName)
      ? conflict.editedValues.get(diff.fieldName)
      : diff.newValue

    fieldsToUpdate.push([diff.fieldName, value])
  }

  if (fieldsToUpdate.length === 0) {
    return `-- SKIP: No changed fields selected for ${table} id=${id}`
  }

  const setClauses = fieldsToUpdate
    .map(([key, val]) => `    [${key}] = ${escapeValue(val)}`)
    .join(",\n")

  return [
    `-- DIFF-AWARE UPDATE (${fieldsToUpdate.length} field(s) changed)`,
    `IF EXISTS (SELECT 1 FROM [dbo].[${table}] WHERE [${idColumn}] = ${id})`,
    `BEGIN`,
    `  UPDATE [dbo].[${table}]`,
    `  SET`,
    setClauses,
    `  WHERE [${idColumn}] = ${id}`,
    `END`,
  ].join("\n")
}

// =============================================
// ID RESOLUTION SYSTEM
// =============================================

export function resolveIds(
  project: WorkingProject,
  existingIds: Map<string, Set<number>>,
  maxIds: Map<string, number>,
  conflictReport?: ConflictReport,
  reservedRanges?: Map<string, [number, number]>
): IdResolutionReport {
  const mappings = new Map<string, Map<number, number>>()
  const conflicts: IdMapping[] = []
  const ranges = reservedRanges ?? new Map<string, [number, number]>()

  const nextId = new Map<string, number>()
  for (const [table, max] of maxIds) {
    const reserved = ranges.get(table)
    let startFrom = max + 1
    if (reserved && startFrom >= reserved[0] && startFrom <= reserved[1]) {
      startFrom = reserved[1] + 1
    }
    nextId.set(table, startFrom)
  }

  for (const entity of project.entities) {
    const table = ENV_TABLE_MAP[entity.envId]
    if (!mappings.has(table)) {
      mappings.set(table, new Map())
    }
    const tableMap = mappings.get(table)!
    const existing = existingIds.get(table) ?? new Set()

    // Check if this entity has a conflict resolution
    const conflictRecord = conflictReport?.conflicts.find(
      (c) => c.entityId === entity.id
    )

    if (conflictRecord) {
      if (conflictRecord.resolution === "generate_new_id" && conflictRecord.generatedNewId) {
        // User chose new ID
        tableMap.set(entity.desiredId, conflictRecord.generatedNewId)
        conflicts.push({
          originalId: entity.desiredId,
          resolvedId: conflictRecord.generatedNewId,
          table,
          wasConflict: true,
        })
        continue
      } else if (conflictRecord.resolution === "update") {
        // Keep original ID — will UPDATE existing record
        tableMap.set(entity.desiredId, entity.desiredId)
        continue
      } else if (conflictRecord.resolution === "cancel") {
        // Skip entirely — don't add mapping
        continue
      }
    }

    if (!existing.has(entity.desiredId)) {
      tableMap.set(entity.desiredId, entity.desiredId)
    } else {
      // Auto-resolve: generate new ID
      let newId = nextId.get(table) ?? 100000
      const reserved = ranges.get(table)

      while (
        existing.has(newId) ||
        (reserved && newId >= reserved[0] && newId <= reserved[1])
      ) {
        newId++
      }

      tableMap.set(entity.desiredId, newId)
      nextId.set(table, newId + 1)

      conflicts.push({
        originalId: entity.desiredId,
        resolvedId: newId,
        table,
        wasConflict: true,
      })
    }
  }

  return { mappings, conflicts, reservedRanges: ranges }
}

// =============================================
// RELATION REMAPPING
// =============================================

function remapEntityReferences(
  entity: ProjectEntity,
  idReport: IdResolutionReport
): Record<string, unknown> {
  const remapped = { ...entity.fields }

  for (const ref of entity.references) {
    const targetTable = ENV_TABLE_MAP[ref.targetEnv]
    const tableMap = idReport.mappings.get(targetTable)
    if (tableMap && tableMap.has(ref.targetId)) {
      remapped[ref.fieldName] = tableMap.get(ref.targetId)
    }
  }

  const ownTable = ENV_TABLE_MAP[entity.envId]
  const ownMap = idReport.mappings.get(ownTable)
  if (ownMap && ownMap.has(entity.desiredId)) {
    remapped["id"] = ownMap.get(entity.desiredId)
  }

  return remapped
}

// =============================================
// SQL GENERATOR
// =============================================

function escapeValue(val: unknown): string {
  if (val === null || val === undefined) return "NULL"
  if (typeof val === "number") return String(val)
  if (typeof val === "boolean") return val ? "1" : "0"
  const str = String(val).replace(/'/g, "''")
  return `N'${str}'`
}

function generateMergeStatement(
  table: string,
  idColumn: string,
  id: number,
  fields: Record<string, unknown>,
  existsInDb: boolean
): string {
  const filteredFields = Object.entries(fields).filter(
    ([key]) => key !== "id" && key !== idColumn
  )

  if (existsInDb) {
    const setClauses = filteredFields
      .map(([key, val]) => `    [${key}] = ${escapeValue(val)}`)
      .join(",\n")

    return [
      `-- UPDATE existing record`,
      `IF EXISTS (SELECT 1 FROM [dbo].[${table}] WHERE [${idColumn}] = ${id})`,
      `BEGIN`,
      `  UPDATE [dbo].[${table}]`,
      `  SET`,
      setClauses,
      `  WHERE [${idColumn}] = ${id}`,
      `END`,
    ].join("\n")
  } else {
    const columns = [idColumn, ...filteredFields.map(([k]) => k)]
    const values = [String(id), ...filteredFields.map(([, v]) => escapeValue(v))]

    return [
      `-- INSERT new record`,
      `IF NOT EXISTS (SELECT 1 FROM [dbo].[${table}] WHERE [${idColumn}] = ${id})`,
      `BEGIN`,
      `  INSERT INTO [dbo].[${table}] (`,
      `    ${columns.map((c) => `[${c}]`).join(", ")}`,
      `  )`,
      `  VALUES (`,
      `    ${values.join(", ")}`,
      `  )`,
      `END`,
    ].join("\n")
  }
}

export function generateSqlScript(
  project: WorkingProject,
  idReport: IdResolutionReport,
  existingIds: Map<string, Set<number>>,
  conflictReport?: ConflictReport
): SqlStatement[] {
  const statements: SqlStatement[] = []

  const sortedEntities = [...project.entities].sort((a, b) => {
    const catA = ENV_CATEGORY[a.envId]
    const catB = ENV_CATEGORY[b.envId]
    return EXECUTION_ORDER[catA] - EXECUTION_ORDER[catB]
  })

  for (const entity of sortedEntities) {
    const table = ENV_TABLE_MAP[entity.envId]
    const idColumn = ENV_ID_COLUMN[entity.envId]
    const category = ENV_CATEGORY[entity.envId]

    // Check if cancelled
    const conflictRecord = conflictReport?.conflicts.find(
      (c) => c.entityId === entity.id
    )
    if (conflictRecord?.resolution === "cancel") continue

    const remappedFields = remapEntityReferences(entity, idReport)
    const resolvedId = (remappedFields["id"] as number) ?? entity.desiredId

    const existing = existingIds.get(table) ?? new Set()
    const existsInDb = existing.has(entity.desiredId)

    const ownMap = idReport.mappings.get(table)
    const idRemapped = ownMap
      ? ownMap.get(entity.desiredId) !== entity.desiredId
      : false

    // If conflict was resolved as UPDATE with diff-aware approach
    if (conflictRecord?.resolution === "update" && existsInDb) {
      const sql = generateDiffAwareUpdate(table, idColumn, resolvedId, conflictRecord)
      statements.push({
        operation: "UPDATE",
        table,
        entityName: entity.entityName,
        envId: entity.envId,
        sql,
        order: EXECUTION_ORDER[category],
        category,
        affectedId: resolvedId,
        idRemapped: false,
      })
      continue
    }

    // If conflict generated new ID, it's now an INSERT
    const operation: SqlOperationType =
      conflictRecord?.resolution === "generate_new_id"
        ? "INSERT"
        : existsInDb
          ? "UPDATE"
          : "INSERT"

    const effectiveExistsInDb =
      conflictRecord?.resolution === "generate_new_id" ? false : existsInDb

    const sql = generateMergeStatement(
      table,
      idColumn,
      resolvedId,
      remappedFields,
      effectiveExistsInDb
    )

    statements.push({
      operation,
      table,
      entityName: entity.entityName,
      envId: entity.envId,
      sql,
      order: EXECUTION_ORDER[category],
      category,
      affectedId: resolvedId,
      idRemapped,
    })
  }

  return statements.sort((a, b) => a.order - b.order)
}

// =============================================
// FULL SCRIPT WRAPPER (Transaction-Safe)
// =============================================

export function wrapInTransaction(
  statements: SqlStatement[],
  targetDb: TargetDatabase
): string {
  const header = [
    `-- =============================================`,
    `-- RZManager Smart Apply Script`,
    `-- Target: ${targetDb.name} (${targetDb.version})`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Statements: ${statements.length}`,
    `-- =============================================`,
    ``,
    `USE [${targetDb.name}]`,
    `GO`,
    ``,
    `SET XACT_ABORT ON`,
    `SET NOCOUNT ON`,
    ``,
    `BEGIN TRY`,
    `  BEGIN TRANSACTION`,
    ``,
  ].join("\n")

  const body = statements
    .map((stmt, i) => {
      const remapNote = stmt.idRemapped
        ? `  -- NOTE: ID was remapped to avoid conflict`
        : ``
      return [
        `  -- [${i + 1}/${statements.length}] ${stmt.operation} ${stmt.entityName} -> ${stmt.table} (id: ${stmt.affectedId})`,
        remapNote,
        stmt.sql
          .split("\n")
          .map((line) => `  ${line}`)
          .join("\n"),
        ``,
      ]
        .filter(Boolean)
        .join("\n")
    })
    .join("\n")

  const footer = [
    ``,
    `  COMMIT TRANSACTION`,
    `  PRINT 'Smart Apply completed successfully. ${statements.length} statements executed.'`,
    `END TRY`,
    `BEGIN CATCH`,
    `  IF @@TRANCOUNT > 0`,
    `    ROLLBACK TRANSACTION`,
    ``,
    `  DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE()`,
    `  DECLARE @ErrorSeverity INT = ERROR_SEVERITY()`,
    `  DECLARE @ErrorState INT = ERROR_STATE()`,
    `  DECLARE @ErrorLine INT = ERROR_LINE()`,
    ``,
    `  PRINT 'Smart Apply FAILED at line ' + CAST(@ErrorLine AS VARCHAR(10))`,
    `  PRINT 'Error: ' + @ErrorMessage`,
    ``,
    `  RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState)`,
    `END CATCH`,
    `GO`,
  ].join("\n")

  return header + body + footer
}

// =============================================
// APPLY PIPELINE (Orchestrator)
// =============================================

export async function runApplyPipeline(
  project: WorkingProject,
  existingIds: Map<string, Set<number>>,
  maxIds: Map<string, number>,
  existingDbRecords: Map<string, Map<number, Record<string, unknown>>>,
  onProgress: (progress: PipelineProgress) => void,
  conflictReport?: ConflictReport
): Promise<ApplyResult> {
  const startTime = Date.now()
  const errors: ApplyError[] = []
  const stages: PipelineStage[] = [
    "validating",
    "analyzing_dependencies",
    "detecting_conflicts",
    "resolving_ids",
    "generating_sql",
    "preview",
  ]
  const stageLabels: Record<string, string> = {
    validating: "Validating Project Structure",
    analyzing_dependencies: "Analyzing Dependencies",
    detecting_conflicts: "Detecting Conflicts",
    resolving_ids: "Resolving ID Conflicts",
    generating_sql: "Generating SQL Script",
    preview: "Preview Ready",
  }

  function emitProgress(stage: PipelineStage, progress: number, message: string) {
    onProgress({
      stage,
      stageIndex: stages.indexOf(stage),
      totalStages: stages.length,
      stageLabel: stageLabels[stage] ?? stage,
      stageProgress: progress,
      message,
      startedAt: startTime,
      updatedAt: Date.now(),
    })
  }

  // Stage 1: Validate
  emitProgress("validating", 0, "Checking project structure...")
  await sleep(300)

  if (project.entities.length === 0) {
    errors.push({
      stage: "validating",
      message: "Project contains no entities",
      isFatal: true,
    })
    emitProgress("error", 100, "Validation failed: empty project")
    return buildResult(false, [], emptyDepReport(), emptyIdReport(), emptyConflictReport(), errors, startTime)
  }

  for (const entity of project.entities) {
    const schema = environmentSchemas[entity.envId]
    if (!schema) {
      errors.push({
        stage: "validating",
        message: `Unknown environment: ${entity.envId}`,
        detail: `Entity "${entity.entityName}" references unknown environment`,
        isFatal: true,
      })
    }
  }

  if (errors.some((e) => e.isFatal)) {
    emitProgress("error", 100, "Validation failed")
    return buildResult(false, [], emptyDepReport(), emptyIdReport(), emptyConflictReport(), errors, startTime)
  }

  emitProgress("validating", 100, "Project structure valid")
  await sleep(200)

  // Stage 2: Dependency Analysis
  emitProgress("analyzing_dependencies", 0, "Scanning entity references...")
  await sleep(400)

  const depReport = analyzeDependencies(project, existingIds)

  emitProgress(
    "analyzing_dependencies",
    60,
    `Found ${depReport.entries.length} references...`
  )
  await sleep(300)

  if (!depReport.canProceed) {
    emitProgress(
      "analyzing_dependencies",
      100,
      `BLOCKED: ${depReport.criticalMissing.length} critical dependencies missing`
    )
    errors.push({
      stage: "analyzing_dependencies",
      message: `${depReport.criticalMissing.length} critical dependencies are missing`,
      detail: depReport.criticalMissing
        .map(
          (d) =>
            `${d.sourceEntity}.${d.fieldName} -> ${d.referencedTable}:${d.referencedId}`
        )
        .join("; "),
      isFatal: true,
    })
    return buildResult(false, [], depReport, emptyIdReport(), emptyConflictReport(), errors, startTime)
  }

  emitProgress("analyzing_dependencies", 100, "All dependencies satisfied")
  await sleep(200)

  // Stage 3: Conflict Detection
  emitProgress("detecting_conflicts", 0, "Scanning for ID and record conflicts...")
  await sleep(350)

  const detectedConflicts = conflictReport ?? detectConflicts(project, existingIds, existingDbRecords)

  emitProgress(
    "detecting_conflicts",
    100,
    detectedConflicts.totalConflicts === 0
      ? "No conflicts detected"
      : `${detectedConflicts.totalConflicts} conflict(s) found — ${detectedConflicts.resolvedCount} resolved`
  )
  await sleep(200)

  // If there are unresolved conflicts, pause pipeline here
  if (!detectedConflicts.allResolved) {
    emitProgress(
      "detecting_conflicts",
      100,
      `WAITING: ${detectedConflicts.totalConflicts - detectedConflicts.resolvedCount} conflict(s) need resolution`
    )
    return buildResult(
      false,
      [],
      depReport,
      emptyIdReport(),
      detectedConflicts,
      [{
        stage: "detecting_conflicts",
        message: `${detectedConflicts.totalConflicts - detectedConflicts.resolvedCount} conflict(s) require resolution before proceeding`,
        isFatal: false,
      }],
      startTime
    )
  }

  // Stage 4: ID Resolution (conflict-aware)
  emitProgress("resolving_ids", 0, "Checking ID conflicts...")
  await sleep(300)

  const idReport = resolveIds(project, existingIds, maxIds, detectedConflicts)

  emitProgress(
    "resolving_ids",
    70,
    `${idReport.conflicts.length} conflicts found, remapping...`
  )
  await sleep(300)

  emitProgress("resolving_ids", 100, "IDs resolved")
  await sleep(200)

  // Stage 5: SQL Generation (conflict-aware)
  emitProgress("generating_sql", 0, "Building merge statements...")
  await sleep(300)

  const statements = generateSqlScript(project, idReport, existingIds, detectedConflicts)

  emitProgress(
    "generating_sql",
    50,
    `Generated ${statements.length} statements...`
  )
  await sleep(300)

  emitProgress("generating_sql", 100, "SQL script ready")
  await sleep(150)

  // Stage 6: Preview
  emitProgress("preview", 100, "Ready for review")

  const affectedTables = [...new Set(statements.map((s) => s.table))]

  return buildResult(
    true,
    statements,
    depReport,
    idReport,
    detectedConflicts,
    errors,
    startTime,
    affectedTables
  )
}

// =============================================
// HELPERS
// =============================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function emptyDepReport(): DependencyReport {
  return {
    entries: [],
    criticalMissing: [],
    optionalMissing: [],
    foundInProject: [],
    foundInDatabase: [],
    canProceed: false,
    timestamp: Date.now(),
  }
}

function emptyIdReport(): IdResolutionReport {
  return {
    mappings: new Map(),
    conflicts: [],
    reservedRanges: new Map(),
  }
}

function emptyConflictReport(): ConflictReport {
  return {
    conflicts: [],
    totalConflicts: 0,
    resolvedCount: 0,
    allResolved: true,
  }
}

function buildResult(
  success: boolean,
  statements: SqlStatement[],
  depReport: DependencyReport,
  idReport: IdResolutionReport,
  conflictReport: ConflictReport,
  errors: ApplyError[],
  startTime: number,
  affectedTables: string[] = []
): ApplyResult {
  return {
    success,
    statementsExecuted: success ? statements.length : 0,
    totalStatements: statements.length,
    dependencyReport: depReport,
    idResolutionReport: idReport,
    conflictReport,
    generatedSql: statements,
    errors,
    executionTimeMs: Date.now() - startTime,
    affectedTables,
  }
}

// =============================================
// MOCK DATA (for UI preview)
// =============================================

export function createMockProject(): WorkingProject {
  return {
    name: "Arcadia Content Pack v1.2",
    version: "1.2.0",
    targetDatabase: {
      name: "Arcadia_91",
      version: "Arcadia_91",
      host: "localhost\\SQLEXPRESS",
      tables: [
        "NPCResource",
        "ItemResource",
        "MonsterResource",
        "QuestResource",
        "SkillResource",
        "StateResource",
        "StringResource",
      ],
    },
    entities: [
      {
        id: "proj-npc-1",
        envId: "npc",
        desiredId: 50042,
        entityName: "Elder Marcus",
        rootNodeType: "npc-root",
        fields: {
          name_text_id: 110042,
          text_id: 110043,
          level: 45,
          race_id: 3,
          sexsual_id: 1,
          x: 152340,
          y: 32100,
          z: 0,
          stat_id: 8012,
          weapon_item_id: 30015,
          shield_item_id: 0,
          clothes_item_id: 30088,
        },
        references: [
          { fieldName: "weapon_item_id", targetEnv: "item", targetId: 30015, isCritical: true },
          { fieldName: "clothes_item_id", targetEnv: "item", targetId: 30088, isCritical: true },
        ],
      },
      {
        id: "proj-npc-2",
        envId: "npc",
        desiredId: 50043,
        entityName: "Guard Captain Elise",
        rootNodeType: "npc-root",
        fields: {
          name_text_id: 110044,
          text_id: 110045,
          level: 60,
          race_id: 1,
          sexsual_id: 2,
          x: 153200,
          y: 32400,
          z: 0,
          stat_id: 8015,
          weapon_item_id: 30022,
          shield_item_id: 30055,
          clothes_item_id: 30090,
        },
        references: [
          { fieldName: "weapon_item_id", targetEnv: "item", targetId: 30022, isCritical: true },
          { fieldName: "shield_item_id", targetEnv: "item", targetId: 30055, isCritical: true },
          { fieldName: "clothes_item_id", targetEnv: "item", targetId: 30090, isCritical: true },
        ],
      },
      {
        id: "proj-item-1",
        envId: "item",
        desiredId: 30015,
        entityName: "Dragon Scale Sword",
        rootNodeType: "item-root",
        fields: {
          name_id: 120030,
          tooltip_id: 120031,
          type: 1,
          level: 40,
          grade: 4,
          skill_id: 5010,
          state_id: 7001,
        },
        references: [
          { fieldName: "skill_id", targetEnv: "skill", targetId: 5010, isCritical: true },
          { fieldName: "state_id", targetEnv: "state", targetId: 7001, isCritical: false },
        ],
      },
      {
        id: "proj-item-2",
        envId: "item",
        desiredId: 30022,
        entityName: "Guardian Blade",
        rootNodeType: "item-root",
        fields: {
          name_id: 120040,
          tooltip_id: 120041,
          type: 1,
          level: 55,
          grade: 5,
          skill_id: 5012,
          state_id: 7003,
        },
        references: [
          { fieldName: "skill_id", targetEnv: "skill", targetId: 5012, isCritical: true },
          { fieldName: "state_id", targetEnv: "state", targetId: 7003, isCritical: false },
        ],
      },
      {
        id: "proj-item-3",
        envId: "item",
        desiredId: 30055,
        entityName: "Mithril Shield",
        rootNodeType: "item-root",
        fields: {
          name_id: 120060,
          tooltip_id: 120061,
          type: 3,
          level: 50,
          grade: 4,
        },
        references: [],
      },
      {
        id: "proj-item-4",
        envId: "item",
        desiredId: 30088,
        entityName: "Sage Robes",
        rootNodeType: "item-root",
        fields: {
          name_id: 120080,
          tooltip_id: 120081,
          type: 2,
          level: 42,
          grade: 3,
        },
        references: [],
      },
      {
        id: "proj-item-5",
        envId: "item",
        desiredId: 30090,
        entityName: "Captain Armor",
        rootNodeType: "item-root",
        fields: {
          name_id: 120090,
          tooltip_id: 120091,
          type: 2,
          level: 58,
          grade: 5,
        },
        references: [],
      },
      {
        id: "proj-skill-1",
        envId: "skill",
        desiredId: 5010,
        entityName: "Flame Strike",
        rootNodeType: "skill-root",
        fields: {
          text_id: 130010,
          desc_id: 130011,
          tooltip_id: 130012,
          state_id: 7001,
        },
        references: [
          { fieldName: "state_id", targetEnv: "state", targetId: 7001, isCritical: false },
        ],
      },
      {
        id: "proj-skill-2",
        envId: "skill",
        desiredId: 5012,
        entityName: "Shield Bash",
        rootNodeType: "skill-root",
        fields: {
          text_id: 130020,
          desc_id: 130021,
          tooltip_id: 130022,
          state_id: 7003,
        },
        references: [
          { fieldName: "state_id", targetEnv: "state", targetId: 7003, isCritical: false },
        ],
      },
      {
        id: "proj-state-1",
        envId: "state",
        desiredId: 7001,
        entityName: "Burning",
        rootNodeType: "state-root",
        fields: {
          text_id: 140001,
          tooltip_id: 140002,
          value_0: 15,
          value_1: 3,
          value_2: 0,
        },
        references: [],
      },
      {
        id: "proj-state-2",
        envId: "state",
        desiredId: 7003,
        entityName: "Stunned",
        rootNodeType: "state-root",
        fields: {
          text_id: 140010,
          tooltip_id: 140011,
          value_0: 0,
          value_1: 5,
          value_2: 1,
        },
        references: [],
      },
      {
        id: "proj-monster-1",
        envId: "monster",
        desiredId: 20005,
        entityName: "Fire Drake",
        rootNodeType: "monster-root",
        fields: {
          name_id: 150010,
          level: 48,
          stat_id: 9001,
          monster_skill_link_id: 600,
          drop_table_link_id: 4500,
        },
        references: [],
      },
      {
        id: "proj-quest-1",
        envId: "quest",
        desiredId: 10001,
        entityName: "The Elder's Request",
        rootNodeType: "quest-root",
        fields: {
          text_id_quest: 160010,
          text_id_summary: 160011,
          text_id_status: 160012,
        },
        references: [],
      },
    ],
    createdAt: Date.now() - 86400000 * 3,
    modifiedAt: Date.now() - 3600000,
  }
}

export function createMockExistingIds(): Map<string, Set<number>> {
  const map = new Map<string, Set<number>>()
  map.set("NPCResource", new Set([50042]))
  map.set("ItemResource", new Set([30015, 30022]))
  map.set("MonsterResource", new Set())
  map.set("QuestResource", new Set())
  map.set("SkillResource", new Set([5010]))
  map.set("StateResource", new Set())
  return map
}

export function createMockMaxIds(): Map<string, number> {
  const map = new Map<string, number>()
  map.set("NPCResource", 55000)
  map.set("ItemResource", 35000)
  map.set("MonsterResource", 25000)
  map.set("QuestResource", 15000)
  map.set("SkillResource", 8000)
  map.set("StateResource", 9000)
  return map
}

// Mock DB records for entities that already exist (to power the diff engine)
export function createMockExistingDbRecords(): Map<string, Map<number, Record<string, unknown>>> {
  const records = new Map<string, Map<number, Record<string, unknown>>>()

  // NPC 50042 exists with different values
  const npcRecords = new Map<number, Record<string, unknown>>()
  npcRecords.set(50042, {
    name_text_id: 110042,
    text_id: 110040,       // DIFFERENT
    level: 40,             // DIFFERENT (was 40, project wants 45)
    race_id: 3,
    sexsual_id: 1,
    x: 152000,             // DIFFERENT (positional shift)
    y: 32100,
    z: 0,
    stat_id: 8010,         // DIFFERENT
    weapon_item_id: 30010, // DIFFERENT (old weapon)
    shield_item_id: 0,
    clothes_item_id: 30080, // DIFFERENT
  })
  records.set("NPCResource", npcRecords)

  // Items 30015 and 30022 exist with different values
  const itemRecords = new Map<number, Record<string, unknown>>()
  itemRecords.set(30015, {
    name_id: 120030,
    tooltip_id: 120031,
    type: 1,
    level: 35,             // DIFFERENT (was 35, project wants 40)
    grade: 3,              // DIFFERENT (was 3, project wants 4)
    skill_id: 5008,        // DIFFERENT (old skill)
    state_id: 7001,
  })
  itemRecords.set(30022, {
    name_id: 120040,
    tooltip_id: 120041,
    type: 1,
    level: 55,             // SAME
    grade: 4,              // DIFFERENT (was 4, project wants 5)
    skill_id: 5012,        // SAME
    state_id: 7002,        // DIFFERENT
  })
  records.set("ItemResource", itemRecords)

  // Skill 5010 exists with minor differences
  const skillRecords = new Map<number, Record<string, unknown>>()
  skillRecords.set(5010, {
    text_id: 130010,       // SAME
    desc_id: 130009,       // DIFFERENT
    tooltip_id: 130012,    // SAME
    state_id: 7001,        // SAME
  })
  records.set("SkillResource", skillRecords)

  records.set("MonsterResource", new Map())
  records.set("QuestResource", new Map())
  records.set("StateResource", new Map())

  return records
}
