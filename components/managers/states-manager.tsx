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
import { Textarea } from "@/components/ui/textarea"

interface StateEntity {
  id: number
  name: string
  tooltip: string
  values: number[]
  description: string
}

const initialStates: StateEntity[] = [
  {
    id: 1,
    name: "Burning",
    tooltip: "Takes fire damage over time",
    values: [10, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    description: "Deals fire damage every second for 3 seconds.",
  },
  {
    id: 2,
    name: "Frozen",
    tooltip: "Movement speed reduced",
    values: [0, 5, -50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    description: "Reduces movement speed by 50% for 5 seconds.",
  },
  {
    id: 3,
    name: "Blessed",
    tooltip: "Increased defense",
    values: [0, 10, 0, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    description: "Increases defense by 25 for 10 seconds.",
  },
  {
    id: 4,
    name: "Poisoned",
    tooltip: "Takes poison damage",
    values: [5, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    description: "Deals 5 poison damage every second for 8 seconds.",
  },
  {
    id: 5,
    name: "Haste",
    tooltip: "Movement and attack speed increased",
    values: [0, 6, 30, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    description: "Increases movement speed by 30% and attack speed by 20% for 6 seconds.",
  },
]

interface StatesManagerProps {
  onOpenCanvas: () => void
}

export function StatesManager({ onOpenCanvas }: StatesManagerProps) {
  const [states, setStates] = useState<StateEntity[]>(initialStates)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingState, setEditingState] = useState<StateEntity | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    tooltip: "",
    description: "",
    values: new Array(20).fill(0) as number[],
  })

  const filtered = states.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.tooltip.toLowerCase().includes(search.toLowerCase()),
  )

  const handleAdd = () => {
    setEditingState(null)
    setFormData({ name: "", tooltip: "", description: "", values: new Array(20).fill(0) })
    setDialogOpen(true)
  }

  const handleEdit = (state: StateEntity) => {
    setEditingState(state)
    setFormData({
      name: state.name,
      tooltip: state.tooltip,
      description: state.description,
      values: [...state.values],
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (editingState) {
      setStates(
        states.map((s) => (s.id === editingState.id ? { ...s, ...formData } : s)),
      )
    } else {
      setStates([...states, { id: Date.now(), ...formData }])
    }
    setDialogOpen(false)
  }

  const handleDelete = (id: number) => {
    setStates(states.filter((s) => s.id !== id))
  }

  const activeValues = (vals: number[]) => vals.filter((v) => v !== 0).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">State Manager</h1>
          <p className="text-sm text-muted-foreground">
            Define buffs, debuffs, and state effects (StateResource)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onOpenCanvas}
            variant="outline"
            className="gap-1.5 bg-transparent text-xs"
          >
            <GitBranch className="h-3.5 w-3.5" />
            Open Node Editor
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={handleAdd}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create State
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg border-border bg-card">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingState ? "Edit State" : "Create New State"}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex gap-4">
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="State name"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Tooltip</Label>
                    <Input
                      value={formData.tooltip}
                      onChange={(e) =>
                        setFormData({ ...formData, tooltip: e.target.value })
                      }
                      placeholder="Short tooltip"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="State description..."
                    rows={2}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>
                    Values (value_0 .. value_19)
                  </Label>
                  <div className="grid grid-cols-5 gap-2">
                    {formData.values.slice(0, 10).map((v, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground">v_{i}</span>
                        <Input
                          type="number"
                          value={v}
                          onChange={(e) => {
                            const newVals = [...formData.values]
                            newVals[i] = Number(e.target.value)
                            setFormData({ ...formData, values: newVals })
                          }}
                          className="h-7 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="bg-transparent">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleSave}
                  className="bg-primary text-primary-foreground"
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search states..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline" className="border-border text-muted-foreground">
          {filtered.length} States
        </Badge>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Tooltip</TableHead>
              <TableHead className="text-muted-foreground hidden sm:table-cell">
                Active Values
              </TableHead>
              <TableHead className="w-12 text-muted-foreground" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((state) => (
              <TableRow key={state.id} className="border-border">
                <TableCell className="font-medium text-foreground">
                  {state.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {state.tooltip}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  <Badge
                    variant="outline"
                    className="border-rose-500/30 bg-rose-500/15 text-rose-400"
                  >
                    {activeValues(state.values)} / 20
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="border-border bg-card"
                    >
                      <DropdownMenuItem
                        onClick={() => handleEdit(state)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(state.id)}
                        className="gap-2 text-destructive"
                      >
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
