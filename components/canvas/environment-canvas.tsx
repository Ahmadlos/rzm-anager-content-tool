"use client"

import React, { useCallback, useState, useRef, useEffect, useMemo } from "react"
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  reconnectEdge,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  type Connection,
  type Edge,
  type Node,
  type SelectionMode,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import {
  ArrowLeft,
  Plus,
  Save,
  Download,
  Search,
  X as XIcon,
  ZoomIn,
  ZoomOut,
  Maximize,
  Pencil,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  GitCompare,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createNodeTypes } from "./schema-nodes"
import { ChangesPanel } from "./changes-panel"
import {
  type EnvironmentSchema,
  type NodeSchema,
  type ValidationError,
  validateGraph,
} from "@/lib/environment-schemas"
import {
  type GraphSnapshot,
  type ChangesSummary,
  createSnapshot,
  computeChanges,
  revertField,
  revertAll,
  getModifiedNodeIds,
  getModifiedFieldsForNode,
} from "@/lib/change-tracker"

// ---- Default data generators ----

function createDefaultNodes(schema: EnvironmentSchema): Node[] {
  const nodes: Node[] = []
  const rootSchema = schema.nodes.find((n) => n.category === "root")

  if (rootSchema) {
    const defaultValues: Record<string, unknown> = {}
    for (const input of rootSchema.inputs) {
      if (input.portType === "number") defaultValues[input.id] = 0
      else defaultValues[input.id] = ""
    }

    nodes.push({
      id: `${rootSchema.type}-1`,
      type: "schema-node",
      position: { x: 400, y: 150 },
      data: { schema: rootSchema, values: defaultValues },
      deletable: false,
    })
  }

  // Add a default string node
  const stringSchema = schema.nodes.find((n) => n.category === "string")
  if (stringSchema) {
    nodes.push({
      id: `${stringSchema.type}-1`,
      type: "schema-node",
      position: { x: 50, y: 100 },
      data: {
        schema: stringSchema,
        values: { value: "Sample Text", language: "US", group_id: 0 },
      },
    })
  }

  // Add one script node if available
  const scriptSchema = schema.nodes.find((n) => n.category === "script")
  if (scriptSchema) {
    nodes.push({
      id: `${scriptSchema.type}-1`,
      type: "schema-node",
      position: { x: 50, y: 320 },
      data: {
        schema: scriptSchema,
        values: { script_text: "-- script logic here" },
      },
    })
  }

  return nodes
}

function createDefaultEdges(schema: EnvironmentSchema, nodes: Node[]): Edge[] {
  const edges: Edge[] = []
  const rootNode = nodes.find((n) => {
    const data = n.data as { schema?: NodeSchema }
    return data.schema?.category === "root"
  })
  const stringNode = nodes.find((n) => {
    const data = n.data as { schema?: NodeSchema }
    return data.schema?.category === "string"
  })

  if (rootNode && stringNode && schema.connectionRules.length > 0) {
    const firstStringRule = schema.connectionRules.find(
      (r) => r.sourceNodeType === (stringNode.data as { schema: NodeSchema }).schema.type,
    )
    if (firstStringRule) {
      edges.push({
        id: `e-default-1`,
        source: stringNode.id,
        sourceHandle: firstStringRule.sourcePort,
        target: rootNode.id,
        targetHandle: firstStringRule.targetPort,
        animated: true,
        style: { stroke: "oklch(0.35 0 0)" },
      })
    }
  }

  return edges
}

// ---- Main Canvas Component ----

interface EnvironmentCanvasProps {
  schema: EnvironmentSchema
  onBack: () => void
}

const nodeTypes = createNodeTypes()

function CanvasInner({ schema, onBack }: EnvironmentCanvasProps) {
  const initialNodes = useMemo(() => createDefaultNodes(schema), [schema])
  const initialEdges = useMemo(() => createDefaultEdges(schema, initialNodes), [schema, initialNodes])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [nodeCount, setNodeCount] = useState(2)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  const [projectName, setProjectName] = useState(`New ${schema.title.replace(" Environment", "")} Entity`)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState(projectName)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [copied, setCopied] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [showValidation, setShowValidation] = useState(false)

  // ---- Change Tracking ----
  const [snapshot, setSnapshot] = useState<GraphSnapshot>(() =>
    createSnapshot(initialNodes, initialEdges)
  )
  const [showChangesPanel, setShowChangesPanel] = useState(false)

  const changes: ChangesSummary = useMemo(
    () => computeChanges(snapshot, nodes, edges),
    [snapshot, nodes, edges]
  )

  const modifiedNodeIds = useMemo(
    () => getModifiedNodeIds(changes),
    [changes]
  )

  const selectedModifiedFields = useMemo(() => {
    if (!selectedNode) return new Set<string>()
    return getModifiedFieldsForNode(changes, selectedNode.id)
  }, [changes, selectedNode])

  const handleRevertField = useCallback(
    (nodeId: string, fieldName: string) => {
      const reverted = revertField(snapshot, nodes, nodeId, fieldName)
      setNodes(reverted)
      // Update selectedNode if it was the one reverted
      if (selectedNode?.id === nodeId) {
        const updated = reverted.find((n) => n.id === nodeId)
        if (updated) setSelectedNode(updated)
      }
    },
    [snapshot, nodes, setNodes, selectedNode]
  )

  const handleRevertAll = useCallback(() => {
    const { nodes: restoredNodes, edges: restoredEdges } = revertAll(snapshot, nodes)
    setNodes(restoredNodes)
    setEdges(restoredEdges)
    setSelectedNode(null)
  }, [snapshot, nodes, setNodes, setEdges])

  const handleClearChanges = useCallback(() => {
    // Accept current state as new baseline
    setSnapshot(createSnapshot(nodes, edges))
  }, [nodes, edges])

  const handleNavigateToChangedNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId)
      if (node) {
        setCenter(node.position.x + 120, node.position.y + 60, { zoom: 1.2, duration: 600 })
        setSelectedNode(node)
        setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id })))
      }
    },
    [nodes, setCenter, setNodes]
  )

  const edgeReconnectSuccessful = useRef(true)
  const { zoomIn, zoomOut, fitView, setCenter } = useReactFlow()

  // --- Connection validation ---
  const isValidConnection = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) return false
      const sourceNode = nodes.find((n) => n.id === connection.source)
      const targetNode = nodes.find((n) => n.id === connection.target)
      if (!sourceNode || !targetNode) return false

      const sourceSchema = (sourceNode.data as { schema?: NodeSchema }).schema
      const targetSchema = (targetNode.data as { schema?: NodeSchema }).schema
      if (!sourceSchema || !targetSchema) return false

      // Check if this connection is allowed by rules
      return schema.connectionRules.some(
        (rule) =>
          rule.sourceNodeType === sourceSchema.type &&
          rule.sourcePort === connection.sourceHandle &&
          rule.targetNodeType === targetSchema.type &&
          rule.targetPort === connection.targetHandle,
      )
    },
    [nodes, schema.connectionRules],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!isValidConnection(connection)) return
      setEdges((eds) =>
        addEdge(
          { ...connection, animated: true, style: { stroke: "oklch(0.35 0 0)" } },
          eds,
        ),
      )
    },
    [setEdges, isValidConnection],
  )

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false
  }, [])

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      edgeReconnectSuccessful.current = true
      setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds))
    },
    [setEdges],
  )

  const onReconnectEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: Edge) => {
      if (!edgeReconnectSuccessful.current) {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id))
      }
      edgeReconnectSuccessful.current = true
    },
    [setEdges],
  )

  const addNode = useCallback(
    (nodeSchema: NodeSchema, position?: { x: number; y: number }) => {
      // Enforce maxInstances
      if (nodeSchema.maxInstances) {
        const existing = nodes.filter((n) => {
          const data = n.data as { schema?: NodeSchema }
          return data.schema?.type === nodeSchema.type
        })
        if (existing.length >= nodeSchema.maxInstances) return
      }

      const id = `${nodeSchema.type}-${nodeCount}`
      const defaultValues: Record<string, unknown> = {}
      for (const input of nodeSchema.inputs) {
        if (input.portType === "number") defaultValues[input.id] = 0
        else if (input.portType === "string-code") defaultValues[input.id] = ""
        else if (input.portType === "script") defaultValues[input.id] = ""
        else defaultValues[input.id] = ""
      }

      const newNode: Node = {
        id,
        type: "schema-node",
        position: position || { x: 200 + Math.random() * 300, y: 100 + Math.random() * 200 },
        data: { schema: nodeSchema, values: defaultValues },
        deletable: nodeSchema.deletable !== false,
      }
      setNodes((nds) => [...nds, newNode])
      setNodeCount((c) => c + 1)
    },
    [nodeCount, nodes, setNodes],
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  // Context menu
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    flowPosition: { x: number; y: number }
  } | null>(null)

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault()
      const bounds = (event.target as HTMLElement)
        .closest(".react-flow")
        ?.getBoundingClientRect()
      if (!bounds) return
      setContextMenu({
        x: (event as React.MouseEvent).clientX,
        y: (event as React.MouseEvent).clientY,
        flowPosition: {
          x: (event as React.MouseEvent).clientX - bounds.left,
          y: (event as React.MouseEvent).clientY - bounds.top,
        },
      })
    },
    [],
  )

  const deleteSelectedNodes = useCallback(() => {
    const selectedIds = nodes
      .filter((n) => n.selected && n.deletable !== false)
      .map((n) => n.id)
    if (selectedNode && !selectedIds.includes(selectedNode.id)) {
      const nodeData = selectedNode.data as { schema?: NodeSchema }
      if (nodeData.schema?.deletable !== false) {
        selectedIds.push(selectedNode.id)
      }
    }
    if (selectedIds.length > 0) {
      setNodes((nds) => nds.filter((n) => !selectedIds.includes(n.id)))
      setEdges((eds) =>
        eds.filter(
          (e) =>
            !selectedIds.includes(e.source) &&
            !selectedIds.includes(e.target),
        ),
      )
      setSelectedNode(null)
    }
  }, [nodes, selectedNode, setNodes, setEdges])

  const updateNodeValue = useCallback(
    (key: string, value: unknown) => {
      if (!selectedNode) return
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === selectedNode.id) {
            const data = n.data as { schema: NodeSchema; values: Record<string, unknown> }
            const updated = {
              ...n,
              data: { ...data, values: { ...data.values, [key]: value } },
            }
            setSelectedNode(updated)
            return updated
          }
          return n
        }),
      )
    },
    [selectedNode, setNodes],
  )

  // Validate
  const runValidation = useCallback(() => {
    const errs = validateGraph(
      schema,
      nodes.map((n) => ({
        id: n.id,
        type: (n.data as { schema?: NodeSchema }).schema?.type,
        data: (n.data as { values?: Record<string, unknown> }).values || {},
      })),
      edges.map((e) => ({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
    )
    setValidationErrors(errs)
    setShowValidation(true)
  }, [schema, nodes, edges])

  // Export
  const handleExport = useCallback(() => {
    runValidation()
    const data = {
      environment: schema.id,
      projectName,
      exportedAt: new Date().toISOString(),
      nodes: nodes.map((n) => ({
        id: n.id,
        type: (n.data as { schema?: NodeSchema }).schema?.type,
        values: (n.data as { values?: Record<string, unknown> }).values,
        position: n.position,
      })),
      edges: edges.map((e) => ({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${projectName.replace(/\s+/g, "_").toLowerCase()}_export.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [schema, projectName, nodes, edges, runValidation])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        if (e.key === "Escape" && showSearch) {
          setShowSearch(false)
          setSearchQuery("")
        }
        return
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        deleteSelectedNodes()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => searchInputRef.current?.focus(), 50)
      }
      if (e.key === "Escape") {
        if (showSearch) {
          setShowSearch(false)
          setSearchQuery("")
        }
        setSelectedNode(null)
        setContextMenu(null)
        setShowValidation(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [deleteSelectedNodes, showSearch])

  // Project name editing
  const startEditingName = () => {
    setEditNameValue(projectName)
    setIsEditingName(true)
    setTimeout(() => nameInputRef.current?.select(), 50)
  }
  const saveProjectName = () => {
    const trimmed = editNameValue.trim()
    if (trimmed) setProjectName(trimmed)
    setIsEditingName(false)
  }

  // Copy to clipboard
  const handleCopy = async () => {
    const data = {
      environment: schema.id,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: (n.data as { schema?: NodeSchema }).schema?.type,
        values: (n.data as { values?: Record<string, unknown> }).values,
      })),
      edges: edges.map((e) => ({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
    }
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Search
  const filteredSearchNodes = nodes.filter((n) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const data = n.data as { schema?: NodeSchema; values?: Record<string, unknown> }
    const label = data.schema?.label?.toLowerCase() || ""
    const type = data.schema?.type?.toLowerCase() || ""
    return label.includes(q) || type.includes(q) || n.id.toLowerCase().includes(q)
  })

  const navigateToNode = (node: Node) => {
    setCenter(node.position.x + 120, node.position.y + 60, { zoom: 1.2, duration: 600 })
    setSelectedNode(node)
    setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id })))
    setShowSearch(false)
    setSearchQuery("")
  }

  // Inject isModified flag into node data for visual indicators
  const displayNodes = useMemo(() => {
    return nodes.map((n) => ({
      ...n,
      data: {
        ...(n.data as Record<string, unknown>),
        isModified: modifiedNodeIds.has(n.id),
      },
    }))
  }, [nodes, modifiedNodeIds])

  // Selected node info
  const selectedSchema = selectedNode
    ? (selectedNode.data as { schema?: NodeSchema }).schema
    : null
  const selectedValues = selectedNode
    ? (selectedNode.data as { values?: Record<string, unknown> }).values || {}
    : {}

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
        {/* Top Bar */}
        <div className="flex h-11 items-center gap-2 border-b border-border bg-background px-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs">Back</span>
          </Button>

          <div className="h-4 w-px bg-border" />

          <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
            {schema.title}
          </Badge>

          {/* Project Name */}
          <div className="flex flex-1 items-center justify-center">
            {isEditingName ? (
              <Input
                ref={nameInputRef}
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveProjectName()
                  if (e.key === "Escape") setIsEditingName(false)
                }}
                onBlur={saveProjectName}
                className="h-7 w-56 bg-secondary text-center text-xs font-medium"
                autoFocus
              />
            ) : (
              <button
                onClick={startEditingName}
                className="group flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
              >
                {projectName}
                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-xs">
                <Plus className="h-3 w-3" /> Add Node
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 border-border bg-card">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {schema.title} Nodes
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {schema.nodes.map((ns) => {
                const isDisabled =
                  ns.maxInstances !== undefined &&
                  nodes.filter((n) => (n.data as { schema?: NodeSchema }).schema?.type === ns.type).length >= ns.maxInstances
                return (
                  <DropdownMenuItem
                    key={ns.type}
                    onClick={() => !isDisabled && addNode(ns)}
                    className={`gap-2 text-xs ${isDisabled ? "opacity-40" : ""}`}
                    disabled={isDisabled}
                  >
                    <span className={`h-2 w-2 rounded-full ${ns.color.split(" ")[0]?.replace("/10", "")}`} />
                    {ns.label}
                    <span className="ml-auto text-[10px] text-muted-foreground">{ns.category}</span>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 bg-transparent text-xs"
            onClick={runValidation}
          >
            <CheckCircle className="h-3 w-3" /> Validate
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 bg-transparent text-xs"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 bg-transparent text-xs"
            onClick={handleExport}
          >
            <Download className="h-3 w-3" /> Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={`gap-1.5 bg-transparent text-xs ${showChangesPanel ? "border-foreground/40 text-foreground" : ""}`}
            onClick={() => setShowChangesPanel(!showChangesPanel)}
          >
            <GitCompare className="h-3 w-3" />
            Changes
            {changes.hasChanges && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/20 px-1 text-[9px] font-semibold text-amber-400">
                {changes.totalChanges}
              </span>
            )}
          </Button>

          <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-xs">
            <Save className="h-3 w-3" /> Save
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Toolbar */}
          <div className="flex w-11 flex-col items-center gap-0.5 border-r border-border bg-card/50 py-2">
            {[
              {
                id: "search",
                icon: Search,
                label: "Search Nodes",
                action: () => {
                  setShowSearch(true)
                  setTimeout(() => searchInputRef.current?.focus(), 50)
                },
              },
              { id: "zoomIn", icon: ZoomIn, label: "Zoom In", action: () => zoomIn() },
              { id: "zoomOut", icon: ZoomOut, label: "Zoom Out", action: () => zoomOut() },
              {
                id: "fitView",
                icon: Maximize,
                label: "Fit View",
                action: () => fitView({ padding: 0.3 }),
              },
            ].map((tool) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={tool.action}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                  >
                    <tool.icon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="border-border bg-card text-foreground"
                >
                  <span className="text-xs">{tool.label}</span>
                </TooltipContent>
              </Tooltip>
            ))}

            <div className="my-1 h-px w-6 bg-border" />

            {/* Changes Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowChangesPanel(!showChangesPanel)}
                  className={`relative flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                    showChangesPanel
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <GitCompare className="h-4 w-4" />
                  {changes.hasChanges && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[8px] font-bold text-background">
                      {changes.totalChanges > 9 ? "9+" : changes.totalChanges}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="border-border bg-card text-foreground"
              >
                <span className="text-xs">
                  Changes{changes.hasChanges ? ` (${changes.totalChanges})` : ""}
                </span>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Canvas */}
          <div className="relative flex-1 overflow-hidden">
            <ReactFlow
              nodes={displayNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onReconnect={onReconnect}
              onReconnectStart={onReconnectStart}
              onReconnectEnd={onReconnectEnd}
              isValidConnection={isValidConnection}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onPaneContextMenu={onPaneContextMenu}
              nodeTypes={nodeTypes}
              selectionOnDrag
              selectionMode={"partial" as SelectionMode}
              panOnDrag={[1]}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              className="bg-background"
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="oklch(0.22 0 0)" />
              <MiniMap
                nodeStrokeColor="oklch(0.35 0 0)"
                nodeColor="oklch(0.22 0 0)"
                nodeBorderRadius={6}
                maskColor="oklch(0.1 0 0 / 0.7)"
                className="!rounded-lg !border !border-border !bg-card"
              />
            </ReactFlow>

            {/* Context Menu */}
            {contextMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setContextMenu(null)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setContextMenu(null)
                  }}
                />
                <div
                  className="fixed z-50 min-w-[200px] overflow-hidden rounded-lg border border-border bg-card shadow-xl"
                  style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                  <div className="px-2 py-1.5">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Add Node
                    </p>
                  </div>
                  <Separator />
                  <div className="p-1">
                    {schema.nodes.map((ns) => {
                      const isDisabled =
                        ns.maxInstances !== undefined &&
                        nodes.filter(
                          (n) =>
                            (n.data as { schema?: NodeSchema }).schema?.type ===
                            ns.type,
                        ).length >= ns.maxInstances
                      return (
                        <button
                          key={ns.type}
                          onClick={() => {
                            if (!isDisabled) {
                              addNode(ns, contextMenu.flowPosition)
                              setContextMenu(null)
                            }
                          }}
                          disabled={isDisabled}
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${isDisabled ? "cursor-not-allowed opacity-40" : "text-foreground hover:bg-accent"}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${ns.color.split(" ")[0]?.replace("/10", "")}`} />
                          {ns.label}
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            {ns.category}
                          </span>
                        </button>
                      )
                    })}
                    <Separator className="my-1" />
                    <button
                      onClick={() => {
                        fitView({ padding: 0.3 })
                        setContextMenu(null)
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                    >
                      <Maximize className="h-3.5 w-3.5 text-muted-foreground" />
                      Fit View
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Search Overlay */}
            {showSearch && (
              <div className="absolute left-1/2 top-4 z-50 w-80 -translate-x-1/2">
                <div className="overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search nodes..."
                      className="h-7 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
                    />
                    <button
                      onClick={() => {
                        setShowSearch(false)
                        setSearchQuery("")
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {searchQuery && (
                    <ScrollArea className="max-h-48">
                      <div className="p-1">
                        {filteredSearchNodes.map((node) => {
                          const data = node.data as { schema?: NodeSchema }
                          return (
                            <button
                              key={node.id}
                              onClick={() => navigateToNode(node)}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                            >
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">
                                {data.schema?.label}
                              </span>
                              <span className="text-muted-foreground">
                                ({node.id})
                              </span>
                            </button>
                          )
                        })}
                        {filteredSearchNodes.length === 0 && (
                          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                            No nodes found
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            )}

            {/* Validation Panel */}
            {showValidation && (
              <div className="absolute bottom-4 left-1/2 z-50 w-96 -translate-x-1/2">
                <div className="overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
                  <div className="flex items-center justify-between border-b border-border px-3 py-2">
                    <div className="flex items-center gap-2">
                      {validationErrors.length === 0 ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                      )}
                      <span className="text-xs font-semibold text-foreground">
                        Validation {validationErrors.length === 0 ? "Passed" : `(${validationErrors.length} issues)`}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowValidation(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {validationErrors.length > 0 ? (
                    <ScrollArea className="max-h-40">
                      <div className="p-2">
                        {validationErrors.map((err, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 rounded px-2 py-1.5"
                          >
                            {err.severity === "error" ? (
                              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                            ) : (
                              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                            )}
                            <div>
                              <p className="text-xs text-foreground">{err.message}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {err.nodeId} / {err.field}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-xs text-emerald-400">
                        All validation rules passed. Ready to export.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Properties Panel */}
          {selectedNode && selectedSchema && !showChangesPanel && (
            <div className="flex w-72 flex-col border-l border-border bg-card/50">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">
                      {selectedSchema.label}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedSchema.category} node
                    </p>
                  </div>
                  {modifiedNodeIds.has(selectedNode.id) && (
                    <span className="flex h-4 items-center gap-1 rounded bg-amber-500/10 px-1.5 text-[9px] font-medium text-amber-400">
                      Modified
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-3 p-4">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Node ID
                    </Label>
                    <p className="mt-1 font-mono text-xs text-foreground">
                      {selectedNode.id}
                    </p>
                  </div>

                  <Separator />

                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Fields
                  </p>

                  {selectedSchema.inputs.map((input) => {
                    const isFieldModified = selectedModifiedFields.has(input.id)
                    return (
                      <div
                        key={input.id}
                        className={`flex flex-col gap-1.5 rounded-md px-2 py-1.5 -mx-2 transition-colors ${
                          isFieldModified ? "bg-amber-500/5 ring-1 ring-amber-500/20" : ""
                        }`}
                      >
                        <Label className="flex items-center gap-1 text-xs text-foreground">
                          {input.label}
                          {input.required && (
                            <span className="text-destructive">*</span>
                          )}
                          {isFieldModified && (
                            <span className="ml-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                          )}
                          <Badge
                            variant="outline"
                            className="ml-auto border-border px-1 text-[9px] text-muted-foreground"
                          >
                            {input.portType}
                          </Badge>
                        </Label>
                        {input.portType === "number" ? (
                          <Input
                            type="number"
                            value={Number(selectedValues[input.id] ?? 0)}
                            onChange={(e) =>
                              updateNodeValue(input.id, Number(e.target.value))
                            }
                            className={`h-8 text-xs ${isFieldModified ? "border-amber-500/30" : ""}`}
                          />
                        ) : input.portType === "script" ? (
                          <Textarea
                            value={String(selectedValues[input.id] ?? "")}
                            onChange={(e) =>
                              updateNodeValue(input.id, e.target.value)
                            }
                            className={`font-mono text-xs ${isFieldModified ? "border-amber-500/30" : ""}`}
                            rows={3}
                          />
                        ) : (
                          <Input
                            value={String(selectedValues[input.id] ?? "")}
                            onChange={(e) =>
                              updateNodeValue(input.id, e.target.value)
                            }
                            className={`h-8 text-xs ${isFieldModified ? "border-amber-500/30" : ""}`}
                          />
                        )}
                        {isFieldModified && (
                          <button
                            onClick={() => handleRevertField(selectedNode.id, input.id)}
                            className="flex items-center gap-1 self-end rounded px-1.5 py-0.5 text-[9px] text-amber-400 transition-colors hover:bg-amber-500/10"
                          >
                            <RotateCcw className="h-2.5 w-2.5" />
                            Revert
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {selectedSchema.outputs.length > 0 && (
                    <>
                      <Separator />
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Outputs
                      </p>
                      {selectedSchema.outputs.map((output) => (
                        <div key={output.id} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {output.label}
                          </span>
                          <Badge
                            variant="outline"
                            className="border-border text-[9px] text-muted-foreground"
                          >
                            {output.portType} (read-only)
                          </Badge>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Changes Panel */}
          {showChangesPanel && (
            <ChangesPanel
              changes={changes}
              onClose={() => setShowChangesPanel(false)}
              onRevertField={handleRevertField}
              onRevertAll={handleRevertAll}
              onClearChanges={handleClearChanges}
              onNavigateToNode={handleNavigateToChangedNode}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

export function EnvironmentCanvas({ schema, onBack }: EnvironmentCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner schema={schema} onBack={onBack} />
    </ReactFlowProvider>
  )
}
