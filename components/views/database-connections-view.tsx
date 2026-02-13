"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Database,
  Plus,
  Pencil,
  Trash2,
  Plug,
  MoreHorizontal,
  ShieldCheck,
  Wifi,
  WifiOff,
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

interface DBConnection {
  id: string
  name: string
  host: string
  port: number
  database: string
  user: string
  ssl: boolean
  ssh: boolean
  status: "connected" | "disconnected" | "error"
  lastUsed: string
}

const mockConnections: DBConnection[] = [
  {
    id: "db-1",
    name: "Production - Arcadia",
    host: "db.arcadia-prod.internal",
    port: 5432,
    database: "arcadia_game",
    user: "rzmanager_prod",
    ssl: true,
    ssh: true,
    status: "connected",
    lastUsed: "Active now",
  },
  {
    id: "db-2",
    name: "Staging - Arcadia",
    host: "db.arcadia-staging.internal",
    port: 5432,
    database: "arcadia_staging",
    user: "rzmanager_stage",
    ssl: true,
    ssh: false,
    status: "connected",
    lastUsed: "1 hour ago",
  },
  {
    id: "db-3",
    name: "Development Local",
    host: "localhost",
    port: 5432,
    database: "arcadia_dev",
    user: "dev_user",
    ssl: false,
    ssh: false,
    status: "disconnected",
    lastUsed: "2 days ago",
  },
  {
    id: "db-4",
    name: "QA Environment",
    host: "db.arcadia-qa.internal",
    port: 5432,
    database: "arcadia_qa",
    user: "qa_user",
    ssl: true,
    ssh: true,
    status: "error",
    lastUsed: "5 days ago",
  },
]

const statusConfig = {
  connected: { label: "Connected", badgeClass: "border-emerald-500/30 text-emerald-400", Icon: Wifi },
  disconnected: { label: "Disconnected", badgeClass: "border-muted-foreground/30 text-muted-foreground", Icon: WifiOff },
  error: { label: "Error", badgeClass: "border-destructive/30 text-destructive", Icon: WifiOff },
} as const

interface DatabaseConnectionsViewProps {
  onBack: () => void
}

export function DatabaseConnectionsView({ onBack }: DatabaseConnectionsViewProps) {
  const [connections, setConnections] = useState(mockConnections)
  const [search, setSearch] = useState("")

  const filtered = connections.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.host.toLowerCase().includes(search.toLowerCase()),
  )

  const handleTestConnection = (id: string) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: "connected" as const, lastUsed: "Just now" } : c,
      ),
    )
  }

  const handleDelete = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id))
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
              <Database className="h-3.5 w-3.5 text-foreground" />
            </div>
            <h1 className="text-sm font-semibold text-foreground">Database Connections</h1>
          </div>

          <div className="flex-1" />

          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3 w-3" />
            Add Connection
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6">
              <h2 className="text-balance text-lg font-bold text-foreground">
                Database Profiles
              </h2>
              <p className="mt-1 text-pretty text-xs text-muted-foreground">
                Manage database connection profiles used by workspaces for reading and writing game schema data.
              </p>
            </div>

            <div className="mb-4">
              <Input
                placeholder="Filter connections..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 max-w-xs text-xs"
              />
            </div>

            <div className="flex flex-col gap-3">
              {filtered.map((conn) => {
                const cfg = statusConfig[conn.status]
                return (
                  <div
                    key={conn.id}
                    className="group flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-muted-foreground/30"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-foreground">
                          {conn.name}
                        </h3>
                        <Badge variant="outline" className={`text-[10px] ${cfg.badgeClass}`}>
                          <cfg.Icon className="mr-1 h-2.5 w-2.5" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {conn.user}@{conn.host}:{conn.port}/{conn.database}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                        {conn.ssl && (
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-emerald-400/70" />
                            SSL
                          </span>
                        )}
                        {conn.ssh && (
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-cyan-400/70" />
                            SSH Tunnel
                          </span>
                        )}
                        <span>{conn.lastUsed}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 bg-transparent text-xs"
                        onClick={() => handleTestConnection(conn.id)}
                      >
                        <Plug className="h-3 w-3" />
                        Test
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 border-border bg-card">
                          <DropdownMenuItem className="gap-2 text-xs">
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
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
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
                  <Database className="mb-2 h-6 w-6 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">No connections found</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
