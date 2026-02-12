"use client"

import React from "react"
import { useState } from "react"
import {
  Users,
  Package,
  Bug,
  ScrollText,
  Zap,
  Shield,
  ArrowRight,
  Gamepad2,
  Search,
  Clock,
  Settings,
  FolderOpen,
  Layers,
  Database,
  GitCommit,
  Eye,
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
import type { EnvironmentId } from "@/lib/environment-schemas"
import { WorkspaceStatusBar } from "@/components/workspace/workspace-status-bar"
import { getActiveWorkspace } from "@/lib/workspace-store"

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
    title: "NPC Environment",
    description:
      "Create and manage NPCResource entities with identity, stats, scripts, item references, and localized text.",
    icon: Users,
    stats: [
      { label: "Entities", value: "6" },
      { label: "Node Types", value: "6" },
      { label: "Scripts", value: "2" },
    ],
    accentColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    lastModified: "2 hours ago",
    status: "active",
  },
  {
    id: "item",
    title: "Item Environment",
    description:
      "Design ItemResource entities with names, tooltips, type, grade, skill and state references, and scripts.",
    icon: Package,
    stats: [
      { label: "Entities", value: "8" },
      { label: "Node Types", value: "5" },
      { label: "References", value: "2" },
    ],
    accentColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    lastModified: "5 hours ago",
    status: "active",
  },
  {
    id: "monster",
    title: "Monster Environment",
    description:
      "Define MonsterResource entities with stats, skill links, drop tables, and on-death script hooks.",
    icon: Bug,
    stats: [
      { label: "Entities", value: "7" },
      { label: "Node Types", value: "3" },
      { label: "Scripts", value: "1" },
    ],
    accentColor: "bg-red-500/10 text-red-400 border-red-500/20",
    lastModified: "1 day ago",
    status: "idle",
  },
  {
    id: "quest",
    title: "Quest Environment",
    description:
      "Build QuestResource entities with localized quest text, summaries, status, and three script hooks.",
    icon: ScrollText,
    stats: [
      { label: "Entities", value: "6" },
      { label: "Node Types", value: "5" },
      { label: "Scripts", value: "3" },
    ],
    accentColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    lastModified: "3 days ago",
    status: "idle",
  },
  {
    id: "skill",
    title: "Skill Environment",
    description:
      "Define SkillResource entities with text, descriptions, tooltips, and state references. No script nodes.",
    icon: Zap,
    stats: [
      { label: "Entities", value: "8" },
      { label: "Node Types", value: "2" },
      { label: "References", value: "1" },
    ],
    accentColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    lastModified: "4 days ago",
    status: "idle",
  },
  {
    id: "state",
    title: "State Environment",
    description:
      "Define StateResource entities with localized text, tooltips, and up to 20 numeric value parameters.",
    icon: Shield,
    stats: [
      { label: "Entities", value: "5" },
      { label: "Node Types", value: "2" },
      { label: "Values", value: "20" },
    ],
    accentColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    lastModified: "5 days ago",
    status: "idle",
  },
]

const recentActivity = [
  { env: "NPC Environment", action: "Created NPC 'Elder Marcus' graph", time: "2h ago" },
  { env: "Item Environment", action: "Added Dragon Scale Shield entity", time: "5h ago" },
  { env: "Quest Environment", action: "Built quest script hooks", time: "1d ago" },
  { env: "Monster Environment", action: "Defined Fire Drake drop table", time: "2d ago" },
  { env: "Skill Environment", action: "Added Fireball skill resource", time: "3d ago" },
]

interface DashboardHubProps {
  onEnterEnvironment: (envId: EnvironmentId) => void
  onOpenConnectionManager?: () => void
  onOpenWorkspaceManager?: () => void
  onOpenStaging?: () => void
  onOpenDatabaseExplorer?: () => void
}

export function DashboardHub({ onEnterEnvironment, onOpenConnectionManager, onOpenWorkspaceManager, onOpenStaging, onOpenDatabaseExplorer }: DashboardHubProps) {
  const [search, setSearch] = useState("")
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const activeWorkspace = getActiveWorkspace()

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
              <p className="text-[10px] text-muted-foreground">
                Arcadia Schema Editor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <WorkspaceStatusBar onOpenWorkspaceManager={onOpenWorkspaceManager} />
            <div className="relative w-56">
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={onOpenDatabaseExplorer}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="border-border bg-card text-foreground">
                <span className="text-xs">Database Explorer</span>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={onOpenConnectionManager}
                >
                  <Database className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="border-border bg-card text-foreground">
                <span className="text-xs">Connection Manager</span>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={onOpenWorkspaceManager}
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="border-border bg-card text-foreground">
                <span className="text-xs">Workspace Manager</span>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={onOpenStaging}
                >
                  <GitCommit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="border-border bg-card text-foreground">
                <span className="text-xs">Commit & Deploy</span>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="border-border bg-card text-foreground">
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
                Select an isolated environment to build game content mapped to
                your database schema.
              </p>
            </div>

            {/* Environment Cards Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg border ${env.accentColor}`}
                      >
                        <env.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">
                            {env.title}
                          </h3>
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${env.status === "active" ? "bg-emerald-400" : "bg-muted-foreground/40"}`}
                          />
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {env.lastModified}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${hoveredCard === env.id ? "bg-foreground/10 text-foreground" : "text-muted-foreground/0"}`}
                    >
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
                        <span className="text-xs font-medium text-foreground">
                          {stat.value}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {stat.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {/* Workspace + Connection + Explorer + Staging Quick Access */}
            <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={onOpenWorkspaceManager}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-muted-foreground/30 hover:shadow-lg hover:shadow-background/80"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-foreground/5">
                  <FolderOpen className="h-5 w-5 text-foreground/70" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    Workspaces
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {activeWorkspace
                      ? `Active: ${activeWorkspace.name}`
                      : "No active workspace -- create one to start"}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={onOpenConnectionManager}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-muted-foreground/30 hover:shadow-lg hover:shadow-background/80"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-foreground/5">
                  <Database className="h-5 w-5 text-foreground/70" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    Database Connections
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Manage server profiles, SSH tunnels, and credentials
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={onOpenDatabaseExplorer}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-muted-foreground/30 hover:shadow-lg hover:shadow-background/80"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-foreground/5">
                  <Eye className="h-5 w-5 text-foreground/70" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    Database Explorer
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Inspect tables, views, and stored procedures (read-only)
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={onOpenStaging}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-muted-foreground/30 hover:shadow-lg hover:shadow-background/80"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-foreground/5">
                  <GitCommit className="h-5 w-5 text-foreground/70" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    Commit & Deploy
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Stage changes, commit, preview SQL, and apply to database
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Recent Activity Section */}
            <div className="mt-8">
              <div className="mb-4 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Recent Activity
                </h3>
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
                        <p className="text-xs font-medium text-foreground">
                          {activity.action}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {activity.env}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-border text-[10px] text-muted-foreground"
                    >
                      {activity.time}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 flex items-center justify-between pb-6">
              <p className="text-[10px] text-muted-foreground/50">
                RZManager v2.0.0
              </p>
              <p className="text-[10px] text-muted-foreground/50">
                Arcadia Schema System
              </p>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
