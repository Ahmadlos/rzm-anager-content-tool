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
import { Progress } from "@/components/ui/progress"
import type { SelectedEntity } from "@/lib/graph-store"

interface Monster {
  id: number
  name: string
  type: string
  level: number
  hp: number
  attack: number
  defense: number
  element: "fire" | "water" | "earth" | "wind" | "dark" | "light" | "none"
  dropRate: number
  description: string
}

const initialMonsters: Monster[] = [
  { id: 1, name: "Forest Wolf", type: "Beast", level: 5, hp: 150, attack: 25, defense: 10, element: "none", dropRate: 60, description: "A common wolf found in forests." },
  { id: 2, name: "Fire Drake", type: "Dragon", level: 35, hp: 3500, attack: 180, defense: 120, element: "fire", dropRate: 25, description: "A lesser dragon breathing flames." },
  { id: 3, name: "Shadow Wraith", type: "Undead", level: 25, hp: 800, attack: 150, defense: 30, element: "dark", dropRate: 35, description: "A spectral entity of darkness." },
  { id: 4, name: "Stone Golem", type: "Elemental", level: 30, hp: 5000, attack: 100, defense: 250, element: "earth", dropRate: 20, description: "Animated stone guardian." },
  { id: 5, name: "Ice Serpent", type: "Beast", level: 20, hp: 1200, attack: 90, defense: 60, element: "water", dropRate: 40, description: "A frozen snake of the tundra." },
  { id: 6, name: "Wind Harpy", type: "Mythical", level: 15, hp: 600, attack: 80, defense: 25, element: "wind", dropRate: 50, description: "Winged terror of the skies." },
  { id: 7, name: "Holy Phoenix", type: "Mythical", level: 50, hp: 8000, attack: 300, defense: 200, element: "light", dropRate: 5, description: "Legendary bird of rebirth." },
]

interface MonstersManagerProps {
  onOpenCanvas?: (entity?: SelectedEntity) => void
}

export function MonstersManager({ onOpenCanvas }: MonstersManagerProps = {}) {
  const [monsters, setMonsters] = useState<Monster[]>(initialMonsters)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMonster, setEditingMonster] = useState<Monster | null>(null)
  const [formData, setFormData] = useState({
    name: "", type: "", level: 1, hp: 100, attack: 10, defense: 5, element: "none" as Monster["element"], dropRate: 50, description: "",
  })

  const filtered = monsters.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.type.toLowerCase().includes(search.toLowerCase())
  )

  const elementColor = (el: Monster["element"]) => {
    switch (el) {
      case "fire": return "bg-red-500/15 text-red-400 border-red-500/30"
      case "water": return "bg-blue-500/15 text-blue-400 border-blue-500/30"
      case "earth": return "bg-amber-500/15 text-amber-400 border-amber-500/30"
      case "wind": return "bg-teal-500/15 text-teal-400 border-teal-500/30"
      case "dark": return "bg-purple-500/15 text-purple-400 border-purple-500/30"
      case "light": return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30"
      case "none": return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
    }
  }

  const handleAdd = () => {
    setEditingMonster(null)
    setFormData({ name: "", type: "", level: 1, hp: 100, attack: 10, defense: 5, element: "none", dropRate: 50, description: "" })
    setDialogOpen(true)
  }

  const handleEdit = (monster: Monster) => {
    setEditingMonster(monster)
    setFormData({
      name: monster.name, type: monster.type, level: monster.level, hp: monster.hp,
      attack: monster.attack, defense: monster.defense, element: monster.element,
      dropRate: monster.dropRate, description: monster.description,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (editingMonster) {
      setMonsters(monsters.map((m) => (m.id === editingMonster.id ? { ...m, ...formData } : m)))
    } else {
      setMonsters([...monsters, { id: Date.now(), ...formData }])
    }
    setDialogOpen(false)
  }

  const handleDelete = (id: number) => {
    setMonsters(monsters.filter((m) => m.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Monster Manager</h1>
          <p className="text-sm text-muted-foreground">Define creatures and enemies for encounters</p>
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
                Create Monster
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-foreground">{editingMonster ? "Edit Monster" : "Create New Monster"}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex gap-4">
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Name</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Monster name" />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Type</Label>
                    <Input value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} placeholder="Beast, Dragon..." />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Level</Label>
                    <Input type="number" value={formData.level} onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })} />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>HP</Label>
                    <Input type="number" value={formData.hp} onChange={(e) => setFormData({ ...formData, hp: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Attack</Label>
                    <Input type="number" value={formData.attack} onChange={(e) => setFormData({ ...formData, attack: Number(e.target.value) })} />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Defense</Label>
                    <Input type="number" value={formData.defense} onChange={(e) => setFormData({ ...formData, defense: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Element</Label>
                    <Select value={formData.element} onValueChange={(v) => setFormData({ ...formData, element: v as Monster["element"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="fire">Fire</SelectItem>
                        <SelectItem value="water">Water</SelectItem>
                        <SelectItem value="earth">Earth</SelectItem>
                        <SelectItem value="wind">Wind</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Drop Rate (%)</Label>
                    <Input type="number" value={formData.dropRate} onChange={(e) => setFormData({ ...formData, dropRate: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Monster description..." rows={2} />
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
          <Input placeholder="Search monsters..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Badge variant="outline" className="border-border text-muted-foreground">{filtered.length} Monsters</Badge>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground hidden sm:table-cell">Type</TableHead>
              <TableHead className="text-muted-foreground">Level</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">HP</TableHead>
              <TableHead className="text-muted-foreground">Element</TableHead>
              <TableHead className="text-muted-foreground hidden lg:table-cell">Drop Rate</TableHead>
              <TableHead className="text-muted-foreground w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((monster) => (
              <TableRow key={monster.id} className="border-border">
                <TableCell className="font-medium text-foreground">{monster.name}</TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">{monster.type}</TableCell>
                <TableCell className="text-muted-foreground">{monster.level}</TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">{monster.hp.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={elementColor(monster.element)}>{monster.element}</Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    <Progress value={monster.dropRate} className="h-2 w-16" />
                    <span className="text-xs text-muted-foreground">{monster.dropRate}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem onClick={() => onOpenCanvas?.({ id: monster.id, name: monster.name })} className="gap-2">
                        <GitBranch className="h-4 w-4" /> Edit Graph
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(monster)} className="gap-2">
                        <Edit className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(monster.id)} className="gap-2 text-destructive">
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
