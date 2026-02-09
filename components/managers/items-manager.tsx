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

interface Item {
  id: number
  name: string
  type: string
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
  value: number
  weight: number
  description: string
}

const initialItems: Item[] = [
  { id: 1, name: "Iron Sword", type: "Weapon", rarity: "common", value: 120, weight: 3.5, description: "A standard iron blade." },
  { id: 2, name: "Healing Potion", type: "Consumable", rarity: "common", value: 50, weight: 0.5, description: "Restores 50 HP." },
  { id: 3, name: "Dragon Scale Shield", type: "Armor", rarity: "legendary", value: 15000, weight: 8.0, description: "Forged from ancient dragon scales." },
  { id: 4, name: "Shadow Cloak", type: "Armor", rarity: "epic", value: 5000, weight: 1.2, description: "Grants stealth in dark areas." },
  { id: 5, name: "Fire Ruby", type: "Material", rarity: "rare", value: 800, weight: 0.1, description: "A gem imbued with fire magic." },
  { id: 6, name: "Elven Bow", type: "Weapon", rarity: "uncommon", value: 600, weight: 2.0, description: "Crafted by elven artisans." },
  { id: 7, name: "Mana Crystal", type: "Material", rarity: "rare", value: 1200, weight: 0.3, description: "Stores magical energy." },
  { id: 8, name: "Steel Gauntlets", type: "Armor", rarity: "uncommon", value: 350, weight: 4.0, description: "Heavy but protective." },
]

interface ItemsManagerProps {
  onOpenCanvas?: () => void
}

export function ItemsManager({ onOpenCanvas }: ItemsManagerProps = {}) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [formData, setFormData] = useState({ name: "", type: "", rarity: "common" as Item["rarity"], value: 0, weight: 0, description: "" })

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.type.toLowerCase().includes(search.toLowerCase())
  )

  const rarityColor = (rarity: Item["rarity"]) => {
    switch (rarity) {
      case "common": return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
      case "uncommon": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      case "rare": return "bg-blue-500/15 text-blue-400 border-blue-500/30"
      case "epic": return "bg-purple-500/15 text-purple-400 border-purple-500/30"
      case "legendary": return "bg-amber-500/15 text-amber-400 border-amber-500/30"
    }
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({ name: "", type: "", rarity: "common", value: 0, weight: 0, description: "" })
    setDialogOpen(true)
  }

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setFormData({ name: item.name, type: item.type, rarity: item.rarity, value: item.value, weight: item.weight, description: item.description })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (editingItem) {
      setItems(items.map((i) => (i.id === editingItem.id ? { ...i, ...formData } : i)))
    } else {
      setItems([...items, { id: Date.now(), ...formData }])
    }
    setDialogOpen(false)
  }

  const handleDelete = (id: number) => {
    setItems(items.filter((i) => i.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Items Manager</h1>
          <p className="text-sm text-muted-foreground">Manage weapons, armor, consumables, and materials</p>
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
                Create Item
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">{editingItem ? "Edit Item" : "Create New Item"}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex gap-4">
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Name</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Item name" />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Type</Label>
                    <Input value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} placeholder="Weapon, Armor..." />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Rarity</Label>
                    <Select value={formData.rarity} onValueChange={(v) => setFormData({ ...formData, rarity: v as Item["rarity"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="common">Common</SelectItem>
                        <SelectItem value="uncommon">Uncommon</SelectItem>
                        <SelectItem value="rare">Rare</SelectItem>
                        <SelectItem value="epic">Epic</SelectItem>
                        <SelectItem value="legendary">Legendary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Value (Gold)</Label>
                    <Input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Weight (kg)</Label>
                  <Input type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Item description..." rows={3} />
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
          <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Badge variant="outline" className="border-border text-muted-foreground">{filtered.length} Items</Badge>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Rarity</TableHead>
              <TableHead className="text-muted-foreground hidden sm:table-cell">Value</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Weight</TableHead>
              <TableHead className="text-muted-foreground w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id} className="border-border">
                <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                <TableCell className="text-muted-foreground">{item.type}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={rarityColor(item.rarity)}>{item.rarity}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">{item.value}g</TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">{item.weight}kg</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem onClick={() => handleEdit(item)} className="gap-2">
                        <Edit className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(item.id)} className="gap-2 text-destructive">
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
