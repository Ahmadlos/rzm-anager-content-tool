"use client"

import { useState } from "react"
import {
  LayoutGrid,
  Plus,
  Copy,
  Trash2,
  Check,
  MoreHorizontal,
  FolderOpen,
  Clock,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Workspace {
  id: string
  name: string
  description: string
  entities: number
  lastModified: string
  isActive: boolean
}

const initialWorkspaces: Workspace[] = [
  {
    id: "ws-1",
    name: "Main Development",
    description: "Primary workspace for Arcadia game content development",
    entities: 42,
    lastModified: "2 hours ago",
    isActive: true,
  },
  {
    id: "ws-2",
    name: "Balancing Branch",
    description: "Testing stat balancing adjustments for NPCs and Monsters",
    entities: 38,
    lastModified: "1 day ago",
    isActive: false,
  },
  {
    id: "ws-3",
    name: "Quest Expansion",
    description: "New quest chain content for the Eastern Kingdoms update",
    entities: 15,
    lastModified: "3 days ago",
    isActive: false,
  },
]

export function WorkspacesView() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces)
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")

  const filtered = workspaces.filter(
    (ws) =>
      ws.name.toLowerCase().includes(search.toLowerCase()) ||
      ws.description.toLowerCase().includes(search.toLowerCase()),
  )

  const handleSwitchActive = (id: string) => {
    setWorkspaces((prev) =>
      prev.map((ws) => ({ ...ws, isActive: ws.id === id })),
    )
  }

  const handleDuplicate = (id: string) => {
    const ws = workspaces.find((w) => w.id === id)
    if (!ws) return
    const dup: Workspace = {
      ...ws,
      id: `ws-${Date.now()}`,
      name: `${ws.name} (Copy)`,
      isActive: false,
      lastModified: "Just now",
    }
    setWorkspaces((prev) => [...prev, dup])
  }

  const handleDelete = (id: string) => {
    setWorkspaces((prev) => prev.filter((ws) => ws.id !== id))
  }

  const handleCreate = () => {
    if (!newName.trim()) return
    const ws: Workspace = {
      id: `ws-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim(),
      entities: 0,
      lastModified: "Just now",
      isActive: false,
    }
    setWorkspaces((prev) => [...prev, ws])
    setNewName("")
    setNewDesc("")
    setCreateOpen(false)
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-foreground" />
            <h2 className="text-xl font-bold text-foreground">Workspaces</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your isolated content workspaces.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Create Workspace
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">New Workspace</DialogTitle>
              <DialogDescription>
                Create a new isolated workspace for content development.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. PvP Balance Test"
                  className="h-9 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Optional description..."
                  className="text-xs"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search workspaces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-9 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-260px)]">
        <div className="flex flex-col gap-3">
          {filtered.map((ws) => (
            <div
              key={ws.id}
              className={`group flex items-center justify-between rounded-lg border bg-card p-4 transition-colors ${
                ws.isActive
                  ? "border-foreground/20 ring-1 ring-foreground/10"
                  : "border-border hover:border-muted-foreground/20"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    ws.isActive
                      ? "bg-foreground/10 text-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{ws.name}</h3>
                    {ws.isActive && (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{ws.description}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{ws.entities} entities</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {ws.lastModified}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!ws.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 bg-transparent text-xs"
                    onClick={() => handleSwitchActive(ws.id)}
                  >
                    <Check className="h-3 w-3" />
                    Set Active
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 border-border bg-card">
                    <DropdownMenuItem
                      className="gap-2 text-xs"
                      onClick={() => handleDuplicate(ws.id)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 text-xs text-destructive focus:text-destructive"
                      onClick={() => handleDelete(ws.id)}
                      disabled={ws.isActive}
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
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No workspaces found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
