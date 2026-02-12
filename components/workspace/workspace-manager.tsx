"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  Server,
  Shield,
  Lock,
  Unlock,
  Database,
  Fingerprint,
  AlertTriangle,
  ChevronRight,
  Radio,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  type Workspace,
  type DatabaseRole,
  type CloneOptions,
  DATABASE_ROLES,
  getAllWorkspaces,
  getWorkspace,
  saveWorkspace,
  deleteWorkspace,
  activateWorkspace,
  createWorkspace,
  cloneWorkspace,
  detectDatabasesByRole,
  generateFingerprint,
  validateSchema,
  requiresVersionLockConfirmation,
} from "@/lib/workspace-store"
import {
  type ServerProfile,
  getAllProfiles,
  testConnection,
  getProfile,
} from "@/lib/db-profiles"

// ---- Field helper ----

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="flex items-center gap-1 text-xs text-foreground">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

const ROLE_LABELS: Record<DatabaseRole, string> = {
  arcadia: "Arcadia",
  telecaster: "Telecaster",
  auth: "Auth",
  billing: "Billing",
}

const ROLE_COLORS: Record<DatabaseRole, string> = {
  arcadia: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  telecaster: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  auth: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  billing: "bg-rose-500/10 text-rose-400 border-rose-500/20",
}

// ---- Clone Dialog ----

function CloneDialog({
  source,
  profiles,
  onClone,
  onCancel,
}: {
  source: Workspace
  profiles: ServerProfile[]
  onClone: (opts: CloneOptions) => void
  onCancel: () => void
}) {
  const [newName, setNewName] = useState(`${source.name} (Copy)`)
  const [newProfileId, setNewProfileId] = useState<string>("")
  const [keepDbs, setKeepDbs] = useState(true)
  const [copyFp, setCopyFp] = useState(true)
  const [resetLock, setResetLock] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Clone Workspace</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              From: {source.name}
            </p>
          </div>
          <Copy className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex flex-col gap-4 p-5">
          <Field label="New Workspace Name" htmlFor="clone-name" required>
            <Input
              id="clone-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-8 text-xs"
            />
          </Field>

          <Field label="Select New Profile (optional)" hint="Leave blank to keep the same profile">
            <Select value={newProfileId} onValueChange={setNewProfileId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Same as source..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="same" className="text-xs">Same as source</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.name} ({p.host}:{p.port})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground">Keep Database Versions</p>
              <p className="text-[10px] text-muted-foreground">Copy existing database selections</p>
            </div>
            <Switch checked={keepDbs} onCheckedChange={setKeepDbs} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground">Copy Schema Fingerprint</p>
              <p className="text-[10px] text-muted-foreground">Reuse the stored schema hash</p>
            </div>
            <Switch checked={copyFp} onCheckedChange={setCopyFp} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground">Reset Version Lock</p>
              <p className="text-[10px] text-muted-foreground">Force version lock back to enabled</p>
            </div>
            <Switch checked={resetLock} onCheckedChange={setResetLock} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <Button variant="outline" size="sm" className="bg-transparent text-xs" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            disabled={!newName.trim()}
            onClick={() =>
              onClone({
                newName: newName.trim(),
                newProfileId: newProfileId && newProfileId !== "same" ? newProfileId : undefined,
                keepDatabaseVersions: keepDbs,
                copyFingerprint: copyFp,
                resetVersionLock: resetLock,
              })
            }
          >
            <Copy className="h-3 w-3" /> Clone
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---- Version Lock Confirmation ----

function VersionLockConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Version Lock Active</h2>
            <p className="text-[11px] text-muted-foreground">
              Changing databases will close all environments and clear cache.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3">
          <Button variant="outline" size="sm" className="bg-transparent text-xs" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" className="text-xs" onClick={onConfirm}>
            Confirm Change
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---- Delete Confirmation ----

function DeleteConfirmDialog({
  workspaceName,
  onConfirm,
  onCancel,
}: {
  workspaceName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
            <Trash2 className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Delete Workspace</h2>
            <p className="text-[11px] text-muted-foreground">
              Permanently delete &ldquo;{workspaceName}&rdquo;? Server profiles will not be affected.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3">
          <Button variant="outline" size="sm" className="bg-transparent text-xs" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-destructive text-xs text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            <Trash2 className="h-3 w-3" /> Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Main Component
// ============================================================

interface WorkspaceManagerProps {
  onBack: () => void
  onOpenConnectionManager: () => void
}

export function WorkspaceManager({ onBack, onOpenConnectionManager }: WorkspaceManagerProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<ServerProfile[]>([])
  const [detectedDbs, setDetectedDbs] = useState<Record<string, string[]>>({})
  const [isTesting, setIsTesting] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)
  const [showClone, setShowClone] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showVersionLock, setShowVersionLock] = useState(false)
  const [pendingDbChange, setPendingDbChange] = useState<{ role: DatabaseRole; value: string } | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newProfileId, setNewProfileId] = useState("")

  // --- load ---
  const reload = useCallback(() => {
    const all = getAllWorkspaces()
    setWorkspaces(all)
    setProfiles(getAllProfiles())
    return all
  }, [])

  useEffect(() => {
    const all = reload()
    if (all.length > 0 && !selectedId) {
      const active = all.find((w) => w.active)
      setSelectedId(active?.id ?? all[0].id)
    }
  }, [reload, selectedId])

  const selected = useMemo(
    () => workspaces.find((w) => w.id === selectedId) ?? null,
    [workspaces, selectedId],
  )

  const boundProfile = useMemo(
    () => (selected ? profiles.find((p) => p.id === selected.profileId) : null),
    [selected, profiles],
  )

  // --- handlers ---

  const handleActivate = (id: string) => {
    activateWorkspace(id)
    reload()
  }

  const handleCreate = () => {
    if (!newName.trim() || !newProfileId) return
    const ws = createWorkspace(newName.trim(), newProfileId)
    activateWorkspace(ws.id)
    reload()
    setSelectedId(ws.id)
    setIsCreating(false)
    setNewName("")
    setNewProfileId("")
  }

  const handleDelete = () => {
    if (!selected) return
    deleteWorkspace(selected.id)
    const all = reload()
    setSelectedId(all.length > 0 ? all[0].id : null)
    setShowDelete(false)
  }

  const handleClone = (opts: CloneOptions) => {
    if (!selected) return
    const cloned = cloneWorkspace(selected.id, opts)
    if (cloned) {
      reload()
      setSelectedId(cloned.id)
    }
    setShowClone(false)
  }

  const handleDbChange = (role: DatabaseRole, value: string) => {
    if (!selected) return
    if (requiresVersionLockConfirmation(selected) && (role === "arcadia" || role === "telecaster")) {
      setPendingDbChange({ role, value })
      setShowVersionLock(true)
      return
    }
    applyDbChange(role, value)
  }

  const applyDbChange = (role: DatabaseRole, value: string) => {
    if (!selected) return
    const updated = {
      ...selected,
      databases: { ...selected.databases, [role]: value || null },
    }
    saveWorkspace(updated)
    reload()
  }

  const handleVersionLockConfirm = () => {
    if (pendingDbChange) {
      applyDbChange(pendingDbChange.role, pendingDbChange.value)
    }
    setPendingDbChange(null)
    setShowVersionLock(false)
  }

  const handleToggleVersionLock = (enabled: boolean) => {
    if (!selected) return
    saveWorkspace({ ...selected, versionLockEnabled: enabled })
    reload()
  }

  const handleTestAndDetect = async () => {
    if (!boundProfile) return
    setIsTesting(true)
    setTestError(null)
    try {
      const result = await testConnection(boundProfile)
      if (result.success && result.databases) {
        const detected = detectDatabasesByRole(result.databases)
        setDetectedDbs(detected)
      } else {
        setTestError(result.error ?? "Connection failed")
      }
    } finally {
      setIsTesting(false)
    }
  }

  const handleGenerateFingerprint = () => {
    if (!selected) return
    const validation = validateSchema()
    if (!validation.valid) return
    const fp = generateFingerprint()
    saveWorkspace({ ...selected, schemaFingerprint: fp })
    reload()
  }

  // Get detected options for a role
  const getDbOptions = (role: DatabaseRole): string[] => {
    const detected = detectedDbs[role] ?? []
    const current = selected?.databases[role]
    if (current && !detected.includes(current)) {
      return [current, ...detected]
    }
    return detected
  }

  // No workspaces at all -- empty state
  if (workspaces.length === 0 && !isCreating) {
    return (
      <TooltipProvider>
        <div className="flex h-screen flex-col bg-background">
          <header className="flex h-12 items-center gap-3 border-b border-border px-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-5 w-px bg-border" />
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-sm font-semibold text-foreground">Workspace Manager</h1>
          </header>
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card">
              <FolderOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No workspaces configured</p>
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => setIsCreating(true)}>
              <Plus className="h-3 w-3" /> New Workspace
            </Button>
          </div>
        </div>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
        {/* Header */}
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onBack}>
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
              <FolderOpen className="h-3.5 w-3.5 text-foreground" />
            </div>
            <h1 className="text-sm font-semibold text-foreground">Workspace Manager</h1>
          </div>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 bg-transparent text-xs"
            onClick={onOpenConnectionManager}
          >
            <Server className="h-3 w-3" /> Profiles
          </Button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel: workspace list */}
          <div className="flex w-64 shrink-0 flex-col border-r border-border bg-card/50">
            <div className="flex items-center justify-between px-3 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Workspaces
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsCreating(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="border-border bg-card text-foreground">
                  <span className="text-xs">New Workspace</span>
                </TooltipContent>
              </Tooltip>
            </div>

            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-0.5 px-2 pb-2">
                {workspaces.map((ws) => {
                  const isSelected = ws.id === selectedId
                  const profile = profiles.find((p) => p.id === ws.profileId)
                  return (
                    <button
                      key={ws.id}
                      onClick={() => setSelectedId(ws.id)}
                      className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                        <FolderOpen className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-xs font-medium">{ws.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {profile?.name ?? "No profile"}
                        </p>
                      </div>
                      {ws.active && (
                        <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                      )}
                      <ChevronRight className={`h-3 w-3 shrink-0 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`} />
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Right panel */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {isCreating ? (
              /* --- Create new workspace form --- */
              <div className="flex flex-1 flex-col">
                <ScrollArea className="flex-1">
                  <div className="mx-auto max-w-lg p-6">
                    <h2 className="text-sm font-semibold text-foreground">Create New Workspace</h2>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      A workspace represents one Rappelz Server Project. It must be bound to a server profile.
                    </p>

                    <div className="mt-6 flex flex-col gap-4">
                      <Field label="Workspace Name" htmlFor="ws-name" required>
                        <Input
                          id="ws-name"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="My Server Project"
                          className="h-8 text-xs"
                        />
                      </Field>

                      <Field label="Bind Server Profile" required hint="Profile binding cannot change after creation.">
                        <Select value={newProfileId} onValueChange={setNewProfileId}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select a profile..." />
                          </SelectTrigger>
                          <SelectContent>
                            {profiles.map((p) => (
                              <SelectItem key={p.id} value={p.id} className="text-xs">
                                {p.name} ({p.host}:{p.port})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {profiles.length === 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 gap-1.5 bg-transparent text-xs"
                            onClick={onOpenConnectionManager}
                          >
                            <Plus className="h-3 w-3" /> Create Profile First
                          </Button>
                        )}
                      </Field>
                    </div>
                  </div>
                </ScrollArea>

                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3">
                  <Button variant="outline" size="sm" className="bg-transparent text-xs" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs"
                    disabled={!newName.trim() || !newProfileId}
                    onClick={handleCreate}
                  >
                    <Plus className="h-3 w-3" /> Create Workspace
                  </Button>
                </div>
              </div>
            ) : selected ? (
              /* --- Edit existing workspace --- */
              <div className="flex flex-1 flex-col overflow-hidden">
                <ScrollArea className="flex-1">
                  <div className="p-5">
                    {/* Workspace name + Active badge */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-sm font-semibold text-foreground">{selected.name}</h2>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Created {new Date(selected.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {selected.active ? (
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-400">
                          Active
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 bg-transparent text-xs"
                          onClick={() => handleActivate(selected.id)}
                        >
                          <Radio className="h-3 w-3" /> Set Active
                        </Button>
                      )}
                    </div>

                    <Separator className="my-4" />

                    {/* Bound Profile (read-only) */}
                    <div className="rounded-lg border border-border bg-secondary/30 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background">
                          <Server className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-foreground">
                            {boundProfile?.name ?? "Unknown Profile"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {boundProfile ? `${boundProfile.host}:${boundProfile.port}` : "Profile not found"}
                            {boundProfile?.serverType && (
                              <span className="ml-2 capitalize">[{boundProfile.serverType}]</span>
                            )}
                          </p>
                        </div>
                        {boundProfile?.sshEnabled && (
                          <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                            SSH
                          </Badge>
                        )}
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        Profile binding is immutable after workspace creation.
                      </p>
                    </div>

                    <Separator className="my-4" />

                    {/* Database Selection */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-foreground">Database Mappings</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            Select one database per role. Test connection to auto-detect available databases.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 bg-transparent text-xs"
                          onClick={handleTestAndDetect}
                          disabled={isTesting || !boundProfile}
                        >
                          {isTesting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Database className="h-3 w-3" />
                          )}
                          Detect Databases
                        </Button>
                      </div>

                      {testError && (
                        <div className="mt-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                          <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                          <p className="text-[11px] text-destructive">{testError}</p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-col gap-3">
                        {DATABASE_ROLES.map((role) => {
                          const options = getDbOptions(role)
                          const current = selected.databases[role]
                          return (
                            <div key={role} className="flex items-center gap-3">
                              <div className={`flex h-8 items-center rounded-md border px-2.5 ${ROLE_COLORS[role]}`}>
                                <span className="text-[10px] font-semibold uppercase tracking-wider">
                                  {ROLE_LABELS[role]}
                                </span>
                              </div>
                              <div className="flex-1">
                                <Select
                                  value={current ?? ""}
                                  onValueChange={(v) => handleDbChange(role, v)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder={`Select ${ROLE_LABELS[role]} database...`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {options.length === 0 && (
                                      <div className="px-2 py-1.5 text-[10px] text-muted-foreground">
                                        Run Detect Databases first
                                      </div>
                                    )}
                                    {options.map((db) => (
                                      <SelectItem key={db} value={db} className="text-xs">
                                        {db}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {current && (
                                <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Show detected databases summary */}
                      {Object.keys(detectedDbs).length > 0 && (
                        <div className="mt-4 rounded-lg border border-border bg-secondary/30 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Detected Databases
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {DATABASE_ROLES.map((role) =>
                              (detectedDbs[role] ?? []).map((db) => (
                                <Badge
                                  key={db}
                                  variant="outline"
                                  className={`border text-[10px] ${ROLE_COLORS[role]}`}
                                >
                                  {db}
                                </Badge>
                              )),
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator className="my-4" />

                    {/* Version Lock */}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background">
                          {selected.versionLockEnabled ? (
                            <Lock className="h-4 w-4 text-amber-400" />
                          ) : (
                            <Unlock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">Version Lock</p>
                          <p className="text-[10px] text-muted-foreground">
                            {selected.versionLockEnabled
                              ? "Changing core databases requires confirmation"
                              : "Databases can be changed freely"}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={selected.versionLockEnabled}
                        onCheckedChange={handleToggleVersionLock}
                      />
                    </div>

                    <Separator className="my-4" />

                    {/* Schema Fingerprint */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Fingerprint className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs font-medium text-foreground">Schema Fingerprint</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 bg-transparent text-xs"
                          onClick={handleGenerateFingerprint}
                        >
                          <Fingerprint className="h-3 w-3" />
                          {selected.schemaFingerprint ? "Regenerate" : "Generate"}
                        </Button>
                      </div>
                      {selected.schemaFingerprint ? (
                        <div className="mt-3 rounded-lg border border-border bg-secondary/30 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <p className="font-mono text-[11px] text-foreground">
                                {selected.schemaFingerprint.hash}
                              </p>
                              <p className="mt-0.5 text-[10px] text-muted-foreground">
                                Generated {new Date(selected.schemaFingerprint.generatedAt).toLocaleString()}
                              </p>
                            </div>
                            <Shield className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {selected.schemaFingerprint.tables.map((t) => (
                              <Badge key={t} variant="outline" className="border-border text-[9px] text-muted-foreground">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-4 py-3">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                          <p className="text-[11px] text-muted-foreground">
                            No fingerprint generated. Select databases and generate to enable export validation.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>

                {/* Bottom action bar */}
                <div className="flex shrink-0 items-center justify-between border-t border-border px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 bg-transparent text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setShowDelete(true)}
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 bg-transparent text-xs"
                      onClick={() => setShowClone(true)}
                    >
                      <Copy className="h-3 w-3" /> Clone
                    </Button>
                    {!selected.active && (
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => handleActivate(selected.id)}
                      >
                        <Radio className="h-3 w-3" /> Activate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-muted-foreground">Select a workspace</p>
              </div>
            )}
          </div>
        </div>

        {/* Dialogs */}
        {showClone && selected && (
          <CloneDialog
            source={selected}
            profiles={profiles}
            onClone={handleClone}
            onCancel={() => setShowClone(false)}
          />
        )}
        {showDelete && selected && (
          <DeleteConfirmDialog
            workspaceName={selected.name}
            onConfirm={handleDelete}
            onCancel={() => setShowDelete(false)}
          />
        )}
        {showVersionLock && (
          <VersionLockConfirmDialog
            onConfirm={handleVersionLockConfirm}
            onCancel={() => {
              setShowVersionLock(false)
              setPendingDbChange(null)
            }}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
