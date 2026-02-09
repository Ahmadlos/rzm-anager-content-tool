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
  type Connection,
  type Edge,
  type Node,
  type SelectionMode,
  BackgroundVariant,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import {
  ArrowLeft,
  Plus,
  Save,
  Download,
  User,
  Heart,
  MessageSquare,
  Brain,
  Palette,
  Backpack,
  MousePointer2,
  Search,
  X as XIcon,
  Settings,
  ClipboardList,
  ZoomIn,
  ZoomOut,
  Maximize,
  Code,
  Database,
  FileText,
  LayoutGrid,
  Pencil,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { npcNodeTypes } from "./npc-nodes"
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

const defaultNodes: Node[] = [
  {
    id: "identity-1",
    type: "identity",
    position: { x: 50, y: 120 },
    data: { name: "New NPC", role: "Villager", level: 1, location: "Town Square" },
  },
  {
    id: "stats-1",
    type: "stats",
    position: { x: 380, y: 20 },
    data: { hp: 100, attack: 10, defense: 5, speed: 10 },
  },
  {
    id: "dialogue-1",
    type: "dialogue",
    position: { x: 380, y: 230 },
    data: { greeting: "Hello, traveler...", farewell: "Safe travels." },
  },
  {
    id: "behavior-1",
    type: "behavior",
    position: { x: 700, y: 20 },
    data: { aiType: "Friendly", aggression: "Passive", patrol: "Wander", schedule: "Day only" },
  },
  {
    id: "appearance-1",
    type: "appearance",
    position: { x: 700, y: 230 },
    data: { race: "Human", gender: "Male", hair: "Brown", outfit: "Peasant" },
  },
  {
    id: "inventory-1",
    type: "inventory",
    position: { x: 1020, y: 100 },
    data: { items: ["Health Potion", "Iron Key", "Bread"], gold: 50 },
  },
]

const defaultEdges: Edge[] = [
  { id: "e-id-stats", source: "identity-1", target: "stats-1", animated: true, style: { stroke: "oklch(0.35 0 0)" } },
  { id: "e-id-dialogue", source: "identity-1", target: "dialogue-1", animated: true, style: { stroke: "oklch(0.35 0 0)" } },
  { id: "e-stats-behavior", source: "stats-1", target: "behavior-1", animated: true, style: { stroke: "oklch(0.35 0 0)" } },
  { id: "e-dialogue-appearance", source: "dialogue-1", target: "appearance-1", animated: true, style: { stroke: "oklch(0.35 0 0)" } },
  { id: "e-behavior-inventory", source: "behavior-1", target: "inventory-1", animated: true, style: { stroke: "oklch(0.35 0 0)" } },
  { id: "e-appearance-inventory", source: "appearance-1", target: "inventory-1", animated: true, style: { stroke: "oklch(0.35 0 0)" } },
]

const nodeTemplates = [
  { type: "identity", label: "Identity", icon: User, data: { name: "Unnamed", role: "None", level: 1, location: "Unknown" } },
  { type: "stats", label: "Stats", icon: Heart, data: { hp: 100, attack: 10, defense: 5, speed: 10 } },
  { type: "dialogue", label: "Dialogue", icon: MessageSquare, data: { greeting: "Hello...", farewell: "Goodbye." } },
  { type: "behavior", label: "Behavior", icon: Brain, data: { aiType: "Idle", aggression: "Passive", patrol: "None", schedule: "24h" } },
  { type: "appearance", label: "Appearance", icon: Palette, data: { race: "Human", gender: "Male", hair: "Black", outfit: "Default" } },
  { type: "inventory", label: "Inventory", icon: Backpack, data: { items: ["Empty Slot"], gold: 0 } },
]

type ViewTab = "canvas" | "code" | "query" | "script"

const viewTabs: { id: ViewTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "canvas", label: "Canvas", icon: LayoutGrid },
  { id: "code", label: "Code", icon: Code },
  { id: "query", label: "Query", icon: Database },
  { id: "script", label: "Script", icon: FileText },
]

interface ToolbarButton {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  separator?: boolean
  shortcut?: string
}

const toolbarButtons: ToolbarButton[] = [
  { id: "select", icon: MousePointer2, label: "Select", shortcut: "V" },
  { id: "search", icon: Search, label: "Search Nodes", shortcut: "Ctrl+F" },
  { id: "delete", icon: XIcon, label: "Delete", shortcut: "Del" },
  { id: "settings", icon: Settings, label: "Settings" },
  { id: "clipboard", icon: ClipboardList, label: "Clipboard", separator: true },
  { id: "zoomIn", icon: ZoomIn, label: "Zoom In", shortcut: "+" },
  { id: "zoomOut", icon: ZoomOut, label: "Zoom Out", shortcut: "-", separator: true },
  { id: "fitView", icon: Maximize, label: "Fit View", shortcut: "F" },
]

interface NPCCanvasProps {
  onBack: () => void
}

const nodeFieldConfig: Record<string, { label: string; fields: { key: string; label: string; type: "text" | "number" | "textarea" | "items" }[] }> = {
  identity: {
    label: "Identity",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "role", label: "Role", type: "text" },
      { key: "level", label: "Level", type: "number" },
      { key: "location", label: "Location", type: "text" },
    ],
  },
  stats: {
    label: "Stats",
    fields: [
      { key: "hp", label: "HP", type: "number" },
      { key: "attack", label: "Attack", type: "number" },
      { key: "defense", label: "Defense", type: "number" },
      { key: "speed", label: "Speed", type: "number" },
    ],
  },
  dialogue: {
    label: "Dialogue",
    fields: [
      { key: "greeting", label: "Greeting", type: "textarea" },
      { key: "farewell", label: "Farewell", type: "textarea" },
    ],
  },
  behavior: {
    label: "Behavior",
    fields: [
      { key: "aiType", label: "AI Type", type: "text" },
      { key: "aggression", label: "Aggression", type: "text" },
      { key: "patrol", label: "Patrol", type: "text" },
      { key: "schedule", label: "Schedule", type: "text" },
    ],
  },
  appearance: {
    label: "Appearance",
    fields: [
      { key: "race", label: "Race", type: "text" },
      { key: "gender", label: "Gender", type: "text" },
      { key: "hair", label: "Hair", type: "text" },
      { key: "outfit", label: "Outfit", type: "text" },
    ],
  },
  inventory: {
    label: "Inventory",
    fields: [
      { key: "items", label: "Items", type: "items" },
      { key: "gold", label: "Gold", type: "number" },
    ],
  },
}

// ===== Syntax highlighting helpers =====

interface SyntaxToken {
  text: string
  className: string
}

function tokenizeJS(code: string): SyntaxToken[][] {
  return code.split("\n").map((line) => {
    const tokens: SyntaxToken[] = []
    // Comment line
    if (line.trimStart().startsWith("//")) {
      tokens.push({ text: line, className: "text-emerald-500" })
      return tokens
    }

    let remaining = line
    const patterns: [RegExp, string][] = [
      [/^(const|let|var|function|return|import|export|from|type|interface)\b/, "text-blue-400"],
      [/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/, "text-amber-300"],
      [/^(\d+(?:\.\d+)?)/, "text-purple-400"],
      [/^(true|false|null|undefined|NaN|Infinity)\b/, "text-purple-400"],
      [/^(\{|\}|\[|\]|\(|\))/, "text-foreground/70"],
      [/^(=>|===|!==|==|!=|>=|<=|&&|\|\||[+\-*/%=<>!&|^~?:])/, "text-sky-300"],
      [/^([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/, "text-red-400"],
      [/^([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*\()/, "text-yellow-300"],
      [/^([a-zA-Z_$][a-zA-Z0-9_$]*)/, "text-foreground"],
      [/^(\s+)/, ""],
      [/^(.)/, "text-foreground"],
    ]

    while (remaining.length > 0) {
      let matched = false
      for (const [pattern, cls] of patterns) {
        const match = remaining.match(pattern)
        if (match) {
          if (match[2] !== undefined) {
            // Two-group patterns (property: or function call)
            tokens.push({ text: match[1], className: cls })
            tokens.push({ text: match[2], className: "text-foreground" })
          } else {
            tokens.push({ text: match[0], className: cls })
          }
          remaining = remaining.slice(match[0].length)
          matched = true
          break
        }
      }
      if (!matched) {
        tokens.push({ text: remaining[0], className: "text-foreground" })
        remaining = remaining.slice(1)
      }
    }
    return tokens
  })
}

function tokenizeSQL(code: string): SyntaxToken[][] {
  const keywords = new Set([
    "SELECT", "FROM", "WHERE", "INSERT", "INTO", "VALUES", "UPDATE", "SET",
    "DELETE", "CREATE", "TABLE", "ALTER", "DROP", "INDEX", "ON", "AND", "OR",
    "NOT", "NULL", "IN", "AS", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER",
    "ORDER", "BY", "GROUP", "HAVING", "LIMIT", "OFFSET", "UNION", "ALL",
    "EXISTS", "BETWEEN", "LIKE", "IS", "PRIMARY", "KEY", "FOREIGN", "REFERENCES",
    "INT", "INTEGER", "VARCHAR", "TEXT", "BOOLEAN", "FLOAT", "DOUBLE", "DATE",
    "TIMESTAMP", "DEFAULT", "AUTO_INCREMENT", "SERIAL", "UNIQUE", "CONSTRAINT",
    "IF", "ELSE", "BEGIN", "END", "DECLARE", "EXEC", "EXECUTE", "PROCEDURE",
  ])

  return code.split("\n").map((line) => {
    const tokens: SyntaxToken[] = []
    if (line.trimStart().startsWith("--")) {
      tokens.push({ text: line, className: "text-emerald-500" })
      return tokens
    }

    let remaining = line
    const patterns: [RegExp, string, boolean][] = [
      [/^('(?:[^'\\]|\\.)*')/, "text-amber-300", false],
      [/^(\d+(?:\.\d+)?)/, "text-purple-400", false],
      [/^([a-zA-Z_][a-zA-Z0-9_]*)/, "", true], // check keyword
      [/^(\s+)/, "", false],
      [/^([(),;.*=<>!+\-/])/, "text-foreground/70", false],
      [/^(.)/, "text-foreground", false],
    ]

    while (remaining.length > 0) {
      let matched = false
      for (const [pattern, cls, checkKw] of patterns) {
        const match = remaining.match(pattern)
        if (match) {
          if (checkKw) {
            const upper = match[1].toUpperCase()
            if (keywords.has(upper)) {
              tokens.push({ text: match[1], className: "text-blue-400 font-semibold" })
            } else {
              tokens.push({ text: match[1], className: "text-foreground" })
            }
          } else {
            tokens.push({ text: match[0], className: cls })
          }
          remaining = remaining.slice(match[0].length)
          matched = true
          break
        }
      }
      if (!matched) {
        tokens.push({ text: remaining[0], className: "text-foreground" })
        remaining = remaining.slice(1)
      }
    }
    return tokens
  })
}

function tokenizeLua(code: string): SyntaxToken[][] {
  const keywords = new Set([
    "local", "function", "end", "if", "then", "else", "elseif", "for", "while",
    "do", "repeat", "until", "return", "break", "in", "and", "or", "not",
    "true", "false", "nil", "require", "print", "pairs", "ipairs", "tostring",
    "tonumber", "type", "table", "string", "math", "io", "os", "self",
  ])

  return code.split("\n").map((line) => {
    const tokens: SyntaxToken[] = []
    if (line.trimStart().startsWith("--")) {
      tokens.push({ text: line, className: "text-emerald-500" })
      return tokens
    }
    if (line.trimStart().startsWith("#")) {
      tokens.push({ text: line, className: "text-emerald-500" })
      return tokens
    }

    let remaining = line
    const patterns: [RegExp, string, boolean][] = [
      [/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/, "text-amber-300", false],
      [/^(\d+(?:\.\d+)?)/, "text-purple-400", false],
      [/^([a-zA-Z_][a-zA-Z0-9_]*)/, "", true],
      [/^(\s+)/, "", false],
      [/^([(){}[\],;.=<>!+\-*/%#:~])/, "text-foreground/70", false],
      [/^(.)/, "text-foreground", false],
    ]

    while (remaining.length > 0) {
      let matched = false
      for (const [pattern, cls, checkKw] of patterns) {
        const match = remaining.match(pattern)
        if (match) {
          if (checkKw) {
            if (keywords.has(match[1])) {
              tokens.push({ text: match[1], className: "text-blue-400 font-semibold" })
            } else if (match[1] === "true" || match[1] === "false" || match[1] === "nil") {
              tokens.push({ text: match[1], className: "text-purple-400" })
            } else {
              tokens.push({ text: match[1], className: "text-foreground" })
            }
          } else {
            tokens.push({ text: match[0], className: cls })
          }
          remaining = remaining.slice(match[0].length)
          matched = true
          break
        }
      }
      if (!matched) {
        tokens.push({ text: remaining[0], className: "text-foreground" })
        remaining = remaining.slice(1)
      }
    }
    return tokens
  })
}

function SyntaxHighlightedCode({ code, language }: { code: string; language: "js" | "sql" | "lua" }) {
  const tokenized = language === "sql" ? tokenizeSQL(code) : language === "lua" ? tokenizeLua(code) : tokenizeJS(code)

  return (
    <div className="font-mono text-xs leading-relaxed">
      {tokenized.map((lineTokens, lineIdx) => (
        <div key={lineIdx} className="flex">
          <span className="mr-4 inline-block w-8 select-none text-right text-muted-foreground/40">{lineIdx + 1}</span>
          <span>
            {lineTokens.map((token, tokenIdx) => (
              <span key={tokenIdx} className={token.className}>{token.text}</span>
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}

// ===== Main Component =====

function NPCCanvasInner({ onBack }: NPCCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges)
  const [nodeCount, setNodeCount] = useState(2)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [activeTool, setActiveTool] = useState("select")
  const [activeView, setActiveView] = useState<ViewTab>("canvas")

  // Project name state
  const [projectName, setProjectName] = useState("New NPC Project")
  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState(projectName)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; flowPosition: { x: number; y: number } } | null>(null)

  // Search state
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Copy feedback
  const [copied, setCopied] = useState(false)

  // Edge reconnect ref
  const edgeReconnectSuccessful = useRef(true)

  const { zoomIn, zoomOut, fitView, setCenter } = useReactFlow()

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          { ...connection, animated: true, style: { stroke: "oklch(0.35 0 0)" } },
          eds,
        ),
      )
    },
    [setEdges],
  )

  // Edge reconnection handlers - allows dragging handle to detach edge
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

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node)
      setContextMenu(null)
    },
    [],
  )

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setContextMenu(null)
  }, [])

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault()
      const reactFlowBounds = (event.target as HTMLElement).closest(".react-flow")?.getBoundingClientRect()
      if (!reactFlowBounds) return

      setContextMenu({
        x: (event as React.MouseEvent).clientX,
        y: (event as React.MouseEvent).clientY,
        flowPosition: {
          x: (event as React.MouseEvent).clientX - reactFlowBounds.left,
          y: (event as React.MouseEvent).clientY - reactFlowBounds.top,
        },
      })
    },
    [],
  )

  const updateNodeData = useCallback(
    (key: string, value: string | number | string[]) => {
      if (!selectedNode) return
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === selectedNode.id) {
            const updated = { ...n, data: { ...n.data, [key]: value } }
            setSelectedNode(updated)
            return updated
          }
          return n
        }),
      )
    },
    [selectedNode, setNodes],
  )

  const deleteSelectedNodes = useCallback(() => {
    const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id)
    if (selectedNode && !selectedIds.includes(selectedNode.id)) {
      selectedIds.push(selectedNode.id)
    }
    if (selectedIds.length > 0) {
      setNodes((nds) => nds.filter((n) => !selectedIds.includes(n.id)))
      setEdges((eds) =>
        eds.filter(
          (e) => !selectedIds.includes(e.source) && !selectedIds.includes(e.target),
        ),
      )
      setSelectedNode(null)
    }
  }, [nodes, selectedNode, setNodes, setEdges])

  const handleToolAction = useCallback(
    (toolId: string) => {
      setActiveTool(toolId)
      switch (toolId) {
        case "zoomIn":
          zoomIn()
          break
        case "zoomOut":
          zoomOut()
          break
        case "fitView":
          fitView({ padding: 0.3 })
          break
        case "delete":
          deleteSelectedNodes()
          break
        case "search":
          setShowSearch(true)
          setTimeout(() => searchInputRef.current?.focus(), 50)
          break
      }
    },
    [zoomIn, zoomOut, fitView, deleteSelectedNodes],
  )

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
    if (trimmed) {
      setProjectName(trimmed)
    }
    setIsEditingName(false)
  }

  // Search functionality
  const filteredSearchNodes = nodes.filter((n) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const data = n.data as Record<string, unknown>
    const name = String(data.name || data.greeting || n.type || "").toLowerCase()
    const type = (n.type || "").toLowerCase()
    const id = n.id.toLowerCase()
    return name.includes(q) || type.includes(q) || id.includes(q)
  })

  const navigateToNode = (node: Node) => {
    setCenter(node.position.x + 110, node.position.y + 60, { zoom: 1.2, duration: 600 })
    setSelectedNode(node)
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: n.id === node.id,
      })),
    )
    setShowSearch(false)
    setSearchQuery("")
  }

  // Code generation
  const generateCode = () => {
    const lines = ["// Generated NPC Configuration", `// Nodes: ${nodes.length} | Edges: ${edges.length}`, ""]
    nodes.forEach((node) => {
      lines.push(`const ${node.id.replace("-", "_")} = {`)
      lines.push(`  type: "${node.type}",`)
      Object.entries(node.data as Record<string, unknown>).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          lines.push(`  ${k}: ${JSON.stringify(v)},`)
        } else if (typeof v === "string") {
          lines.push(`  ${k}: "${v}",`)
        } else {
          lines.push(`  ${k}: ${v},`)
        }
      })
      lines.push("};")
      lines.push("")
    })
    return lines.join("\n")
  }

  const generateQuery = () => {
    const lines = [
      "-- Generated NPC SQL Schema & Insert Statements",
      `-- Generated: ${new Date().toISOString()}`,
      "",
      "CREATE TABLE IF NOT EXISTS npcs (",
      "  id SERIAL PRIMARY KEY,",
      "  name VARCHAR(255) NOT NULL,",
      "  role VARCHAR(100),",
      "  level INT DEFAULT 1,",
      "  location VARCHAR(255)",
      ");",
      "",
      "CREATE TABLE IF NOT EXISTS npc_stats (",
      "  id SERIAL PRIMARY KEY,",
      "  npc_id INT REFERENCES npcs(id),",
      "  hp INT DEFAULT 100,",
      "  attack INT DEFAULT 10,",
      "  defense INT DEFAULT 5,",
      "  speed INT DEFAULT 10",
      ");",
      "",
      "CREATE TABLE IF NOT EXISTS npc_dialogues (",
      "  id SERIAL PRIMARY KEY,",
      "  npc_id INT REFERENCES npcs(id),",
      "  greeting TEXT,",
      "  farewell TEXT",
      ");",
      "",
    ]
    nodes.filter((n) => n.type === "identity").forEach((node) => {
      const d = node.data as Record<string, unknown>
      lines.push(`INSERT INTO npcs (name, role, level, location)`)
      lines.push(`VALUES ('${d.name}', '${d.role}', ${d.level}, '${d.location}');`)
      lines.push("")
    })
    nodes.filter((n) => n.type === "stats").forEach((node) => {
      const d = node.data as Record<string, unknown>
      lines.push(`INSERT INTO npc_stats (hp, attack, defense, speed)`)
      lines.push(`VALUES (${d.hp}, ${d.attack}, ${d.defense}, ${d.speed});`)
      lines.push("")
    })
    nodes.filter((n) => n.type === "dialogue").forEach((node) => {
      const d = node.data as Record<string, unknown>
      lines.push(`INSERT INTO npc_dialogues (greeting, farewell)`)
      lines.push(`VALUES ('${d.greeting}', '${d.farewell}');`)
      lines.push("")
    })
    return lines.join("\n")
  }

  const generateScript = () => {
    const lines = [
      "-- NPC Builder Lua Script",
      `-- Generated: ${new Date().toISOString()}`,
      "",
      "local npc_data = {}",
      "",
    ]
    nodes.forEach((node) => {
      const data = node.data as Record<string, unknown>
      const luaId = node.id.replace("-", "_")
      lines.push(`npc_data["${luaId}"] = {`)
      lines.push(`  type = "${node.type}",`)
      Object.entries(data).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          const items = v.map((item: string) => `"${item}"`).join(", ")
          lines.push(`  ${k} = {${items}},`)
        } else if (typeof v === "string") {
          lines.push(`  ${k} = "${v}",`)
        } else {
          lines.push(`  ${k} = ${v},`)
        }
      })
      lines.push("}")
      lines.push("")
    })

    lines.push("local connections = {")
    edges.forEach((edge) => {
      lines.push(`  {source = "${edge.source}", target = "${edge.target}"},`)
    })
    lines.push("}")
    lines.push("")
    lines.push("-- Apply NPC data")
    lines.push("for id, data in pairs(npc_data) do")
    lines.push('  print("Loading NPC: " .. id)')
    lines.push("end")
    lines.push("")
    lines.push('print("NPC data loaded successfully!")')
    return lines.join("\n")
  }

  const getCodeContent = () => {
    switch (activeView) {
      case "code": return generateCode()
      case "query": return generateQuery()
      case "script": return generateScript()
      default: return ""
    }
  }

  const getCodeLanguage = (): "js" | "sql" | "lua" => {
    switch (activeView) {
      case "code": return "js"
      case "query": return "sql"
      case "script": return "lua"
      default: return "js"
    }
  }

  const handleCopyCode = async () => {
    const code = getCodeContent()
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportCode = () => {
    const code = getCodeContent()
    let filename: string
    let mimeType: string

    switch (activeView) {
      case "query":
        filename = `${projectName.replace(/\s+/g, "_").toLowerCase()}.sql`
        mimeType = "application/sql"
        break
      case "script":
        filename = `${projectName.replace(/\s+/g, "_").toLowerCase()}.lua`
        mimeType = "text/plain"
        break
      default:
        filename = `${projectName.replace(/\s+/g, "_").toLowerCase()}.js`
        mimeType = "application/javascript"
        break
    }

    const blob = new Blob([code], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedConfig = selectedNode?.type ? nodeFieldConfig[selectedNode.type] : null

  const getNodeLabel = (node: Node) => {
    const data = node.data as Record<string, unknown>
    return String(data.name || data.greeting || node.type || node.id)
  }

  const getNodeTypeIcon = (type: string) => {
    const t = nodeTemplates.find((nt) => nt.type === type)
    return t ? t.icon : User
  }

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

          {/* View Tabs */}
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-secondary/50 p-0.5">
            {viewTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeView === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-3 w-3" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Project Name - Center */}
          <div className="flex flex-1 items-center justify-center">
            {isEditingName ? (
              <div className="flex items-center gap-1.5">
                <Input
                  ref={nameInputRef}
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveProjectName()
                    if (e.key === "Escape") setIsEditingName(false)
                  }}
                  onBlur={saveProjectName}
                  className="h-7 w-48 bg-secondary text-center text-xs font-medium"
                  autoFocus
                />
              </div>
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

          {activeView === "canvas" ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-xs">
                    <Plus className="h-3 w-3" />
                    Add Node
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                  <DropdownMenuLabel className="text-muted-foreground text-xs">Node Types</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {nodeTemplates.map((t) => (
                    <DropdownMenuItem key={t.type} onClick={() => addNode(t)} className="gap-2 text-xs">
                      <t.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {t.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-xs">
                <Save className="h-3 w-3" />
                Save
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-xs">
                <Download className="h-3 w-3" />
                Export
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 bg-transparent text-xs"
                onClick={handleCopyCode}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 bg-transparent text-xs"
                onClick={handleExportCode}
              >
                <Download className="h-3 w-3" />
                {activeView === "query" ? "Export .sql" : activeView === "script" ? "Export .lua" : "Export .js"}
              </Button>
            </>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Toolbar */}
          {activeView === "canvas" && (
            <div className="flex w-11 flex-col items-center gap-0.5 border-r border-border bg-card/50 py-2">
              {toolbarButtons.map((tool) => (
                <div key={tool.id} className="flex flex-col items-center">
                  {tool.separator && (
                    <Separator className="my-1.5 w-5" />
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleToolAction(tool.id)}
                        className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                          activeTool === tool.id
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        }`}
                      >
                        <tool.icon className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-card border-border text-foreground">
                      <div className="flex items-center gap-2">
                        <span>{tool.label}</span>
                        {tool.shortcut && (
                          <span className="rounded bg-secondary px-1 py-0.5 text-[10px] text-muted-foreground">{tool.shortcut}</span>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}

          {/* Canvas / Code Views */}
          <div className="relative flex-1 overflow-hidden">
            {activeView === "canvas" ? (
              <>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onReconnect={onReconnect}
                  onReconnectStart={onReconnectStart}
                  onReconnectEnd={onReconnectEnd}
                  onNodeClick={onNodeClick}
                  onPaneClick={onPaneClick}
                  onPaneContextMenu={onPaneContextMenu}
                  nodeTypes={npcNodeTypes}
                  selectionOnDrag
                  selectionMode={"partial" as SelectionMode}
                  panOnDrag={[1]}
                  fitView
                  fitViewOptions={{ padding: 0.3 }}
                  className="bg-background"
                  proOptions={{ hideAttribution: true }}
                >
                  <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="oklch(0.22 0 0)"
                  />
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
                      onContextMenu={(e) => { e.preventDefault(); setContextMenu(null) }}
                    />
                    <div
                      className="fixed z-50 min-w-[180px] overflow-hidden rounded-lg border border-border bg-card shadow-xl"
                      style={{ left: contextMenu.x, top: contextMenu.y }}
                    >
                      <div className="px-2 py-1.5">
                        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</p>
                      </div>
                      <Separator />
                      <div className="p-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-accent">
                              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                              Add Node
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" className="w-44 bg-card border-border">
                            <DropdownMenuLabel className="text-muted-foreground text-xs">Node Types</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {nodeTemplates.map((t) => (
                              <DropdownMenuItem
                                key={t.type}
                                onClick={() => {
                                  addNode(t, contextMenu.flowPosition)
                                  setContextMenu(null)
                                }}
                                className="gap-2 text-xs"
                              >
                                <t.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                {t.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <button
                          onClick={() => { setContextMenu(null) }}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                        >
                          <Save className="h-3.5 w-3.5 text-muted-foreground" />
                          Save Project
                        </button>
                        <button
                          onClick={() => { setContextMenu(null) }}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                        >
                          <Download className="h-3.5 w-3.5 text-muted-foreground" />
                          Export
                        </button>
                        <Separator className="my-1" />
                        <button
                          onClick={() => {
                            setShowSearch(true)
                            setContextMenu(null)
                            setTimeout(() => searchInputRef.current?.focus(), 50)
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                        >
                          <Search className="h-3.5 w-3.5 text-muted-foreground" />
                          Search Nodes
                        </button>
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
                          placeholder="Search nodes by name, type, or ID..."
                          className="h-7 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
                        />
                        <button
                          onClick={() => { setShowSearch(false); setSearchQuery("") }}
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {searchQuery && (
                        <div className="max-h-52 overflow-auto p-1">
                          {filteredSearchNodes.length > 0 ? (
                            filteredSearchNodes.map((node) => {
                              const Icon = getNodeTypeIcon(node.type || "")
                              return (
                                <button
                                  key={node.id}
                                  onClick={() => navigateToNode(node)}
                                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent"
                                >
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
                            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                              No nodes found
                            </div>
                          )}
                        </div>
                      )}
                      <div className="border-t border-border px-3 py-1.5">
                        <p className="text-[10px] text-muted-foreground">Press Esc to close</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Code / Query / Script views with syntax highlighting */
              <div className="flex h-full flex-col">
                {/* Code toolbar */}
                <div className="flex items-center justify-between border-b border-border bg-card/50 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-secondary">
                      {activeView === "code" && <Code className="h-3 w-3 text-muted-foreground" />}
                      {activeView === "query" && <Database className="h-3 w-3 text-muted-foreground" />}
                      {activeView === "script" && <FileText className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <span className="text-xs font-medium text-foreground">
                      {activeView === "code" ? `${projectName.replace(/\s+/g, "_").toLowerCase()}.js` :
                        activeView === "query" ? `${projectName.replace(/\s+/g, "_").toLowerCase()}.sql` :
                          `${projectName.replace(/\s+/g, "_").toLowerCase()}.lua`}
                    </span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {activeView === "code" ? "JavaScript" : activeView === "query" ? "SQL" : "Lua"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={handleCopyCode}
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={handleExportCode}
                    >
                      <Download className="h-3 w-3" />
                      Export
                    </Button>
                  </div>
                </div>
                {/* Syntax highlighted code */}
                <div className="flex-1 overflow-auto bg-background p-4">
                  <SyntaxHighlightedCode code={getCodeContent()} language={getCodeLanguage()} />
                </div>
              </div>
            )}
          </div>

          {/* Right Properties Panel */}
          {selectedNode && selectedConfig && activeView === "canvas" && (
            <div className="flex w-72 flex-col border-l border-border bg-card/50">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{selectedConfig.label}</h3>
                  <p className="text-[10px] text-muted-foreground">ID: {selectedNode.id}</p>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div className="flex flex-col gap-4">
                  {selectedConfig.fields.map((field) => (
                    <div key={field.key} className="flex flex-col gap-1.5">
                      <Label className="text-xs text-muted-foreground">{field.label}</Label>
                      {field.type === "textarea" ? (
                        <Textarea
                          value={String((selectedNode.data as Record<string, unknown>)[field.key] ?? "")}
                          onChange={(e) => updateNodeData(field.key, e.target.value)}
                          rows={3}
                          className="resize-none bg-background text-xs"
                        />
                      ) : field.type === "number" ? (
                        <Input
                          type="number"
                          value={String((selectedNode.data as Record<string, unknown>)[field.key] ?? 0)}
                          onChange={(e) => updateNodeData(field.key, Number(e.target.value))}
                          className="bg-background text-xs"
                        />
                      ) : field.type === "items" ? (
                        <div className="flex flex-col gap-1.5">
                          {((selectedNode.data as Record<string, unknown>)[field.key] as string[] || []).map(
                            (item: string, i: number) => (
                              <div key={i} className="flex items-center gap-2">
                                <Input
                                  value={item}
                                  onChange={(e) => {
                                    const items = [
                                      ...((selectedNode.data as Record<string, unknown>)[field.key] as string[]),
                                    ]
                                    items[i] = e.target.value
                                    updateNodeData(field.key, items)
                                  }}
                                  className="bg-background text-xs"
                                />
                                <button
                                  onClick={() => {
                                    const items = [
                                      ...((selectedNode.data as Record<string, unknown>)[field.key] as string[]),
                                    ]
                                    items.splice(i, 1)
                                    updateNodeData(field.key, items)
                                  }}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <XIcon className="h-3 w-3" />
                                </button>
                              </div>
                            ),
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-1 bg-transparent text-xs"
                            onClick={() => {
                              const items = [
                                ...((selectedNode.data as Record<string, unknown>)[field.key] as string[]),
                                "New Item",
                              ]
                              updateNodeData(field.key, items)
                            }}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add Item
                          </Button>
                        </div>
                      ) : (
                        <Input
                          value={String((selectedNode.data as Record<string, unknown>)[field.key] ?? "")}
                          onChange={(e) => updateNodeData(field.key, e.target.value)}
                          className="bg-background text-xs"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-border p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent text-xs text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
                    setEdges((eds) =>
                      eds.filter(
                        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id,
                      ),
                    )
                    setSelectedNode(null)
                  }}
                >
                  <XIcon className="mr-1 h-3 w-3" />
                  Delete Node
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

export function NPCCanvas({ onBack }: NPCCanvasProps) {
  return (
    <ReactFlowProvider>
      <NPCCanvasInner onBack={onBack} />
    </ReactFlowProvider>
  )
}
