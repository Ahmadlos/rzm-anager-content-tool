"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import {
  ArrowLeft,
  Search,
  Table,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  AlertTriangle,
  Download,
  Trash2,
  Play,
  Plus,
  FileOutput,
  Loader2,
  XCircle,
  CheckCircle2,
  Clock,
  Lock,
  Settings2,
  Eye,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  RDBSettings,
  RDBJob,
  RDBJobStatus,
  TableSnapshot,
  TableChangeInfo,
  TableColumnDef,
  TableDataRow,
} from "@/lib/services/rdb-service"
import {
  defaultRDBSettings,
  calculateStructureHash,
  calculateDataHash,
  compareWithSnapshot,
  generateRdb,
  resolveFilename,
  downloadBlob,
} from "@/lib/services/rdb-service"

// ---- Table Mock Data (re-using from explorer) ----

interface TableInfo {
  name: string
  rows: number
  columns: TableColumnDef[]
  data: TableDataRow[]
}

const mockTables: TableInfo[] = [
  {
    name: "npc_resources",
    rows: 142,
    columns: [
      { name: "resource_id", type: "VARCHAR(64)", nullable: false, default: null, pk: true },
      { name: "display_name", type: "VARCHAR(128)", nullable: false, default: null, pk: false },
      { name: "level", type: "INTEGER", nullable: true, default: "1", pk: false },
      { name: "faction_id", type: "INTEGER", nullable: true, default: null, pk: false },
      { name: "created_at", type: "TIMESTAMP", nullable: false, default: "CURRENT_TIMESTAMP", pk: false },
      { name: "updated_at", type: "TIMESTAMP", nullable: false, default: "CURRENT_TIMESTAMP", pk: false },
    ],
    data: [
      { resource_id: "npc_001", display_name: "Elder Sage Theron", level: 45, faction_id: 2, created_at: "2025-08-14 09:12:33", updated_at: "2025-11-02 14:55:01" },
      { resource_id: "npc_002", display_name: "Guard Captain Mira", level: 30, faction_id: 1, created_at: "2025-08-14 09:12:33", updated_at: "2025-10-28 11:20:15" },
      { resource_id: "npc_003", display_name: "Blacksmith Doran", level: 20, faction_id: 1, created_at: "2025-08-15 10:05:44", updated_at: "2025-10-30 08:33:22" },
      { resource_id: "npc_004", display_name: "Merchant Lysa", level: 15, faction_id: 3, created_at: "2025-08-15 10:05:44", updated_at: "2025-11-01 16:42:08" },
      { resource_id: "npc_005", display_name: "Wandering Bard Kael", level: 25, faction_id: null, created_at: "2025-08-16 12:30:00", updated_at: "2025-11-03 09:15:30" },
      { resource_id: "npc_006", display_name: "Healer Priestess Anya", level: 35, faction_id: 2, created_at: "2025-08-16 14:20:11", updated_at: "2025-11-04 10:00:00" },
    ],
  },
  {
    name: "item_resources",
    rows: 387,
    columns: [
      { name: "resource_id", type: "VARCHAR(64)", nullable: false, default: null, pk: true },
      { name: "display_name", type: "VARCHAR(128)", nullable: false, default: null, pk: false },
      { name: "item_type", type: "VARCHAR(32)", nullable: false, default: "'misc'", pk: false },
      { name: "grade", type: "VARCHAR(16)", nullable: true, default: "'common'", pk: false },
      { name: "tooltip", type: "TEXT", nullable: true, default: null, pk: false },
    ],
    data: [
      { resource_id: "item_001", display_name: "Iron Longsword", item_type: "weapon", grade: "common", tooltip: "A sturdy iron blade." },
      { resource_id: "item_002", display_name: "Mithril Shield", item_type: "armor", grade: "rare", tooltip: "Lightweight yet strong." },
      { resource_id: "item_003", display_name: "Health Potion", item_type: "consumable", grade: "common", tooltip: "Restores 50 HP." },
      { resource_id: "item_004", display_name: "Phoenix Feather", item_type: "material", grade: "epic", tooltip: "A feather imbued with fire." },
      { resource_id: "item_005", display_name: "Arcane Staff", item_type: "weapon", grade: "rare", tooltip: "Channels arcane energy." },
    ],
  },
  {
    name: "monster_resources",
    rows: 89,
    columns: [
      { name: "resource_id", type: "VARCHAR(64)", nullable: false, default: null, pk: true },
      { name: "display_name", type: "VARCHAR(128)", nullable: false, default: null, pk: false },
      { name: "base_hp", type: "INTEGER", nullable: false, default: "100", pk: false },
      { name: "base_attack", type: "INTEGER", nullable: false, default: "10", pk: false },
    ],
    data: [
      { resource_id: "mon_001", display_name: "Forest Wolf", base_hp: 150, base_attack: 22 },
      { resource_id: "mon_002", display_name: "Cave Troll", base_hp: 800, base_attack: 55 },
      { resource_id: "mon_003", display_name: "Shadow Wraith", base_hp: 300, base_attack: 40 },
      { resource_id: "mon_004", display_name: "Flame Drake", base_hp: 1200, base_attack: 75 },
    ],
  },
  {
    name: "quest_resources",
    rows: 64,
    columns: [
      { name: "resource_id", type: "VARCHAR(64)", nullable: false, default: null, pk: true },
      { name: "title", type: "VARCHAR(256)", nullable: false, default: null, pk: false },
      { name: "summary", type: "TEXT", nullable: true, default: null, pk: false },
      { name: "status", type: "VARCHAR(16)", nullable: false, default: "'draft'", pk: false },
    ],
    data: [
      { resource_id: "quest_001", title: "The Lost Artifact", summary: "Recover the ancient relic from the dungeon depths.", status: "active" },
      { resource_id: "quest_002", title: "Wolf Hunt", summary: "Eliminate 10 forest wolves threatening the village.", status: "active" },
      { resource_id: "quest_003", title: "The Merchant Route", summary: "Escort the merchant caravan safely to the capital.", status: "draft" },
    ],
  },
  {
    name: "skill_resources",
    rows: 215,
    columns: [
      { name: "resource_id", type: "VARCHAR(64)", nullable: false, default: null, pk: true },
      { name: "display_name", type: "VARCHAR(128)", nullable: false, default: null, pk: false },
      { name: "description", type: "TEXT", nullable: true, default: null, pk: false },
    ],
    data: [
      { resource_id: "skill_001", display_name: "Fireball", description: "Launches a ball of fire dealing AOE damage." },
      { resource_id: "skill_002", display_name: "Heal", description: "Restores HP to the target." },
      { resource_id: "skill_003", display_name: "Stealth", description: "Become invisible for a short duration." },
    ],
  },
  {
    name: "state_resources",
    rows: 48,
    columns: [
      { name: "resource_id", type: "VARCHAR(64)", nullable: false, default: null, pk: true },
      { name: "display_name", type: "VARCHAR(128)", nullable: false, default: null, pk: false },
      { name: "tooltip", type: "TEXT", nullable: true, default: null, pk: false },
    ],
    data: [
      { resource_id: "state_001", display_name: "Burning", tooltip: "Taking fire damage over time." },
      { resource_id: "state_002", display_name: "Frozen", tooltip: "Movement speed reduced by 50%." },
      { resource_id: "state_003", display_name: "Blessed", tooltip: "All stats increased by 10%." },
    ],
  },
]

// Pre-computed mock snapshots (simulate some tables have changed)
const mockSnapshots: Record<string, TableSnapshot> = {
  npc_resources: {
    tableName: "npc_resources",
    structureHash: "different1",  // will trigger structure change
    dataHash: calculateDataHash(mockTables[0].data),
    lastExportedAt: new Date("2025-10-01"),
    columnCount: 5,
    rowCount: 130,
  },
  item_resources: {
    tableName: "item_resources",
    structureHash: calculateStructureHash(mockTables[1].columns),
    dataHash: "different2",  // will trigger data change
    lastExportedAt: new Date("2025-10-15"),
    columnCount: 5,
    rowCount: 380,
  },
  monster_resources: {
    tableName: "monster_resources",
    structureHash: calculateStructureHash(mockTables[2].columns),
    dataHash: calculateDataHash(mockTables[2].data),
    lastExportedAt: new Date("2025-10-20"),
    columnCount: 4,
    rowCount: 89,
  },
  // quest, skill, state have no snapshot = never exported
}

// ---- Preview Tab Types ----
type PreviewTab = "structure" | "data" | "encoding"

// ---- Component ----

interface RdbExportViewProps {
  onBack: () => void
}

export function RdbExportView({ onBack }: RdbExportViewProps) {
  // Left panel state
  const [tableSearch, setTableSearch] = useState("")
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set())
  const [previewTable, setPreviewTable] = useState<TableInfo | null>(null)

  // Center panel state
  const [previewTab, setPreviewTab] = useState<PreviewTab>("structure")
  const [showAllRows, setShowAllRows] = useState(false)
  const [dataPage, setDataPage] = useState(1)
  const dataPageSize = 50

  // Right panel state
  const [exportQueue, setExportQueue] = useState<RDBJob[]>([])
  const [settings, setSettings] = useState<RDBSettings>({ ...defaultRDBSettings })
  const [snapshots, setSnapshots] = useState<Record<string, TableSnapshot>>({ ...mockSnapshots })
  const [isExporting, setIsExporting] = useState(false)

  // Toast state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" }[]>([])
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = Math.random().toString(36).slice(2, 8)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  // Filtered tables
  const filteredTables = useMemo(() => {
    if (!tableSearch) return mockTables
    const q = tableSearch.toLowerCase()
    return mockTables.filter((t) => t.name.toLowerCase().includes(q))
  }, [tableSearch])

  // Change info per table
  const tableChangeMap = useMemo(() => {
    const map = new Map<string, TableChangeInfo>()
    for (const table of mockTables) {
      const snapshot = snapshots[table.name]
      map.set(
        table.name,
        compareWithSnapshot(snapshot, table.columns, table.data)
      )
    }
    return map
  }, [snapshots])

  // Preview table data pagination
  const previewData = useMemo(() => {
    if (!previewTable) return []
    return previewTable.data
  }, [previewTable])

  const totalPreviewPages = Math.max(1, Math.ceil(previewData.length / dataPageSize))
  const pagedPreviewData = showAllRows
    ? previewData
    : previewData.slice((dataPage - 1) * dataPageSize, dataPage * dataPageSize)

  // Toggle table selection
  const toggleTableSelection = (name: string) => {
    setSelectedTables((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const selectAllFiltered = () => {
    setSelectedTables((prev) => {
      const next = new Set(prev)
      for (const t of filteredTables) next.add(t.name)
      return next
    })
  }

  const deselectAll = () => setSelectedTables(new Set())

  // Add selected to queue
  const addToQueue = () => {
    const existing = new Set(exportQueue.map((j) => j.tableName))
    const newJobs: RDBJob[] = []
    for (const name of selectedTables) {
      if (!existing.has(name)) {
        newJobs.push({
          id: `job-${name}-${Date.now()}`,
          tableName: name,
          status: "pending",
          progress: 0,
          blob: null,
          filename: resolveFilename(settings.filenamePattern, name),
          error: null,
          startedAt: null,
          completedAt: null,
        })
      }
    }
    if (newJobs.length > 0) {
      setExportQueue((prev) => [...prev, ...newJobs])
      addToast(`${newJobs.length} table${newJobs.length > 1 ? "s" : ""} added to queue`, "success")
    }
    setSelectedTables(new Set())
  }

  // Process export queue
  const processQueue = useCallback(async (jobIds?: string[]) => {
    setIsExporting(true)

    const jobsToProcess = jobIds
      ? exportQueue.filter((j) => jobIds.includes(j.id) && j.status !== "processing" && j.status !== "success")
      : exportQueue.filter((j) => j.status === "pending" || j.status === "failed")

    for (const job of jobsToProcess) {
      // Set processing
      setExportQueue((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? { ...j, status: "processing" as RDBJobStatus, progress: 0, startedAt: new Date(), error: null }
            : j
        )
      )

      try {
        const table = mockTables.find((t) => t.name === job.tableName)
        if (!table) throw new Error("Table not found")

        // Simulate progress stages
        for (const pct of [15, 35, 55, 75, 90]) {
          await new Promise((r) => setTimeout(r, 150 + Math.random() * 200))
          setExportQueue((prev) =>
            prev.map((j) => (j.id === job.id ? { ...j, progress: pct } : j))
          )
        }

        const blob = generateRdb(table.name, table.columns, table.data, settings)
        const filename = resolveFilename(settings.filenamePattern, table.name)

        await new Promise((r) => setTimeout(r, 100))

        setExportQueue((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? { ...j, status: "success" as RDBJobStatus, progress: 100, blob, filename, completedAt: new Date() }
              : j
          )
        )

        // Update snapshot after export
        setSnapshots((prev) => ({
          ...prev,
          [table.name]: {
            tableName: table.name,
            structureHash: calculateStructureHash(table.columns),
            dataHash: calculateDataHash(table.data),
            lastExportedAt: new Date(),
            columnCount: table.columns.length,
            rowCount: table.data.length,
          },
        }))

        addToast(`${table.name}.rdb generated successfully`, "success")
      } catch (err) {
        setExportQueue((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? { ...j, status: "failed" as RDBJobStatus, progress: 0, error: (err as Error).message, completedAt: new Date() }
              : j
          )
        )
        addToast(`Failed to export ${job.tableName}`, "error")
      }
    }

    setIsExporting(false)
  }, [exportQueue, settings, addToast])

  const clearQueue = () => {
    setExportQueue([])
  }

  const removeJob = (jobId: string) => {
    setExportQueue((prev) => prev.filter((j) => j.id !== jobId))
  }

  const handleDownload = (job: RDBJob) => {
    if (job.blob) {
      downloadBlob(job.blob, job.filename)
    }
  }

  const handlePreview = (table: TableInfo) => {
    setPreviewTable(table)
    setPreviewTab("structure")
    setDataPage(1)
    setShowAllRows(false)
  }

  // Change indicator UI
  const renderChangeIndicator = (tableName: string) => {
    const info = tableChangeMap.get(tableName)
    if (!info || info.indicator === "none") {
      if (!snapshots[tableName]) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex h-4 items-center">
                <Badge variant="outline" className="h-4 border-muted-foreground/20 px-1.5 text-[8px] text-muted-foreground/50">
                  NEW
                </Badge>
              </span>
            </TooltipTrigger>
            <TooltipContent side="right" className="border-border bg-card text-foreground">
              <span className="text-xs">Never exported</span>
            </TooltipContent>
          </Tooltip>
        )
      }
      return null
    }

    if (info.indicator === "breaking") {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="h-4 border-red-500/30 bg-red-500/15 px-1.5 text-[8px] text-red-400">
              BREAKING
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="right" className="border-border bg-card text-foreground">
            <span className="text-xs">Primary key changed - breaking change</span>
          </TooltipContent>
        </Tooltip>
      )
    }

    if (info.indicator === "structure") {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-blue-400" />
          </TooltipTrigger>
          <TooltipContent side="right" className="border-border bg-card text-foreground">
            <span className="text-xs">Structure modified since last export</span>
          </TooltipContent>
        </Tooltip>
      )
    }

    if (info.indicator === "data") {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-amber-400" />
          </TooltipTrigger>
          <TooltipContent side="right" className="border-border bg-card text-foreground">
            <span className="text-xs">Data modified since last export</span>
          </TooltipContent>
        </Tooltip>
      )
    }

    return null
  }

  const statusIcon = (status: RDBJobStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
      case "processing":
        return <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
      case "success":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
      case "failed":
        return <XCircle className="h-3.5 w-3.5 text-red-400" />
    }
  }

  const pendingCount = exportQueue.filter((j) => j.status === "pending" || j.status === "failed").length
  const successCount = exportQueue.filter((j) => j.status === "success").length

  const previewTabs: { id: PreviewTab; label: string }[] = [
    { id: "structure", label: "Structure" },
    { id: "data", label: "Data Preview" },
    { id: "encoding", label: "Encoding Options" },
  ]

  const changeInfo = previewTable ? tableChangeMap.get(previewTable.name) : undefined

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
        {/* Header */}
        <header className="flex h-11 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onBack}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="border-border bg-card text-foreground">
              <span className="text-xs">Back to Dashboard</span>
            </TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-500/10">
              <FileOutput className="h-3 w-3 text-orange-400" />
            </div>
            <h1 className="text-xs font-semibold text-foreground">RDB Export Tool</h1>
          </div>

          {exportQueue.length > 0 && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-4 px-1.5 text-[9px] text-muted-foreground">
                  {exportQueue.length} in queue
                </Badge>
                {successCount > 0 && (
                  <Badge className="h-4 border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[9px] text-emerald-400">
                    {successCount} done
                  </Badge>
                )}
              </div>
            </>
          )}
        </header>

        {/* Body: 3-panel layout */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT PANEL - Table Selection */}
          <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card/50">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tables</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[9px] text-muted-foreground hover:text-foreground"
                  onClick={selectAllFiltered}
                >
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[9px] text-muted-foreground hover:text-foreground"
                  onClick={deselectAll}
                >
                  None
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter tables..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="h-7 bg-background pl-7 text-[11px] placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            {/* Table List */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredTables.map((table) => {
                  const isSelected = selectedTables.has(table.name)
                  const isPreview = previewTable?.name === table.name

                  return (
                    <div
                      key={table.name}
                      className={`group flex items-center gap-2 rounded-md px-2 py-2 transition-colors ${
                        isPreview
                          ? "bg-foreground/10"
                          : "hover:bg-secondary/60"
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          isSelected
                            ? "border-foreground/40 bg-foreground/15 text-foreground"
                            : "border-border bg-background text-transparent hover:border-muted-foreground"
                        }`}
                        onClick={() => toggleTableSelection(table.name)}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5" />}
                      </button>

                      {/* Table info */}
                      <button
                        className="flex flex-1 items-center gap-2 text-left"
                        onClick={() => handlePreview(table)}
                      >
                        <Table className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className={`truncate text-[11px] ${isPreview ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                          {table.name}
                        </span>
                        {renderChangeIndicator(table.name)}
                        <span className="ml-auto shrink-0 font-mono text-[9px] text-muted-foreground/50">
                          {table.rows}
                        </span>
                      </button>

                      {/* Preview eye button */}
                      <button
                        className="hidden shrink-0 text-muted-foreground/40 transition-colors hover:text-foreground group-hover:block"
                        onClick={() => handlePreview(table)}
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Add to Queue */}
            <div className="border-t border-border p-3">
              <Button
                size="sm"
                className="w-full gap-1.5 bg-foreground/10 text-xs text-foreground hover:bg-foreground/15"
                disabled={selectedTables.size === 0}
                onClick={addToQueue}
              >
                <Plus className="h-3 w-3" />
                {"Add to Export Queue"}
                {selectedTables.size > 0 && (
                  <Badge className="ml-1 h-4 bg-foreground/15 px-1.5 text-[9px] text-foreground">
                    {selectedTables.size}
                  </Badge>
                )}
              </Button>
            </div>
          </aside>

          {/* CENTER PANEL - Preview */}
          <main className="flex flex-1 flex-col overflow-hidden bg-background">
            {previewTable ? (
              <>
                {/* Change Warning Banner */}
                {changeInfo && changeInfo.indicator !== "none" && (
                  <div className={`flex items-start gap-2.5 border-b px-4 py-2.5 ${
                    changeInfo.indicator === "breaking"
                      ? "border-red-500/20 bg-red-500/5"
                      : changeInfo.indicator === "structure"
                        ? "border-blue-500/20 bg-blue-500/5"
                        : "border-amber-500/20 bg-amber-500/5"
                  }`}>
                    <AlertTriangle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                      changeInfo.indicator === "breaking"
                        ? "text-red-400"
                        : changeInfo.indicator === "structure"
                          ? "text-blue-400"
                          : "text-amber-400"
                    }`} />
                    <div className="flex-1">
                      <p className={`text-[11px] font-medium ${
                        changeInfo.indicator === "breaking"
                          ? "text-red-400"
                          : changeInfo.indicator === "structure"
                            ? "text-blue-400"
                            : "text-amber-400"
                      }`}>
                        {changeInfo.indicator === "breaking"
                          ? "Breaking change detected - primary key modified since last export."
                          : changeInfo.indicator === "structure"
                            ? "This table has been modified since last RDB export."
                            : "Data has changed since last RDB export."}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                        {changeInfo.columnsAdded.length > 0 && (
                          <span>+{changeInfo.columnsAdded.length} columns added</span>
                        )}
                        {changeInfo.columnsRemoved.length > 0 && (
                          <span>-{changeInfo.columnsRemoved.length} columns removed</span>
                        )}
                        {changeInfo.rowDelta !== 0 && (
                          <span>{changeInfo.rowDelta > 0 ? "+" : ""}{changeInfo.rowDelta} rows</span>
                        )}
                        {changeInfo.dataModified && changeInfo.indicator === "data" && (
                          <span>Data content modified</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Bar */}
                <div className="flex h-10 shrink-0 items-end border-b border-border px-4">
                  {previewTabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={`relative px-4 pb-2.5 text-xs font-medium transition-colors ${
                        previewTab === tab.id
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground/70"
                      }`}
                      onClick={() => setPreviewTab(tab.id)}
                    >
                      {tab.label}
                      {previewTab === tab.id && (
                        <span className="absolute inset-x-0 bottom-0 h-px bg-foreground" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                  {/* STRUCTURE TAB */}
                  {previewTab === "structure" && (
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        <div className="mb-4 flex items-center gap-2">
                          <h2 className="text-xs font-semibold text-foreground">Column Definitions</h2>
                          <Badge variant="outline" className="h-4 px-1.5 text-[9px] text-muted-foreground">
                            {previewTable.columns.length} columns
                          </Badge>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-border">
                          {/* Header */}
                          <div className="grid grid-cols-[2fr_1.5fr_70px_1.5fr_50px_70px] gap-px bg-secondary/50 px-4 py-2.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Column Name</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Data Type</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nullable</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Default</span>
                            <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PK</span>
                            <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Length</span>
                          </div>

                          {previewTable.columns.map((col, idx) => {
                            const lengthMatch = col.type.match(/\((\d+)\)/)
                            const length = lengthMatch ? lengthMatch[1] : "-"

                            return (
                              <div
                                key={col.name}
                                className={`grid grid-cols-[2fr_1.5fr_70px_1.5fr_50px_70px] gap-px px-4 py-2.5 transition-colors hover:bg-secondary/30 ${
                                  idx % 2 === 0 ? "bg-background" : "bg-card/30"
                                } ${idx < previewTable.columns.length - 1 ? "border-b border-border/50" : ""}`}
                              >
                                <div className="flex items-center gap-2">
                                  {col.pk && <KeyRound className="h-3 w-3 shrink-0 text-amber-400" />}
                                  <span className="font-mono text-[11px] text-foreground">{col.name}</span>
                                </div>
                                <span className="font-mono text-[11px] text-muted-foreground">{col.type}</span>
                                <span className={`text-[11px] ${col.nullable ? "text-muted-foreground/60" : "text-foreground/70"}`}>
                                  {col.nullable ? "YES" : "NO"}
                                </span>
                                <span className="font-mono text-[11px] text-muted-foreground/60">
                                  {col.default ?? <span className="italic">NULL</span>}
                                </span>
                                <div className="flex justify-center">
                                  {col.pk && (
                                    <Badge className="h-4 border-amber-500/30 bg-amber-500/10 px-1.5 text-[9px] text-amber-400">PK</Badge>
                                  )}
                                </div>
                                <span className="text-center font-mono text-[11px] text-muted-foreground/50">{length}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </ScrollArea>
                  )}

                  {/* DATA PREVIEW TAB */}
                  {previewTab === "data" && (
                    <div className="flex h-full flex-col">
                      {/* Toolbar */}
                      <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-6 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground">
                            {showAllRows
                              ? `Showing all ${previewData.length} rows`
                              : `Showing ${Math.min(dataPageSize, previewData.length)} of ${previewData.length} rows`}
                          </span>
                          {!showAllRows && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 gap-1 bg-transparent text-[10px]"
                              onClick={() => setShowAllRows(true)}
                            >
                              Load All Rows
                            </Button>
                          )}
                        </div>

                        {!showAllRows && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground"
                              disabled={dataPage <= 1}
                              onClick={() => setDataPage((p) => p - 1)}
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </Button>
                            <span className="min-w-[3rem] text-center font-mono text-[10px] text-muted-foreground">
                              {dataPage} / {totalPreviewPages}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground"
                              disabled={dataPage >= totalPreviewPages}
                              onClick={() => setDataPage((p) => p + 1)}
                            >
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Large dataset warning */}
                      {showAllRows && previewData.length > 200 && (
                        <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/5 px-4 py-1.5">
                          <AlertTriangle className="h-3 w-3 text-amber-400" />
                          <span className="text-[10px] text-amber-400/80">Large datasets may affect performance.</span>
                        </div>
                      )}

                      {/* Data Grid */}
                      <ScrollArea className="flex-1">
                        <div className="min-w-full">
                          {/* Grid Header */}
                          <div className="sticky top-0 z-10 flex border-b border-border bg-secondary/50">
                            {previewTable.columns.map((col) => (
                              <div
                                key={col.name}
                                className="flex min-w-[140px] flex-1 items-center gap-1.5 px-4 py-2.5"
                              >
                                {col.pk && <KeyRound className="h-2.5 w-2.5 shrink-0 text-amber-400" />}
                                <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  {col.name}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Grid Rows */}
                          {pagedPreviewData.map((row, rowIdx) => (
                            <div
                              key={rowIdx}
                              className={`flex transition-colors hover:bg-secondary/30 ${
                                rowIdx % 2 === 0 ? "bg-background" : "bg-card/20"
                              } ${rowIdx < pagedPreviewData.length - 1 ? "border-b border-border/30" : ""}`}
                            >
                              {previewTable.columns.map((col) => (
                                <div
                                  key={col.name}
                                  className="flex min-w-[140px] flex-1 items-center px-4 py-2"
                                >
                                  <span className="truncate font-mono text-[11px] text-foreground/80">
                                    {row[col.name] === null ? (
                                      <span className="italic text-muted-foreground/40">NULL</span>
                                    ) : (
                                      String(row[col.name])
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ))}

                          {pagedPreviewData.length === 0 && (
                            <div className="flex items-center justify-center py-12">
                              <p className="text-xs text-muted-foreground/60">No data available.</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* ENCODING OPTIONS TAB */}
                  {previewTab === "encoding" && (
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        <div className="mb-6 flex items-center gap-2">
                          <Settings2 className="h-4 w-4 text-muted-foreground" />
                          <h2 className="text-xs font-semibold text-foreground">Export Configuration</h2>
                        </div>

                        <div className="flex max-w-lg flex-col gap-6">
                          {/* Encryption Key */}
                          <div className="flex flex-col gap-2">
                            <Label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Lock className="h-3 w-3" />
                              Encryption Key
                            </Label>
                            <Input
                              type="password"
                              placeholder="Leave empty for no encryption"
                              value={settings.encryptionKey}
                              onChange={(e) => setSettings((s) => ({ ...s, encryptionKey: e.target.value }))}
                              className="h-8 bg-card text-xs"
                            />
                            <p className="text-[10px] text-muted-foreground/50">
                              XOR-based encryption applied to the output binary.
                            </p>
                          </div>

                          {/* Version */}
                          <div className="flex flex-col gap-2">
                            <Label className="text-[11px] text-muted-foreground">RDB Version</Label>
                            <Select
                              value={settings.version}
                              onValueChange={(v) => setSettings((s) => ({ ...s, version: v }))}
                            >
                              <SelectTrigger className="h-8 w-40 bg-card text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="border-border bg-card">
                                <SelectItem value="1.0" className="text-xs">v1.0</SelectItem>
                                <SelectItem value="1.1" className="text-xs">v1.1</SelectItem>
                                <SelectItem value="2.0" className="text-xs">v2.0</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Compression */}
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-[11px] text-foreground/80">Compression</Label>
                              <p className="text-[10px] text-muted-foreground/50">Minify JSON output</p>
                            </div>
                            <Switch
                              checked={settings.compression}
                              onCheckedChange={(v) => setSettings((s) => ({ ...s, compression: v }))}
                            />
                          </div>

                          {/* Include Metadata */}
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-[11px] text-foreground/80">Include Metadata</Label>
                              <p className="text-[10px] text-muted-foreground/50">Embed hashes and generation info</p>
                            </div>
                            <Switch
                              checked={settings.includeMetadata}
                              onCheckedChange={(v) => setSettings((s) => ({ ...s, includeMetadata: v }))}
                            />
                          </div>

                          {/* Filename Pattern */}
                          <div className="flex flex-col gap-2">
                            <Label className="text-[11px] text-muted-foreground">Output Filename Pattern</Label>
                            <Input
                              value={settings.filenamePattern}
                              onChange={(e) => setSettings((s) => ({ ...s, filenamePattern: e.target.value }))}
                              className="h-8 bg-card font-mono text-xs"
                            />
                            <p className="text-[10px] text-muted-foreground/50">
                              {"Use {table} as placeholder. Example: {table}.rdb"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                  <FileOutput className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground/60">No table selected</p>
                  <p className="mt-1 text-xs text-muted-foreground/40">
                    Select a table from the left panel to preview its structure and data.
                  </p>
                </div>
              </div>
            )}
          </main>

          {/* RIGHT PANEL - Export Queue */}
          <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-card/50">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Export Queue</span>
                {exportQueue.length > 0 && (
                  <Badge variant="outline" className="h-4 px-1.5 text-[9px] text-muted-foreground">
                    {exportQueue.length}
                  </Badge>
                )}
              </div>
              {exportQueue.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[9px] text-muted-foreground hover:text-foreground"
                  onClick={clearQueue}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Queue List */}
            <ScrollArea className="flex-1">
              {exportQueue.length > 0 ? (
                <div className="p-2">
                  {exportQueue.map((job) => (
                    <div
                      key={job.id}
                      className="mb-1.5 rounded-lg border border-border/50 bg-background/50 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {statusIcon(job.status)}
                          <span className="font-mono text-[11px] text-foreground">{job.tableName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {job.status === "success" && job.blob && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-emerald-400 hover:text-emerald-300"
                                  onClick={() => handleDownload(job)}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="border-border bg-card text-foreground">
                                <span className="text-xs">Download {job.filename}</span>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {job.status !== "processing" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground/40 hover:text-red-400"
                              onClick={() => removeJob(job.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      {(job.status === "processing" || job.status === "success") && (
                        <div className="mt-2">
                          <Progress
                            value={job.progress}
                            className="h-1 bg-secondary"
                          />
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-[9px] text-muted-foreground/60">
                              {job.status === "processing" ? `${job.progress}%` : job.filename}
                            </span>
                            {job.blob && (
                              <span className="text-[9px] text-muted-foreground/60">
                                {(job.blob.size / 1024).toFixed(1)} KB
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Error */}
                      {job.status === "failed" && job.error && (
                        <p className="mt-1.5 text-[10px] text-red-400/80">{job.error}</p>
                      )}

                      {/* Pending status */}
                      {job.status === "pending" && (
                        <p className="mt-1 text-[9px] text-muted-foreground/50">Waiting to process...</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <FileOutput className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                  <p className="text-center text-[11px] text-muted-foreground/40">
                    Select tables and add them to the export queue.
                  </p>
                </div>
              )}
            </ScrollArea>

            {/* Queue Actions */}
            <div className="flex flex-col gap-2 border-t border-border p-3">
              <Button
                size="sm"
                className="w-full gap-1.5 bg-foreground/10 text-xs text-foreground hover:bg-foreground/15"
                disabled={pendingCount === 0 || isExporting}
                onClick={() => processQueue()}
              >
                {isExporting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                {isExporting ? "Generating..." : `Generate All (${pendingCount})`}
              </Button>

              {successCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 bg-transparent text-xs"
                  onClick={() => {
                    for (const job of exportQueue) {
                      if (job.status === "success" && job.blob) {
                        downloadBlob(job.blob, job.filename)
                      }
                    }
                  }}
                >
                  <Download className="h-3 w-3" />
                  {"Download All"} ({successCount})
                </Button>
              )}
            </div>
          </aside>
        </div>

        {/* Toast Notifications */}
        {toasts.length > 0 && (
          <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 shadow-lg transition-all ${
                  toast.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-red-500/30 bg-red-500/10 text-red-400"
                }`}
              >
                {toast.type === "success" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                <span className="text-xs">{toast.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
