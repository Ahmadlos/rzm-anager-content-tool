"use client"

import { useState, useMemo } from "react"
import {
  ArrowLeft,
  TableProperties,
  ChevronRight,
  ChevronDown,
  Server,
  Database,
  Table,
  Eye,
  FolderClosed,
  FolderOpen,
  Search,
  Copy,
  Check,
  KeyRound,
  Rows3,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ---- Types ----

interface TableColumn {
  name: string
  type: string
  nullable: boolean
  default: string | null
  pk: boolean
}

interface TableRow {
  [key: string]: string | number | boolean | null
}

interface TableInfo {
  name: string
  rows: number
  columns: TableColumn[]
  data: TableRow[]
}

interface ViewInfo {
  name: string
  definition: string
}

interface ProcedureInfo {
  name: string
  definition: string
}

interface DatabaseInfo {
  name: string
  tables: TableInfo[]
  views: ViewInfo[]
  procedures: ProcedureInfo[]
}

interface ServerInfo {
  name: string
  databases: DatabaseInfo[]
}

// ---- Mock Data ----

const mockData: ServerInfo[] = [
  {
    name: "Production - Arcadia",
    databases: [
      {
        name: "arcadia_game",
        tables: [
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
              { resource_id: "npc_007", display_name: "Rogue Spy Vex", level: 40, faction_id: 4, created_at: "2025-08-17 08:45:19", updated_at: "2025-11-05 12:30:45" },
              { resource_id: "npc_008", display_name: "Stable Master Gwen", level: 10, faction_id: 1, created_at: "2025-08-17 09:00:00", updated_at: "2025-11-05 13:00:00" },
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
              { resource_id: "item_006", display_name: "Shadow Cloak", item_type: "armor", grade: "epic", tooltip: "Grants stealth in darkness." },
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
              { resource_id: "mon_005", display_name: "Goblin Scout", base_hp: 80, base_attack: 12 },
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
              { resource_id: "quest_004", title: "Dragon Slayer", summary: "Defeat the Flame Drake in the volcanic lair.", status: "active" },
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
        ],
        views: [
          { name: "v_active_npcs", definition: "SELECT * FROM npc_resources WHERE level > 0" },
          { name: "v_epic_items", definition: "SELECT * FROM item_resources WHERE grade = 'epic'" },
        ],
        procedures: [
          { name: "sp_reset_npc_levels", definition: "UPDATE npc_resources SET level = 1 WHERE level IS NULL" },
          { name: "sp_purge_draft_quests", definition: "DELETE FROM quest_resources WHERE status = 'draft'" },
        ],
      },
    ],
  },
]

// ---- Tab types ----
type TabId = "structure" | "data" | "sql"

// ---- Component ----

interface ExplorerViewProps {
  onBack: () => void
}

export function ExplorerView({ onBack }: ExplorerViewProps) {
  // Tree state
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set(["Production - Arcadia"]))
  const [expandedDbs, setExpandedDbs] = useState<Set<string>>(new Set(["arcadia_game"]))
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["arcadia_game:tables"]))
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(mockData[0].databases[0].tables[0])
  const [search, setSearch] = useState("")

  // Right panel state
  const [activeTab, setActiveTab] = useState<TabId>("structure")
  const [dataSearch, setDataSearch] = useState("")
  const [dataPage, setDataPage] = useState(1)
  const [copied, setCopied] = useState(false)
  const dataPageSize = 5

  const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) => {
    setter((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // Filtered data for data tab
  const filteredData = useMemo(() => {
    if (!selectedTable) return []
    if (!dataSearch) return selectedTable.data
    const q = dataSearch.toLowerCase()
    return selectedTable.data.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    )
  }, [selectedTable, dataSearch])

  const totalDataPages = Math.max(1, Math.ceil(filteredData.length / dataPageSize))
  const pagedData = filteredData.slice((dataPage - 1) * dataPageSize, dataPage * dataPageSize)

  // SQL generation
  const generateSQL = (table: TableInfo) => {
    const cols = table.columns.map((c) => {
      let line = `  ${c.name.padEnd(24)} ${c.type}`
      if (c.pk) line += "  PRIMARY KEY"
      if (!c.nullable && !c.pk) line += "  NOT NULL"
      if (c.default) line += `  DEFAULT ${c.default}`
      return line
    })
    return `CREATE TABLE ${table.name} (\n${cols.join(",\n")}\n);`
  }

  const handleCopySQL = () => {
    if (!selectedTable) return
    navigator.clipboard.writeText(generateSQL(selectedTable))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSelectTable = (table: TableInfo) => {
    setSelectedTable(table)
    setActiveTab("structure")
    setDataPage(1)
    setDataSearch("")
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "structure", label: "Structure" },
    { id: "data", label: "Data" },
    { id: "sql", label: "SQL" },
  ]

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
            <div className="flex h-6 w-6 items-center justify-center rounded bg-foreground/10">
              <TableProperties className="h-3 w-3 text-foreground" />
            </div>
            <h1 className="text-xs font-semibold text-foreground">Database Explorer</h1>
          </div>

          {selectedTable && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <Table className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-[11px] text-muted-foreground">{selectedTable.name}</span>
                <Badge variant="outline" className="ml-1 h-4 px-1.5 text-[9px] text-muted-foreground">
                  {selectedTable.rows} rows
                </Badge>
              </div>
            </>
          )}
        </header>

        {/* Body: 2-panel layout */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left Sidebar - Database Tree */}
          <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card/50">
            {/* Search */}
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter objects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-7 bg-background pl-7 text-[11px] placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            {/* Tree */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {mockData.map((server) => (
                  <div key={server.name}>
                    {/* Server Node */}
                    <button
                      className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[11px] font-medium text-foreground transition-colors hover:bg-secondary"
                      onClick={() => toggleSet(setExpandedServers, server.name)}
                    >
                      {expandedServers.has(server.name) ? (
                        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                      )}
                      <Server className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="truncate">{server.name}</span>
                    </button>

                    {/* Databases */}
                    {expandedServers.has(server.name) &&
                      server.databases.map((db) => {
                        const dbKey = db.name
                        const tablesKey = `${db.name}:tables`
                        const viewsKey = `${db.name}:views`
                        const procsKey = `${db.name}:procedures`

                        const filteredTables = search
                          ? db.tables.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
                          : db.tables
                        const filteredViews = search
                          ? db.views.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()))
                          : db.views
                        const filteredProcs = search
                          ? db.procedures.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
                          : db.procedures

                        return (
                          <div key={db.name} className="ml-3">
                            {/* Database Node */}
                            <button
                              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[11px] text-foreground transition-colors hover:bg-secondary"
                              onClick={() => toggleSet(setExpandedDbs, dbKey)}
                            >
                              {expandedDbs.has(dbKey) ? (
                                <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                              )}
                              <Database className="h-3 w-3 shrink-0 text-emerald-400/70" />
                              <span className="truncate">{db.name}</span>
                            </button>

                            {expandedDbs.has(dbKey) && (
                              <div className="ml-3">
                                {/* Tables Folder */}
                                {filteredTables.length > 0 && (
                                  <div>
                                    <button
                                      className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                      onClick={() => toggleSet(setExpandedFolders, tablesKey)}
                                    >
                                      {expandedFolders.has(tablesKey) ? (
                                        <>
                                          <ChevronDown className="h-3 w-3 shrink-0" />
                                          <FolderOpen className="h-3 w-3 shrink-0 text-amber-400/70" />
                                        </>
                                      ) : (
                                        <>
                                          <ChevronRight className="h-3 w-3 shrink-0" />
                                          <FolderClosed className="h-3 w-3 shrink-0 text-amber-400/70" />
                                        </>
                                      )}
                                      <span>Tables</span>
                                      <span className="ml-auto font-mono text-[9px] text-muted-foreground/60">{filteredTables.length}</span>
                                    </button>
                                    {expandedFolders.has(tablesKey) &&
                                      filteredTables.map((tbl) => (
                                        <button
                                          key={tbl.name}
                                          className={`ml-3 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[11px] transition-colors ${
                                            selectedTable?.name === tbl.name
                                              ? "bg-foreground/10 text-foreground"
                                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                          }`}
                                          onClick={() => handleSelectTable(tbl)}
                                        >
                                          <Table className="h-3 w-3 shrink-0" />
                                          <span className="truncate">{tbl.name}</span>
                                          <span className="ml-auto font-mono text-[9px] text-muted-foreground/50">{tbl.rows}</span>
                                        </button>
                                      ))}
                                  </div>
                                )}

                                {/* Views Folder */}
                                {filteredViews.length > 0 && (
                                  <div>
                                    <button
                                      className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                      onClick={() => toggleSet(setExpandedFolders, viewsKey)}
                                    >
                                      {expandedFolders.has(viewsKey) ? (
                                        <>
                                          <ChevronDown className="h-3 w-3 shrink-0" />
                                          <FolderOpen className="h-3 w-3 shrink-0 text-blue-400/70" />
                                        </>
                                      ) : (
                                        <>
                                          <ChevronRight className="h-3 w-3 shrink-0" />
                                          <FolderClosed className="h-3 w-3 shrink-0 text-blue-400/70" />
                                        </>
                                      )}
                                      <span>Views</span>
                                      <span className="ml-auto font-mono text-[9px] text-muted-foreground/60">{filteredViews.length}</span>
                                    </button>
                                    {expandedFolders.has(viewsKey) &&
                                      filteredViews.map((v) => (
                                        <div
                                          key={v.name}
                                          className="ml-3 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-muted-foreground"
                                        >
                                          <Eye className="h-3 w-3 shrink-0 text-blue-400/50" />
                                          <span className="truncate">{v.name}</span>
                                        </div>
                                      ))}
                                  </div>
                                )}

                                {/* Procedures Folder */}
                                {filteredProcs.length > 0 && (
                                  <div>
                                    <button
                                      className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                      onClick={() => toggleSet(setExpandedFolders, procsKey)}
                                    >
                                      {expandedFolders.has(procsKey) ? (
                                        <>
                                          <ChevronDown className="h-3 w-3 shrink-0" />
                                          <FolderOpen className="h-3 w-3 shrink-0 text-rose-400/70" />
                                        </>
                                      ) : (
                                        <>
                                          <ChevronRight className="h-3 w-3 shrink-0" />
                                          <FolderClosed className="h-3 w-3 shrink-0 text-rose-400/70" />
                                        </>
                                      )}
                                      <span>Procedures</span>
                                      <span className="ml-auto font-mono text-[9px] text-muted-foreground/60">{filteredProcs.length}</span>
                                    </button>
                                    {expandedFolders.has(procsKey) &&
                                      filteredProcs.map((p) => (
                                        <div
                                          key={p.name}
                                          className="ml-3 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-muted-foreground"
                                        >
                                          <Rows3 className="h-3 w-3 shrink-0 text-rose-400/50" />
                                          <span className="truncate">{p.name}</span>
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Sidebar Footer */}
            <div className="border-t border-border px-3 py-2">
              <p className="text-[10px] text-muted-foreground/50">
                {mockData[0].databases[0].tables.length} tables, {mockData[0].databases[0].views.length} views
              </p>
            </div>
          </aside>

          {/* Right Content Panel */}
          <main className="flex flex-1 flex-col overflow-hidden bg-background">
            {selectedTable ? (
              <>
                {/* Tab Bar */}
                <div className="flex h-10 shrink-0 items-end border-b border-border px-4">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={`relative px-4 pb-2.5 text-xs font-medium transition-colors ${
                        activeTab === tab.id
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground/70"
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <span className="absolute inset-x-0 bottom-0 h-px bg-foreground" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                  {/* Structure Tab */}
                  {activeTab === "structure" && (
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        <div className="mb-4 flex items-center gap-2">
                          <h2 className="text-xs font-semibold text-foreground">Column Definitions</h2>
                          <Badge variant="outline" className="h-4 px-1.5 text-[9px] text-muted-foreground">
                            {selectedTable.columns.length} columns
                          </Badge>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-border">
                          {/* Table Header */}
                          <div className="grid grid-cols-[2fr_1.5fr_80px_1.5fr_60px] gap-px bg-secondary/50 px-4 py-2.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Column Name</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Data Type</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nullable</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Default</span>
                            <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PK</span>
                          </div>

                          {/* Table Rows */}
                          {selectedTable.columns.map((col, idx) => (
                            <div
                              key={col.name}
                              className={`grid grid-cols-[2fr_1.5fr_80px_1.5fr_60px] gap-px px-4 py-2.5 transition-colors hover:bg-secondary/30 ${
                                idx % 2 === 0 ? "bg-background" : "bg-card/30"
                              } ${idx < selectedTable.columns.length - 1 ? "border-b border-border/50" : ""}`}
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
                                  <Badge className="h-4 border-amber-500/30 bg-amber-500/10 px-1.5 text-[9px] text-amber-400">
                                    PK
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                  )}

                  {/* Data Tab */}
                  {activeTab === "data" && (
                    <div className="flex h-full flex-col">
                      {/* Data Toolbar */}
                      <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-6 py-3">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Search rows..."
                            value={dataSearch}
                            onChange={(e) => { setDataSearch(e.target.value); setDataPage(1) }}
                            className="h-7 w-56 bg-card pl-7 text-[11px] placeholder:text-muted-foreground/60"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            {filteredData.length} row{filteredData.length !== 1 ? "s" : ""}
                          </span>
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
                              {dataPage} / {totalDataPages}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground"
                              disabled={dataPage >= totalDataPages}
                              onClick={() => setDataPage((p) => p + 1)}
                            >
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Data Grid */}
                      <ScrollArea className="flex-1">
                        <div className="min-w-full">
                          {/* Grid Header */}
                          <div className="sticky top-0 z-10 flex border-b border-border bg-secondary/50">
                            {selectedTable.columns.map((col) => (
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
                          {pagedData.map((row, rowIdx) => (
                            <div
                              key={rowIdx}
                              className={`flex transition-colors hover:bg-secondary/30 ${
                                rowIdx % 2 === 0 ? "bg-background" : "bg-card/20"
                              } ${rowIdx < pagedData.length - 1 ? "border-b border-border/30" : ""}`}
                            >
                              {selectedTable.columns.map((col) => (
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

                          {pagedData.length === 0 && (
                            <div className="flex items-center justify-center py-12">
                              <p className="text-xs text-muted-foreground/60">No rows match your search.</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* SQL Tab */}
                  {activeTab === "sql" && (
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        <div className="mb-3 flex items-center justify-between">
                          <h2 className="text-xs font-semibold text-foreground">CREATE TABLE Statement</h2>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                            onClick={handleCopySQL}
                          >
                            {copied ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-border bg-[oklch(0.12_0_0)]">
                          <pre className="overflow-x-auto p-5">
                            <code className="font-mono text-[11px] leading-relaxed">
                              {generateSQL(selectedTable).split("\n").map((line, i) => (
                                <div key={i} className="flex">
                                  <span className="mr-6 inline-block w-5 select-none text-right text-muted-foreground/30">{i + 1}</span>
                                  <span>
                                    {highlightSQL(line)}
                                  </span>
                                </div>
                              ))}
                            </code>
                          </pre>
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
                  <TableProperties className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground/60">No table selected</p>
                  <p className="mt-1 text-xs text-muted-foreground/40">
                    Select a table from the sidebar to inspect its schema and data.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}

// ---- SQL Syntax Highlighting (lightweight) ----

function highlightSQL(line: string): React.ReactNode {
  const keywords = /\b(CREATE|TABLE|PRIMARY|KEY|NOT|NULL|DEFAULT|VARCHAR|INTEGER|TIMESTAMP|TEXT|CURRENT_TIMESTAMP)\b/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = keywords.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`t-${lastIndex}`} className="text-foreground/70">
          {line.slice(lastIndex, match.index)}
        </span>
      )
    }
    const word = match[0]
    const isType = ["VARCHAR", "INTEGER", "TIMESTAMP", "TEXT"].includes(word)
    parts.push(
      <span
        key={`k-${match.index}`}
        className={isType ? "text-emerald-400/80" : "text-blue-400/80"}
      >
        {word}
      </span>
    )
    lastIndex = match.index + word.length
  }

  if (lastIndex < line.length) {
    parts.push(
      <span key={`e-${lastIndex}`} className="text-foreground/70">
        {line.slice(lastIndex)}
      </span>
    )
  }

  return parts.length > 0 ? parts : <span className="text-foreground/70">{line}</span>
}
