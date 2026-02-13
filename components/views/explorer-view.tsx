"use client"

import { useState } from "react"
import {
  ArrowLeft,
  TableProperties,
  ChevronRight,
  ChevronDown,
  Server,
  Database,
  Table,
  Columns3,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TableColumn {
  name: string
  type: string
  nullable: boolean
  pk: boolean
}

interface TableInfo {
  name: string
  rows: number
  columns: TableColumn[]
}

interface DatabaseInfo {
  name: string
  tables: TableInfo[]
}

interface ServerInfo {
  name: string
  databases: DatabaseInfo[]
}

const mockTree: ServerInfo[] = [
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
              { name: "resource_id", type: "VARCHAR(64)", nullable: false, pk: true },
              { name: "display_name", type: "VARCHAR(128)", nullable: false, pk: false },
              { name: "level", type: "INTEGER", nullable: true, pk: false },
              { name: "faction_id", type: "INTEGER", nullable: true, pk: false },
              { name: "created_at", type: "TIMESTAMP", nullable: false, pk: false },
              { name: "updated_at", type: "TIMESTAMP", nullable: false, pk: false },
            ],
          },
          {
            name: "item_resources",
            rows: 387,
            columns: [
              { name: "resource_id", type: "VARCHAR(64)", nullable: false, pk: true },
              { name: "display_name", type: "VARCHAR(128)", nullable: false, pk: false },
              { name: "item_type", type: "VARCHAR(32)", nullable: false, pk: false },
              { name: "grade", type: "VARCHAR(16)", nullable: true, pk: false },
              { name: "tooltip", type: "TEXT", nullable: true, pk: false },
            ],
          },
          {
            name: "monster_resources",
            rows: 89,
            columns: [
              { name: "resource_id", type: "VARCHAR(64)", nullable: false, pk: true },
              { name: "display_name", type: "VARCHAR(128)", nullable: false, pk: false },
              { name: "base_hp", type: "INTEGER", nullable: false, pk: false },
              { name: "base_attack", type: "INTEGER", nullable: false, pk: false },
            ],
          },
          {
            name: "quest_resources",
            rows: 64,
            columns: [
              { name: "resource_id", type: "VARCHAR(64)", nullable: false, pk: true },
              { name: "title", type: "VARCHAR(256)", nullable: false, pk: false },
              { name: "summary", type: "TEXT", nullable: true, pk: false },
              { name: "status", type: "VARCHAR(16)", nullable: false, pk: false },
            ],
          },
          {
            name: "skill_resources",
            rows: 215,
            columns: [
              { name: "resource_id", type: "VARCHAR(64)", nullable: false, pk: true },
              { name: "display_name", type: "VARCHAR(128)", nullable: false, pk: false },
              { name: "description", type: "TEXT", nullable: true, pk: false },
            ],
          },
          {
            name: "state_resources",
            rows: 48,
            columns: [
              { name: "resource_id", type: "VARCHAR(64)", nullable: false, pk: true },
              { name: "display_name", type: "VARCHAR(128)", nullable: false, pk: false },
              { name: "tooltip", type: "TEXT", nullable: true, pk: false },
            ],
          },
        ],
      },
    ],
  },
]

interface ExplorerViewProps {
  onBack: () => void
}

export function ExplorerView({ onBack }: ExplorerViewProps) {
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set(["Production - Arcadia"]))
  const [expandedDbs, setExpandedDbs] = useState<Set<string>>(new Set(["arcadia_game"]))
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(mockTree[0].databases[0].tables[0])
  const [search, setSearch] = useState("")

  const toggleServer = (name: string) => {
    setExpandedServers((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const toggleDb = (name: string) => {
    setExpandedDbs((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
        {/* Header */}
        <header className="flex h-12 items-center gap-3 border-b border-border bg-background px-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="border-border bg-card text-foreground">
              <span className="text-xs">Back to Dashboard</span>
            </TooltipContent>
          </Tooltip>

          <div className="h-5 w-px bg-border" />

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground/10">
              <TableProperties className="h-3.5 w-3.5 text-foreground" />
            </div>
            <h1 className="text-sm font-semibold text-foreground">Database Explorer</h1>
          </div>
        </header>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tree Sidebar */}
          <aside className="flex w-64 flex-col border-r border-border bg-card">
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter tables..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-7 pl-7 text-[11px]"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto px-2 pb-3">
              {mockTree.map((server) => (
                <div key={server.name}>
                  <button
                    className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[11px] font-medium text-foreground hover:bg-secondary"
                    onClick={() => toggleServer(server.name)}
                  >
                    {expandedServers.has(server.name) ? (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    )}
                    <Server className="h-3 w-3 text-muted-foreground" />
                    {server.name}
                  </button>
                  {expandedServers.has(server.name) &&
                    server.databases.map((db) => (
                      <div key={db.name} className="ml-3">
                        <button
                          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[11px] text-foreground hover:bg-secondary"
                          onClick={() => toggleDb(db.name)}
                        >
                          {expandedDbs.has(db.name) ? (
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          )}
                          <Database className="h-3 w-3 text-muted-foreground" />
                          {db.name}
                        </button>
                        {expandedDbs.has(db.name) &&
                          db.tables
                            .filter((t) =>
                              search ? t.name.toLowerCase().includes(search.toLowerCase()) : true,
                            )
                            .map((tbl) => (
                              <button
                                key={tbl.name}
                                className={`ml-3 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[11px] hover:bg-secondary ${selectedTable?.name === tbl.name ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
                                onClick={() => setSelectedTable(tbl)}
                              >
                                <Table className="h-3 w-3" />
                                {tbl.name}
                              </button>
                            ))}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </aside>

          {/* Table Detail */}
          <main className="flex-1 overflow-auto p-6">
            {selectedTable ? (
              <div className="mx-auto max-w-3xl">
                <div className="mb-4 flex items-center gap-3">
                  <Table className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-mono text-sm font-semibold text-foreground">{selectedTable.name}</h2>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    {selectedTable.rows} rows
                  </Badge>
                </div>

                <div className="rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                    <Columns3 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Columns</span>
                    <Badge variant="outline" className="ml-auto text-[10px] text-muted-foreground">
                      {selectedTable.columns.length}
                    </Badge>
                  </div>
                  <div className="divide-y divide-border">
                    {selectedTable.columns.map((col) => (
                      <div key={col.name} className="flex items-center gap-4 px-4 py-2.5">
                        <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                          {col.name}
                        </span>
                        <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
                          {col.type}
                        </Badge>
                        {col.pk && (
                          <Badge variant="outline" className="border-amber-500/30 text-[10px] text-amber-400">
                            PK
                          </Badge>
                        )}
                        {!col.nullable && !col.pk && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            NOT NULL
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-xs text-muted-foreground">Select a table from the sidebar to inspect its schema.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
