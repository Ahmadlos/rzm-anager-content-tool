// ============================================================
// Database Comparison & Sync Engine
// ============================================================
// Full bidirectional schema + data comparison engine.
// Generates SQL scripts for sync operations.
// All operations are transactional and require explicit confirmation.

import {
  type DbTable,
  type DbColumn,
  type DbIndex,
  type DbForeignKey,
  type DbView,
  type DbStoredProcedure,
  type DbDatabase,
  type DataRow,
  simulatedServer,
  fetchTableData,
} from "@/lib/db-explorer-store"

// ============================================================
// Types
// ============================================================

export type DiffStatus = "added" | "removed" | "modified" | "identical"
export type SyncDirection = "source-to-target" | "target-to-source"
export type ObjectCategory = "table" | "column" | "index" | "constraint" | "view" | "procedure"

export interface SchemaDiff {
  id: string
  category: ObjectCategory
  objectName: string
  parentTable?: string
  status: DiffStatus
  sourceDefinition?: string
  targetDefinition?: string
  details: string
  selected: boolean
  sqlSourceToTarget: string
  sqlTargetToSource: string
}

export interface DataRowDiff {
  id: string
  primaryKey: Record<string, string | number | boolean | null>
  status: DiffStatus
  sourceRow: DataRow | null
  targetRow: DataRow | null
  changedFields: string[]
  selected: boolean
}

export interface DataComparisonResult {
  tableName: string
  primaryKeyColumns: string[]
  rows: DataRowDiff[]
  totalAdded: number
  totalRemoved: number
  totalModified: number
  totalIdentical: number
}

export interface SyncLogEntry {
  timestamp: string
  level: "info" | "success" | "warning" | "error"
  message: string
  sql?: string
}

export interface SyncResult {
  success: boolean
  direction: SyncDirection
  totalStatements: number
  executedStatements: number
  failedStatements: number
  rolledBack: boolean
  log: SyncLogEntry[]
  dryRun: boolean
}

// ============================================================
// Schema Comparison Engine
// ============================================================

function diffColumns(
  sourceTable: DbTable,
  targetTable: DbTable,
  parentTable: string,
): SchemaDiff[] {
  const diffs: SchemaDiff[] = []
  const sourceMap = new Map(sourceTable.columns.map((c) => [c.name, c]))
  const targetMap = new Map(targetTable.columns.map((c) => [c.name, c]))

  // Columns in source but not in target
  for (const [name, col] of sourceMap) {
    if (!targetMap.has(name)) {
      diffs.push({
        id: `col-${parentTable}-${name}`,
        category: "column",
        objectName: name,
        parentTable,
        status: "removed",
        sourceDefinition: formatColumnDef(col),
        details: `Column [${name}] exists in Source but not in Target`,
        selected: false,
        sqlSourceToTarget: `ALTER TABLE [dbo].[${parentTable}] ADD [${name}] ${col.type}${col.nullable ? " NULL" : " NOT NULL"}${col.defaultValue ? ` DEFAULT ${col.defaultValue}` : ""};`,
        sqlTargetToSource: `-- Column [${name}] will be removed from Source (no action needed on Target)`,
      })
    }
  }

  // Columns in target but not in source
  for (const [name, col] of targetMap) {
    if (!sourceMap.has(name)) {
      diffs.push({
        id: `col-${parentTable}-${name}`,
        category: "column",
        objectName: name,
        parentTable,
        status: "added",
        targetDefinition: formatColumnDef(col),
        details: `Column [${name}] exists in Target but not in Source`,
        selected: false,
        sqlSourceToTarget: `-- Column [${name}] exists only in Target (no action needed)`,
        sqlTargetToSource: `ALTER TABLE [dbo].[${parentTable}] ADD [${name}] ${col.type}${col.nullable ? " NULL" : " NOT NULL"}${col.defaultValue ? ` DEFAULT ${col.defaultValue}` : ""};`,
      })
    }
  }

  // Columns in both but different
  for (const [name, srcCol] of sourceMap) {
    const tgtCol = targetMap.get(name)
    if (tgtCol) {
      const differences: string[] = []
      if (srcCol.type !== tgtCol.type) differences.push(`type: ${srcCol.type} vs ${tgtCol.type}`)
      if (srcCol.nullable !== tgtCol.nullable) differences.push(`nullable: ${srcCol.nullable} vs ${tgtCol.nullable}`)
      if (srcCol.defaultValue !== tgtCol.defaultValue) differences.push(`default: ${srcCol.defaultValue ?? "none"} vs ${tgtCol.defaultValue ?? "none"}`)

      if (differences.length > 0) {
        diffs.push({
          id: `col-${parentTable}-${name}`,
          category: "column",
          objectName: name,
          parentTable,
          status: "modified",
          sourceDefinition: formatColumnDef(srcCol),
          targetDefinition: formatColumnDef(tgtCol),
          details: differences.join("; "),
          selected: false,
          sqlSourceToTarget: `ALTER TABLE [dbo].[${parentTable}] ALTER COLUMN [${name}] ${srcCol.type}${srcCol.nullable ? " NULL" : " NOT NULL"};`,
          sqlTargetToSource: `ALTER TABLE [dbo].[${parentTable}] ALTER COLUMN [${name}] ${tgtCol.type}${tgtCol.nullable ? " NULL" : " NOT NULL"};`,
        })
      }
    }
  }

  return diffs
}

function diffIndexes(
  sourceTable: DbTable,
  targetTable: DbTable,
  parentTable: string,
): SchemaDiff[] {
  const diffs: SchemaDiff[] = []
  const sourceMap = new Map(sourceTable.indexes.map((i) => [i.name, i]))
  const targetMap = new Map(targetTable.indexes.map((i) => [i.name, i]))

  for (const [name, idx] of sourceMap) {
    if (!targetMap.has(name)) {
      diffs.push({
        id: `idx-${parentTable}-${name}`,
        category: "index",
        objectName: name,
        parentTable,
        status: "removed",
        sourceDefinition: formatIndexDef(idx),
        details: `Index [${name}] exists in Source but not in Target`,
        selected: false,
        sqlSourceToTarget: `CREATE ${idx.isUnique ? "UNIQUE " : ""}${idx.isClustered ? "CLUSTERED " : "NONCLUSTERED "}INDEX [${name}] ON [dbo].[${parentTable}] (${idx.columns.map((c) => `[${c}]`).join(", ")});`,
        sqlTargetToSource: `-- Index only in Source, no Target action`,
      })
    }
  }

  for (const [name, idx] of targetMap) {
    if (!sourceMap.has(name)) {
      diffs.push({
        id: `idx-${parentTable}-${name}`,
        category: "index",
        objectName: name,
        parentTable,
        status: "added",
        targetDefinition: formatIndexDef(idx),
        details: `Index [${name}] exists in Target but not in Source`,
        selected: false,
        sqlSourceToTarget: `-- Index only in Target, no action`,
        sqlTargetToSource: `CREATE ${idx.isUnique ? "UNIQUE " : ""}${idx.isClustered ? "CLUSTERED " : "NONCLUSTERED "}INDEX [${name}] ON [dbo].[${parentTable}] (${idx.columns.map((c) => `[${c}]`).join(", ")});`,
      })
    }
  }

  for (const [name, srcIdx] of sourceMap) {
    const tgtIdx = targetMap.get(name)
    if (tgtIdx) {
      const srcCols = srcIdx.columns.join(",")
      const tgtCols = tgtIdx.columns.join(",")
      if (srcCols !== tgtCols || srcIdx.isUnique !== tgtIdx.isUnique) {
        diffs.push({
          id: `idx-${parentTable}-${name}`,
          category: "index",
          objectName: name,
          parentTable,
          status: "modified",
          sourceDefinition: formatIndexDef(srcIdx),
          targetDefinition: formatIndexDef(tgtIdx),
          details: `Index columns or uniqueness differ`,
          selected: false,
          sqlSourceToTarget: `DROP INDEX [${name}] ON [dbo].[${parentTable}];\nCREATE ${srcIdx.isUnique ? "UNIQUE " : ""}${srcIdx.isClustered ? "CLUSTERED " : "NONCLUSTERED "}INDEX [${name}] ON [dbo].[${parentTable}] (${srcIdx.columns.map((c) => `[${c}]`).join(", ")});`,
          sqlTargetToSource: `DROP INDEX [${name}] ON [dbo].[${parentTable}];\nCREATE ${tgtIdx.isUnique ? "UNIQUE " : ""}${tgtIdx.isClustered ? "CLUSTERED " : "NONCLUSTERED "}INDEX [${name}] ON [dbo].[${parentTable}] (${tgtIdx.columns.map((c) => `[${c}]`).join(", ")});`,
        })
      }
    }
  }

  return diffs
}

function diffForeignKeys(
  sourceTable: DbTable,
  targetTable: DbTable,
  parentTable: string,
): SchemaDiff[] {
  const diffs: SchemaDiff[] = []
  const sourceMap = new Map(sourceTable.foreignKeys.map((f) => [f.name, f]))
  const targetMap = new Map(targetTable.foreignKeys.map((f) => [f.name, f]))

  for (const [name, fk] of sourceMap) {
    if (!targetMap.has(name)) {
      diffs.push({
        id: `fk-${parentTable}-${name}`,
        category: "constraint",
        objectName: name,
        parentTable,
        status: "removed",
        sourceDefinition: formatFKDef(fk),
        details: `FK [${name}] exists in Source but not in Target`,
        selected: false,
        sqlSourceToTarget: `ALTER TABLE [dbo].[${parentTable}] ADD CONSTRAINT [${name}] FOREIGN KEY ([${fk.column}]) REFERENCES [dbo].[${fk.referencedTable}] ([${fk.referencedColumn}]);`,
        sqlTargetToSource: `-- FK only in Source`,
      })
    }
  }

  for (const [name, fk] of targetMap) {
    if (!sourceMap.has(name)) {
      diffs.push({
        id: `fk-${parentTable}-${name}`,
        category: "constraint",
        objectName: name,
        parentTable,
        status: "added",
        targetDefinition: formatFKDef(fk),
        details: `FK [${name}] exists in Target but not in Source`,
        selected: false,
        sqlSourceToTarget: `-- FK only in Target`,
        sqlTargetToSource: `ALTER TABLE [dbo].[${parentTable}] ADD CONSTRAINT [${name}] FOREIGN KEY ([${fk.column}]) REFERENCES [dbo].[${fk.referencedTable}] ([${fk.referencedColumn}]);`,
      })
    }
  }

  return diffs
}

function formatColumnDef(col: DbColumn): string {
  return `[${col.name}] ${col.type}${col.nullable ? " NULL" : " NOT NULL"}${col.defaultValue ? ` DEFAULT ${col.defaultValue}` : ""}${col.isPrimaryKey ? " PRIMARY KEY" : ""}`
}

function formatIndexDef(idx: DbIndex): string {
  return `${idx.isUnique ? "UNIQUE " : ""}${idx.isClustered ? "CLUSTERED" : "NONCLUSTERED"} (${idx.columns.join(", ")})`
}

function formatFKDef(fk: DbForeignKey): string {
  return `[${fk.column}] -> [${fk.referencedTable}].[${fk.referencedColumn}]`
}

/** Compare schemas of two databases and return all differences */
export function compareSchemas(
  sourceDb: DbDatabase,
  targetDb: DbDatabase,
): SchemaDiff[] {
  const diffs: SchemaDiff[] = []
  const sourceTableMap = new Map(sourceDb.tables.map((t) => [t.name, t]))
  const targetTableMap = new Map(targetDb.tables.map((t) => [t.name, t]))

  // Tables in source but not in target
  for (const [name, table] of sourceTableMap) {
    if (!targetTableMap.has(name)) {
      const colDefs = table.columns.map((c) => `  [${c.name}] ${c.type}${c.nullable ? " NULL" : " NOT NULL"}${c.defaultValue ? ` DEFAULT ${c.defaultValue}` : ""}`).join(",\n")
      const pkCols = table.columns.filter((c) => c.isPrimaryKey).map((c) => `[${c.name}]`).join(", ")
      diffs.push({
        id: `table-${name}`,
        category: "table",
        objectName: name,
        status: "removed",
        sourceDefinition: `${table.columns.length} columns, ${table.indexes.length} indexes`,
        details: `Table [${name}] exists in Source (${table.rowCount} rows) but not in Target`,
        selected: false,
        sqlSourceToTarget: `CREATE TABLE [dbo].[${name}] (\n${colDefs}${pkCols ? `,\n  CONSTRAINT [PK_${name}] PRIMARY KEY CLUSTERED (${pkCols})` : ""}\n);`,
        sqlTargetToSource: `-- Table [${name}] only in Source, no Target action`,
      })
    }
  }

  // Tables in target but not in source
  for (const [name, table] of targetTableMap) {
    if (!sourceTableMap.has(name)) {
      const colDefs = table.columns.map((c) => `  [${c.name}] ${c.type}${c.nullable ? " NULL" : " NOT NULL"}${c.defaultValue ? ` DEFAULT ${c.defaultValue}` : ""}`).join(",\n")
      const pkCols = table.columns.filter((c) => c.isPrimaryKey).map((c) => `[${c.name}]`).join(", ")
      diffs.push({
        id: `table-${name}`,
        category: "table",
        objectName: name,
        status: "added",
        targetDefinition: `${table.columns.length} columns, ${table.indexes.length} indexes`,
        details: `Table [${name}] exists in Target (${table.rowCount} rows) but not in Source`,
        selected: false,
        sqlSourceToTarget: `-- Table [${name}] only in Target, no action`,
        sqlTargetToSource: `CREATE TABLE [dbo].[${name}] (\n${colDefs}${pkCols ? `,\n  CONSTRAINT [PK_${name}] PRIMARY KEY CLUSTERED (${pkCols})` : ""}\n);`,
      })
    }
  }

  // Tables in both -- diff columns, indexes, FKs
  for (const [name, srcTable] of sourceTableMap) {
    const tgtTable = targetTableMap.get(name)
    if (tgtTable) {
      diffs.push(...diffColumns(srcTable, tgtTable, name))
      diffs.push(...diffIndexes(srcTable, tgtTable, name))
      diffs.push(...diffForeignKeys(srcTable, tgtTable, name))
    }
  }

  // Views
  const sourceViewMap = new Map(sourceDb.views.map((v) => [v.name, v]))
  const targetViewMap = new Map(targetDb.views.map((v) => [v.name, v]))

  for (const [name, view] of sourceViewMap) {
    if (!targetViewMap.has(name)) {
      diffs.push({
        id: `view-${name}`,
        category: "view",
        objectName: name,
        status: "removed",
        sourceDefinition: view.definition.slice(0, 200),
        details: `View [${name}] exists in Source but not in Target`,
        selected: false,
        sqlSourceToTarget: view.definition + ";",
        sqlTargetToSource: `-- View only in Source`,
      })
    }
  }

  for (const [name, view] of targetViewMap) {
    if (!sourceViewMap.has(name)) {
      diffs.push({
        id: `view-${name}`,
        category: "view",
        objectName: name,
        status: "added",
        targetDefinition: view.definition.slice(0, 200),
        details: `View [${name}] exists in Target but not in Source`,
        selected: false,
        sqlSourceToTarget: `-- View only in Target`,
        sqlTargetToSource: view.definition + ";",
      })
    }
  }

  for (const [name, srcView] of sourceViewMap) {
    const tgtView = targetViewMap.get(name)
    if (tgtView && srcView.definition !== tgtView.definition) {
      diffs.push({
        id: `view-${name}`,
        category: "view",
        objectName: name,
        status: "modified",
        sourceDefinition: srcView.definition.slice(0, 200),
        targetDefinition: tgtView.definition.slice(0, 200),
        details: `View [${name}] definition differs between Source and Target`,
        selected: false,
        sqlSourceToTarget: `DROP VIEW IF EXISTS [dbo].[${name}];\nGO\n${srcView.definition};`,
        sqlTargetToSource: `DROP VIEW IF EXISTS [dbo].[${name}];\nGO\n${tgtView.definition};`,
      })
    }
  }

  // Stored Procedures
  const sourceSPMap = new Map(sourceDb.storedProcedures.map((p) => [p.name, p]))
  const targetSPMap = new Map(targetDb.storedProcedures.map((p) => [p.name, p]))

  for (const [name, sp] of sourceSPMap) {
    if (!targetSPMap.has(name)) {
      diffs.push({
        id: `proc-${name}`,
        category: "procedure",
        objectName: name,
        status: "removed",
        sourceDefinition: sp.definition.slice(0, 200),
        details: `Procedure [${name}] exists in Source but not in Target`,
        selected: false,
        sqlSourceToTarget: sp.definition + ";",
        sqlTargetToSource: `-- Procedure only in Source`,
      })
    }
  }

  for (const [name, sp] of targetSPMap) {
    if (!sourceSPMap.has(name)) {
      diffs.push({
        id: `proc-${name}`,
        category: "procedure",
        objectName: name,
        status: "added",
        targetDefinition: sp.definition.slice(0, 200),
        details: `Procedure [${name}] exists in Target but not in Source`,
        selected: false,
        sqlSourceToTarget: `-- Procedure only in Target`,
        sqlTargetToSource: sp.definition + ";",
      })
    }
  }

  for (const [name, srcSP] of sourceSPMap) {
    const tgtSP = targetSPMap.get(name)
    if (tgtSP && srcSP.definition !== tgtSP.definition) {
      diffs.push({
        id: `proc-${name}`,
        category: "procedure",
        objectName: name,
        status: "modified",
        sourceDefinition: srcSP.definition.slice(0, 200),
        targetDefinition: tgtSP.definition.slice(0, 200),
        details: `Procedure [${name}] definition differs`,
        selected: false,
        sqlSourceToTarget: `DROP PROCEDURE IF EXISTS [dbo].[${name}];\nGO\n${srcSP.definition};`,
        sqlTargetToSource: `DROP PROCEDURE IF EXISTS [dbo].[${name}];\nGO\n${tgtSP.definition};`,
      })
    }
  }

  return diffs
}

// ============================================================
// Data Comparison Engine
// ============================================================

/** Compare data rows between source and target using PK-based matching */
export async function compareTableData(
  sourceDbName: string,
  targetDbName: string,
  tableName: string,
  primaryKeyColumns: string[],
): Promise<DataComparisonResult> {
  // Fetch all data from both (batched in real app)
  const srcResult = await fetchTableData(sourceDbName, tableName, 0, 500)
  const tgtResult = await fetchTableData(targetDbName, tableName, 0, 500)

  const srcRows = srcResult.rows
  const tgtRows = tgtResult.rows

  const keyFn = (row: DataRow) =>
    primaryKeyColumns.map((k) => String(row[k] ?? "")).join("|")

  const srcMap = new Map(srcRows.map((r) => [keyFn(r), r]))
  const tgtMap = new Map(tgtRows.map((r) => [keyFn(r), r]))

  const rowDiffs: DataRowDiff[] = []
  let totalAdded = 0
  let totalRemoved = 0
  let totalModified = 0
  let totalIdentical = 0

  // Rows in source but not in target (need INSERT on target)
  for (const [key, srcRow] of srcMap) {
    const pk: Record<string, string | number | boolean | null> = {}
    for (const col of primaryKeyColumns) pk[col] = srcRow[col]

    if (!tgtMap.has(key)) {
      rowDiffs.push({
        id: `row-missing-${key}`,
        primaryKey: pk,
        status: "removed",
        sourceRow: srcRow,
        targetRow: null,
        changedFields: Object.keys(srcRow),
        selected: false,
      })
      totalRemoved++
    } else {
      const tgtRow = tgtMap.get(key)!
      const changedFields: string[] = []
      for (const col of Object.keys(srcRow)) {
        if (String(srcRow[col]) !== String(tgtRow[col])) {
          changedFields.push(col)
        }
      }
      if (changedFields.length > 0) {
        rowDiffs.push({
          id: `row-mod-${key}`,
          primaryKey: pk,
          status: "modified",
          sourceRow: srcRow,
          targetRow: tgtRow,
          changedFields,
          selected: false,
        })
        totalModified++
      } else {
        totalIdentical++
      }
    }
  }

  // Rows in target but not in source (extra in target)
  for (const [key, tgtRow] of tgtMap) {
    if (!srcMap.has(key)) {
      const pk: Record<string, string | number | boolean | null> = {}
      for (const col of primaryKeyColumns) pk[col] = tgtRow[col]
      rowDiffs.push({
        id: `row-extra-${key}`,
        primaryKey: pk,
        status: "added",
        sourceRow: null,
        targetRow: tgtRow,
        changedFields: Object.keys(tgtRow),
        selected: false,
      })
      totalAdded++
    }
  }

  return {
    tableName,
    primaryKeyColumns,
    rows: rowDiffs,
    totalAdded,
    totalRemoved,
    totalModified,
    totalIdentical,
  }
}

// ============================================================
// SQL Generation for Data Sync
// ============================================================

export function generateDataSyncSQL(
  tableName: string,
  rows: DataRowDiff[],
  direction: SyncDirection,
  primaryKeyColumns: string[],
): string {
  const selected = rows.filter((r) => r.selected)
  if (selected.length === 0) return "-- No rows selected for sync"

  const lines: string[] = [
    `-- Data sync for [${tableName}]`,
    `-- Direction: ${direction}`,
    `-- Selected: ${selected.length} row(s)`,
    `-- Generated: ${new Date().toISOString()}`,
    "",
    "BEGIN TRANSACTION;",
    "BEGIN TRY",
    "",
  ]

  for (const row of selected) {
    const isSourceToTarget = direction === "source-to-target"
    const fromRow = isSourceToTarget ? row.sourceRow : row.targetRow
    const toStatus = row.status

    if (toStatus === "removed" && fromRow) {
      // INSERT missing row into target
      const cols = Object.keys(fromRow).filter((c) => fromRow[c] !== null)
      const vals = cols.map((c) => {
        const v = fromRow[c]
        return typeof v === "string" ? `N'${v.replace(/'/g, "''")}'` : String(v)
      })
      lines.push(`  INSERT INTO [dbo].[${tableName}] (${cols.map((c) => `[${c}]`).join(", ")})`)
      lines.push(`  VALUES (${vals.join(", ")});`)
      lines.push("")
    } else if (toStatus === "added" && isSourceToTarget) {
      // DELETE extra row from target
      const where = primaryKeyColumns.map((c) => {
        const v = row.targetRow?.[c]
        return `[${c}] = ${typeof v === "string" ? `N'${v}'` : v}`
      }).join(" AND ")
      lines.push(`  DELETE FROM [dbo].[${tableName}] WHERE ${where};`)
      lines.push("")
    } else if (toStatus === "modified" && fromRow) {
      // UPDATE modified fields
      const setClauses = row.changedFields
        .filter((c) => !primaryKeyColumns.includes(c))
        .map((c) => {
          const v = fromRow[c]
          return `[${c}] = ${v === null ? "NULL" : typeof v === "string" ? `N'${v.replace(/'/g, "''")}'` : v}`
        })
      const where = primaryKeyColumns.map((c) => {
        const v = fromRow[c]
        return `[${c}] = ${typeof v === "string" ? `N'${v}'` : v}`
      }).join(" AND ")
      if (setClauses.length > 0) {
        lines.push(`  UPDATE [dbo].[${tableName}] SET ${setClauses.join(", ")}`)
        lines.push(`  WHERE ${where};`)
        lines.push("")
      }
    }
  }

  lines.push("  COMMIT TRANSACTION;")
  lines.push("  PRINT 'Data sync completed successfully.';")
  lines.push("END TRY")
  lines.push("BEGIN CATCH")
  lines.push("  ROLLBACK TRANSACTION;")
  lines.push("  PRINT 'ERROR: ' + ERROR_MESSAGE();")
  lines.push("  THROW;")
  lines.push("END CATCH")

  return lines.join("\n")
}

/** Generate schema sync SQL for selected diffs */
export function generateSchemaSyncSQL(
  diffs: SchemaDiff[],
  direction: SyncDirection,
): string {
  const selected = diffs.filter((d) => d.selected)
  if (selected.length === 0) return "-- No objects selected for sync"

  const lines: string[] = [
    `-- Schema sync script`,
    `-- Direction: ${direction}`,
    `-- Selected: ${selected.length} object(s)`,
    `-- Generated: ${new Date().toISOString()}`,
    "",
    "BEGIN TRANSACTION;",
    "BEGIN TRY",
    "",
  ]

  for (const diff of selected) {
    const sql = direction === "source-to-target" ? diff.sqlSourceToTarget : diff.sqlTargetToSource
    lines.push(`  -- ${diff.category}: [${diff.objectName}] (${diff.status})`)
    lines.push(`  ${sql}`)
    lines.push("")
  }

  lines.push("  COMMIT TRANSACTION;")
  lines.push("  PRINT 'Schema sync completed successfully.';")
  lines.push("END TRY")
  lines.push("BEGIN CATCH")
  lines.push("  ROLLBACK TRANSACTION;")
  lines.push("  PRINT 'ERROR: ' + ERROR_MESSAGE();")
  lines.push("  THROW;")
  lines.push("END CATCH")

  return lines.join("\n")
}

// ============================================================
// Sync Executor (Simulated)
// ============================================================

export async function executeSyncScript(
  sql: string,
  dryRun: boolean,
  direction: SyncDirection,
  onProgress?: (pct: number, log: SyncLogEntry) => void,
): Promise<SyncResult> {
  const log: SyncLogEntry[] = []
  const statements = sql.split(";").filter((s) => s.trim().length > 0 && !s.trim().startsWith("--"))
  const total = statements.length
  let executed = 0
  let failed = 0

  const addLog = (level: SyncLogEntry["level"], message: string, sqlSnippet?: string) => {
    const entry: SyncLogEntry = { timestamp: new Date().toISOString(), level, message, sql: sqlSnippet }
    log.push(entry)
    onProgress?.(Math.round(((executed + failed) / Math.max(total, 1)) * 100), entry)
  }

  addLog("info", dryRun ? "DRY RUN -- No changes will be applied" : "Starting sync execution...")
  addLog("info", `Direction: ${direction}`)
  addLog("info", `Total statements: ${total}`)

  if (!dryRun) {
    addLog("info", "BEGIN TRANSACTION")
  }

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim()
    if (!stmt || stmt.startsWith("--") || stmt.startsWith("PRINT") || stmt.startsWith("BEGIN") || stmt.startsWith("END") || stmt.startsWith("COMMIT") || stmt.startsWith("ROLLBACK") || stmt.startsWith("THROW")) {
      continue
    }

    await new Promise((r) => setTimeout(r, 150 + Math.random() * 250))

    // Simulate 5% failure rate
    if (!dryRun && Math.random() < 0.05) {
      failed++
      addLog("error", `Failed: ${stmt.slice(0, 80)}...`, stmt)
      addLog("error", "ROLLBACK TRANSACTION -- Rolling back all changes")
      return {
        success: false,
        direction,
        totalStatements: total,
        executedStatements: executed,
        failedStatements: failed,
        rolledBack: true,
        log,
        dryRun,
      }
    }

    executed++
    addLog(dryRun ? "info" : "success", `${dryRun ? "[DRY RUN] " : ""}Executed: ${stmt.slice(0, 100)}${stmt.length > 100 ? "..." : ""}`, stmt)
  }

  if (!dryRun) {
    addLog("success", "COMMIT TRANSACTION")
  }

  addLog("success", `Sync completed. ${executed} statement(s) ${dryRun ? "validated" : "executed"}.`)

  return {
    success: true,
    direction,
    totalStatements: total,
    executedStatements: executed,
    failedStatements: 0,
    rolledBack: false,
    log,
    dryRun,
  }
}

// ============================================================
// Export Helpers
// ============================================================

export function exportAsJSON(data: unknown): string {
  return JSON.stringify(data, null, 2)
}

export function exportAsCSV(rows: DataRowDiff[]): string {
  if (rows.length === 0) return ""
  const allCols = new Set<string>()
  for (const r of rows) {
    const row = r.sourceRow || r.targetRow
    if (row) Object.keys(row).forEach((k) => allCols.add(k))
  }
  const cols = ["_status", ...allCols]
  const header = cols.join(",")
  const lines = rows.map((r) => {
    const row = r.sourceRow || r.targetRow || {}
    const vals = cols.map((c) => {
      if (c === "_status") return r.status
      const v = row[c]
      if (v === null || v === undefined) return ""
      return typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : String(v)
    })
    return vals.join(",")
  })
  return [header, ...lines].join("\n")
}

/** Get database objects from the simulated server */
export function getDatabase(name: string): DbDatabase | undefined {
  return simulatedServer.databases.find((d) => d.name === name)
}

export function getAllDatabaseNames(): string[] {
  return simulatedServer.databases.map((d) => d.name)
}
