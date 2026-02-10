"use client"

import { useState } from "react"
import { Plus, Search, MoreHorizontal, Edit, Trash2, GitBranch } from "lucide-react"
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
  DialogTrigger,
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
import type { SelectedEntity } from "@/lib/graph-store"

interface Quest {
  id: number
  name: string
  type: "main" | "side" | "daily" | "event"
  difficulty: "easy" | "medium" | "hard" | "extreme"
  rewardXP: number
  rewardGold: number
  requiredLevel: number
  description: string
}

const initialQuests: Quest[] = [
  { id: 1, name: "The Lost Kingdom", type: "main", difficulty: "hard", rewardXP: 5000, rewardGold: 2000, requiredLevel: 30, description: "Uncover the ruins of the ancient kingdom." },
  { id: 2, name: "Wolf Hunt", type: "daily", difficulty: "easy", rewardXP: 200, rewardGold: 100, requiredLevel: 1, description: "Eliminate 10 wolves near the village." },
  { id: 3, name: "Dragon's Hoard", type: "main", difficulty: "extreme", rewardXP: 15000, rewardGold: 10000, requiredLevel: 45, description: "Defeat the ancient dragon and claim its treasure." },
  { id: 4, name: "Herb Gathering", type: "side", difficulty: "easy", rewardXP: 100, rewardGold: 50, requiredLevel: 1, description: "Collect 5 healing herbs." },
  { id: 5, name: "Festival Challenge", type: "event", difficulty: "medium", rewardXP: 1500, rewardGold: 800, requiredLevel: 10, description: "Compete in the annual festival tournament." },
  { id: 6, name: "Shadow Conspiracy", type: "main", difficulty: "hard", rewardXP: 8000, rewardGold: 3500, requiredLevel: 35, description: "Investigate the shadow cult's plans." },
]

interface QuestsManagerProps {
  onOpenCanvas?: (entity?: SelectedEntity) => void
}

export function QuestsManager({ onOpenCanvas }: QuestsManagerProps = {}) {
  const [quests, setQuests] = useState<Quest[]>(initialQuests)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)
  const [formData, setFormData] = useState({
    name: "", type: "side" as Quest["type"], difficulty: "medium" as Quest["difficulty"],
    rewardXP: 0, rewardGold: 0, requiredLevel: 1, description: "",
  })

  const filtered = quests.filter(
    (q) => q.name.toLowerCase().includes(search.toLowerCase()) || q.type.includes(search.toLowerCase())
  )

  const typeColor = (type: Quest["type"]) => {
    switch (type) {
      case "main": return "bg-amber-500/15 text-amber-400 border-amber-500/30"
      case "side": return "bg-blue-500/15 text-blue-400 border-blue-500/30"
      case "daily": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      case "event": return "bg-pink-500/15 text-pink-400 border-pink-500/30"
    }
  }

  const difficultyColor = (d: Quest["difficulty"]) => {
    switch (d) {
      case "easy": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      case "medium": return "bg-amber-500/15 text-amber-400 border-amber-500/30"
      case "hard": return "bg-red-500/15 text-red-400 border-red-500/30"
      case "extreme": return "bg-purple-500/15 text-purple-400 border-purple-500/30"
    }
  }

  const handleAdd = () => {
    setEditingQuest(null)
    setFormData({ name: "", type: "side", difficulty: "medium", rewardXP: 0, rewardGold: 0, requiredLevel: 1, description: "" })
    setDialogOpen(true)
  }

  const handleEdit = (quest: Quest) => {
    setEditingQuest(quest)
    setFormData({
      name: quest.name, type: quest.type, difficulty: quest.difficulty,
      rewardXP: quest.rewardXP, rewardGold: quest.rewardGold,
      requiredLevel: quest.requiredLevel, description: quest.description,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (editingQuest) {
      setQuests(quests.map((q) => (q.id === editingQuest.id ? { ...q, ...formData } : q)))
    } else {
      setQuests([...quests, { id: Date.now(), ...formData }])
    }
    setDialogOpen(false)
  }

  const handleDelete = (id: number) => {
    setQuests(quests.filter((q) => q.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quest Manager</h1>
          <p className="text-sm text-muted-foreground">Design quests and missions for players</p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenCanvas && (
            <Button onClick={onOpenCanvas} variant="outline" className="gap-1.5 bg-transparent text-xs">
              <GitBranch className="h-3.5 w-3.5" />
              Open Node Editor
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Create Quest
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-foreground">{editingQuest ? "Edit Quest" : "Create New Quest"}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label>Quest Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Quest name" />
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Type</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as Quest["type"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">Main</SelectItem>
                        <SelectItem value="side">Side</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Difficulty</Label>
                    <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v as Quest["difficulty"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                        <SelectItem value="extreme">Extreme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Reward XP</Label>
                    <Input type="number" value={formData.rewardXP} onChange={(e) => setFormData({ ...formData, rewardXP: Number(e.target.value) })} />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Reward Gold</Label>
                    <Input type="number" value={formData.rewardGold} onChange={(e) => setFormData({ ...formData, rewardGold: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Required Level</Label>
                  <Input type="number" value={formData.requiredLevel} onChange={(e) => setFormData({ ...formData, requiredLevel: Number(e.target.value) })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Quest description..." rows={3} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSave} className="bg-primary text-primary-foreground">Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search quests..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Badge variant="outline" className="border-border text-muted-foreground">{filtered.length} Quests</Badge>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Difficulty</TableHead>
              <TableHead className="text-muted-foreground hidden sm:table-cell">XP</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Gold</TableHead>
              <TableHead className="text-muted-foreground hidden lg:table-cell">Req. Level</TableHead>
              <TableHead className="text-muted-foreground w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((quest) => (
              <TableRow key={quest.id} className="border-border">
                <TableCell className="font-medium text-foreground">{quest.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={typeColor(quest.type)}>{quest.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={difficultyColor(quest.difficulty)}>{quest.difficulty}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">{quest.rewardXP.toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">{quest.rewardGold.toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground hidden lg:table-cell">{quest.requiredLevel}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem onClick={() => onOpenCanvas?.({ id: quest.id, name: quest.name })} className="gap-2">
                        <GitBranch className="h-4 w-4" /> Edit Graph
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(quest)} className="gap-2">
                        <Edit className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(quest.id)} className="gap-2 text-destructive">
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
    </div>
  )
}
