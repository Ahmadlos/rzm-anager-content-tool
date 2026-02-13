"use client"

import { useState } from "react"
import {
  Database,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  MoreHorizontal,
  Search,
  Server,
  Lock,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DBConnection {
  id: string
  name: string
  host: string
  port: number
  database: string
  user: string
  driver: "mysql" | "postgresql" | "mssql"
  sshEnabled: boolean
  status: "connected" | "disconnected" | "error"
  lastTested: string
}

const initialConnections: DBConnection[] = [
  {
    id: "db-1",
    name: "Arcadia Production",
    host: "db.arcadia.game",
    port: 3306,
    database: "arcadia_prod",
    user: "rzmanager",
    driver: "mysql",
    sshEnabled: true,
    status: "connected",
    lastTested: "5 min ago",
  },
  {
    id: "db-2",
    name: "Staging Server",
    host: "staging-db.arcadia.game",
    port: 3306,
    database: "arcadia_staging",
    user: "rzmanager",
    driver: "mysql",
    sshEnabled: false,
    status: "connected",
    lastTested: "1 hour ago",
  },
  {
    id: "db-3",
    name: "Local Dev",
    host: "localhost",
    port: 3306,
    database: "arcadia_dev",
    user: "root",
    driver: "mysql",
    sshEnabled: false,
    status: "disconnected",
    lastTested: "3 days ago",
  },
]

const driverColors: Record<string, string> = {
  mysql: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  postgresql: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  mssql: "bg-red-500/10 text-red-400 border-red-500/20",
}

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  connected: { icon: CheckCircle, color: "text-emerald-400", label: "Connected" },
  disconnected: { icon: XCircle, color: "text-muted-foreground", label: "Disconnected" },
  error: { icon: XCircle, color: "text-destructive", label: "Error" },
}

export function DatabaseConnectionsView() {
  const [connections, setConnections] = useState<DBConnection[]>(initialConnections)
  const [search, setSearch] = useState("")
  const [testingId, setTestingId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formHost, setFormHost] = useState("")
  const [formPort, setFormPort] = useState("3306")
  const [formDB, setFormDB] = useState("")
  const [formUser, setFormUser] = useState("")
  const [formDriver, setFormDriver] = useState<string>("mysql")
  const [formSSH, setFormSSH] = useState(false)
  const [formSSHHost, setFormSSHHost] = useState("")
  const [formSSHPort, setFormSSHPort] = useState("22")
  const [formSSHUser, setFormSSHUser] = useState("")

  const filtered = connections.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.host.toLowerCase().includes(search.toLowerCase()) ||
      c.database.toLowerCase().includes(search.toLowerCase()),
  )

  const handleTestConnection = (id: string) => {
    setTestingId(id)
    setTimeout(() => {
      setConnections((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: "connected" as const, lastTested: "Just now" } : c,
        ),
      )
      setTestingId(null)
    }, 1500)
  }

  const handleDelete = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id))
  }

  const resetForm = () => {
    setFormName("")
    setFormHost("")
    setFormPort("3306")
    setFormDB("")
    setFormUser("")
    setFormDriver("mysql")
    setFormSSH(false)
    setFormSSHHost("")
    setFormSSHPort("22")
    setFormSSHUser("")
    setEditingId(null)
  }

  const openEdit = (conn: DBConnection) => {
    setFormName(conn.name)
    setFormHost(conn.host)
    setFormPort(String(conn.port))
    setFormDB(conn.database)
    setFormUser(conn.user)
    setFormDriver(conn.driver)
    setFormSSH(conn.sshEnabled)
    setEditingId(conn.id)
    setAddOpen(true)
  }

  const handleSave = () => {
    if (!formName.trim() || !formHost.trim()) return
    if (editingId) {
      setConnections((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
                ...c,
                name: formName.trim(),
                host: formHost.trim(),
                port: Number(formPort),
                database: formDB.trim(),
                user: formUser.trim(),
                driver: formDriver as DBConnection["driver"],
                sshEnabled: formSSH,
              }
            : c,
        ),
      )
    } else {
      const newConn: DBConnection = {
        id: `db-${Date.now()}`,
        name: formName.trim(),
        host: formHost.trim(),
        port: Number(formPort),
        database: formDB.trim(),
        user: formUser.trim(),
        driver: formDriver as DBConnection["driver"],
        sshEnabled: formSSH,
        status: "disconnected",
        lastTested: "Never",
      }
      setConnections((prev) => [...prev, newConn])
    }
    resetForm()
    setAddOpen(false)
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-foreground" />
            <h2 className="text-xl font-bold text-foreground">Database Connections</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage database profiles for your environments.
          </p>
        </div>
        <Dialog
          open={addOpen}
          onOpenChange={(open) => {
            setAddOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add Connection
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingId ? "Edit Connection" : "New Connection"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update the database connection settings."
                  : "Add a new database connection profile."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Connection Name</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Production Server"
                  className="h-9 text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label className="text-xs">Host</Label>
                  <Input
                    value={formHost}
                    onChange={(e) => setFormHost(e.target.value)}
                    placeholder="db.example.com"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Port</Label>
                  <Input
                    type="number"
                    value={formPort}
                    onChange={(e) => setFormPort(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Database</Label>
                  <Input
                    value={formDB}
                    onChange={(e) => setFormDB(e.target.value)}
                    placeholder="arcadia_db"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Username</Label>
                  <Input
                    value={formUser}
                    onChange={(e) => setFormUser(e.target.value)}
                    placeholder="root"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Driver</Label>
                <Select value={formDriver} onValueChange={setFormDriver}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="mysql" className="text-xs">MySQL</SelectItem>
                    <SelectItem value="postgresql" className="text-xs">PostgreSQL</SelectItem>
                    <SelectItem value="mssql" className="text-xs">MS SQL Server</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">SSH Tunnel</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Connect through an SSH tunnel
                  </p>
                </div>
                <Switch checked={formSSH} onCheckedChange={setFormSSH} />
              </div>
              {formSSH && (
                <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                  <div className="col-span-1 flex flex-col gap-1.5">
                    <Label className="text-[11px]">SSH Host</Label>
                    <Input
                      value={formSSHHost}
                      onChange={(e) => setFormSSHHost(e.target.value)}
                      placeholder="ssh.example.com"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px]">SSH Port</Label>
                    <Input
                      type="number"
                      value={formSSHPort}
                      onChange={(e) => setFormSSHPort(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px]">SSH User</Label>
                    <Input
                      value={formSSHUser}
                      onChange={(e) => setFormSSHUser(e.target.value)}
                      placeholder="admin"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetForm()
                  setAddOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!formName.trim() || !formHost.trim()}>
                {editingId ? "Save Changes" : "Add Connection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search connections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-9 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-260px)]">
        <div className="flex flex-col gap-3">
          {filtered.map((conn) => {
            const st = statusConfig[conn.status]
            const StatusIcon = st.icon
            return (
              <div
                key={conn.id}
                className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-muted-foreground/20"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{conn.name}</h3>
                      <Badge variant="outline" className={`text-[10px] ${driverColors[conn.driver]}`}>
                        {conn.driver.toUpperCase()}
                      </Badge>
                      {conn.sshEnabled && (
                        <Badge variant="outline" className="gap-1 border-border text-[10px] text-muted-foreground">
                          <Lock className="h-2.5 w-2.5" />
                          SSH
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {conn.user}@{conn.host}:{conn.port}/{conn.database}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px]">
                      <span className={`flex items-center gap-1 ${st.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {st.label}
                      </span>
                      <span className="text-muted-foreground">
                        Last tested: {conn.lastTested}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 bg-transparent text-xs"
                    onClick={() => handleTestConnection(conn.id)}
                    disabled={testingId === conn.id}
                  >
                    {testingId === conn.id ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Shield className="h-3 w-3" />
                        Test
                      </>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 border-border bg-card">
                      <DropdownMenuItem className="gap-2 text-xs" onClick={() => openEdit(conn)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2 text-xs text-destructive focus:text-destructive"
                        onClick={() => handleDelete(conn.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Server className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No connections found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
