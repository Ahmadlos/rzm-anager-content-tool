"use client"

import React from "react"

import { useState } from "react"
import {
  Users,
  Package,
  Database,
  GitBranch,
  ArrowRight,
  Gamepad2,
  Search,
  Clock,
  Layers,
  Settings,
  FolderOpen,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type EnvironmentId = "npc" | "item" | "database" | "node-editor"

interface EnvironmentCard {
  id: EnvironmentId
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  stats: { label: string; value: string }[]
  accentColor: string
  lastModified: string
  status: "active" | "idle"
}

const environments: EnvironmentCard[] = [
  {
    id: "npc",
    title: "NPC Editor",
    description: "Create and manage non-player characters with visual node-based editing. Define identity, stats, behavior, dialogue, and inventory.",
    icon: Users,
    stats: [
      { label: "Characters", value: "6" },
      { label: "Templates", value: "4" },
      { label: "Scripts", value: "2" },
    ],
    accentColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    lastModified: "2 hours ago",
    status: "active",
  },
  {
    id: "item",
    title: "Item Manager",
    description: "Design weapons, armor, consumables, and materials. Manage rarity, stats, and item relationships.",
    icon: Package,
    stats: [
      { label: "Items", value: "8" },
      { label: "Categories", value: "4" },
      { label: "Rarities", value: "5" },
    ],
    accentColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    lastModified: "5 hours ago",
    status: "active",
  },
  {
    id: "database",
    title: "Database Viewer",
    description: "Browse and manage game data tables. View NPCs, items, monsters, quests, and skills with filtering and search.",
    icon: Database,
    stats: [
      { label: "Tables", value: "5" },
      { label: "Records", value: "35" },
      { label: "Relations", value: "8" },
    ],
    accentColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    lastModified: "1 day ago",
    status: "idle",
  },
  {
    id: "node-editor",
    title: "Node Editor",
    description: "Visual scripting and logic flow editor. Build AI behavior trees, quest logic, and event systems.",
    icon: GitBranch,
    stats: [
      { label: "Graphs", value: "3" },
      { label: "Nodes", value: "24" },
      { label: "Connections", value: "18" },
    ],
    accentColor: "bg-red-500/10 text-red-400 border-red-500/20",
    lastModified: "3 days ago",
    status: "idle",
  },
]

const recentActivity = [
  { env: "NPC Editor", action: "Modified Elder Marcus dialogue", time: "2h ago" },
  { env: "Item Manager", action: "Added Dragon Scale Shield", time: "5h ago" },
  { env: "Node Editor", action: "Created patrol behavior tree", time: "1d ago" },
  { env: "Database", action: "Exported quest table to SQL", time: "2d ago" },
]

interface DashboardHubProps {
  onEnterEnvironment: (envId: EnvironmentId) => void
}

export function DashboardHub({ onEnterEnvironment }: DashboardHubProps) {
  const [search, setSearch] = useState("")
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const filteredEnvs = environments.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-background">
        {/* Top Navigation */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/10">
              <Gamepad2 className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">RZManager</h1>
              <p className="text-[10px] text-muted-foreground">LOSDC Studio</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search environments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-9 text-xs"
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-card border-border text-foreground">
                <span className="text-xs">Settings</span>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl px-6 py-8">
            {/* Hero Section */}
            <div className="mb-10">
              <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground">
                Workspace
              </h2>
              <p className="mt-1 text-pretty text-sm text-muted-foreground">
                Select an environment to start building your RPG game content.
              </p>
            </div>

            {/* Environment Cards Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredEnvs.map((env) => (
                <button
                  key={env.id}
                  onClick={() => onEnterEnvironment(env.id)}
                  onMouseEnter={() => setHoveredCard(env.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-all duration-200 hover:border-muted-foreground/30 hover:shadow-lg hover:shadow-background/80"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between p-5 pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${env.accentColor}`}>
                        <env.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">{env.title}</h3>
                          <div className={`h-1.5 w-1.5 rounded-full ${env.status === "active" ? "bg-emerald-400" : "bg-muted-foreground/40"}`} />
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {env.lastModified}
                        </div>
                      </div>
                    </div>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${hoveredCard === env.id ? "bg-foreground/10 text-foreground" : "text-muted-foreground/0"}`}>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="px-5 pb-4">
                    <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
                      {env.description}
                    </p>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 border-t border-border px-5 py-3">
                    {env.stats.map((stat) => (
                      <div key={stat.label} className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-foreground">{stat.value}</span>
                        <span className="text-[11px] text-muted-foreground">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {/* Recent Activity Section */}
            <div className="mt-10">
              <div className="mb-4 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
              </div>
              <div className="rounded-lg border border-border bg-card">
                {recentActivity.map((activity, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-4 py-3 ${i < recentActivity.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">{activity.action}</p>
                        <p className="text-[10px] text-muted-foreground">{activity.env}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                      {activity.time}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 flex items-center justify-between pb-6">
              <p className="text-[10px] text-muted-foreground/50">RZManager v1.0.0</p>
              <p className="text-[10px] text-muted-foreground/50">LOSDC Studio</p>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
