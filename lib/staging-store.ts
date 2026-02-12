// ============================================================
// Staging & Commit Store
// ============================================================
// Lightweight internal Git-like engine for Rappelz data changes.
// All changes flow: Canvas edit -> Staged Change -> Commit -> Apply.
// The database is NEVER modified until explicit Apply.

// --- Types ---

import { getActiveWorkspace } from "@/lib/workspace-store"

export type EntityType = "NPC" | "Item" | "Monster" | "Quest" | "Skill" | "State"
export type OperationType = "Create" | "Update" | "Delete"
export type StagedChangeStatus = "Draft" | "Committed" | "Applied" | "Reverted"
export type CommitStatus = "Pending" | "Applied" | "Failed" | "Reverted"

export interface StagedChange {
  id: string
  workspaceId: string
  profileId: string
  entityType: EntityType
  entityId: string | number
  entityName: string
  operationType: OperationType
  previousSnapshot: Record<string, unknown> | null
  newSnapshot: Record<string, unknown> | null
  generatedSQL: string
  status: StagedChangeStatus
  timestamp: string
}

export interface Commit {
  id: string
  workspaceId: string
  profileId: string
  message: string
  author: string
  timestamp: string
  changeIds: string[]
  status: CommitStatus
  appliedAt: string | null
  errorLog: string | null
}

// --- SQL Generator ---

function escapeSQL(val: unknown): string {
  if (val === null || val === undefined) return "NULL"
  if (typeof val === "number") return String(val)
  if (typeof val === "boolean") return val ? "1" : "0"
  return `N'${String(val).replace(/'/g, "''")}'`
}

function tableForEntity(entityType: EntityType): string {
  const map: Record<EntityType, string> = {
    NPC: "dbo.NPCResource",
    Item: "dbo.ItemResource",
    Monster: "dbo.MonsterResource",
    Quest: "dbo.QuestResource",
    Skill: "dbo.SkillResource",
    State: "dbo.StateResource",
  }
  return map[entityType]
}

export function generateSQL(
  entityType: EntityType,
  operation: OperationType,
  entityId: string | number,
  previousSnapshot: Record<string, unknown> | null,
  newSnapshot: Record<string, unknown> | null,
): string {
  const table = tableForEntity(entityType)

  if (operation === "Create" && newSnapshot) {
    const cols = Object.keys(newSnapshot)
    const vals = cols.map((c) => escapeSQL(newSnapshot[c]))
    return `INSERT INTO ${table} (${cols.join(", ")})\nVALUES (${vals.join(", ")});`
  }

  if (operation === "Update" && newSnapshot && previousSnapshot) {
    const changed = Object.keys(newSnapshot).filter(
      (k) => JSON.stringify(newSnapshot[k]) !== JSON.stringify(previousSnapshot[k]),
    )
    if (changed.length === 0) return `-- No changes detected for ${table} id=${entityId}`
    const sets = changed.map((c) => `  ${c} = ${escapeSQL(newSnapshot[c])}`)
    return `UPDATE ${table}\nSET\n${sets.join(",\n")}\nWHERE id = ${escapeSQL(entityId)};`
  }

  if (operation === "Delete") {
    return `DELETE FROM ${table}\nWHERE id = ${escapeSQL(entityId)};`
  }

  return `-- Unknown operation for ${table} id=${entityId}`
}

/**
 * Generate reverse SQL for a revert operation.
 * This creates the SQL to undo a previously-applied change.
 */
export function generateReverseSQL(change: StagedChange): string {
  const table = tableForEntity(change.entityType)

  if (change.operationType === "Create") {
    // Undo create = delete
    return `-- Revert CREATE: delete the inserted row\nDELETE FROM ${table}\nWHERE id = ${escapeSQL(change.entityId)};`
  }

  if (change.operationType === "Update" && change.previousSnapshot) {
    // Undo update = restore previous values
    const cols = Object.keys(change.previousSnapshot)
    const sets = cols.map((c) => `  ${c} = ${escapeSQL(change.previousSnapshot![c])}`)
    return `-- Revert UPDATE: restore previous values\nUPDATE ${table}\nSET\n${sets.join(",\n")}\nWHERE id = ${escapeSQL(change.entityId)};`
  }

  if (change.operationType === "Delete" && change.previousSnapshot) {
    // Undo delete = re-insert
    const cols = Object.keys(change.previousSnapshot)
    const vals = cols.map((c) => escapeSQL(change.previousSnapshot![c]))
    return `-- Revert DELETE: re-insert deleted row\nINSERT INTO ${table} (${cols.join(", ")})\nVALUES (${vals.join(", ")});`
  }

  return `-- Cannot generate revert SQL for ${change.operationType} on ${table} id=${change.entityId}`
}

// ============================================================
// In-memory stores
// ============================================================

const changeStore = new Map<string, StagedChange>()
const commitStore = new Map<string, Commit>()

// --- Staged Change CRUD ---

export function createStagedChange(
  workspaceId: string,
  profileId: string,
  entityType: EntityType,
  entityId: string | number,
  entityName: string,
  operationType: OperationType,
  previousSnapshot: Record<string, unknown> | null,
  newSnapshot: Record<string, unknown> | null,
): StagedChange {
  const sql = generateSQL(entityType, operationType, entityId, previousSnapshot, newSnapshot)
  const change: StagedChange = {
    id: crypto.randomUUID(),
    workspaceId,
    profileId,
    entityType,
    entityId,
    entityName,
    operationType,
    previousSnapshot: previousSnapshot ? structuredClone(previousSnapshot) : null,
    newSnapshot: newSnapshot ? structuredClone(newSnapshot) : null,
    generatedSQL: sql,
    status: "Draft",
    timestamp: new Date().toISOString(),
  }
  changeStore.set(change.id, change)
  return change
}

export function getStagedChange(id: string): StagedChange | undefined {
  return changeStore.get(id)
}

export function getAllStagedChanges(): StagedChange[] {
  return Array.from(changeStore.values())
}

export function getDraftChanges(workspaceId: string): StagedChange[] {
  return Array.from(changeStore.values()).filter(
    (c) => c.workspaceId === workspaceId && c.status === "Draft",
  )
}

export function getChangesForCommit(commitId: string): StagedChange[] {
  const commit = commitStore.get(commitId)
  if (!commit) return []
  return commit.changeIds.map((id) => changeStore.get(id)).filter(Boolean) as StagedChange[]
}

export function deleteStagedChange(id: string): void {
  const change = changeStore.get(id)
  if (change && change.status === "Draft") {
    changeStore.delete(id)
  }
}

// --- Commit CRUD ---

export function createCommit(
  workspaceId: string,
  profileId: string,
  message: string,
  author: string,
  changeIds: string[],
): Commit {
  const commit: Commit = {
    id: crypto.randomUUID(),
    workspaceId,
    profileId,
    message,
    author,
    timestamp: new Date().toISOString(),
    changeIds: [...changeIds],
    status: "Pending",
    appliedAt: null,
    errorLog: null,
  }
  // Mark all staged changes as Committed
  for (const cid of changeIds) {
    const change = changeStore.get(cid)
    if (change) {
      changeStore.set(cid, { ...change, status: "Committed" })
    }
  }
  commitStore.set(commit.id, commit)
  return commit
}

export function getCommit(id: string): Commit | undefined {
  return commitStore.get(id)
}

export function getAllCommits(): Commit[] {
  return Array.from(commitStore.values())
}

export function getWorkspaceCommits(workspaceId: string): Commit[] {
  return Array.from(commitStore.values())
    .filter((c) => c.workspaceId === workspaceId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// --- Apply Commit (simulated) ---

export async function applyCommit(commitId: string): Promise<{
  success: boolean
  error?: string
}> {
  const commit = commitStore.get(commitId)
  if (!commit) return { success: false, error: "Commit not found" }
  if (commit.status === "Applied") return { success: false, error: "Commit already applied" }

  // Simulate: open transaction, execute all SQL, commit
  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000))

  // 5% chance of simulated failure
  if (Math.random() < 0.05) {
    commitStore.set(commitId, {
      ...commit,
      status: "Failed",
      errorLog: "Simulated SQL error: FOREIGN KEY constraint violation on dbo.NPCResource.weapon_item_id",
    })
    return {
      success: false,
      error: "FOREIGN KEY constraint violation on dbo.NPCResource.weapon_item_id",
    }
  }

  // Success: mark everything as Applied
  for (const cid of commit.changeIds) {
    const change = changeStore.get(cid)
    if (change) {
      changeStore.set(cid, { ...change, status: "Applied" })
    }
  }
  commitStore.set(commitId, {
    ...commit,
    status: "Applied",
    appliedAt: new Date().toISOString(),
  })
  return { success: true }
}

// --- Discard Commit (not yet applied) ---

export function discardCommit(commitId: string): boolean {
  const commit = commitStore.get(commitId)
  if (!commit || commit.status === "Applied") return false

  // Restore changes to Draft
  for (const cid of commit.changeIds) {
    const change = changeStore.get(cid)
    if (change) {
      changeStore.set(cid, { ...change, status: "Draft" })
    }
  }
  commitStore.delete(commitId)
  return true
}

// --- Revert Commit (already applied) ---

export function createRevertCommit(
  originalCommitId: string,
  author: string,
): Commit | null {
  const original = commitStore.get(originalCommitId)
  if (!original || original.status !== "Applied") return null

  // Generate reverse changes
  const reverseChangeIds: string[] = []
  const originalChanges = original.changeIds
    .map((id) => changeStore.get(id))
    .filter(Boolean) as StagedChange[]

  // Process in reverse order for proper dependency handling
  for (const change of [...originalChanges].reverse()) {
    const reverseSQL = generateReverseSQL(change)
    const reverseChange: StagedChange = {
      id: crypto.randomUUID(),
      workspaceId: change.workspaceId,
      profileId: change.profileId,
      entityType: change.entityType,
      entityId: change.entityId,
      entityName: change.entityName,
      operationType: change.operationType === "Create"
        ? "Delete"
        : change.operationType === "Delete"
          ? "Create"
          : "Update",
      previousSnapshot: change.newSnapshot,
      newSnapshot: change.previousSnapshot,
      generatedSQL: reverseSQL,
      status: "Committed",
      timestamp: new Date().toISOString(),
    }
    changeStore.set(reverseChange.id, reverseChange)
    reverseChangeIds.push(reverseChange.id)
  }

  // Mark original as Reverted
  commitStore.set(originalCommitId, { ...original, status: "Reverted" })
  for (const cid of original.changeIds) {
    const change = changeStore.get(cid)
    if (change) {
      changeStore.set(cid, { ...change, status: "Reverted" })
    }
  }

  // Create the revert commit
  const revertCommit: Commit = {
    id: crypto.randomUUID(),
    workspaceId: original.workspaceId,
    profileId: original.profileId,
    message: `Revert Commit <${originalCommitId.slice(0, 8)}>: ${original.message}`,
    author,
    timestamp: new Date().toISOString(),
    changeIds: reverseChangeIds,
    status: "Pending",
    appliedAt: null,
    errorLog: null,
  }
  commitStore.set(revertCommit.id, revertCommit)
  return revertCommit
}

// --- Aggregated SQL for a commit ---

export function getCommitSQL(commitId: string): string {
  const commit = commitStore.get(commitId)
  if (!commit) return "-- Commit not found"

  const changes = commit.changeIds
    .map((id) => changeStore.get(id))
    .filter(Boolean) as StagedChange[]

  const lines = [
    `-- ============================================`,
    `-- Commit: ${commit.message}`,
    `-- Author: ${commit.author}`,
    `-- Date: ${commit.timestamp}`,
    `-- Changes: ${changes.length}`,
    `-- ============================================`,
    ``,
    `BEGIN TRANSACTION;`,
    ``,
  ]

  for (const change of changes) {
    lines.push(`-- ${change.operationType} ${change.entityType}: ${change.entityName} (id=${change.entityId})`)
    lines.push(change.generatedSQL)
    lines.push(``)
  }

  lines.push(`COMMIT TRANSACTION;`)
  return lines.join("\n")
}

// --- Export helpers ---

export function exportCommitAsSQL(commitId: string): string {
  return getCommitSQL(commitId)
}

export function exportCommitAsJSON(commitId: string): string {
  const commit = commitStore.get(commitId)
  if (!commit) return "{}"
  const changes = commit.changeIds
    .map((id) => changeStore.get(id))
    .filter(Boolean) as StagedChange[]
  return JSON.stringify({ commit, changes }, null, 2)
}

// --- Seed some example staged changes for demo purposes ---

function seedDemoChanges() {
  const ws = getActiveWorkspace()
  if (!ws) return

  createStagedChange(
    ws.id,
    ws.profileId,
    "NPC",
    10001,
    "Village Elder Rowan",
    "Create",
    null,
    {
      id: 10001,
      name_text_id: 500100,
      text_id: 500101,
      x: 1240.5,
      y: 0,
      z: 3320.8,
      face_x: 0,
      face_y: 1,
      face_z: 0,
      model_file: "db/npc/elder_male_01.nif",
      speed: 120,
      run_speed: 250,
    },
  )

  createStagedChange(
    ws.id,
    ws.profileId,
    "Item",
    3050,
    "Enchanted Iron Sword",
    "Update",
    {
      id: 3050,
      name_id: 200050,
      tooltip_id: 200051,
      type: 1,
      group: 10,
      class: 2,
      attack_min: 45,
      attack_max: 68,
      level_limit: 15,
    },
    {
      id: 3050,
      name_id: 200050,
      tooltip_id: 200051,
      type: 1,
      group: 10,
      class: 2,
      attack_min: 52,
      attack_max: 78,
      level_limit: 18,
    },
  )

  createStagedChange(
    ws.id,
    ws.profileId,
    "Monster",
    7002,
    "Corrupted Treant",
    "Delete",
    {
      id: 7002,
      name_id: 300200,
      level: 42,
      hp: 15600,
      mp: 800,
      attack: 320,
      defence: 180,
    },
    null,
  )
}

let seeded = false
export function ensureSeedData() {
  if (seeded) return
  seeded = true
  try {
    seedDemoChanges()
  } catch {
    // Ignore seed errors
  }
}
