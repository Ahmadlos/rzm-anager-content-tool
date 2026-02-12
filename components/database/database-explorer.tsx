"use client"

import { useState, useCallback, useEffect } from "react"
import {
  ArrowLeft,
  Database,
  Table2,
  Eye,
  FileCode,
  ChevronRight,
  ChevronDown,
  Server,
  Key,
  Link2,
  Hash,
  Search,
  Filter,
  Plus,
  Trash2,
  Play,
  Copy,
  Check,
  Loader2,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  Lock,
  Terminal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  type DbDatabase,
  type DbTable,
  type DbView,
  type DbStoredProcedure,
  type QueryFilter,
  type FilterOperator,
  type DataRow,
  simulatedServer,
  fetchTableData,
  executeSelectQuery,
} from "@/lib/db-explorer-store"

interface DatabaseExplorerProps {
  onBack: () => void
}

type TreeNodeType = "server" | "database" | "tables-folder" | "views-folder" | "sprocs-folder" | "table" | "view" | "sproc"
type DetailTab = "columns" | "indexes" | "foreign-keys" | "data" | "definition" | "query"

interface TreeNode {
  id: string
  label: string
  type: TreeNodeType
  children?: TreeNode[]
  data?: DbTable | DbView | DbStoredProcedure
  dbName?: string
}

function buildTree(): TreeNode {
  const srv = simulatedServer
  return {
    id: "server",
    label: srv.name,
    type: "server",
    children: srv.databases.map((db) => ({
      id: `db-${db.name}`,
      label: db.name,
      type: "database" as TreeNodeType,
      dbName: db.name,
      children: [
        {
          id: `tables-${db.name}`,
          label: `Tables (${db.tables.length})`,
          type: "tables-folder" as TreeNodeType,
          dbName: db.name,
          children: db.tables.map((t) => ({
            id: `table-${db.name}-${t.name}`,
            label: t.name,
            type: "table" as TreeNodeType,
            data: t,
            dbName: db.name,
          })),
        },
        {
          id: `views-${db.name}`,
          label: `Views (${db.views.length})`,
          type: "views-folder" as TreeNodeType,
          dbName: db.name,
          children: db.views.map((v) => ({
            id: `view-${db.name}-${v.name}`,
            label: v.name,
            type: "view" as TreeNodeType,
            data: v,
            dbName: db.name,
          })),
        },
        {
          id: `sprocs-${db.name}`,
          label: `Stored Procedures (${db.storedProcedures.length})`,
          type: "sprocs-folder" as TreeNodeType,
          dbName: db.name,
          children: db.storedProcedures.map((sp) => ({
            id: `sproc-${db.name}-${sp.name}`,
            label: sp.name,
            type: "sproc" as TreeNodeType,
            data: sp,
            dbName: db.name,
          })),
        },
      ],
    })),
  }
}

function TreeIcon({ type }: { type: TreeNodeType }) {
  switch (type) {
    case "server": return <Server className="h-3.5 w-3.5 text-muted-foreground" />
    case "database": return <Database className="h-3.5 w-3.5 text-blue-400" />
    case "tables-folder": return <Table2 className="h-3.5 w-3.5 text-muted-foreground" />
    case "views-folder": return <Eye className="h-3.5 w-3.5 text-muted-foreground" />
    case "sprocs-folder": return <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
    case "table": return <Table2 className="h-3.5 w-3.5 text-emerald-400" />
    case "view": return <Eye className="h-3.5 w-3.5 text-amber-400" />
    case "sproc": return <FileCode className="h-3.5 w-3.5 text-cyan-400" />
  }
}

function TreeNodeComponent({
  node,
  depth,
  expanded,
  selectedId,
  onToggle,
  onSelect,
}: {
  node: TreeNode
  depth: number
  expanded: Set<string>
  selectedId: string | null
  onToggle: (id: string) => void
  onSelect: (node: TreeNode) => void
}) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expanded.has(node.id)
  const isSelected = selectedId === node.id

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) onToggle(node.id)
          onSelect(node)
        }}
        className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs transition-colors ${
          isSelected
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="w-3" />
        )}
        <TreeIcon type={node.type} />
        <span className="truncate">{node.label}</span>
        {node.type === "table" && (node.data as DbTable)?.rowCount && (
          <Badge variant="outline" className="ml-auto text-[9px] px-1 py-0 border-border text-muted-foreground">
            {(node.data as DbTable).rowCount.toLocaleString()}
          </Badge>
        )}
      </button>
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function DatabaseExplorer({ onBack }: DatabaseExplorerProps) {
  const [tree] = useState(() => buildTree())
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["server"]))
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>("columns")
  const [treeSearch, setTreeSearch] = useState("")

  // Data preview state
  const [dataRows, setDataRows] = useState<DataRow[]>([])
  const [dataTotalRows, setDataTotalRows] = useState(0)
  const [dataPage, setDataPage] = useState(0)
  const [dataPageSize] = useState(25)
  const [dataLoading, setDataLoading] = useState(false)
  const [generatedSQL, setGeneratedSQL] = useState("")

  // Filter state
  const [filters, setFilters] = useState<QueryFilter[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Query console state
  const [queryText, setQueryText] = useState("SELECT TOP 100 * FROM dbo.NPCResource")
  const [queryResults, setQueryResults] = useState<DataRow[]>([])
  const [queryColumns, setQueryColumns] = useState<string[]>([])
  const [queryError, setQueryError] = useState<string | null>(null)
  const [queryRunning, setQueryRunning] = useState(false)

  // Copy state
  const [copied, setCopied] = useState(false)

  const handleToggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelect = useCallback((node: TreeNode) => {
    setSelectedNode(node)
    if (node.type === "table") {
      setActiveTab("columns")
      setDataPage(0)
      setFilters([])
    } else if (node.type === "view" || node.type === "sproc") {
      setActiveTab("definition")
    }
  }, [])

  // Fetch table data when switching to data tab
  const loadData = useCallback(async () => {
    if (!selectedNode || selectedNode.type !== "table") return
    const table = selectedNode.data as DbTable
    setDataLoading(true)
    try {
      const result = await fetchTableData(
        selectedNode.dbName || "arcadia",
        table.name,
        dataPage,
        dataPageSize,
        filters.length > 0 ? filters : undefined,
      )
      setDataRows(result.rows)
      setDataTotalRows(result.totalRows)
      setGeneratedSQL(result.generatedSQL)
    } finally {
      setDataLoading(false)
    }
  }, [selectedNode, dataPage, dataPageSize, filters])

  useEffect(() => {
    if (activeTab === "data" && selectedNode?.type === "table") {
      loadData()
    }
  }, [activeTab, selectedNode, dataPage, filters, loadData])

  const addFilter = () => {
    if (!selectedNode || selectedNode.type !== "table") return
    const table = selectedNode.data as DbTable
    setFilters((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        column: table.columns[0]?.name || "",
        operator: "=" as FilterOperator,
        value: "",
        logic: "AND",
      },
    ])
  }

  const updateFilter = (id: string, key: keyof QueryFilter, value: string) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [key]: value } : f)),
    )
  }

  const removeFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id))
  }

  const handleCopySQL = async () => {
    await navigator.clipboard.writeText(generatedSQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRunQuery = async () => {
    setQueryRunning(true)
    setQueryError(null)
    try {
      const result = await executeSelectQuery(
        selectedNode?.dbName || "arcadia",
        queryText,
      )
      if (result.error) {
        setQueryError(result.error)
        setQueryResults([])
        setQueryColumns([])
      } else {
        setQueryResults(result.rows)
        setQueryColumns(result.columns)
      }
    } finally {
      setQueryRunning(false)
    }
  }

  const selectedTable = selectedNode?.type === "table" ? (selectedNode.data as DbTable) : null
  const selectedView = selectedNode?.type === "view" ? (selectedNode.data as DbView) : null
  const selectedSproc = selectedNode?.type === "sproc" ? (selectedNode.data as DbStoredProcedure) : null

  const totalPages = Math.ceil(dataTotalRows / dataPageSize)

  // Detail tabs based on selected node type
  const detailTabs: { id: DetailTab; label: string }[] = selectedTable
    ? [
        { id: "columns", label: "Columns" },
        { id: "indexes", label: "Indexes" },
        { id: "foreign-keys", label: "Foreign Keys" },
        { id: "data", label: "Data Preview" },
        { id: "query", label: "Query Console" },
      ]
    : selectedView || selectedSproc
      ? [
          { id: "definition", label: "Definition" },
          { id: "query", label: "Query Console" },
        ]
      : []

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
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10">
              <Database className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">Database Explorer</h1>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Read-Only Mode</span>
          </div>
        </header>

        {/* Main Content: Tree + Detail */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tree Sidebar */}
          <div className="flex w-64 flex-col border-r border-border bg-card/50">
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter objects..."
                  value={treeSearch}
                  onChange={(e) => setTreeSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
            <Separator />
            <ScrollArea className="flex-1">
              <div className="p-1">
                <TreeNodeComponent
                  node={tree}
                  depth={0}
                  expanded={expanded}
                  selectedId={selectedNode?.id ?? null}
                  onToggle={handleToggle}
                  onSelect={handleSelect}
                />
              </div>
            </ScrollArea>
            <div className="border-t border-border p-2">
              <div className="flex items-center gap-1.5">
                <Server className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground truncate">
                  {simulatedServer.version.split(" - ")[0]}
                </span>
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {!selectedNode || !detailTabs.length ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card">
                  <Database className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Select an Object</p>
                  <p className="text-xs text-muted-foreground">
                    Choose a table, view, or stored procedure from the tree
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Detail Tabs */}
                <div className="flex items-center gap-0.5 border-b border-border bg-card/50 px-4 py-1.5">
                  {detailTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                  <div className="flex-1" />
                  <span className="text-[11px] text-muted-foreground">
                    {selectedNode.dbName}.{(selectedNode.data as { schema?: string })?.schema || "dbo"}.{selectedNode.label}
                  </span>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-auto">
                  {/* Columns Tab */}
                  {activeTab === "columns" && selectedTable && (
                    <div className="p-4">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground text-xs">Column</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Type</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Nullable</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Key</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Default</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Reference</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedTable.columns.map((col) => (
                            <TableRow key={col.name} className="border-border">
                              <TableCell className="font-mono text-xs text-foreground">
                                <div className="flex items-center gap-1.5">
                                  {col.isPrimaryKey && <Key className="h-3 w-3 text-amber-400" />}
                                  {col.isForeignKey && !col.isPrimaryKey && <Link2 className="h-3 w-3 text-blue-400" />}
                                  {!col.isPrimaryKey && !col.isForeignKey && <Hash className="h-3 w-3 text-muted-foreground/50" />}
                                  {col.name}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">{col.type}</TableCell>
                              <TableCell className="text-xs">
                                {col.nullable ? (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 border-border text-muted-foreground">YES</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 bg-amber-500/10 text-amber-400 border-amber-500/30">NOT NULL</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs">
                                {col.isPrimaryKey && <Badge variant="outline" className="text-[10px] px-1 py-0 bg-amber-500/10 text-amber-400 border-amber-500/30">PK</Badge>}
                                {col.isForeignKey && <Badge variant="outline" className="text-[10px] px-1 py-0 bg-blue-500/10 text-blue-400 border-blue-500/30">FK</Badge>}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">{col.defaultValue || "-"}</TableCell>
                              <TableCell className="font-mono text-xs text-blue-400">{col.fkReference || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Indexes Tab */}
                  {activeTab === "indexes" && selectedTable && (
                    <div className="p-4">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground text-xs">Name</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Columns</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Unique</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Type</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedTable.indexes.map((idx) => (
                            <TableRow key={idx.name} className="border-border">
                              <TableCell className="font-mono text-xs text-foreground">{idx.name}</TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">{idx.columns.join(", ")}</TableCell>
                              <TableCell className="text-xs">
                                {idx.isUnique ? (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">UNIQUE</Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {idx.isClustered ? "Clustered" : "Non-Clustered"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Foreign Keys Tab */}
                  {activeTab === "foreign-keys" && selectedTable && (
                    <div className="p-4">
                      {selectedTable.foreignKeys.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-8 text-center">
                          <Link2 className="h-8 w-8 text-muted-foreground/30" />
                          <p className="text-xs text-muted-foreground">No foreign keys defined</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                              <TableHead className="text-muted-foreground text-xs">Name</TableHead>
                              <TableHead className="text-muted-foreground text-xs">Column</TableHead>
                              <TableHead className="text-muted-foreground text-xs">References</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedTable.foreignKeys.map((fk) => (
                              <TableRow key={fk.name} className="border-border">
                                <TableCell className="font-mono text-xs text-foreground">{fk.name}</TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">{fk.column}</TableCell>
                                <TableCell className="font-mono text-xs text-blue-400">
                                  {fk.referencedTable}.{fk.referencedColumn}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  )}

                  {/* Data Preview Tab */}
                  {activeTab === "data" && selectedTable && (
                    <div className="flex flex-col h-full">
                      {/* Filter Bar */}
                      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 bg-transparent text-xs"
                          onClick={() => setShowFilters(!showFilters)}
                        >
                          <Filter className="h-3 w-3" />
                          Filters
                          {filters.length > 0 && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1 bg-blue-500/10 text-blue-400 border-blue-500/30">
                              {filters.length}
                            </Badge>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 bg-transparent text-xs"
                          onClick={loadData}
                        >
                          <Play className="h-3 w-3" />
                          Refresh
                        </Button>
                        <div className="flex-1" />
                        <span className="text-[11px] text-muted-foreground">
                          {dataTotalRows} total rows
                        </span>
                      </div>

                      {/* Filters Panel */}
                      {showFilters && (
                        <div className="border-b border-border bg-card/50 px-4 py-3">
                          <div className="flex flex-col gap-2">
                            {filters.map((filter, idx) => (
                              <div key={filter.id} className="flex items-center gap-2">
                                {idx > 0 && (
                                  <Select
                                    value={filter.logic}
                                    onValueChange={(v) => updateFilter(filter.id, "logic", v)}
                                  >
                                    <SelectTrigger className="h-7 w-16 text-[11px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="AND" className="text-xs">AND</SelectItem>
                                      <SelectItem value="OR" className="text-xs">OR</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                                {idx === 0 && <span className="w-16 text-center text-[11px] text-muted-foreground">WHERE</span>}

                                <Select
                                  value={filter.column}
                                  onValueChange={(v) => updateFilter(filter.id, "column", v)}
                                >
                                  <SelectTrigger className="h-7 w-36 text-[11px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedTable.columns.map((col) => (
                                      <SelectItem key={col.name} value={col.name} className="text-xs">{col.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <Select
                                  value={filter.operator}
                                  onValueChange={(v) => updateFilter(filter.id, "operator", v)}
                                >
                                  <SelectTrigger className="h-7 w-24 text-[11px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(["=", "!=", "LIKE", ">", "<", "BETWEEN", "IN"] as FilterOperator[]).map((op) => (
                                      <SelectItem key={op} value={op} className="text-xs">{op}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <Input
                                  value={filter.value}
                                  onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
                                  placeholder="Value..."
                                  className="h-7 w-28 text-xs"
                                />
                                {filter.operator === "BETWEEN" && (
                                  <>
                                    <span className="text-[11px] text-muted-foreground">AND</span>
                                    <Input
                                      value={filter.value2 || ""}
                                      onChange={(e) => updateFilter(filter.id, "value2", e.target.value)}
                                      placeholder="Value 2..."
                                      className="h-7 w-28 text-xs"
                                    />
                                  </>
                                )}

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeFilter(filter.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 bg-transparent text-xs"
                                onClick={addFilter}
                              >
                                <Plus className="h-3 w-3" />
                                Add Filter
                              </Button>
                              {filters.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1.5 text-xs text-destructive"
                                  onClick={() => setFilters([])}
                                >
                                  Clear All
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Generated SQL */}
                      {generatedSQL && (
                        <div className="flex items-start gap-2 border-b border-border bg-background/50 px-4 py-2">
                          <Terminal className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                          <pre className="flex-1 text-[11px] font-mono text-muted-foreground whitespace-pre-wrap">{generatedSQL}</pre>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground shrink-0"
                            onClick={handleCopySQL}
                          >
                            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      )}

                      {/* Data Table */}
                      <div className="flex-1 overflow-auto">
                        {dataLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : dataRows.length === 0 ? (
                          <div className="flex flex-col items-center gap-2 py-12 text-center">
                            <Table2 className="h-8 w-8 text-muted-foreground/30" />
                            <p className="text-xs text-muted-foreground">No data found</p>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow className="border-border hover:bg-transparent">
                                {Object.keys(dataRows[0]).map((col) => (
                                  <TableHead key={col} className="text-muted-foreground text-[11px] font-mono whitespace-nowrap">
                                    {col}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dataRows.map((row, i) => (
                                <TableRow key={i} className="border-border">
                                  {Object.values(row).map((val, j) => (
                                    <TableCell key={j} className="font-mono text-[11px] text-foreground whitespace-nowrap max-w-[200px] truncate">
                                      {val === null ? <span className="text-muted-foreground/50 italic">NULL</span> : String(val)}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center justify-between border-t border-border px-4 py-2">
                        <span className="text-[11px] text-muted-foreground">
                          Page {dataPage + 1} of {totalPages || 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setDataPage(0)}
                            disabled={dataPage === 0}
                          >
                            <ChevronsLeft className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setDataPage(Math.max(0, dataPage - 1))}
                            disabled={dataPage === 0}
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setDataPage(Math.min(totalPages - 1, dataPage + 1))}
                            disabled={dataPage >= totalPages - 1}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setDataPage(totalPages - 1)}
                            disabled={dataPage >= totalPages - 1}
                          >
                            <ChevronsRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Definition Tab (Views/SProcs) */}
                  {activeTab === "definition" && (selectedView || selectedSproc) && (
                    <div className="p-4">
                      <pre className="rounded-lg border border-border bg-background p-4 font-mono text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                        {selectedView?.definition || selectedSproc?.definition}
                      </pre>
                    </div>
                  )}

                  {/* Query Console Tab */}
                  {activeTab === "query" && (
                    <div className="flex flex-col h-full">
                      <div className="flex flex-col gap-2 border-b border-border p-4">
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-semibold text-foreground">Query Console</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-400 border-amber-500/30">
                            SELECT only
                          </Badge>
                        </div>
                        <Textarea
                          value={queryText}
                          onChange={(e) => setQueryText(e.target.value)}
                          placeholder="Enter a SELECT query..."
                          className="font-mono text-xs min-h-[80px] bg-background resize-none"
                          rows={4}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={handleRunQuery}
                            disabled={queryRunning}
                          >
                            {queryRunning ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                            Execute
                          </Button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-auto">
                        {queryError && (
                          <div className="flex items-center gap-2 m-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                            <span className="text-xs text-destructive">{queryError}</span>
                          </div>
                        )}

                        {queryResults.length > 0 && (
                          <div className="p-4">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-border hover:bg-transparent">
                                  {queryColumns.map((col) => (
                                    <TableHead key={col} className="text-muted-foreground text-[11px] font-mono">{col}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {queryResults.map((row, i) => (
                                  <TableRow key={i} className="border-border">
                                    {queryColumns.map((col) => (
                                      <TableCell key={col} className="font-mono text-[11px] text-foreground">
                                        {row[col] === null ? <span className="text-muted-foreground/50 italic">NULL</span> : String(row[col])}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            <p className="mt-2 text-[11px] text-muted-foreground">{queryResults.length} row(s) returned</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
