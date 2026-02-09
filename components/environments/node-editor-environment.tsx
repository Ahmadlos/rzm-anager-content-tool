"use client"

import React from "react"

import { useCallback, useState, useRef, useEffect } from "react"
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
  GitBranch,
  Plus,
  Save,
  Download,
  Search,
  X as XIcon,
  ZoomIn,
  ZoomOut,
  Maximize,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Pencil,
  ArrowRight,
  Timer,
  Zap,
  Target,
  Flag,
  MessageSquare,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Handle, Position } from "@xyflow/react"
import type { NodeProps } from "@xyflow/react"
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

// ===== Custom Node Types for Logic Editor =====

function LogicNodeShell({
  label,
  icon: Icon,
  color,
  borderColor,
  children,
  hasInput = true,
  hasOutput = true,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  borderColor: string
  children: React.ReactNode
  hasInput?: boolean
  hasOutput?: boolean
}) {
  return (
    <div className={`min-w-[180px] rounded-lg border bg-card shadow-lg ${borderColor}`}>
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !rounded-full !border-2 !border-border !bg-muted-foreground hover:!bg-foreground hover:!scale-125 !transition-all"
        />
      )}
      <div className={`flex items-center gap-2 rounded-t-lg border-b border-border px-3 py-2 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex flex-col gap-1.5 p-3 text-xs">{children}</div>
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !rounded-full !border-2 !border-border !bg-muted-foreground hover:!bg-foreground hover:!scale-125 !transition-all"
        />
      )}
    </div>
  )
}

function LField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

function StartNode({ data }: NodeProps) {
  return (
    <LogicNodeShell label="Start" icon={Play} color="bg-emerald-500/10 text-emerald-400" borderColor="border-emerald-500/20" hasInput={false}>
      <LField label="Trigger" value={String(data.trigger || "OnSpawn")} />
      <LField label="Priority" value={String(data.priority || "High")} />
    </LogicNodeShell>
  )
}

function ConditionNode({ data }: NodeProps) {
  return (
    <LogicNodeShell label="Condition" icon={Target} color="bg-amber-500/10 text-amber-400" borderColor="border-amber-500/20">
      <LField label="Check" value={String(data.check || "HP > 50%")} />
      <LField label="Type" value={String(data.condType || "Boolean")} />
    </LogicNodeShell>
  )
}

function ActionNode({ data }: NodeProps) {
  return (
    <LogicNodeShell label="Action" icon={Zap} color="bg-blue-500/10 text-blue-400" borderColor="border-blue-500/20">
      <LField label="Action" value={String(data.action || "Attack")} />
      <LField label="Target" value={String(data.target || "Nearest Enemy")} />
      <LField label="Delay" value={`${data.delay || 0}s`} />
    </LogicNodeShell>
  )
}

function DelayNode({ data }: NodeProps) {
  return (
    <LogicNodeShell label="Delay" icon={Timer} color="bg-purple-500/10 text-purple-400" borderColor="border-purple-500/20">
      <LField label="Duration" value={`${data.duration || 2}s`} />
      <LField label="Repeat" value={String(data.repeat || "Once")} />
    </LogicNodeShell>
  )
}

function DialogueActionNode({ data }: NodeProps) {
  return (
    <LogicNodeShell label="Dialogue" icon={MessageSquare} color="bg-teal-500/10 text-teal-400" borderColor="border-teal-500/20">
      <LField label="Speaker" value={String(data.speaker || "NPC")} />
      <div className="rounded border border-border bg-background px-2 py-1 text-foreground">
        {String(data.text || "Hello there!")}
      </div>
    </LogicNodeShell>
  )
}

function EndNode({ data }: NodeProps) {
  return (
    <LogicNodeShell label="End" icon={Flag} color="bg-red-500/10 text-red-400" borderColor="border-red-500/20" hasOutput={false}>
      <LField label="Result" value={String(data.result || "Success")} />
    </LogicNodeShell>
  )
}

const logicNodeTypes = {
  start: StartNode,
  condition: ConditionNode,
  action: ActionNode,
  delay: DelayNode,
  dialogueAction: DialogueActionNode,
  end: EndNode,
}

const nodeTemplates = [
  { type: "start", label: "Start", icon: Play, data: { trigger: "OnSpawn", priority: "High" } },
  { type: "condition", label: "Condition", icon: Target, data: { check: "HP > 50%", condType: "Boolean" } },
  { type: "action", label: "Action", icon: Zap, data: { action: "Attack", target: "Nearest Enemy", delay: 0 } },
  { type: "delay", label: "Delay", icon: Timer, data: { duration: 2, repeat: "Once" } },
  { type: "dialogueAction", label: "Dialogue", icon: MessageSquare, data: { speaker: "NPC", text: "Hello!" } },
  { type: "end", label: "End", icon: Flag, data: { result: "Success" } },
]

const defaultNodes: Node[] = [
  { id: "start-1", type: "start", position: { x: 50, y: 150 }, data: { trigger: "OnPlayerNear", priority: "High" } },
  { id: "cond-1", type: "condition", position: { x: 320, y: 50 }, data: { check: "Player.Level >= 10", condType: "Boolean" } },
  { id: "action-1", type: "action", position: { x: 600, y: 50 }, data: { action: "GrantQuest", target: "Player", delay: 0 } },
  { id: "dial-1", type: "dialogueAction", position: { x: 320, y: 250 }, data: { speaker: "Elder Marcus", text: "You are too young for this quest..." } },
  { id: "delay-1", type: "delay", position: { x: 600, y: 250 }, data: { duration: 3, repeat: "Once" } },
  { id: "end-1", type: "end", position: { x: 880, y: 150 }, data: { result: "QuestStarted" } },
]

const defaultEdges: Edge[] = [
  { id: "e1", source: "start-1", target: "cond-1", animated: true, style: { stroke: "oklch(0.35 0 0)" } },
  { id: "e2", source: "cond-1", target: "action-1", animated: true, style: { stroke: "oklch(0.35 0 0)" }, label: "true" },
  { id: "e3", source: "cond-1", target: "dial-1", animated: true, style: { stroke: "oklch(0.35 0 0)" }, label: "false" },
  { id: "e4", source: "action-1", target: "end-1", animated: true, style: { stroke: "oklch(0.35 0 0)" } },
  { id: "e5", source: "dial-1", target: "delay-1", animated: true, style: { stroke: "oklch(0.35 0 0)" } },
  { id: "e6", source: "delay-1", target: "end-1", animated: true, style: { stroke: "oklch(0.35 0 0)" } },
]

interface NodeEditorEnvironmentProps {
  onBack: () => void
}

function NodeEditorInner({ onBack }: NodeEditorEnvironmentProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges)
  const [nodeCount, setNodeCount] = useState(2)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  const [projectName, setProjectName] = useState("Patrol Behavior Tree")
  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState(projectName)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [copied, setCopied] = useState(false)
  const edgeReconnectSuccessful = useRef(true)

  const { zoomIn, zoomOut, fitView, setCenter } = useReactFlow()

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge({ ...connection, animated: true, style: { stroke: "oklch(0.35 0 0)" } }, eds),
      )
    },
    [setEdges],
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
    (template: (typeof nodeTemplates)[number], position?: { x: number; y: number }) => {
      const id = `${template.type}-${nodeCount}`
      const newNode: Node = {
        id,
        type: template.type,
        position: position || { x: 200 + Math.random() * 400, y: 100 + Math.random() * 300 },
        data: { ...template.data },
      }
      setNodes((nds) => [...nds, newNode])
      setNodeCount((c) => c + 1)
    },
    [nodeCount, setNodes],
  )

  const deleteSelectedNodes = useCallback(() => {
    const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id)
    if (selectedNode && !selectedIds.includes(selectedNode.id)) {
      selectedIds.push(selectedNode.id)
    }
    if (selectedIds.length > 0) {
      setNodes((nds) => nds.filter((n) => !selectedIds.includes(n.id)))
      setEdges((eds) => eds.filter((e) => !selectedIds.includes(e.source) && !selectedIds.includes(e.target)))
      setSelectedNode(null)
    }
  }, [nodes, selectedNode, setNodes, setEdges])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        if (e.key === "Escape" && showSearch) { setShowSearch(false); setSearchQuery("") }
        return
      }
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteSelectedNodes() }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") { e.preventDefault(); setShowSearch(true); setTimeout(() => searchInputRef.current?.focus(), 50) }
      if (e.key === "Escape") { setShowSearch(false); setSearchQuery(""); setSelectedNode(null) }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [deleteSelectedNodes, showSearch])

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

  const filteredSearchNodes = nodes.filter((n) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const data = n.data as Record<string, unknown>
    const name = String(data.action || data.trigger || data.check || data.speaker || data.result || n.type || "").toLowerCase()
    return name.includes(q) || (n.type || "").toLowerCase().includes(q) || n.id.toLowerCase().includes(q)
  })

  const navigateToNode = (node: Node) => {
    setCenter(node.position.x + 90, node.position.y + 50, { zoom: 1.2, duration: 600 })
    setSelectedNode(node)
    setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id })))
    setShowSearch(false)
    setSearchQuery("")
  }

  const generateLuaScript = () => {
    const lines = [
      "-- Behavior Tree Logic Script",
      `-- Graph: ${projectName}`,
      `-- Generated: ${new Date().toISOString()}`,
      "",
      "local BehaviorTree = {}",
      "",
    ]
    nodes.forEach((node) => {
      const data = node.data as Record<string, unknown>
      const luaId = node.id.replace("-", "_")
      lines.push(`BehaviorTree["${luaId}"] = {`)
      lines.push(`  type = "${node.type}",`)
      Object.entries(data).forEach(([k, v]) => {
        if (typeof v === "string") lines.push(`  ${k} = "${v}",`)
        else lines.push(`  ${k} = ${v},`)
      })
      lines.push("}")
      lines.push("")
    })
    lines.push("local connections = {")
    edges.forEach((e) => lines.push(`  {from = "${e.source}", to = "${e.target}"},`))
    lines.push("}")
    lines.push("")
    lines.push("return BehaviorTree")
    return lines.join("\n")
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateLuaScript())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExport = () => {
    const script = generateLuaScript()
    const blob = new Blob([script], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${projectName.replace(/\s+/g, "_").toLowerCase()}.lua`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getNodeLabel = (node: Node) => {
    const data = node.data as Record<string, unknown>
    return String(data.action || data.trigger || data.check || data.speaker || data.result || node.type || node.id)
  }

  const getNodeIcon = (type: string) => {
    const t = nodeTemplates.find((nt) => nt.type === type)
    return t ? t.icon : GitBranch
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
        {/* Header */}
        <div className="flex h-11 items-center gap-2 border-b border-border bg-background px-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs">Back</span>
          </Button>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-red-500/10">
              <GitBranch className="h-3 w-3 text-red-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Node Editor</span>
          </div>

          {/* Project Name */}
          <div className="flex flex-1 items-center justify-center">
            {isEditingName ? (
              <Input
                ref={nameInputRef}
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveProjectName(); if (e.key === "Escape") setIsEditingName(false) }}
                onBlur={saveProjectName}
                className="h-7 w-48 bg-secondary text-center text-xs font-medium"
                autoFocus
              />
            ) : (
              <button onClick={startEditingName} className="group flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary">
                {projectName}
                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-xs">
                <Plus className="h-3 w-3" /> Add Node
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-card border-border">
              <DropdownMenuLabel className="text-muted-foreground text-xs">Logic Nodes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {nodeTemplates.map((t) => (
                <DropdownMenuItem key={t.type} onClick={() => addNode(t)} className="gap-2 text-xs">
                  <t.icon className="h-3.5 w-3.5 text-muted-foreground" /> {t.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-xs" onClick={handleCopy}>
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-xs" onClick={handleExport}>
            <Download className="h-3 w-3" /> Export .lua
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-xs">
            <Save className="h-3 w-3" /> Save
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Toolbar */}
          <div className="flex w-11 flex-col items-center gap-0.5 border-r border-border bg-card/50 py-2">
            {[
              { id: "search", icon: Search, label: "Search", action: () => { setShowSearch(true); setTimeout(() => searchInputRef.current?.focus(), 50) } },
              { id: "zoomIn", icon: ZoomIn, label: "Zoom In", action: () => zoomIn() },
              { id: "zoomOut", icon: ZoomOut, label: "Zoom Out", action: () => zoomOut() },
              { id: "fitView", icon: Maximize, label: "Fit View", action: () => fitView({ padding: 0.3 }) },
            ].map((tool) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <button onClick={tool.action} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground">
                    <tool.icon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-card border-border text-foreground">
                  <span className="text-xs">{tool.label}</span>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Canvas */}
          <div className="relative flex-1 overflow-hidden">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onReconnect={onReconnect}
              onReconnectStart={onReconnectStart}
              onReconnectEnd={onReconnectEnd}
              onNodeClick={(_, node) => setSelectedNode(node)}
              onPaneClick={() => setSelectedNode(null)}
              nodeTypes={logicNodeTypes}
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
                      className="h-7 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
                    />
                    <button onClick={() => { setShowSearch(false); setSearchQuery("") }} className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground">
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {searchQuery && (
                    <div className="max-h-52 overflow-auto p-1">
                      {filteredSearchNodes.length > 0 ? (
                        filteredSearchNodes.map((node) => {
                          const Icon = getNodeIcon(node.type || "")
                          return (
                            <button key={node.id} onClick={() => navigateToNode(node)} className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-secondary">
                                <Icon className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="truncate text-xs font-medium text-foreground">{getNodeLabel(node)}</p>
                                <p className="text-[10px] text-muted-foreground">{node.type} - {node.id}</p>
                              </div>
                            </button>
                          )
                        })
                      ) : (
                        <div className="px-3 py-4 text-center text-xs text-muted-foreground">No nodes found</div>
                      )}
                    </div>
                  )}
                  <div className="border-t border-border px-3 py-1.5">
                    <p className="text-[10px] text-muted-foreground">Press Esc to close</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export function NodeEditorEnvironment({ onBack }: NodeEditorEnvironmentProps) {
  return (
    <ReactFlowProvider>
      <NodeEditorInner onBack={onBack} />
    </ReactFlowProvider>
  )
}
