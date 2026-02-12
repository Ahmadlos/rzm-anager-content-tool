"use client"

import { useState, useCallback, useRef } from "react"
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  Copy,
  Database,
  Download,
  FileText,
  Loader2,
  Minus,
  Play,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Square,
  Table2,
  TriangleAlert,
  X as XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  type SchemaDiff,
  type DataRowDiff,
  type DataComparisonResult,
  type SyncDirection,
  type SyncLogEntry,
  type SyncResult,
  type ObjectCategory,
  type DiffStatus,
  compareSchemas,
  compareTableData,
  generateSchemaSyncSQL,
  generateDataSyncSQL,
  executeSyncScript,
  exportAsJSON,
  exportAsCSV,
  getDatabase,
  getAllDatabaseNames,
} from "@/lib/db-comparison-store"
import type { DbDatabase } from "@/lib/db-explorer-store"

// ============================================================
// Props
// ============================================================

interface DatabaseComparisonProps {
  onBack: () => void
}

// ============================================================
// Helpers
// ============================================================

const statusColors: Record<DiffStatus, string> = {
  added: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  removed: "text-red-400 bg-red-500/10 border-red-500/20",
  modified: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  identical: "text-muted-foreground bg-secondary border-border",
}

const statusLabels: Record<DiffStatus, string> = {
  added: "Extra in Target",
  removed: "Missing in Target",
  modified: "Modified",
  identical: "Identical",
}

const categoryLabels: Record<ObjectCategory, string> = {
  table: "Tables",
  column: "Columns",
  index: "Indexes",
  constraint: "Constraints",
  view: "Views",
  procedure: "Stored Procedures",
}

const categoryIcons: Record<ObjectCategory, typeof Table2> = {
  table: Table2,
  column: Minus,
  index: FileText,
  constraint: Shield,
  view: Database,
  procedure: FileText,
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ============================================================
// Component
// ============================================================

export function DatabaseComparison({ onBack }: DatabaseComparisonProps) {
  // --- Database selection ---
  const dbNames = getAllDatabaseNames()
  const [sourceDbName, setSourceDbName] = useState<string>(dbNames[0] || "")
  const [targetDbName, setTargetDbName] = useState<string>(dbNames[1] || dbNames[0] || "")

  // --- Tab ---
  const [activeTab, setActiveTab] = useState<"schema" | "data">("schema")

  // --- Schema comparison state ---
  const [schemaDiffs, setSchemaDiffs] = useState<SchemaDiff[]>([])
  const [schemaCompared, setSchemaCompared] = useState(false)
  const [schemaComparing, setSchemaComparing] = useState(false)
  const [schemaSearch, setSchemaSearch] = useState("")
  const [schemaStatusFilter, setSchemaStatusFilter] = useState<DiffStatus | "all">("all")
  const [expandedCategories, setExpandedCategories] = useState<Set<ObjectCategory>>(new Set(["table", "column", "index", "constraint", "view", "procedure"]))

  // --- Data comparison state ---
  const [dataTableName, setDataTableName] = useState("")
  const [dataResult, setDataResult] = useState<DataComparisonResult | null>(null)
  const [dataComparing, setDataComparing] = useState(false)
  const [dataStatusFilter, setDataStatusFilter] = useState<DiffStatus | "all">("all")
  const [dataSearch, setDataSearch] = useState("")

  // --- Sync direction ---
  const [direction, setDirection] = useState<SyncDirection>("source-to-target")

  // --- SQL Preview dialog ---
  const [sqlPreviewOpen, setSqlPreviewOpen] = useState(false)
  const [sqlPreviewContent, setSqlPreviewContent] = useState("")
  const [sqlPreviewTitle, setSqlPreviewTitle] = useState("")

  // --- Confirm dialog ---
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmDryRun, setConfirmDryRun] = useState(false)
  const [pendingSql, setPendingSql] = useState("")

  // --- Execution state ---
  const [executing, setExecuting] = useState(false)
  const [execProgress, setExecProgress] = useState(0)
  const [execResult, setExecResult] = useState<SyncResult | null>(null)
  const [execLogs, setExecLogs] = useState<SyncLogEntry[]>([])
  const [showExecLog, setShowExecLog] = useState(false)

  const [copied, setCopied] = useState(false)

  // --- Swap ---
  const handleSwap = useCallback(() => {
    setSourceDbName(targetDbName)
    setTargetDbName(sourceDbName)
    setSchemaCompared(false)
    setSchemaDiffs([])
    setDataResult(null)
    setDirection((d) => d === "source-to-target" ? "target-to-source" : "source-to-target")
  }, [sourceDbName, targetDbName])

  // --- Schema compare ---
  const runSchemaCompare = useCallback(async () => {
    const srcDb = getDatabase(sourceDbName)
    const tgtDb = getDatabase(targetDbName)
    if (!srcDb || !tgtDb) return

    setSchemaComparing(true)
    await new Promise((r) => setTimeout(r, 600))
    const diffs = compareSchemas(srcDb, tgtDb)
    setSchemaDiffs(diffs)
    setSchemaCompared(true)
    setSchemaComparing(false)
  }, [sourceDbName, targetDbName])

  // --- Data compare ---
  const runDataCompare = useCallback(async () => {
    if (!dataTableName) return
    setDataComparing(true)
    const srcDb = getDatabase(sourceDbName)
    if (!srcDb) return
    const table = srcDb.tables.find((t) => t.name === dataTableName)
    const pkCols = table?.columns.filter((c) => c.isPrimaryKey).map((c) => c.name) || ["id"]

    const result = await compareTableData(sourceDbName, targetDbName, dataTableName, pkCols)
    setDataResult(result)
    setDataComparing(false)
  }, [sourceDbName, targetDbName, dataTableName])

  // --- Selection helpers ---
  const toggleSchemaDiff = useCallback((id: string) => {
    setSchemaDiffs((prev) => prev.map((d) => d.id === id ? { ...d, selected: !d.selected } : d))
  }, [])

  const selectAllSchemaInCategory = useCallback((category: ObjectCategory, selected: boolean) => {
    setSchemaDiffs((prev) =>
      prev.map((d) => {
        if (d.category !== category) return d
        if (schemaStatusFilter !== "all" && d.status !== schemaStatusFilter) return d
        return { ...d, selected }
      }),
    )
  }, [schemaStatusFilter])

  const toggleDataRow = useCallback((id: string) => {
    if (!dataResult) return
    setDataResult({
      ...dataResult,
      rows: dataResult.rows.map((r) => r.id === id ? { ...r, selected: !r.selected } : r),
    })
  }, [dataResult])

  const selectAllDataByStatus = useCallback((status: DiffStatus, selected: boolean) => {
    if (!dataResult) return
    setDataResult({
      ...dataResult,
      rows: dataResult.rows.map((r) => r.status === status ? { ...r, selected } : r),
    })
  }, [dataResult])

  // --- SQL preview ---
  const previewSchemaSQL = useCallback(() => {
    const sql = generateSchemaSyncSQL(schemaDiffs, direction)
    setSqlPreviewTitle(`Schema Sync SQL (${direction})`)
    setSqlPreviewContent(sql)
    setSqlPreviewOpen(true)
  }, [schemaDiffs, direction])

  const previewDataSQL = useCallback(() => {
    if (!dataResult) return
    const sql = generateDataSyncSQL(dataResult.tableName, dataResult.rows, direction, dataResult.primaryKeyColumns)
    setSqlPreviewTitle(`Data Sync SQL: ${dataResult.tableName} (${direction})`)
    setSqlPreviewContent(sql)
    setSqlPreviewOpen(true)
  }, [dataResult, direction])

  // --- Execute ---
  const startExecution = useCallback((sql: string, dryRun: boolean) => {
    setPendingSql(sql)
    setConfirmDryRun(dryRun)
    setConfirmOpen(true)
  }, [])

  const confirmExecution = useCallback(async () => {
    setConfirmOpen(false)
    setExecuting(true)
    setExecProgress(0)
    setExecLogs([])
    setShowExecLog(true)
    setExecResult(null)

    const result = await executeSyncScript(
      pendingSql,
      confirmDryRun,
      direction,
      (pct, logEntry) => {
        setExecProgress(pct)
        setExecLogs((prev) => [...prev, logEntry])
      },
    )

    setExecResult(result)
    setExecuting(false)
    setExecProgress(100)
  }, [pendingSql, confirmDryRun, direction])

  // --- Copy ---
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  // --- Export ---
  const exportSchemaSQL = useCallback(() => {
    const sql = generateSchemaSyncSQL(schemaDiffs, direction)
    downloadFile(sql, `schema_sync_${sourceDbName}_to_${targetDbName}.sql`, "text/sql")
  }, [schemaDiffs, direction, sourceDbName, targetDbName])

  const exportDataSQL = useCallback(() => {
    if (!dataResult) return
    const sql = generateDataSyncSQL(dataResult.tableName, dataResult.rows, direction, dataResult.primaryKeyColumns)
    downloadFile(sql, `data_sync_${dataResult.tableName}.sql`, "text/sql")
  }, [dataResult, direction])

  const exportJSON = useCallback(() => {
    const data = activeTab === "schema" ? schemaDiffs : dataResult?.rows
    downloadFile(exportAsJSON(data), `diff_${activeTab}_${Date.now()}.json`, "application/json")
  }, [activeTab, schemaDiffs, dataResult])

  const exportCSVFile = useCallback(() => {
    if (!dataResult) return
    downloadFile(exportAsCSV(dataResult.rows), `diff_${dataResult.tableName}.csv`, "text/csv")
  }, [dataResult])

  // --- Filtering ---
  const filteredSchemaDiffs = schemaDiffs.filter((d) => {
    if (schemaStatusFilter !== "all" && d.status !== schemaStatusFilter) return false
    if (schemaSearch) {
      const q = schemaSearch.toLowerCase()
      return d.objectName.toLowerCase().includes(q) || d.details.toLowerCase().includes(q) || (d.parentTable?.toLowerCase().includes(q) ?? false)
    }
    return true
  })

  const groupedDiffs = new Map<ObjectCategory, SchemaDiff[]>()
  for (const d of filteredSchemaDiffs) {
    const arr = groupedDiffs.get(d.category) || []
    arr.push(d)
    groupedDiffs.set(d.category, arr)
  }

  const filteredDataRows = dataResult?.rows.filter((r) => {
    if (dataStatusFilter !== "all" && r.status !== dataStatusFilter) return false
    if (dataSearch) {
      const q = dataSearch.toLowerCase()
      return Object.values(r.primaryKey).some((v) => String(v).toLowerCase().includes(q))
    }
    return true
  }) ?? []

  const selectedSchemaCount = schemaDiffs.filter((d) => d.selected).length
  const selectedDataCount = dataResult?.rows.filter((r) => r.selected).length ?? 0
  const schemaStats = {
    added: schemaDiffs.filter((d) => d.status === "added").length,
    removed: schemaDiffs.filter((d) => d.status === "removed").length,
    modified: schemaDiffs.filter((d) => d.status === "modified").length,
  }

  const sourceDb = getDatabase(sourceDbName)
  const sourceTableNames = sourceDb?.tables.map((t) => t.name) ?? []

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              <h1 className="text-sm font-semibold text-foreground">Database Comparison</h1>
            </div>
          </div>

          {/* Direction indicator */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs font-normal">
              <span className="text-foreground">{sourceDbName}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="text-foreground">{targetDbName}</span>
            </Badge>
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportJSON}>
                  <Download className="h-3 w-3" />
                  JSON
                </Button>
              </TooltipTrigger>
              <TooltipContent><span className="text-xs">Export diff as JSON</span></TooltipContent>
            </Tooltip>
            {activeTab === "data" && dataResult && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportCSVFile}>
                    <Download className="h-3 w-3" />
                    CSV
                  </Button>
                </TooltipTrigger>
                <TooltipContent><span className="text-xs">Export diff as CSV</span></TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={activeTab === "schema" ? exportSchemaSQL : exportDataSQL}
                  disabled={activeTab === "data" && !dataResult}
                >
                  <Download className="h-3 w-3" />
                  .sql
                </Button>
              </TooltipTrigger>
              <TooltipContent><span className="text-xs">Export sync script as .sql file</span></TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Database Selectors + Compare Button */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex flex-1 items-center gap-3">
            {/* Source */}
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Source (Left)</span>
              <Select value={sourceDbName} onValueChange={(v) => { setSourceDbName(v); setSchemaCompared(false); setSchemaDiffs([]); setDataResult(null) }}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dbNames.map((n) => (
                    <SelectItem key={n} value={n} className="text-xs">{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Swap button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="mt-4 h-9 w-9" onClick={handleSwap}>
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><span className="text-xs">Swap Source & Target</span></TooltipContent>
            </Tooltip>

            {/* Target */}
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Target (Right)</span>
              <Select value={targetDbName} onValueChange={(v) => { setTargetDbName(v); setSchemaCompared(false); setSchemaDiffs([]); setDataResult(null) }}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dbNames.map((n) => (
                    <SelectItem key={n} value={n} className="text-xs">{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Direction selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Sync Direction</span>
            <Select value={direction} onValueChange={(v) => setDirection(v as SyncDirection)}>
              <SelectTrigger className="h-9 w-48 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="source-to-target" className="text-xs">Source → Target</SelectItem>
                <SelectItem value="target-to-source" className="text-xs">Target → Source</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-border px-4">
          <button
            onClick={() => setActiveTab("schema")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "schema" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Table2 className="h-3.5 w-3.5" />
            Schema Compare
            {schemaCompared && schemaDiffs.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{schemaDiffs.length}</Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "data" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            Data Compare
            {dataResult && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{dataResult.rows.length}</Badge>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {activeTab === "schema" ? (
            <SchemaTab
              schemaCompared={schemaCompared}
              schemaComparing={schemaComparing}
              schemaDiffs={schemaDiffs}
              filteredDiffs={filteredSchemaDiffs}
              groupedDiffs={groupedDiffs}
              search={schemaSearch}
              onSearchChange={setSchemaSearch}
              statusFilter={schemaStatusFilter}
              onStatusFilterChange={setSchemaStatusFilter}
              stats={schemaStats}
              selectedCount={selectedSchemaCount}
              expandedCategories={expandedCategories}
              onToggleCategory={(cat) =>
                setExpandedCategories((prev) => {
                  const next = new Set(prev)
                  next.has(cat) ? next.delete(cat) : next.add(cat)
                  return next
                })
              }
              onToggleDiff={toggleSchemaDiff}
              onSelectAllInCategory={selectAllSchemaInCategory}
              onCompare={runSchemaCompare}
              onPreviewSQL={previewSchemaSQL}
              onExecute={(dryRun) => startExecution(generateSchemaSyncSQL(schemaDiffs, direction), dryRun)}
              direction={direction}
            />
          ) : (
            <DataTab
              sourceDb={sourceDb}
              sourceTableNames={sourceTableNames}
              tableName={dataTableName}
              onTableNameChange={(v) => { setDataTableName(v); setDataResult(null) }}
              dataResult={dataResult}
              dataComparing={dataComparing}
              filteredRows={filteredDataRows}
              search={dataSearch}
              onSearchChange={setDataSearch}
              statusFilter={dataStatusFilter}
              onStatusFilterChange={setDataStatusFilter}
              selectedCount={selectedDataCount}
              onToggleRow={toggleDataRow}
              onSelectAllByStatus={selectAllDataByStatus}
              onCompare={runDataCompare}
              onPreviewSQL={previewDataSQL}
              onExecute={(dryRun) => {
                if (!dataResult) return
                startExecution(generateDataSyncSQL(dataResult.tableName, dataResult.rows, direction, dataResult.primaryKeyColumns), dryRun)
              }}
              direction={direction}
            />
          )}
        </div>

        {/* Execution Log Panel */}
        {showExecLog && (
          <div className="flex flex-col border-t border-border bg-card">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">Execution Log</span>
                {executing && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                {execResult && (
                  <Badge variant="outline" className={execResult.success ? "border-emerald-500/20 text-emerald-400" : "border-red-500/20 text-red-400"}>
                    {execResult.success ? (execResult.dryRun ? "Dry Run OK" : "Success") : "Failed"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {execResult && (
                  <span className="text-[10px] text-muted-foreground">
                    {execResult.executedStatements}/{execResult.totalStatements} statements
                    {execResult.rolledBack ? " (ROLLED BACK)" : ""}
                  </span>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowExecLog(false)}>
                  <XIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {executing && <Progress value={execProgress} className="h-1 rounded-none" />}
            <ScrollArea className="h-40 px-4 pb-2">
              <div className="flex flex-col gap-0.5">
                {execLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 py-0.5">
                    <span className="mt-0.5 flex-shrink-0">
                      {log.level === "success" && <CheckCircle className="h-3 w-3 text-emerald-400" />}
                      {log.level === "error" && <TriangleAlert className="h-3 w-3 text-red-400" />}
                      {log.level === "warning" && <TriangleAlert className="h-3 w-3 text-amber-400" />}
                      {log.level === "info" && <Circle className="h-3 w-3 text-muted-foreground" />}
                    </span>
                    <span className="font-mono text-[11px] text-foreground/80">{log.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* SQL Preview Dialog */}
        <Dialog open={sqlPreviewOpen} onOpenChange={setSqlPreviewOpen}>
          <DialogContent className="max-w-3xl bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">{sqlPreviewTitle}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Review the generated SQL script before executing.
              </DialogDescription>
            </DialogHeader>
            <div className="relative">
              <ScrollArea className="h-96 rounded-lg border border-border bg-background p-4">
                <pre className="font-mono text-xs text-foreground/80 whitespace-pre-wrap">{sqlPreviewContent}</pre>
              </ScrollArea>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-7 w-7"
                onClick={() => handleCopy(sqlPreviewContent)}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setSqlPreviewOpen(false)} className="text-xs">
                Close
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => downloadFile(sqlPreviewContent, "sync_script.sql", "text/sql")}>
                <Download className="h-3 w-3" />
                Export .sql
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Execution Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {confirmDryRun ? "Confirm Dry Run" : "Confirm Execution"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {confirmDryRun
                  ? "This will validate the SQL script without applying any changes."
                  : "This will execute the SQL script inside a transaction. Changes will be rolled back on failure."
                }
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Direction</span>
                <span className="text-foreground">{direction === "source-to-target" ? "Source → Target" : "Target → Source"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Mode</span>
                <Badge variant="outline" className={confirmDryRun ? "text-amber-400 border-amber-500/20" : "text-emerald-400 border-emerald-500/20"}>
                  {confirmDryRun ? "Dry Run" : "Execute"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Transaction</span>
                <span className="text-foreground">Wrapped in BEGIN TRY / CATCH</span>
              </div>
            </div>
            {!confirmDryRun && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <TriangleAlert className="h-4 w-4 flex-shrink-0 text-amber-400" />
                <span className="text-xs text-amber-300">
                  This will modify the database. All changes are wrapped in a transaction and will rollback on failure.
                </span>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={confirmExecution} className="gap-1.5 text-xs">
                <Play className="h-3 w-3" />
                {confirmDryRun ? "Start Dry Run" : "Execute"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

// ============================================================
// Schema Tab Sub-Component
// ============================================================

function SchemaTab({
  schemaCompared,
  schemaComparing,
  filteredDiffs,
  groupedDiffs,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  stats,
  selectedCount,
  expandedCategories,
  onToggleCategory,
  onToggleDiff,
  onSelectAllInCategory,
  onCompare,
  onPreviewSQL,
  onExecute,
  direction,
}: {
  schemaCompared: boolean
  schemaComparing: boolean
  schemaDiffs: SchemaDiff[]
  filteredDiffs: SchemaDiff[]
  groupedDiffs: Map<ObjectCategory, SchemaDiff[]>
  search: string
  onSearchChange: (v: string) => void
  statusFilter: DiffStatus | "all"
  onStatusFilterChange: (v: DiffStatus | "all") => void
  stats: { added: number; removed: number; modified: number }
  selectedCount: number
  expandedCategories: Set<ObjectCategory>
  onToggleCategory: (cat: ObjectCategory) => void
  onToggleDiff: (id: string) => void
  onSelectAllInCategory: (cat: ObjectCategory, selected: boolean) => void
  onCompare: () => void
  onPreviewSQL: () => void
  onExecute: (dryRun: boolean) => void
  direction: SyncDirection
}) {
  if (!schemaCompared) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
          <Table2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-semibold text-foreground">Schema Comparison</h3>
          <p className="mt-1 text-xs text-muted-foreground">Compare table structures, columns, indexes, and constraints between databases.</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={onCompare} disabled={schemaComparing}>
          {schemaComparing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          {schemaComparing ? "Comparing..." : "Run Schema Comparison"}
        </Button>
      </div>
    )
  }

  if (filteredDiffs.length === 0 && search === "" && statusFilter === "all") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <CheckCircle className="h-10 w-10 text-emerald-400" />
        <h3 className="text-sm font-semibold text-foreground">Schemas are identical</h3>
        <p className="text-xs text-muted-foreground">No differences found between the two databases.</p>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onCompare}>
          <RefreshCw className="h-3 w-3" />
          Re-compare
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search objects..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* Status filter badges */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onStatusFilterChange("all")}
            className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${statusFilter === "all" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            All ({stats.added + stats.removed + stats.modified})
          </button>
          <button
            onClick={() => onStatusFilterChange("removed")}
            className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${statusFilter === "removed" ? "bg-red-500/10 text-red-400" : "text-muted-foreground hover:text-foreground"}`}
          >
            Missing ({stats.removed})
          </button>
          <button
            onClick={() => onStatusFilterChange("added")}
            className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${statusFilter === "added" ? "bg-emerald-500/10 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
          >
            Extra ({stats.added})
          </button>
          <button
            onClick={() => onStatusFilterChange("modified")}
            className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${statusFilter === "modified" ? "bg-amber-500/10 text-amber-400" : "text-muted-foreground hover:text-foreground"}`}
          >
            Modified ({stats.modified})
          </button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Action buttons */}
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onCompare}>
          <RefreshCw className="h-3 w-3" />
          Re-compare
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={onPreviewSQL}
          disabled={selectedCount === 0}
        >
          <FileText className="h-3 w-3" />
          Preview SQL ({selectedCount})
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => onExecute(true)}
          disabled={selectedCount === 0}
        >
          <Shield className="h-3 w-3" />
          Dry Run
        </Button>
        <Button
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => onExecute(false)}
          disabled={selectedCount === 0}
        >
          <Play className="h-3 w-3" />
          Execute ({selectedCount})
        </Button>
      </div>

      {/* Diff Tree */}
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-1">
          {(["table", "column", "index", "constraint", "view", "procedure"] as ObjectCategory[]).map((cat) => {
            const items = groupedDiffs.get(cat)
            if (!items || items.length === 0) return null
            const expanded = expandedCategories.has(cat)
            const Icon = categoryIcons[cat]
            const allSelected = items.every((d) => d.selected)
            const someSelected = items.some((d) => d.selected) && !allSelected

            return (
              <div key={cat} className="rounded-lg border border-border bg-card/50">
                {/* Category Header */}
                <button
                  onClick={() => onToggleCategory(cat)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left"
                >
                  {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={(checked) => {
                      onSelectAllInCategory(cat, !!checked)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3.5 w-3.5"
                  />
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">{categoryLabels[cat]}</span>
                  <Badge variant="secondary" className="ml-auto px-1.5 py-0 text-[10px]">{items.length}</Badge>
                </button>

                {/* Items */}
                {expanded && (
                  <div className="border-t border-border">
                    {items.map((diff) => (
                      <div
                        key={diff.id}
                        className="flex items-center gap-3 border-b border-border/50 px-4 py-2 last:border-b-0 hover:bg-secondary/30"
                      >
                        <Checkbox
                          checked={diff.selected}
                          onCheckedChange={() => onToggleDiff(diff.id)}
                          className="h-3.5 w-3.5"
                        />
                        <Badge variant="outline" className={`shrink-0 px-1.5 py-0 text-[10px] ${statusColors[diff.status]}`}>
                          {diff.status === "removed" ? "Missing" : diff.status === "added" ? "Extra" : "Modified"}
                        </Badge>
                        <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                          <span className="truncate text-xs font-medium text-foreground">
                            {diff.parentTable ? `[${diff.parentTable}].[${diff.objectName}]` : `[${diff.objectName}]`}
                          </span>
                          <span className="truncate text-[10px] text-muted-foreground">{diff.details}</span>
                        </div>
                        {diff.sourceDefinition && (
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="text-[10px] text-muted-foreground">Source</span>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              <pre className="font-mono text-[10px] whitespace-pre-wrap">{diff.sourceDefinition}</pre>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {diff.targetDefinition && (
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="text-[10px] text-muted-foreground">Target</span>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              <pre className="font-mono text-[10px] whitespace-pre-wrap">{diff.targetDefinition}</pre>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

// ============================================================
// Data Tab Sub-Component
// ============================================================

function DataTab({
  sourceDb,
  sourceTableNames,
  tableName,
  onTableNameChange,
  dataResult,
  dataComparing,
  filteredRows,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedCount,
  onToggleRow,
  onSelectAllByStatus,
  onCompare,
  onPreviewSQL,
  onExecute,
  direction,
}: {
  sourceDb: DbDatabase | undefined
  sourceTableNames: string[]
  tableName: string
  onTableNameChange: (v: string) => void
  dataResult: DataComparisonResult | null
  dataComparing: boolean
  filteredRows: DataRowDiff[]
  search: string
  onSearchChange: (v: string) => void
  statusFilter: DiffStatus | "all"
  onStatusFilterChange: (v: DiffStatus | "all") => void
  selectedCount: number
  onToggleRow: (id: string) => void
  onSelectAllByStatus: (status: DiffStatus, selected: boolean) => void
  onCompare: () => void
  onPreviewSQL: () => void
  onExecute: (dryRun: boolean) => void
  direction: SyncDirection
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Table selector */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-2">
        <div className="flex flex-1 items-center gap-3">
          <span className="text-xs text-muted-foreground">Table:</span>
          <Select value={tableName} onValueChange={onTableNameChange}>
            <SelectTrigger className="h-8 w-56 text-xs">
              <SelectValue placeholder="Select table..." />
            </SelectTrigger>
            <SelectContent>
              {sourceTableNames.map((n) => (
                <SelectItem key={n} value={n} className="text-xs">{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-1.5 text-xs" onClick={onCompare} disabled={!tableName || dataComparing}>
            {dataComparing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Compare Data
          </Button>
        </div>
      </div>

      {!dataResult ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
            <Database className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-semibold text-foreground">Data Comparison</h3>
            <p className="mt-1 text-xs text-muted-foreground">Select a table and run comparison to see row-level differences.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats bar */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by primary key..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onStatusFilterChange("all")}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${statusFilter === "all" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                All ({dataResult.rows.length})
              </button>
              <button
                onClick={() => onStatusFilterChange("removed")}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${statusFilter === "removed" ? "bg-red-500/10 text-red-400" : "text-muted-foreground hover:text-foreground"}`}
              >
                Missing ({dataResult.totalRemoved})
              </button>
              <button
                onClick={() => onStatusFilterChange("added")}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${statusFilter === "added" ? "bg-emerald-500/10 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
              >
                Extra ({dataResult.totalAdded})
              </button>
              <button
                onClick={() => onStatusFilterChange("modified")}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${statusFilter === "modified" ? "bg-amber-500/10 text-amber-400" : "text-muted-foreground hover:text-foreground"}`}
              >
                Modified ({dataResult.totalModified})
              </button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Group select */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 text-[10px] text-red-400" onClick={() => onSelectAllByStatus("removed", true)}>
                  <Square className="h-3 w-3" />
                  Select Missing
                </Button>
              </TooltipTrigger>
              <TooltipContent><span className="text-xs">Select all rows missing in Target</span></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 text-[10px] text-amber-400" onClick={() => onSelectAllByStatus("modified", true)}>
                  <Square className="h-3 w-3" />
                  Select Modified
                </Button>
              </TooltipTrigger>
              <TooltipContent><span className="text-xs">Select all modified rows</span></TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={onPreviewSQL}
              disabled={selectedCount === 0}
            >
              <FileText className="h-3 w-3" />
              SQL ({selectedCount})
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => onExecute(true)}
              disabled={selectedCount === 0}
            >
              <Shield className="h-3 w-3" />
              Dry Run
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => onExecute(false)}
              disabled={selectedCount === 0}
            >
              <Play className="h-3 w-3" />
              Execute
            </Button>
          </div>

          {/* Data rows */}
          <ScrollArea className="flex-1 px-4 py-2">
            <div className="flex flex-col gap-1">
              {filteredRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                  <span className="mt-2 text-xs text-muted-foreground">
                    {dataResult.totalIdentical > 0 ? `All ${dataResult.totalIdentical} rows are identical` : "No rows match the current filter"}
                  </span>
                </div>
              ) : (
                filteredRows.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-3 hover:bg-secondary/20"
                  >
                    <Checkbox
                      checked={row.selected}
                      onCheckedChange={() => onToggleRow(row.id)}
                      className="mt-0.5 h-3.5 w-3.5"
                    />
                    <Badge variant="outline" className={`mt-0.5 shrink-0 px-1.5 py-0 text-[10px] ${statusColors[row.status]}`}>
                      {statusLabels[row.status]}
                    </Badge>
                    <div className="flex flex-1 flex-col gap-1.5 overflow-hidden">
                      {/* Primary Key */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium uppercase text-muted-foreground">PK:</span>
                        {Object.entries(row.primaryKey).map(([k, v]) => (
                          <span key={k} className="font-mono text-xs text-foreground">{k}={String(v)}</span>
                        ))}
                      </div>

                      {/* Changed fields */}
                      {row.status === "modified" && (
                        <div className="flex flex-wrap gap-1.5">
                          {row.changedFields.map((field) => (
                            <div key={field} className="flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5">
                              <span className="text-[10px] font-medium text-muted-foreground">{field}:</span>
                              <span className="font-mono text-[10px] text-red-400 line-through">{String(row.targetRow?.[field] ?? "null")}</span>
                              <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                              <span className="font-mono text-[10px] text-emerald-400">{String(row.sourceRow?.[field] ?? "null")}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Full row preview for added/removed */}
                      {(row.status === "added" || row.status === "removed") && (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(row.sourceRow || row.targetRow || {}).slice(0, 6).map(([k, v]) => (
                            <span key={k} className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                              {k}={String(v ?? "null")}
                            </span>
                          ))}
                          {Object.keys(row.sourceRow || row.targetRow || {}).length > 6 && (
                            <span className="text-[10px] text-muted-foreground">...</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  )
}
