// =============================================
// RZManager – RDB Export Service Layer
// =============================================
// Handles RDB file generation, encryption (mock),
// hash-based change detection, and batch export.

// ---- Types ----

export interface RDBSettings {
  encryptionKey: string
  version: string
  compression: boolean
  includeMetadata: boolean
  filenamePattern: string // e.g. "{table}.rdb"
}

export const defaultRDBSettings: RDBSettings = {
  encryptionKey: "",
  version: "1.0",
  compression: true,
  includeMetadata: true,
  filenamePattern: "{table}.rdb",
}

export interface TableSnapshot {
  tableName: string
  structureHash: string
  dataHash: string
  lastExportedAt: Date
  columnCount: number
  rowCount: number
}

export type ChangeIndicator = "none" | "structure" | "data" | "breaking"

export interface TableChangeInfo {
  indicator: ChangeIndicator
  columnsAdded: string[]
  columnsRemoved: string[]
  typeChanges: { column: string; oldType: string; newType: string }[]
  rowDelta: number
  dataModified: boolean
  pkChange: boolean
}

export type RDBJobStatus = "pending" | "processing" | "success" | "failed"

export interface RDBJob {
  id: string
  tableName: string
  status: RDBJobStatus
  progress: number
  blob: Blob | null
  filename: string
  error: string | null
  startedAt: Date | null
  completedAt: Date | null
}

export interface TableColumnDef {
  name: string
  type: string
  nullable: boolean
  default: string | null
  pk: boolean
}

export interface TableDataRow {
  [key: string]: string | number | boolean | null
}

// ---- Hashing ----

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return Math.abs(hash).toString(36).padStart(8, "0")
}

export function calculateStructureHash(columns: TableColumnDef[]): string {
  const normalized = columns.map((c) => ({
    name: c.name,
    type: c.type,
    nullable: c.nullable,
    pk: c.pk,
  }))
  return simpleHash(JSON.stringify(normalized))
}

export function calculateDataHash(rows: TableDataRow[]): string {
  return simpleHash(JSON.stringify(rows))
}

export function compareWithSnapshot(
  snapshot: TableSnapshot | undefined,
  currentColumns: TableColumnDef[],
  currentRows: TableDataRow[],
  previousColumns?: TableColumnDef[]
): TableChangeInfo {
  if (!snapshot) {
    return {
      indicator: "none",
      columnsAdded: [],
      columnsRemoved: [],
      typeChanges: [],
      rowDelta: 0,
      dataModified: false,
      pkChange: false,
    }
  }

  const currentStructureHash = calculateStructureHash(currentColumns)
  const currentDataHash = calculateDataHash(currentRows)

  const structureChanged = currentStructureHash !== snapshot.structureHash
  const dataChanged = currentDataHash !== snapshot.dataHash

  // Detailed column diff
  const prevColNames = new Set(previousColumns?.map((c) => c.name) ?? [])
  const currColNames = new Set(currentColumns.map((c) => c.name))

  const columnsAdded = currentColumns
    .filter((c) => !prevColNames.has(c.name))
    .map((c) => c.name)

  const columnsRemoved = (previousColumns ?? [])
    .filter((c) => !currColNames.has(c.name))
    .map((c) => c.name)

  // Type changes
  const typeChanges: { column: string; oldType: string; newType: string }[] = []
  if (previousColumns) {
    for (const curr of currentColumns) {
      const prev = previousColumns.find((p) => p.name === curr.name)
      if (prev && prev.type !== curr.type) {
        typeChanges.push({ column: curr.name, oldType: prev.type, newType: curr.type })
      }
    }
  }

  // PK change detection
  const prevPks = new Set(previousColumns?.filter((c) => c.pk).map((c) => c.name) ?? [])
  const currPks = new Set(currentColumns.filter((c) => c.pk).map((c) => c.name))
  const pkChange =
    prevPks.size !== currPks.size || [...prevPks].some((pk) => !currPks.has(pk))

  const rowDelta = currentRows.length - snapshot.rowCount

  let indicator: ChangeIndicator = "none"
  if (pkChange) {
    indicator = "breaking"
  } else if (structureChanged) {
    indicator = "structure"
  } else if (dataChanged) {
    indicator = "data"
  }

  return {
    indicator,
    columnsAdded,
    columnsRemoved,
    typeChanges,
    rowDelta,
    dataModified: dataChanged,
    pkChange,
  }
}

// ---- RDB File Generation ----

function encryptData(data: Uint8Array, _key: string): Uint8Array {
  // Mock encryption: XOR with key bytes (placeholder for real encryption)
  if (!_key) return data
  const keyBytes = new TextEncoder().encode(_key)
  const encrypted = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) {
    encrypted[i] = data[i] ^ keyBytes[i % keyBytes.length]
  }
  return encrypted
}

export function generateRdb(
  tableName: string,
  columns: TableColumnDef[],
  rows: TableDataRow[],
  settings: RDBSettings
): Blob {
  // Build RDB binary format (simplified)
  const header = {
    magic: "RDB1",
    version: settings.version,
    table: tableName,
    columns: columns.length,
    rows: rows.length,
    timestamp: new Date().toISOString(),
    compressed: settings.compression,
  }

  const payload: Record<string, unknown> = {
    header,
    schema: columns,
    data: rows,
  }

  if (settings.includeMetadata) {
    payload.metadata = {
      generatedBy: "RZManager RDB Export Tool",
      structureHash: calculateStructureHash(columns),
      dataHash: calculateDataHash(rows),
    }
  }

  const jsonStr = JSON.stringify(payload, null, settings.compression ? 0 : 2)
  let bytes = new TextEncoder().encode(jsonStr)

  // Apply encryption if key provided
  if (settings.encryptionKey) {
    bytes = encryptData(bytes, settings.encryptionKey)
  }

  return new Blob([bytes], { type: "application/octet-stream" })
}

export async function generateBatchRdb(
  tables: {
    name: string
    columns: TableColumnDef[]
    rows: TableDataRow[]
  }[],
  settings: RDBSettings,
  onProgress?: (tableName: string, progress: number) => void
): Promise<Map<string, Blob>> {
  const results = new Map<string, Blob>()

  for (const table of tables) {
    onProgress?.(table.name, 0)

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500))
    onProgress?.(table.name, 30)

    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300))
    onProgress?.(table.name, 60)

    const blob = generateRdb(table.name, table.columns, table.rows, settings)
    onProgress?.(table.name, 90)

    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200))
    results.set(table.name, blob)
    onProgress?.(table.name, 100)
  }

  return results
}

export function resolveFilename(pattern: string, tableName: string): string {
  return pattern.replace("{table}", tableName)
}

// ---- Download Helpers ----

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadAllAsZip(
  files: Map<string, Blob>,
  zipFilename: string
): Promise<void> {
  // Simple concatenated download (in production you'd use a ZIP library)
  // For now, download each file individually
  for (const [name, blob] of files) {
    downloadBlob(blob, name)
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
}
