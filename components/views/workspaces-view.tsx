"use client"

import { useState } from "react"
import {
  ArrowLeft,
  LayoutGrid,
  Plus,
  Copy,
  Trash2,
  Check,
  MoreHorizontal,
  FolderOpen,
  Clock,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface Workspace {
  id: string
  name: string
  description: string
  environments: number
  entities: number
  lastModified: string
  active: boolean
}

const mockWorkspaces: Workspace[] = [
  {
    id: "ws-1",
    name: "Arcadia Main",
    description: "Primary game content workspace with all core environments configured.",
    environments: 6,
    entities: 40,
    lastModified: "2 hours ago",
    active: true,
  },
  {
    id: "ws-2",
    name: "Arcadia Staging",
    description: "Staging copy for pre-release QA validation and testing.",
    environments: 6,
    entities: 38,
    lastModified: "1 day ago",
    active: false,
  },
  {
    id: "ws-3",
    name: "Expansion Pack Alpha",
    description: "New content workspace for the first major expansion pack.",
    environments: 3,
    entities: 12,
    lastModified: "3 days ago",
    active: false,
  },
  {
    id: "ws-4",
    name: "Sandbox / Experiments",
    description: "Experimental workspace for prototyping new resource types and workflows.",
    environments: 2,
    entities: 5,
    lastModified: "1 week ago",
    active: false,
  },
]

interface WorkspacesViewProps {
  onBack: () => void
}

export function WorkspacesView({ onBack }: WorkspacesViewProps) {
  const [workspaces, setWorkspaces] = useState(mockWorkspaces)
  const [search, setSearch] = useState("")

  const filtered = workspaces.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.description.toLowerCase().includes(search.toLowerCase()),
  )

  const handleSwitchWorkspace = (id: string) => {
    setWorkspaces((prev) =>
      prev.map((w) => ({ ...w, active: w.id === id })),
    )
  }

  const handleDuplicate = (id: string) => {
    const source = workspaces.find((w) => w.id === id)
    if (!source) return
    const dup: Workspace = {
      ...source,
      id: `ws-${Date.now()}`,
      name: `${source.name} (Copy)`,
      active: false,
      lastModified: "Just now",
    }
    setWorkspaces((prev) => [...prev, dup])
  }

  const handleDelete = (id: string) => {
    setWorkspaces((prev) => prev.filter((w) => w.id !== id))
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
              <LayoutGrid className="h-3.5 w-3.5 text-foreground" />
            </div>
            <h1 className="text-sm font-semibold text-foreground">Workspaces</h1>
          </div>

          <div className="flex-1" />

          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3 w-3" />
            New Workspace
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6">
              <h2 className="text-balance text-lg font-bold text-foreground">
                Manage Workspaces
              </h2>
              <p className="mt-1 text-pretty text-xs text-muted-foreground">
                Switch between workspaces, duplicate configurations, or create new isolated content sets.
              </p>
            </div>

            <div className="mb-4">
              <Input
                placeholder="Filter workspaces..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 max-w-xs text-xs"
              />
            </div>

            <div className="flex flex-col gap-3">
              {filtered.map((ws) => (
                <div
                  key={ws.id}
                  className={`group flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors ${ws.active ? "border-foreground/20" : "border-border hover:border-muted-foreground/30"}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {ws.name}
                      </h3>
                      {ws.active && (
                        <Badge variant="outline" className="border-emerald-500/30 text-[10px] text-emerald-400">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {ws.description}
                    </p>
                    <div className="mt-1.5 flex items-center gap-4 text-[11px] text-muted-foreground">
                      <span>{ws.environments} environments</span>
                      <span>{ws.entities} entities</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {ws.lastModified}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!ws.active && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 bg-transparent text-xs"
                        onClick={() => handleSwitchWorkspace(ws.id)}
                      >
                        <Check className="h-3 w-3" />
                        Switch
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 border-border bg-card">
                        <DropdownMenuItem
                          className="gap-2 text-xs"
                          onClick={() => handleDuplicate(ws.id)}
                        >
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 text-xs text-destructive focus:text-destructive"
                          onClick={() => handleDelete(ws.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
                  <LayoutGrid className="mb-2 h-6 w-6 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">No workspaces found</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
