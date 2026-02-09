"use client"

import { useState } from "react"
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react"
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

interface Skill {
  id: number
  name: string
  type: "attack" | "defense" | "support" | "passive" | "ultimate"
  element: string
  manaCost: number
  cooldown: number
  damage: number
  requiredLevel: number
  description: string
}

const initialSkills: Skill[] = [
  { id: 1, name: "Fireball", type: "attack", element: "Fire", manaCost: 30, cooldown: 3, damage: 150, requiredLevel: 5, description: "Launches a ball of fire at enemies." },
  { id: 2, name: "Ice Shield", type: "defense", element: "Water", manaCost: 40, cooldown: 8, damage: 0, requiredLevel: 10, description: "Creates a protective ice barrier." },
  { id: 3, name: "Healing Light", type: "support", element: "Light", manaCost: 50, cooldown: 5, damage: 0, requiredLevel: 8, description: "Restores HP to allies." },
  { id: 4, name: "Shadow Strike", type: "attack", element: "Dark", manaCost: 45, cooldown: 4, damage: 200, requiredLevel: 15, description: "A devastating strike from the shadows." },
  { id: 5, name: "Berserker Rage", type: "passive", element: "None", manaCost: 0, cooldown: 0, damage: 0, requiredLevel: 20, description: "Increases attack power when HP is low." },
  { id: 6, name: "Meteor Storm", type: "ultimate", element: "Fire", manaCost: 150, cooldown: 30, damage: 800, requiredLevel: 40, description: "Calls down meteors from the sky." },
  { id: 7, name: "Wind Dash", type: "support", element: "Wind", manaCost: 20, cooldown: 2, damage: 0, requiredLevel: 3, description: "Quick movement to dodge attacks." },
  { id: 8, name: "Earth Shatter", type: "attack", element: "Earth", manaCost: 60, cooldown: 6, damage: 350, requiredLevel: 25, description: "Shakes the ground dealing AoE damage." },
]

export function SkillsManager() {
  const [skills, setSkills] = useState<Skill[]>(initialSkills)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [formData, setFormData] = useState({
    name: "", type: "attack" as Skill["type"], element: "", manaCost: 0, cooldown: 0, damage: 0, requiredLevel: 1, description: "",
  })

  const filtered = skills.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.type.includes(search.toLowerCase()) ||
      s.element.toLowerCase().includes(search.toLowerCase())
  )

  const typeColor = (type: Skill["type"]) => {
    switch (type) {
      case "attack": return "bg-red-500/15 text-red-400 border-red-500/30"
      case "defense": return "bg-blue-500/15 text-blue-400 border-blue-500/30"
      case "support": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      case "passive": return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
      case "ultimate": return "bg-amber-500/15 text-amber-400 border-amber-500/30"
    }
  }

  const handleAdd = () => {
    setEditingSkill(null)
    setFormData({ name: "", type: "attack", element: "", manaCost: 0, cooldown: 0, damage: 0, requiredLevel: 1, description: "" })
    setDialogOpen(true)
  }

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill)
    setFormData({
      name: skill.name, type: skill.type, element: skill.element,
      manaCost: skill.manaCost, cooldown: skill.cooldown, damage: skill.damage,
      requiredLevel: skill.requiredLevel, description: skill.description,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (editingSkill) {
      setSkills(skills.map((s) => (s.id === editingSkill.id ? { ...s, ...formData } : s)))
    } else {
      setSkills([...skills, { id: Date.now(), ...formData }])
    }
    setDialogOpen(false)
  }

  const handleDelete = (id: number) => {
    setSkills(skills.filter((s) => s.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Skills Manager</h1>
          <p className="text-sm text-muted-foreground">Create and manage character abilities and skills</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Create Skill
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingSkill ? "Edit Skill" : "Create New Skill"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex gap-4">
                <div className="flex flex-1 flex-col gap-2">
                  <Label>Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Skill name" />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Label>Element</Label>
                  <Input value={formData.element} onChange={(e) => setFormData({ ...formData, element: e.target.value })} placeholder="Fire, Water..." />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-1 flex-col gap-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as Skill["type"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attack">Attack</SelectItem>
                      <SelectItem value="defense">Defense</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="passive">Passive</SelectItem>
                      <SelectItem value="ultimate">Ultimate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Label>Damage</Label>
                  <Input type="number" value={formData.damage} onChange={(e) => setFormData({ ...formData, damage: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-1 flex-col gap-2">
                  <Label>Mana Cost</Label>
                  <Input type="number" value={formData.manaCost} onChange={(e) => setFormData({ ...formData, manaCost: Number(e.target.value) })} />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Label>Cooldown (s)</Label>
                  <Input type="number" value={formData.cooldown} onChange={(e) => setFormData({ ...formData, cooldown: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Required Level</Label>
                <Input type="number" value={formData.requiredLevel} onChange={(e) => setFormData({ ...formData, requiredLevel: Number(e.target.value) })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Skill description..." rows={2} />
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

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search skills..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Badge variant="outline" className="border-border text-muted-foreground">{filtered.length} Skills</Badge>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground hidden sm:table-cell">Element</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Mana</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Cooldown</TableHead>
              <TableHead className="text-muted-foreground hidden lg:table-cell">Damage</TableHead>
              <TableHead className="text-muted-foreground hidden lg:table-cell">Req. Lv</TableHead>
              <TableHead className="text-muted-foreground w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((skill) => (
              <TableRow key={skill.id} className="border-border">
                <TableCell className="font-medium text-foreground">{skill.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={typeColor(skill.type)}>{skill.type}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">{skill.element}</TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">{skill.manaCost}</TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">{skill.cooldown}s</TableCell>
                <TableCell className="text-muted-foreground hidden lg:table-cell">{skill.damage}</TableCell>
                <TableCell className="text-muted-foreground hidden lg:table-cell">{skill.requiredLevel}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem onClick={() => handleEdit(skill)} className="gap-2">
                        <Edit className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(skill.id)} className="gap-2 text-destructive">
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
