"use client"

import { useState } from "react"
import { Plus, Search, MoreHorizontal, Edit, Trash2, LayoutGrid, List, MapPin, Shield, MessageCircle } from "lucide-react"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NPC {
  id: number
  name: string
  role: string
  location: string
  level: number
  dialogue: string
  status: "active" | "inactive" | "quest"
}

const initialNPCs: NPC[] = [
  { id: 1, name: "Elder Marcus", role: "Quest Giver", location: "Village Square", level: 50, dialogue: "Welcome, brave adventurer...", status: "active" },
  { id: 2, name: "Blacksmith Hilda", role: "Merchant", location: "Forge District", level: 35, dialogue: "Need something repaired?", status: "active" },
  { id: 3, name: "Shadow Whisper", role: "Guide", location: "Dark Forest", level: 45, dialogue: "The shadows speak to me...", status: "quest" },
  { id: 4, name: "Captain Aldric", role: "Guard", location: "Main Gate", level: 40, dialogue: "Halt! State your business.", status: "active" },
  { id: 5, name: "Mystic Serena", role: "Healer", location: "Temple of Light", level: 55, dialogue: "May the light heal you.", status: "inactive" },
  { id: 6, name: "Thief Rook", role: "Info Broker", location: "Underground", level: 30, dialogue: "Got coin? Got info.", status: "quest" },
]

interface NPCsManagerProps {
  onOpenCanvas: () => void
}

type ViewMode = "list" | "cards"

export function NPCsManager({ onOpenCanvas }: NPCsManagerProps) {
  const [npcs, setNPCs] = useState<NPC[]>(initialNPCs)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNPC, setEditingNPC] = useState<NPC | null>(null)
  const [formData, setFormData] = useState({ name: "", role: "", location: "", level: 1, dialogue: "", status: "active" as NPC["status"] })
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  const filtered = npcs.filter(
    (n) =>
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.role.toLowerCase().includes(search.toLowerCase()) ||
      n.location.toLowerCase().includes(search.toLowerCase())
  )

  const statusColor = (status: NPC["status"]) => {
    switch (status) {
      case "active": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      case "inactive": return "bg-red-500/15 text-red-400 border-red-500/30"
      case "quest": return "bg-amber-500/15 text-amber-400 border-amber-500/30"
    }
  }

  const statusDotColor = (status: NPC["status"]) => {
    switch (status) {
      case "active": return "bg-emerald-400"
      case "inactive": return "bg-red-400"
      case "quest": return "bg-amber-400"
    }
  }

  const handleEdit = (npc: NPC) => {
    setEditingNPC(npc)
    setFormData({ name: npc.name, role: npc.role, location: npc.location, level: npc.level, dialogue: npc.dialogue, status: npc.status })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (editingNPC) {
      setNPCs(npcs.map((n) => (n.id === editingNPC.id ? { ...n, ...formData } : n)))
    }
    setDialogOpen(false)
  }

  const handleDelete = (id: number) => {
    setNPCs(npcs.filter((n) => n.id !== id))
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">NPCs Manager</h1>
            <p className="text-sm text-muted-foreground">Manage non-player characters in your game world</p>
          </div>
          <Button onClick={onOpenCanvas} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Create NPC
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search NPCs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Badge variant="outline" className="border-border text-muted-foreground">{filtered.length} NPCs</Badge>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-secondary/50 p-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
                    viewMode === "list"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-card border-border text-foreground">
                <span className="text-xs">List view</span>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
                    viewMode === "cards"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-card border-border text-foreground">
                <span className="text-xs">Cards view</span>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* List View */}
        {viewMode === "list" && (
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Location</TableHead>
                  <TableHead className="text-muted-foreground hidden sm:table-cell">Level</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((npc) => (
                  <TableRow key={npc.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{npc.name}</TableCell>
                    <TableCell className="text-muted-foreground">{npc.role}</TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">{npc.location}</TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">{npc.level}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor(npc.status)}>{npc.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem onClick={() => handleEdit(npc)} className="gap-2">
                            <Edit className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(npc.id)} className="gap-2 text-destructive">
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Cards View */}
        {viewMode === "cards" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((npc) => (
              <div
                key={npc.id}
                className="group relative flex flex-col rounded-lg border border-border bg-card transition-colors hover:border-muted-foreground/30"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between p-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-lg font-bold text-foreground">
                      {npc.name.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h3 className="truncate text-sm font-semibold text-foreground">{npc.name}</h3>
                      <p className="text-xs text-muted-foreground">{npc.role}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem onClick={() => handleEdit(npc)} className="gap-2">
                        <Edit className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(npc.id)} className="gap-2 text-destructive">
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Card Details */}
                <div className="flex flex-col gap-2.5 border-t border-border px-4 py-3">
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{npc.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Shield className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Level {npc.level}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <MessageCircle className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="line-clamp-2 text-muted-foreground italic">{`"${npc.dialogue}"`}</span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${statusDotColor(npc.status)}`} />
                    <span className="text-[11px] capitalize text-muted-foreground">{npc.status}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60">#{npc.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Edit NPC</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="NPC name" />
              </div>
              <div className="flex gap-4">
                <div className="flex flex-1 flex-col gap-2">
                  <Label>Role</Label>
                  <Input value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} placeholder="Role" />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Label>Level</Label>
                  <Input type="number" value={formData.level} onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-1 flex-col gap-2">
                  <Label>Location</Label>
                  <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Location" />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as NPC["status"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="quest">Quest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Dialogue</Label>
                <Textarea value={formData.dialogue} onChange={(e) => setFormData({ ...formData, dialogue: e.target.value })} placeholder="NPC dialogue..." rows={3} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="bg-transparent">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} className="bg-primary text-primary-foreground">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
