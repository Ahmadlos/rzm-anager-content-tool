"use client"

import { useState, useMemo } from "react"
import {
  ArrowLeft,
  Database,
  Search,
  Download,
  Copy,
  Check,
  Table2,
  Filter,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DatabaseEnvironmentProps {
  onBack: () => void
}

interface TableSchema {
  name: string
  displayName: string
  columns: { key: string; label: string; type: string }[]
  data: Record<string, unknown>[]
  color: string
}

const tables: TableSchema[] = [
  {
    name: "npcs",
    displayName: "NPCs",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    columns: [
      { key: "id", label: "ID", type: "INT" },
      { key: "name", label: "Name", type: "VARCHAR" },
      { key: "role", label: "Role", type: "VARCHAR" },
      { key: "level", label: "Level", type: "INT" },
      { key: "location", label: "Location", type: "VARCHAR" },
      { key: "status", label: "Status", type: "ENUM" },
    ],
    data: [
      { id: 1, name: "Elder Marcus", role: "Quest Giver", level: 50, location: "Village Square", status: "active" },
      { id: 2, name: "Blacksmith Hilda", role: "Merchant", level: 35, location: "Forge District", status: "active" },
      { id: 3, name: "Shadow Whisper", role: "Guide", level: 45, location: "Dark Forest", status: "quest" },
      { id: 4, name: "Captain Aldric", role: "Guard", level: 40, location: "Main Gate", status: "active" },
      { id: 5, name: "Mystic Serena", role: "Healer", level: 55, location: "Temple of Light", status: "inactive" },
      { id: 6, name: "Thief Rook", role: "Info Broker", level: 30, location: "Underground", status: "quest" },
    ],
  },
  {
    name: "items",
    displayName: "Items",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    columns: [
      { key: "id", label: "ID", type: "INT" },
      { key: "name", label: "Name", type: "VARCHAR" },
      { key: "type", label: "Type", type: "VARCHAR" },
      { key: "rarity", label: "Rarity", type: "ENUM" },
      { key: "value", label: "Value", type: "INT" },
      { key: "weight", label: "Weight", type: "FLOAT" },
    ],
    data: [
      { id: 1, name: "Iron Sword", type: "Weapon", rarity: "common", value: 120, weight: 3.5 },
      { id: 2, name: "Healing Potion", type: "Consumable", rarity: "common", value: 50, weight: 0.5 },
      { id: 3, name: "Dragon Scale Shield", type: "Armor", rarity: "legendary", value: 15000, weight: 8.0 },
      { id: 4, name: "Shadow Cloak", type: "Armor", rarity: "epic", value: 5000, weight: 1.2 },
      { id: 5, name: "Fire Ruby", type: "Material", rarity: "rare", value: 800, weight: 0.1 },
      { id: 6, name: "Elven Bow", type: "Weapon", rarity: "uncommon", value: 600, weight: 2.0 },
      { id: 7, name: "Mana Crystal", type: "Material", rarity: "rare", value: 1200, weight: 0.3 },
      { id: 8, name: "Steel Gauntlets", type: "Armor", rarity: "uncommon", value: 350, weight: 4.0 },
    ],
  },
  {
    name: "monsters",
    displayName: "Monsters",
    color: "text-red-400 bg-red-500/10 border-red-500/20",
    columns: [
      { key: "id", label: "ID", type: "INT" },
      { key: "name", label: "Name", type: "VARCHAR" },
      { key: "type", label: "Type", type: "VARCHAR" },
      { key: "level", label: "Level", type: "INT" },
      { key: "hp", label: "HP", type: "INT" },
      { key: "element", label: "Element", type: "ENUM" },
    ],
    data: [
      { id: 1, name: "Forest Wolf", type: "Beast", level: 5, hp: 150, element: "none" },
      { id: 2, name: "Fire Drake", type: "Dragon", level: 35, hp: 3500, element: "fire" },
      { id: 3, name: "Shadow Wraith", type: "Undead", level: 25, hp: 800, element: "dark" },
      { id: 4, name: "Stone Golem", type: "Elemental", level: 30, hp: 5000, element: "earth" },
      { id: 5, name: "Ice Serpent", type: "Beast", level: 20, hp: 1200, element: "water" },
      { id: 6, name: "Wind Harpy", type: "Mythical", level: 15, hp: 600, element: "wind" },
      { id: 7, name: "Holy Phoenix", type: "Mythical", level: 50, hp: 8000, element: "light" },
    ],
  },
  {
    name: "quests",
    displayName: "Quests",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    columns: [
      { key: "id", label: "ID", type: "INT" },
      { key: "name", label: "Name", type: "VARCHAR" },
      { key: "type", label: "Type", type: "ENUM" },
      { key: "difficulty", label: "Difficulty", type: "ENUM" },
      { key: "rewardXP", label: "XP", type: "INT" },
      { key: "rewardGold", label: "Gold", type: "INT" },
    ],
    data: [
      { id: 1, name: "The Lost Kingdom", type: "main", difficulty: "hard", rewardXP: 5000, rewardGold: 2000 },
      { id: 2, name: "Wolf Hunt", type: "daily", difficulty: "easy", rewardXP: 200, rewardGold: 100 },
      { id: 3, name: "Dragon's Hoard", type: "main", difficulty: "extreme", rewardXP: 15000, rewardGold: 10000 },
      { id: 4, name: "Herb Gathering", type: "side", difficulty: "easy", rewardXP: 100, rewardGold: 50 },
      { id: 5, name: "Festival Challenge", type: "event", difficulty: "medium", rewardXP: 1500, rewardGold: 800 },
      { id: 6, name: "Shadow Conspiracy", type: "main", difficulty: "hard", rewardXP: 8000, rewardGold: 3500 },
    ],
  },
  {
    name: "skills",
    displayName: "Skills",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    columns: [
      { key: "id", label: "ID", type: "INT" },
      { key: "name", label: "Name", type: "VARCHAR" },
      { key: "type", label: "Type", type: "ENUM" },
      { key: "element", label: "Element", type: "VARCHAR" },
      { key: "manaCost", label: "Mana", type: "INT" },
      { key: "damage", label: "Damage", type: "INT" },
    ],
    data: [
      { id: 1, name: "Fireball", type: "attack", element: "Fire", manaCost: 30, damage: 150 },
      { id: 2, name: "Ice Shield", type: "defense", element: "Water", manaCost: 40, damage: 0 },
      { id: 3, name: "Healing Light", type: "support", element: "Light", manaCost: 50, damage: 0 },
      { id: 4, name: "Shadow Strike", type: "attack", element: "Dark", manaCost: 45, damage: 200 },
      { id: 5, name: "Berserker Rage", type: "passive", element: "None", manaCost: 0, damage: 0 },
      { id: 6, name: "Meteor Storm", type: "ultimate", element: "Fire", manaCost: 150, damage: 800 },
      { id: 7, name: "Wind Dash", type: "support", element: "Wind", manaCost: 20, damage: 0 },
      { id: 8, name: "Earth Shatter", type: "attack", element: "Earth", manaCost: 60, damage: 350 },
    ],
  },
]

export function DatabaseEnvironment({ onBack }: DatabaseEnvironmentProps) {
  const [activeTable, setActiveTable] = useState("npcs")
  const [search, setSearch] = useState("")
  const [copied, setCopied] = useState(false)

  const table = tables.find((t) => t.name === activeTable)!

  const filteredData = useMemo(() => {
    if (!search) return table.data
    const q = search.toLowerCase()
    return table.data.filter((row) =>
      Object.values(row).some((v) =>
        String(v).toLowerCase().includes(q)
      )
    )
  }, [table, search])

  const generateSQL = () => {
    const lines: string[] = [
      `-- Export: ${table.displayName} table`,
      `-- Generated: ${new Date().toISOString()}`,
      "",
      `CREATE TABLE IF NOT EXISTS ${table.name} (`,
      table.columns.map((c, i) => {
        const last = i === table.columns.length - 1
        const sqlType = c.type === "INT" ? "INT" : c.type === "FLOAT" ? "FLOAT" : c.type === "ENUM" ? "VARCHAR(50)" : "VARCHAR(255)"
        return `  ${c.key} ${sqlType}${c.key === "id" ? " PRIMARY KEY" : ""}${last ? "" : ","}`
      }).join("\n"),
      ");",
      "",
    ]

    filteredData.forEach((row) => {
      const vals = table.columns.map((c) => {
        const v = row[c.key]
        return typeof v === "number" ? String(v) : `'${v}'`
      }).join(", ")
      const cols = table.columns.map((c) => c.key).join(", ")
      lines.push(`INSERT INTO ${table.name} (${cols}) VALUES (${vals});`)
    })

    return lines.join("\n")
  }

  const handleCopySQL = async () => {
    await navigator.clipboard.writeText(generateSQL())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportSQL = () => {
    const sql = generateSQL()
    const blob = new Blob([sql], { type: "application/sql" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${table.name}_export.sql`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalRecords = tables.reduce((acc, t) => acc + t.data.length, 0)

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
            <TooltipContent className="bg-card border-border text-foreground">
              <span className="text-xs">Back to Dashboard</span>
            </TooltipContent>
          </Tooltip>

          <div className="h-5 w-px bg-border" />

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10">
              <Database className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <h1 className="text-sm font-semibold text-foreground">Database Viewer</h1>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
              {tables.length} tables / {totalRecords} records
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-transparent text-xs"
              onClick={handleCopySQL}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy SQL"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-transparent text-xs"
              onClick={handleExportSQL}
            >
              <Download className="h-3 w-3" />
              Export .sql
            </Button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Table Sidebar */}
          <div className="flex w-56 flex-col border-r border-border bg-card/50">
            <div className="border-b border-border px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tables</p>
            </div>
            <div className="flex-1 overflow-auto p-2">
              {tables.map((t) => (
                <button
                  key={t.name}
                  onClick={() => { setActiveTable(t.name); setSearch("") }}
                  className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors ${
                    activeTable === t.name
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <Table2 className="h-3.5 w-3.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">{t.displayName}</p>
                    <p className="text-[10px] text-muted-foreground">{t.data.length} rows</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Schema info */}
            <div className="border-t border-border p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Schema</p>
              <div className="flex flex-col gap-1.5">
                {table.columns.map((col) => (
                  <div key={col.key} className="flex items-center justify-between">
                    <span className="text-[11px] text-foreground">{col.key}</span>
                    <Badge variant="outline" className="border-border px-1.5 text-[9px] text-muted-foreground">
                      {col.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Data Area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Filter Bar */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={`Search ${table.displayName}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-9 text-xs"
                />
              </div>
              <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                {filteredData.length} / {table.data.length} rows
              </Badge>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    {table.columns.map((col) => (
                      <TableHead key={col.key} className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {col.label}
                          <span className="text-[9px] text-muted-foreground/50">({col.type})</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row, i) => (
                    <TableRow key={i} className="border-border">
                      {table.columns.map((col) => (
                        <TableCell key={col.key} className="text-foreground">
                          {col.key === "id" ? (
                            <span className="font-mono text-xs text-muted-foreground">{String(row[col.key])}</span>
                          ) : typeof row[col.key] === "number" ? (
                            <span className="font-mono text-xs">{String(row[col.key])}</span>
                          ) : (
                            <span className="text-xs">{String(row[col.key])}</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {filteredData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={table.columns.length} className="h-24 text-center text-sm text-muted-foreground">
                        No records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
