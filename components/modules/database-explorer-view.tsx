"use client"

import { useState } from "react"
import {
  TableProperties,
  Server,
  Database,
  Table,
  ChevronRight,
  ChevronDown,
  Columns3,
  Key,
  Hash,
  Search,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface ColumnDef {
  name: string
  type: string
  nullable: boolean
  isPK: boolean
  isFK: boolean
  default?: string
}

interface TableDef {
  name: string
  rows: number
  columns: ColumnDef[]
}

interface DatabaseDef {
  name: string
  tables: TableDef[]
}

interface ServerDef {
  name: string
  driver: string
  databases: DatabaseDef[]
}

const mockData: ServerDef[] = [
  {
    name: "Arcadia Production",
    driver: "MySQL 8.0",
    databases: [
      {
        name: "arcadia_prod",
        tables: [
          {
            name: "npc_resource",
            rows: 142,
            columns: [
              { name: "id", type: "INT", nullable: false, isPK: true, isFK: false },
              { name: "name_text", type: "VARCHAR(255)", nullable: false, isPK: false, isFK: false },
              { name: "identity_text", type: "VARCHAR(255)", nullable: true, isPK: false, isFK: false },
              { name: "hp", type: "INT", nullable: false, isPK: false, isFK: false, default: "100" },
              { name: "mp", type: "INT", nullable: false, isPK: false, isFK: false, default: "50" },
              { name: "weapon_item_id", type: "INT", nullable: true, isPK: false, isFK: true },
              { name: "script_on_talk", type: "TEXT", nullable: true, isPK: false, isFK: false },
            ],
          },
          {
            name: "item_resource",
            rows: 387,
            columns: [
              { name: "id", type: "INT", nullable: false, isPK: true, isFK: false },
              { name: "name_text", type: "VARCHAR(255)", nullable: false, isPK: false, isFK: false },
              { name: "tooltip_text", type: "VARCHAR(512)", nullable: true, isPK: false, isFK: false },
              { name: "type", type: "TINYINT", nullable: false, isPK: false, isFK: false },
              { name: "grade", type: "TINYINT", nullable: false, isPK: false, isFK: false, default: "0" },
              { name: "skill_id", type: "INT", nullable: true, isPK: false, isFK: true },
            ],
          },
          {
            name: "monster_resource",
            rows: 98,
            columns: [
              { name: "id", type: "INT", nullable: false, isPK: true, isFK: false },
              { name: "name_text", type: "VARCHAR(255)", nullable: false, isPK: false, isFK: false },
              { name: "hp", type: "INT", nullable: false, isPK: false, isFK: false },
              { name: "attack", type: "INT", nullable: false, isPK: false, isFK: false },
              { name: "defense", type: "INT", nullable: false, isPK: false, isFK: false },
              { name: "script_on_death", type: "TEXT", nullable: true, isPK: false, isFK: false },
            ],
          },
          {
            name: "quest_resource",
            rows: 64,
            columns: [
              { name: "id", type: "INT", nullable: false, isPK: true, isFK: false },
              { name: "name_text", type: "VARCHAR(255)", nullable: false, isPK: false, isFK: false },
              { name: "summary_text", type: "TEXT", nullable: true, isPK: false, isFK: false },
              { name: "status", type: "TINYINT", nullable: false, isPK: false, isFK: false, default: "0" },
            ],
          },
          {
            name: "skill_resource",
            rows: 215,
            columns: [
              { name: "id", type: "INT", nullable: false, isPK: true, isFK: false },
              { name: "name_text", type: "VARCHAR(255)", nullable: false, isPK: false, isFK: false },
              { name: "description_text", type: "TEXT", nullable: true, isPK: false, isFK: false },
              { name: "state_id", type: "INT", nullable: true, isPK: false, isFK: true },
            ],
          },
          {
            name: "state_resource",
            rows: 53,
            columns: [
              { name: "id", type: "INT", nullable: false, isPK: true, isFK: false },
              { name: "name_text", type: "VARCHAR(255)", nullable: false, isPK: false, isFK: false },
              { name: "tooltip_text", type: "VARCHAR(512)", nullable: true, isPK: false, isFK: false },
              { name: "value_0", type: "FLOAT", nullable: true, isPK: false, isFK: false },
              { name: "value_1", type: "FLOAT", nullable: true, isPK: false, isFK: false },
            ],
          },
        ],
      },
    ],
  },
]

export function DatabaseExplorerView() {
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set(["Arcadia Production"]))
  const [expandedDBs, setExpandedDBs] = useState<Set<string>>(new Set(["arcadia_prod"]))
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [selectedTable, setSelectedTable] = useState<TableDef | null>(null)
  const [search, setSearch] = useState("")

  const toggleServer = (name: string) => {
    setExpandedServers((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const toggleDB = (name: string) => {
    setExpandedDBs((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const toggleTable = (name: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TableProperties className="h-5 w-5 text-foreground" />
              <h2 className="text-xl font-bold text-foreground">Database Explorer</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse server, database, and table structures.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-xs">
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Tree Sidebar */}
        <div className="flex w-72 flex-col border-r border-border">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter tables..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 pl-8 text-[11px]"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-0.5 px-2 pb-4">
              {mockData.map((server) => (
                <div key={server.name}>
                  <button
                    onClick={() => toggleServer(server.name)}
                    className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-medium text-foreground hover:bg-accent/50"
                  >
                    {expandedServers.has(server.name) ? (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    )}
                    <Server className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{server.name}</span>
                    <Badge variant="outline" className="ml-auto border-border px-1 text-[8px] text-muted-foreground">
                      {server.driver}
                    </Badge>
                  </button>
                  {expandedServers.has(server.name) &&
                    server.databases.map((db) => (
                      <div key={db.name} className="ml-4">
                        <button
                          onClick={() => toggleDB(db.name)}
                          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[11px] text-foreground hover:bg-accent/50"
                        >
                          {expandedDBs.has(db.name) ? (
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          )}
                          <Database className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate">{db.name}</span>
                        </button>
                        {expandedDBs.has(db.name) &&
                          db.tables
                            .filter((t) =>
                              search ? t.name.toLowerCase().includes(search.toLowerCase()) : true,
                            )
                            .map((table) => (
                              <div key={table.name} className="ml-4">
                                <button
                                  onClick={() => {
                                    toggleTable(table.name)
                                    setSelectedTable(table)
                                  }}
                                  className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[11px] hover:bg-accent/50 ${
                                    selectedTable?.name === table.name
                                      ? "bg-accent text-foreground"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  <Table className="h-3 w-3" />
                                  <span className="truncate">{table.name}</span>
                                  <span className="ml-auto text-[9px] text-muted-foreground">
                                    {table.rows}
                                  </span>
                                </button>
                              </div>
                            ))}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Table Detail */}
        <div className="flex-1 overflow-auto">
          {selectedTable ? (
            <div className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Table className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">{selectedTable.name}</h3>
                <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                  {selectedTable.rows} rows
                </Badge>
                <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                  {selectedTable.columns.length} columns
                </Badge>
              </div>

              <div className="rounded-lg border border-border">
                <div className="grid grid-cols-12 gap-2 border-b border-border bg-secondary/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <div className="col-span-3">Column</div>
                  <div className="col-span-3">Type</div>
                  <div className="col-span-2">Nullable</div>
                  <div className="col-span-2">Key</div>
                  <div className="col-span-2">Default</div>
                </div>
                {selectedTable.columns.map((col) => (
                  <div
                    key={col.name}
                    className="grid grid-cols-12 items-center gap-2 border-b border-border px-4 py-2 last:border-b-0"
                  >
                    <div className="col-span-3 flex items-center gap-1.5">
                      <Columns3 className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-xs text-foreground">{col.name}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="font-mono text-[11px] text-muted-foreground">{col.type}</span>
                    </div>
                    <div className="col-span-2">
                      <span className={`text-[11px] ${col.nullable ? "text-muted-foreground" : "text-foreground"}`}>
                        {col.nullable ? "YES" : "NO"}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      {col.isPK && (
                        <Badge className="gap-0.5 bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px]">
                          <Key className="h-2.5 w-2.5" />
                          PK
                        </Badge>
                      )}
                      {col.isFK && (
                        <Badge className="gap-0.5 bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px]">
                          <Hash className="h-2.5 w-2.5" />
                          FK
                        </Badge>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {col.default ?? "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <TableProperties className="h-10 w-10 text-muted-foreground/30" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">No table selected</p>
                <p className="text-xs text-muted-foreground/60">
                  Select a table from the tree to inspect its structure.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
