"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Database,
  Plus,
  Trash2,
  Server,
  Shield,
  Plug,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  Terminal,
  KeyRound,
  Network,
  HardDrive,
  AlertTriangle,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  type ServerProfile,
  type AuthType,
  type SSHAuthMethod,
  type GameDatabase,
  type ConnectionTestResult,
  GAME_DBS,
  getAllProfiles,
  saveProfile,
  deleteProfile as deleteProfileFromStore,
  createDefaultProfile,
  testConnection,
  obfuscate,
  deobfuscate,
} from "@/lib/db-profiles"

// ----- Sub-component: Password input with reveal toggle -----

function PasswordInput({
  value,
  onChange,
  placeholder,
  id,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  id?: string
  disabled?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-8 pr-9 text-xs"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

// ----- Field helper -----

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

// ----- Validation -----

interface ValidationErrors {
  [field: string]: string
}

function validateProfile(p: ServerProfile): ValidationErrors {
  const e: ValidationErrors = {}
  if (!p.name.trim()) e.name = "Profile name is required"
  if (!p.host.trim()) e.host = "Host is required"
  if (!p.port || p.port < 1 || p.port > 65535) e.port = "Port must be 1-65535"
  if (!p.defaultDatabase.trim()) e.defaultDatabase = "Default database is required"
  if (p.authType === "sql") {
    if (!p.username.trim()) e.username = "Username is required for SQL Auth"
    if (!p.password) e.password = "Password is required for SQL Auth"
  }
  if (p.sshEnabled) {
    if (!p.sshHost.trim()) e.sshHost = "SSH Host is required"
    if (!p.sshUsername.trim()) e.sshUsername = "SSH Username is required"
    if (p.sshAuthMethod === "key" && !p.sshPrivateKeyPath.trim())
      e.sshPrivateKeyPath = "Private key path is required"
    if (p.sshAuthMethod === "password" && !p.sshPassword)
      e.sshPassword = "SSH password is required"
  }
  return e
}

// ============================================================
// Main component
// ============================================================

interface ConnectionManagerProps {
  onBack: () => void
}

export function ConnectionManager({ onBack }: ConnectionManagerProps) {
  // --- state ---
  const [profiles, setProfiles] = useState<ServerProfile[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ServerProfile | null>(null)
  const [dirty, setDirty] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [fetchedDatabases, setFetchedDatabases] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("general")

  // --- load profiles ---
  const reloadProfiles = useCallback(() => {
    const all = getAllProfiles()
    setProfiles(all)
    return all
  }, [])

  useEffect(() => {
    const all = reloadProfiles()
    if (all.length > 0 && !selectedId) {
      setSelectedId(all[0].id)
    }
  }, [reloadProfiles, selectedId])

  // When selection changes, load profile into draft
  useEffect(() => {
    if (!selectedId) {
      setDraft(null)
      return
    }
    const found = profiles.find((p) => p.id === selectedId)
    if (found) {
      setDraft({ ...found, password: deobfuscate(found.password), sshPassword: deobfuscate(found.sshPassword), sshPassphrase: deobfuscate(found.sshPassphrase) })
      setDirty(false)
      setErrors({})
      setTestResult(null)
      setFetchedDatabases([])
    }
  }, [selectedId, profiles])

  // --- handlers ---
  const updateDraft = useCallback(
    <K extends keyof ServerProfile>(key: K, value: ServerProfile[K]) => {
      setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
      setDirty(true)
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key as string]
        return next
      })
    },
    [],
  )

  const updateDbMap = useCallback((db: GameDatabase, value: string) => {
    setDraft((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        databaseMap: { ...prev.databaseMap, [db]: value },
      }
    })
    setDirty(true)
  }, [])

  const handleNewProfile = () => {
    const np = createDefaultProfile()
    saveProfile({ ...np, password: obfuscate(""), sshPassword: obfuscate(""), sshPassphrase: obfuscate("") })
    const all = reloadProfiles()
    setSelectedId(np.id)
    setActiveTab("general")
    // Find the new profile in the reloaded list
    const found = all.find((p) => p.id === np.id)
    if (found) {
      setDraft({ ...found, password: "", sshPassword: "", sshPassphrase: "" })
    }
    setDirty(true)
  }

  const handleDeleteProfile = () => {
    if (!selectedId) return
    deleteProfileFromStore(selectedId)
    const all = reloadProfiles()
    setSelectedId(all.length > 0 ? all[0].id : null)
  }

  const handleSave = () => {
    if (!draft) return
    const errs = validateProfile(draft)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      // Switch to tab with first error
      const generalFields = ["name", "host", "port", "defaultDatabase", "username", "password"]
      const sshFields = ["sshHost", "sshUsername", "sshPassword", "sshPrivateKeyPath"]
      const firstKey = Object.keys(errs)[0]
      if (generalFields.includes(firstKey)) setActiveTab("general")
      else if (sshFields.includes(firstKey)) setActiveTab("ssh")
      return
    }
    const toSave: ServerProfile = {
      ...draft,
      password: obfuscate(draft.password),
      sshPassword: obfuscate(draft.sshPassword),
      sshPassphrase: obfuscate(draft.sshPassphrase),
    }
    saveProfile(toSave)
    reloadProfiles()
    setDirty(false)
    setErrors({})
  }

  const handleCancel = () => {
    if (!selectedId) return
    // Reload from store
    const found = profiles.find((p) => p.id === selectedId)
    if (found) {
      setDraft({ ...found, password: deobfuscate(found.password), sshPassword: deobfuscate(found.sshPassword), sshPassphrase: deobfuscate(found.sshPassphrase) })
    }
    setDirty(false)
    setErrors({})
  }

  const handleTestConnection = async () => {
    if (!draft) return
    setIsTesting(true)
    setTestResult(null)
    try {
      const profileForTest: ServerProfile = {
        ...draft,
        password: obfuscate(draft.password),
        sshPassword: obfuscate(draft.sshPassword),
        sshPassphrase: obfuscate(draft.sshPassphrase),
      }
      const result = await testConnection(profileForTest)
      setTestResult(result)
      if (result.success && result.databases) {
        setFetchedDatabases(result.databases)
      }
      // Update last tested
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              lastTestedAt: new Date().toISOString(),
              lastTestSuccess: result.success,
            }
          : prev,
      )
      setDirty(true)
    } finally {
      setIsTesting(false)
    }
  }

  // Database options for mapping dropdowns
  const dbOptions = useMemo(() => {
    if (fetchedDatabases.length > 0) return fetchedDatabases
    // Fallback defaults
    return ["arcadia", "auth", "BILLING", "Telecaster", "master", "tempdb", "msdb", "model"]
  }, [fetchedDatabases])

  if (!draft) {
    // No profiles at all
    return (
      <TooltipProvider>
        <div className="flex h-screen flex-col bg-background">
          <header className="flex h-12 items-center gap-3 border-b border-border px-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-5 w-px bg-border" />
            <Database className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-sm font-semibold text-foreground">Connection Manager</h1>
          </header>
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card">
              <Server className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No server profiles configured</p>
            <Button size="sm" className="gap-1.5 text-xs" onClick={handleNewProfile}>
              <Plus className="h-3 w-3" /> New Profile
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
              <Database className="h-3.5 w-3.5 text-foreground" />
            </div>
            <h1 className="text-sm font-semibold text-foreground">Connection Manager</h1>
          </div>
          <div className="flex-1" />
          {dirty && (
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-400">
              Unsaved Changes
            </Badge>
          )}
        </header>

        {/* Body: left panel + right panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Profile list */}
          <div className="flex w-64 shrink-0 flex-col border-r border-border bg-card/50">
            <div className="flex items-center justify-between px-3 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Profiles
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleNewProfile}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="border-border bg-card text-foreground">
                  <span className="text-xs">New Profile</span>
                </TooltipContent>
              </Tooltip>
            </div>

            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-0.5 px-2 pb-2">
                {profiles.map((p) => {
                  const isSelected = p.id === selectedId
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                        <Server className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-xs font-medium">{p.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {p.host}:{p.port}
                        </p>
                      </div>
                      {p.lastTestSuccess === true && (
                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      )}
                      {p.lastTestSuccess === false && (
                        <div className="h-2 w-2 rounded-full bg-destructive" />
                      )}
                      <ChevronRight className={`h-3 w-3 shrink-0 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`} />
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Tabbed settings */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
              <div className="shrink-0 border-b border-border px-4">
                <TabsList className="h-10 bg-transparent p-0">
                  <TabsTrigger value="general" className="gap-1.5 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none">
                    <Server className="h-3 w-3" /> General
                  </TabsTrigger>
                  <TabsTrigger value="databases" className="gap-1.5 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none">
                    <HardDrive className="h-3 w-3" /> Databases
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="gap-1.5 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none">
                    <Shield className="h-3 w-3" /> Advanced
                  </TabsTrigger>
                  <TabsTrigger value="ssh" className="gap-1.5 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none">
                    <Terminal className="h-3 w-3" /> SSH
                    {draft.sshEnabled && (
                      <div className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-5">
                  {/* ---- General Tab ---- */}
                  <TabsContent value="general" className="mt-0">
                    <div className="flex flex-col gap-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Field label="Profile Name" htmlFor="prof-name" required>
                            <Input
                              id="prof-name"
                              value={draft.name}
                              onChange={(e) => updateDraft("name", e.target.value)}
                              className={`h-8 text-xs ${errors.name ? "border-destructive" : ""}`}
                            />
                            {errors.name && <p className="text-[10px] text-destructive">{errors.name}</p>}
                          </Field>
                        </div>

                        <Field label="Host" htmlFor="prof-host" required>
                          <Input
                            id="prof-host"
                            value={draft.host}
                            onChange={(e) => updateDraft("host", e.target.value)}
                            placeholder="127.0.0.1 or hostname"
                            className={`h-8 text-xs ${errors.host ? "border-destructive" : ""}`}
                          />
                          {errors.host && <p className="text-[10px] text-destructive">{errors.host}</p>}
                        </Field>

                        <Field label="Port" htmlFor="prof-port" required>
                          <Input
                            id="prof-port"
                            type="number"
                            value={draft.port}
                            onChange={(e) => updateDraft("port", Number(e.target.value))}
                            className={`h-8 text-xs ${errors.port ? "border-destructive" : ""}`}
                          />
                          {errors.port && <p className="text-[10px] text-destructive">{errors.port}</p>}
                        </Field>

                        <div className="col-span-2">
                          <Field label="Default Database" htmlFor="prof-db" required>
                            <Input
                              id="prof-db"
                              value={draft.defaultDatabase}
                              onChange={(e) => updateDraft("defaultDatabase", e.target.value)}
                              className={`h-8 text-xs ${errors.defaultDatabase ? "border-destructive" : ""}`}
                            />
                            {errors.defaultDatabase && <p className="text-[10px] text-destructive">{errors.defaultDatabase}</p>}
                          </Field>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex flex-col gap-4">
                        <Field label="Authentication Type">
                          <Select
                            value={draft.authType}
                            onValueChange={(v) => updateDraft("authType", v as AuthType)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="windows" className="text-xs">
                                Windows Authentication
                              </SelectItem>
                              <SelectItem value="sql" className="text-xs">
                                SQL Server Authentication
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>

                        {draft.authType === "sql" && (
                          <>
                            <Field label="Username" htmlFor="prof-user" required>
                              <Input
                                id="prof-user"
                                value={draft.username}
                                onChange={(e) => updateDraft("username", e.target.value)}
                                placeholder="sa"
                                className={`h-8 text-xs ${errors.username ? "border-destructive" : ""}`}
                              />
                              {errors.username && <p className="text-[10px] text-destructive">{errors.username}</p>}
                            </Field>
                            <Field label="Password" htmlFor="prof-pass" required>
                              <PasswordInput
                                id="prof-pass"
                                value={draft.password}
                                onChange={(v) => updateDraft("password", v)}
                                placeholder="Enter password"
                              />
                              {errors.password && <p className="text-[10px] text-destructive">{errors.password}</p>}
                            </Field>
                          </>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* ---- Databases Tab ---- */}
                  <TabsContent value="databases" className="mt-0">
                    <div className="flex flex-col gap-5">
                      <div>
                        <p className="text-xs font-medium text-foreground">Database Mapping</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Map each game database role to an actual database on this server.
                          {fetchedDatabases.length === 0 && " Run Test Connection to fetch available databases."}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3">
                        {GAME_DBS.map((db) => (
                          <Field key={db} label={db}>
                            <Select
                              value={draft.databaseMap[db]}
                              onValueChange={(v) => updateDbMap(db, v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Select database..." />
                              </SelectTrigger>
                              <SelectContent>
                                {dbOptions.map((d) => (
                                  <SelectItem key={d} value={d} className="text-xs">
                                    {d}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                        ))}
                      </div>

                      {fetchedDatabases.length > 0 && (
                        <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Available Databases ({fetchedDatabases.length})
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {fetchedDatabases.map((d) => (
                              <Badge key={d} variant="outline" className="border-border text-[10px] text-muted-foreground">
                                {d}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* ---- Advanced Tab ---- */}
                  <TabsContent value="advanced" className="mt-0">
                    <div className="flex flex-col gap-5">
                      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                        <div>
                          <p className="text-xs font-medium text-foreground">Encrypt Connection</p>
                          <p className="text-[10px] text-muted-foreground">Use TLS/SSL for database connection</p>
                        </div>
                        <Switch
                          checked={draft.encryptConnection}
                          onCheckedChange={(v) => updateDraft("encryptConnection", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                        <div>
                          <p className="text-xs font-medium text-foreground">Trust Server Certificate</p>
                          <p className="text-[10px] text-muted-foreground">Accept self-signed certificates</p>
                        </div>
                        <Switch
                          checked={draft.trustServerCertificate}
                          onCheckedChange={(v) => updateDraft("trustServerCertificate", v)}
                        />
                      </div>

                      <Field label="Connection Timeout (seconds)" htmlFor="prof-timeout">
                        <Input
                          id="prof-timeout"
                          type="number"
                          value={draft.connectionTimeout}
                          onChange={(e) => updateDraft("connectionTimeout", Number(e.target.value))}
                          className="h-8 text-xs"
                        />
                      </Field>
                    </div>
                  </TabsContent>

                  {/* ---- SSH Tab ---- */}
                  <TabsContent value="ssh" className="mt-0">
                    <div className="flex flex-col gap-5">
                      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background">
                            <Network className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">Enable SSH Tunnel</p>
                            <p className="text-[10px] text-muted-foreground">Route SQL connection through SSH</p>
                          </div>
                        </div>
                        <Switch
                          checked={draft.sshEnabled}
                          onCheckedChange={(v) => updateDraft("sshEnabled", v)}
                        />
                      </div>

                      <div className={draft.sshEnabled ? "" : "pointer-events-none opacity-40"}>
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="SSH Host" htmlFor="ssh-host" required={draft.sshEnabled}>
                            <Input
                              id="ssh-host"
                              value={draft.sshHost}
                              onChange={(e) => updateDraft("sshHost", e.target.value)}
                              disabled={!draft.sshEnabled}
                              placeholder="ssh.example.com"
                              className={`h-8 text-xs ${errors.sshHost ? "border-destructive" : ""}`}
                            />
                            {errors.sshHost && <p className="text-[10px] text-destructive">{errors.sshHost}</p>}
                          </Field>

                          <Field label="SSH Port" htmlFor="ssh-port">
                            <Input
                              id="ssh-port"
                              type="number"
                              value={draft.sshPort}
                              onChange={(e) => updateDraft("sshPort", Number(e.target.value))}
                              disabled={!draft.sshEnabled}
                              className="h-8 text-xs"
                            />
                          </Field>

                          <div className="col-span-2">
                            <Field label="SSH Username" htmlFor="ssh-user" required={draft.sshEnabled}>
                              <Input
                                id="ssh-user"
                                value={draft.sshUsername}
                                onChange={(e) => updateDraft("sshUsername", e.target.value)}
                                disabled={!draft.sshEnabled}
                                className={`h-8 text-xs ${errors.sshUsername ? "border-destructive" : ""}`}
                              />
                              {errors.sshUsername && <p className="text-[10px] text-destructive">{errors.sshUsername}</p>}
                            </Field>
                          </div>

                          <div className="col-span-2">
                            <Field label="Authentication Method">
                              <Select
                                value={draft.sshAuthMethod}
                                onValueChange={(v) => updateDraft("sshAuthMethod", v as SSHAuthMethod)}
                                disabled={!draft.sshEnabled}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="password" className="text-xs">
                                    Password
                                  </SelectItem>
                                  <SelectItem value="key" className="text-xs">
                                    Private Key
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </Field>
                          </div>

                          {draft.sshAuthMethod === "password" && (
                            <div className="col-span-2">
                              <Field label="SSH Password" htmlFor="ssh-pass" required={draft.sshEnabled}>
                                <PasswordInput
                                  id="ssh-pass"
                                  value={draft.sshPassword}
                                  onChange={(v) => updateDraft("sshPassword", v)}
                                  disabled={!draft.sshEnabled}
                                  placeholder="SSH password"
                                />
                                {errors.sshPassword && <p className="text-[10px] text-destructive">{errors.sshPassword}</p>}
                              </Field>
                            </div>
                          )}

                          {draft.sshAuthMethod === "key" && (
                            <>
                              <div className="col-span-2">
                                <Field label="Private Key File Path" htmlFor="ssh-key" required={draft.sshEnabled}>
                                  <div className="relative">
                                    <KeyRound className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                      id="ssh-key"
                                      value={draft.sshPrivateKeyPath}
                                      onChange={(e) => updateDraft("sshPrivateKeyPath", e.target.value)}
                                      disabled={!draft.sshEnabled}
                                      placeholder="/path/to/id_rsa"
                                      className={`h-8 pl-8 text-xs ${errors.sshPrivateKeyPath ? "border-destructive" : ""}`}
                                    />
                                  </div>
                                  {errors.sshPrivateKeyPath && <p className="text-[10px] text-destructive">{errors.sshPrivateKeyPath}</p>}
                                </Field>
                              </div>
                              <div className="col-span-2">
                                <Field label="Passphrase (optional)" htmlFor="ssh-phrase">
                                  <PasswordInput
                                    id="ssh-phrase"
                                    value={draft.sshPassphrase}
                                    onChange={(v) => updateDraft("sshPassphrase", v)}
                                    disabled={!draft.sshEnabled}
                                    placeholder="Key passphrase"
                                  />
                                </Field>
                              </div>
                            </>
                          )}

                          <div className="col-span-2">
                            <Field label="Local Forward Port" htmlFor="ssh-local-port" hint="0 = auto-assigned">
                              <Input
                                id="ssh-local-port"
                                type="number"
                                value={draft.sshLocalForwardPort}
                                onChange={(e) => updateDraft("sshLocalForwardPort", Number(e.target.value))}
                                disabled={!draft.sshEnabled}
                                className="h-8 text-xs"
                              />
                            </Field>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* ---- Test Result ---- */}
                  {testResult && (
                    <div className="mt-6">
                      <Separator className="mb-4" />
                      <div
                        className={`rounded-lg border px-4 py-3 ${
                          testResult.success
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : "border-destructive/30 bg-destructive/5"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {testResult.success ? (
                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                          ) : (
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                          )}
                          <div className="flex-1">
                            <p className={`text-xs font-medium ${testResult.success ? "text-emerald-400" : "text-destructive"}`}>
                              {testResult.success ? "Connection Successful" : "Connection Failed"}
                            </p>
                            {testResult.serverVersion && (
                              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                                {testResult.serverVersion}
                              </p>
                            )}
                            {testResult.error && (
                              <p className="mt-1 text-[11px] text-destructive/80">
                                {testResult.error}
                              </p>
                            )}
                            {testResult.sshStatus && testResult.sshStatus !== "skipped" && (
                              <div className="mt-2 flex items-center gap-1.5">
                                <Terminal className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">
                                  SSH Tunnel: {testResult.sshStatus === "connected" ? "Connected" : "Failed"}
                                </span>
                              </div>
                            )}
                            {testResult.databases && (
                              <div className="mt-2">
                                <p className="text-[10px] text-muted-foreground">
                                  {testResult.databases.length} databases accessible
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Tabs>

            {/* Bottom action bar */}
            <div className="flex shrink-0 items-center justify-between border-t border-border px-5 py-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 bg-transparent text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleDeleteProfile}
              >
                <Trash2 className="h-3 w-3" /> Delete Profile
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-transparent text-xs"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plug className="h-3 w-3" />
                  )}
                  Test Connection
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent text-xs"
                  onClick={handleCancel}
                  disabled={!dirty}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={handleSave}
                  disabled={!dirty}
                >
                  <CheckCircle className="h-3 w-3" /> Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
