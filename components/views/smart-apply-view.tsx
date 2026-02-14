"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import {
  ArrowLeft,
  Play,
  Eye,
  Copy,
  Check,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  GitMerge,
  ArrowRightLeft,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  FileCode2,
  Link2,
  Unlink,
  Hash,
  Server,
  Download,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
  PipelineProgress,
  PipelineStage,
  ApplyResult,
  DependencyEntry,
  DependencyStatus,
  SqlStatement,
  IdMapping,
  ExecutionCategory,
} from "@/lib/services/merge-engine"
import {
  createMockProject,
  createMockExistingIds,
  createMockMaxIds,
  runApplyPipeline,
  wrapInTransaction,
} from "@/lib/services/merge-engine"

// =============================================
// TYPES & CONSTANTS
// =============================================

type ViewTab = "overview" | "dependencies" | "id-resolution" | "sql-preview" | "execution"

const TABS: { id: ViewTab; label: string; icon: typeof Database }[] = [
  { id: "overview", label: "Overview", icon: GitMerge },
  { id: "dependencies", label: "Dependencies", icon: Link2 },
  { id: "id-resolution", label: "ID Resolution", icon: Hash },
  { id: "sql-preview", label: "SQL Preview", icon: FileCode2 },
  { id: "execution", label: "Execution", icon: Play },
]

const STAGE_ORDER: PipelineStage[] = [
  "validating",
  "analyzing_dependencies",
  "resolving_ids",
  "generating_sql",
  "preview",
]

const STAGE_LABELS: Record<string, string> = {
  idle: "Idle",
  validating: "Validate Structure",
  analyzing_dependencies: "Analyze Dependencies",
  resolving_ids: "Resolve IDs",
  generating_sql: "Generate SQL",
  preview: "Preview Ready",
  executing: "Executing...",
  committed: "Committed",
  rolled_back: "Rolled Back",
  error: "Error",
}

const DEP_STATUS_CONFIG: Record<
  DependencyStatus,
  { label: string; color: string; bg: string }
> = {
  FOUND_IN_PROJECT: {
    label: "In Project",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  FOUND_IN_DATABASE: {
    label: "In Database",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  MISSING_CRITICAL: {
    label: "Critical Missing",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  MISSING_OPTIONAL: {
    label: "Optional Missing",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
}

const CATEGORY_LABELS: Record<ExecutionCategory, string> = {
  base_entities: "Base Entities",
  main_entities: "Main Entities",
  secondary_data: "Secondary Data",
  relations: "Relations",
  spawn: "Spawn Data",
  linking_tables: "Linking Tables",
}

// =============================================
// COMPONENT
// =============================================

interface SmartApplyViewProps {
  onBack: () => void
}

export function SmartApplyView({ onBack }: SmartApplyViewProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>("overview")
  const [progress, setProgress] = useState<PipelineProgress | null>(null)
  const [result, setResult] = useState<ApplyResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expandedStatements, setExpandedStatements] = useState<Set<number>>(new Set())
  const [executionSimulated, setExecutionSimulated] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const project = createMockProject()
  const entity = project.entities

  // Run the pipeline
  const handleRunPipeline = useCallback(async () => {
    setIsRunning(true)
    setResult(null)
    setExecutionSimulated(false)
    setActiveTab("overview")

    const existingIds = createMockExistingIds()
    const maxIds = createMockMaxIds()

    const pipelineResult = await runApplyPipeline(
      project,
      existingIds,
      maxIds,
      (p) => setProgress(p)
    )

    setResult(pipelineResult)
    setIsRunning(false)

    if (pipelineResult.success) {
      setActiveTab("sql-preview")
    }
  }, [])

  // Simulate execution (no real DB)
  const handleSimulateExecute = useCallback(async () => {
    if (!result) return
    setActiveTab("execution")
    setExecutionSimulated(false)

    // Simulate execution delay
    await new Promise((r) => setTimeout(r, 1500))
    setExecutionSimulated(true)
  }, [result])

  // Copy SQL
  const handleCopySQL = useCallback(() => {
    if (!result) return
    const fullScript = wrapInTransaction(result.generatedSql, project.targetDatabase)
    navigator.clipboard.writeText(fullScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [result])

  // Download SQL
  const handleDownloadSQL = useCallback(() => {
    if (!result) return
    const fullScript = wrapInTransaction(result.generatedSql, project.targetDatabase)
    const blob = new Blob([fullScript], { type: "text/sql" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `smart-apply_${project.targetDatabase.name}_${new Date().toISOString().slice(0, 10)}.sql`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [result])

  const handleReset = useCallback(() => {
    setProgress(null)
    setResult(null)
    setIsRunning(false)
    setExecutionSimulated(false)
    setActiveTab("overview")
    setExpandedStatements(new Set())
  }, [])

  const toggleStatement = (idx: number) => {
    setExpandedStatements((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
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
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10">
              <GitMerge className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">Smart Apply</h1>
              <p className="text-[10px] text-muted-foreground">Merge Engine</p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Target DB Badge */}
          <div className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5">
            <Server className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-[11px] text-foreground">
              {project.targetDatabase.name}
            </span>
            <Badge variant="outline" className="border-border text-[9px] text-muted-foreground">
              {project.targetDatabase.version}
            </Badge>
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Actions */}
          {result?.success && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={handleCopySQL}
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copied ? "Copied" : "Copy SQL"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="border-border bg-card text-foreground">
                  <span className="text-xs">Copy full SQL script</span>
                </TooltipContent>
              </Tooltip>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleDownloadSQL}
              >
                <Download className="h-3 w-3" />
                Download .sql
              </Button>
            </>
          )}

          {!isRunning && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={handleReset}
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          )}

          <Button
            size="sm"
            className="gap-1.5 bg-emerald-600 text-xs text-foreground hover:bg-emerald-700"
            onClick={handleRunPipeline}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            {isRunning ? "Running..." : "Run Pipeline"}
          </Button>
        </header>

        {/* Tab Bar */}
        <div className="flex h-10 items-center gap-0 border-b border-border bg-background px-4">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const TabIcon = tab.icon
            const isDisabled =
              !result &&
              tab.id !== "overview" &&
              !(isRunning && tab.id === "overview")
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`flex h-10 items-center gap-1.5 border-b-2 px-3 text-xs transition-colors ${
                  isActive
                    ? "border-foreground text-foreground"
                    : isDisabled
                      ? "border-transparent text-muted-foreground/30 cursor-not-allowed"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <TabIcon className="h-3 w-3" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              {activeTab === "overview" && (
                <OverviewPanel
                  project={project}
                  progress={progress}
                  result={result}
                  isRunning={isRunning}
                />
              )}
              {activeTab === "dependencies" && result && (
                <DependenciesPanel result={result} />
              )}
              {activeTab === "id-resolution" && result && (
                <IdResolutionPanel result={result} />
              )}
              {activeTab === "sql-preview" && result && (
                <SqlPreviewPanel
                  result={result}
                  expandedStatements={expandedStatements}
                  toggleStatement={toggleStatement}
                  targetDb={project.targetDatabase}
                />
              )}
              {activeTab === "execution" && result && (
                <ExecutionPanel
                  result={result}
                  simulated={executionSimulated}
                  onSimulate={handleSimulateExecute}
                />
              )}
            </div>
          </ScrollArea>
        </main>
      </div>
    </TooltipProvider>
  )
}

// =============================================
// OVERVIEW PANEL
// =============================================

function OverviewPanel({
  project,
  progress,
  result,
  isRunning,
}: {
  project: ReturnType<typeof createMockProject>
  progress: PipelineProgress | null
  result: ApplyResult | null
  isRunning: boolean
}) {
  // Entity stats by env
  const envGroups = new Map<string, number>()
  for (const e of project.entities) {
    envGroups.set(e.envId, (envGroups.get(e.envId) ?? 0) + 1)
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Project Summary */}
      <div className="mb-6 rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
            <GitMerge className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{project.name}</h2>
            <p className="text-[11px] text-muted-foreground">
              v{project.version} -- {project.entities.length} entities across{" "}
              {envGroups.size} environments
            </p>
          </div>
        </div>

        {/* Entity breakdown */}
        <div className="flex flex-wrap gap-3">
          {Array.from(envGroups.entries()).map(([env, count]) => (
            <div
              key={env}
              className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5"
            >
              <span className="text-[11px] font-medium capitalize text-foreground">
                {env}
              </span>
              <Badge
                variant="outline"
                className="border-border text-[10px] text-muted-foreground"
              >
                {count}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Target Database */}
      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Database className="h-3.5 w-3.5" />
          Target Database
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground">Server</p>
            <p className="font-mono text-xs text-foreground">
              {project.targetDatabase.host}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Database</p>
            <p className="font-mono text-xs text-foreground">
              {project.targetDatabase.name}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Version</p>
            <p className="font-mono text-xs text-foreground">
              {project.targetDatabase.version}
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Progress */}
      {(isRunning || result) && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-4 flex items-center gap-2 text-xs font-medium text-foreground">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Apply Pipeline
          </div>

          <div className="flex flex-col gap-3">
            {STAGE_ORDER.map((stage, i) => {
              const isCompleted = progress
                ? progress.stageIndex > i ||
                  (progress.stage === "preview" && stage === "preview")
                : false
              const isCurrent = progress?.stage === stage
              const isError = progress?.stage === "error" && i === progress.stageIndex
              const isFutureStage = progress ? progress.stageIndex < i : true

              return (
                <div key={stage} className="flex items-center gap-3">
                  {/* Status indicator */}
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                    {isError ? (
                      <XCircle className="h-4 w-4 text-red-400" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>

                  {/* Stage info */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-medium ${
                        isCompleted
                          ? "text-emerald-400"
                          : isCurrent
                            ? "text-foreground"
                            : isError
                              ? "text-red-400"
                              : "text-muted-foreground/50"
                      }`}
                    >
                      {STAGE_LABELS[stage]}
                    </p>
                    {isCurrent && progress && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {progress.message}
                      </p>
                    )}
                  </div>

                  {/* Progress bar */}
                  {(isCurrent || isCompleted) && (
                    <div className="h-1 w-20 overflow-hidden rounded-full bg-border">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted
                            ? "bg-emerald-500 w-full"
                            : isError
                              ? "bg-red-500"
                              : "bg-foreground"
                        }`}
                        style={{
                          width: isCompleted
                            ? "100%"
                            : `${progress?.stageProgress ?? 0}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Result Summary */}
          {result && !isRunning && (
            <div
              className={`mt-4 flex items-center gap-2 rounded-md border px-3 py-2 ${
                result.success
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-red-500/20 bg-red-500/5"
              }`}
            >
              {result.success ? (
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-red-400" />
              )}
              <div>
                <p
                  className={`text-xs font-medium ${
                    result.success ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {result.success
                    ? `Pipeline complete: ${result.totalStatements} statements generated`
                    : `Pipeline failed: ${result.errors.length} error(s)`}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {result.executionTimeMs}ms -- {result.affectedTables.length} tables
                  affected
                </p>
              </div>
            </div>
          )}

          {/* Errors */}
          {result?.errors.map((err, i) => (
            <div
              key={i}
              className="mt-2 flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2"
            >
              <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" />
              <div>
                <p className="text-xs font-medium text-red-400">{err.message}</p>
                {err.detail && (
                  <p className="mt-0.5 font-mono text-[10px] text-red-400/70">
                    {err.detail}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Idle state */}
      {!isRunning && !result && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
            <Play className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">
            Ready to Apply
          </p>
          <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
            Click &quot;Run Pipeline&quot; to validate, analyze dependencies,
            resolve IDs, and generate a safe SQL deployment script.
          </p>
        </div>
      )}
    </div>
  )
}

// =============================================
// DEPENDENCIES PANEL
// =============================================

function DependenciesPanel({ result }: { result: ApplyResult }) {
  const dep = result.dependencyReport
  const [filter, setFilter] = useState<DependencyStatus | "all">("all")

  const filtered =
    filter === "all"
      ? dep.entries
      : dep.entries.filter((e) => e.status === filter)

  return (
    <div className="mx-auto max-w-4xl">
      {/* Summary Bar */}
      <div className="mb-4 flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-1.5">
          {dep.canProceed ? (
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-red-400" />
          )}
          <span
            className={`text-xs font-medium ${
              dep.canProceed ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {dep.canProceed ? "All Clear" : "Blocked"}
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <span className="text-xs text-muted-foreground">
          {dep.entries.length} references scanned
        </span>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          {dep.foundInProject.length} project
        </div>
        <div className="flex items-center gap-1.5 text-xs text-blue-400">
          <Database className="h-3 w-3" />
          {dep.foundInDatabase.length} database
        </div>
        {dep.criticalMissing.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-red-400">
            <XCircle className="h-3 w-3" />
            {dep.criticalMissing.length} critical
          </div>
        )}
        {dep.optionalMissing.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            {dep.optionalMissing.length} optional
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="mb-3 flex gap-1.5">
        {(
          ["all", "FOUND_IN_PROJECT", "FOUND_IN_DATABASE", "MISSING_CRITICAL", "MISSING_OPTIONAL"] as const
        ).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-2.5 py-1 text-[11px] transition-colors ${
              filter === f
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : DEP_STATUS_CONFIG[f].label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border bg-muted/30 px-4 py-2">
          <span className="w-36 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Source
          </span>
          <span className="w-28 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Field
          </span>
          <span className="w-36 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Target Table
          </span>
          <span className="w-20 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Ref ID
          </span>
          <span className="flex-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Status
          </span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
            No dependencies match this filter
          </div>
        ) : (
          filtered.map((entry, i) => {
            const cfg = DEP_STATUS_CONFIG[entry.status]
            return (
              <div
                key={i}
                className={`flex items-center gap-4 px-4 py-2.5 ${
                  i < filtered.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="w-36">
                  <p className="text-xs font-medium text-foreground">
                    {entry.sourceEntity}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {entry.sourceEnv}
                  </p>
                </div>
                <span className="w-28 font-mono text-[11px] text-muted-foreground">
                  {entry.fieldName}
                </span>
                <span className="w-36 font-mono text-[11px] text-foreground">
                  {entry.referencedTable}
                </span>
                <span className="w-20 font-mono text-[11px] text-foreground">
                  {entry.referencedId}
                </span>
                <div className="flex-1">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${cfg.bg} ${cfg.color}`}
                  >
                    {entry.status === "FOUND_IN_PROJECT" && (
                      <Link2 className="mr-1 h-2.5 w-2.5" />
                    )}
                    {entry.status === "FOUND_IN_DATABASE" && (
                      <Database className="mr-1 h-2.5 w-2.5" />
                    )}
                    {entry.status === "MISSING_CRITICAL" && (
                      <Unlink className="mr-1 h-2.5 w-2.5" />
                    )}
                    {entry.status === "MISSING_OPTIONAL" && (
                      <AlertTriangle className="mr-1 h-2.5 w-2.5" />
                    )}
                    {cfg.label}
                  </Badge>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// =============================================
// ID RESOLUTION PANEL
// =============================================

function IdResolutionPanel({ result }: { result: ApplyResult }) {
  const idReport = result.idResolutionReport

  // Flatten all mappings for display
  const allMappings: (IdMapping & { table: string })[] = []
  for (const [table, tableMap] of idReport.mappings) {
    for (const [oldId, newId] of tableMap) {
      allMappings.push({
        originalId: oldId,
        resolvedId: newId,
        table,
        wasConflict: oldId !== newId,
      })
    }
  }

  const conflicts = allMappings.filter((m) => m.wasConflict)
  const unchanged = allMappings.filter((m) => !m.wasConflict)

  return (
    <div className="mx-auto max-w-3xl">
      {/* Summary */}
      <div className="mb-4 flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
        <Hash className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{allMappings.length}</span>{" "}
          IDs resolved
        </span>
        <div className="h-4 w-px bg-border" />
        {conflicts.length > 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <ArrowRightLeft className="h-3 w-3" />
            {conflicts.length} remapped
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            No conflicts
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          {unchanged.length} unchanged
        </div>
      </div>

      {/* Conflicts Section */}
      {conflicts.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-amber-400">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Remapped IDs ({conflicts.length})
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5">
            {conflicts.map((m, i) => (
              <div
                key={`${m.table}-${m.originalId}`}
                className={`flex items-center gap-4 px-4 py-2.5 ${
                  i < conflicts.length - 1
                    ? "border-b border-amber-500/10"
                    : ""
                }`}
              >
                <span className="w-32 font-mono text-[11px] text-foreground">
                  {m.table}
                </span>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-mono text-[11px] text-red-400 line-through">
                    {m.originalId}
                  </span>
                  <ArrowRightLeft className="h-3 w-3 text-amber-400" />
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[11px] text-emerald-400">
                    {m.resolvedId}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="border-amber-500/20 text-[9px] text-amber-400"
                >
                  conflict resolved
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unchanged IDs */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          Unchanged IDs ({unchanged.length})
        </div>
        <div className="rounded-lg border border-border bg-card">
          {unchanged.map((m, i) => (
            <div
              key={`${m.table}-${m.originalId}`}
              className={`flex items-center gap-4 px-4 py-2 ${
                i < unchanged.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span className="w-32 font-mono text-[11px] text-muted-foreground">
                {m.table}
              </span>
              <span className="font-mono text-[11px] text-foreground">
                {m.originalId}
              </span>
              <Badge
                variant="outline"
                className="border-emerald-500/20 text-[9px] text-emerald-400"
              >
                free
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================
// SQL PREVIEW PANEL
// =============================================

function SqlPreviewPanel({
  result,
  expandedStatements,
  toggleStatement,
  targetDb,
}: {
  result: ApplyResult
  expandedStatements: Set<number>
  toggleStatement: (idx: number) => void
  targetDb: ReturnType<typeof createMockProject>["targetDatabase"]
}) {
  const statements = result.generatedSql

  // Group by category
  const groups = new Map<ExecutionCategory, SqlStatement[]>()
  for (const stmt of statements) {
    if (!groups.has(stmt.category)) groups.set(stmt.category, [])
    groups.get(stmt.category)!.push(stmt)
  }

  const insertCount = statements.filter((s) => s.operation === "INSERT").length
  const updateCount = statements.filter((s) => s.operation === "UPDATE").length
  const remappedCount = statements.filter((s) => s.idRemapped).length

  return (
    <div className="mx-auto max-w-4xl">
      {/* Summary */}
      <div className="mb-4 flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
        <FileCode2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{statements.length}</span>{" "}
          statements
        </span>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="font-medium">{insertCount}</span> INSERT
        </div>
        <div className="flex items-center gap-1.5 text-xs text-blue-400">
          <span className="font-medium">{updateCount}</span> UPDATE
        </div>
        {remappedCount > 0 && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <ArrowRightLeft className="h-3 w-3" />
              {remappedCount} remapped
            </div>
          </>
        )}
        <div className="h-4 w-px bg-border" />
        <span className="text-xs text-muted-foreground">
          Execution order: base → main → secondary → relations
        </span>
      </div>

      {/* Grouped Statements */}
      {Array.from(groups.entries()).map(([category, stmts]) => (
        <div key={category} className="mb-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span className="uppercase tracking-wider">
              {CATEGORY_LABELS[category]}
            </span>
            <Badge
              variant="outline"
              className="border-border text-[9px] text-muted-foreground"
            >
              {stmts.length}
            </Badge>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="rounded-lg border border-border bg-card">
            {stmts.map((stmt, i) => {
              const globalIdx = statements.indexOf(stmt)
              const isExpanded = expandedStatements.has(globalIdx)
              return (
                <div
                  key={globalIdx}
                  className={
                    i < stmts.length - 1 ? "border-b border-border" : ""
                  }
                >
                  {/* Row Header */}
                  <button
                    onClick={() => toggleStatement(globalIdx)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/30"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${
                        stmt.operation === "INSERT"
                          ? "border-emerald-500/30 text-emerald-400"
                          : "border-blue-500/30 text-blue-400"
                      }`}
                    >
                      {stmt.operation}
                    </Badge>
                    <span className="text-xs font-medium text-foreground">
                      {stmt.entityName}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {stmt.table}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      id:{stmt.affectedId}
                    </span>
                    {stmt.idRemapped && (
                      <Badge
                        variant="outline"
                        className="border-amber-500/20 text-[9px] text-amber-400"
                      >
                        remapped
                      </Badge>
                    )}
                  </button>

                  {/* SQL Code */}
                  {isExpanded && (
                    <div className="border-t border-border bg-background px-4 py-3">
                      <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed">
                        {stmt.sql.split("\n").map((line, li) => (
                          <div key={li} className="flex">
                            <span className="mr-3 w-5 select-none text-right text-muted-foreground/40">
                              {li + 1}
                            </span>
                            <span
                              className={
                                line.trimStart().startsWith("--")
                                  ? "text-muted-foreground"
                                  : /\b(IF|EXISTS|SELECT|BEGIN|END|UPDATE|INSERT|INTO|SET|VALUES|WHERE|FROM|NOT)\b/.test(
                                        line
                                      )
                                    ? "text-foreground"
                                    : "text-muted-foreground/80"
                              }
                            >
                              {highlightSql(line)}
                            </span>
                          </div>
                        ))}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function highlightSql(line: string): React.ReactNode {
  // Simple keyword highlighting
  const keywords =
    /\b(IF|EXISTS|SELECT|BEGIN|END|UPDATE|INSERT|INTO|SET|VALUES|WHERE|FROM|NOT|NULL|AND|OR|DECLARE|PRINT|CAST|AS|VARCHAR|NVARCHAR|INT)\b/g

  if (line.trimStart().startsWith("--")) {
    return <span className="text-muted-foreground italic">{line}</span>
  }

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match

  while ((match = keywords.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index))
    }
    parts.push(
      <span key={match.index} className="font-semibold text-blue-400">
        {match[0]}
      </span>
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex))
  }

  return parts.length > 0 ? <>{parts}</> : line
}

// =============================================
// EXECUTION PANEL
// =============================================

function ExecutionPanel({
  result,
  simulated,
  onSimulate,
}: {
  result: ApplyResult
  simulated: boolean
  onSimulate: () => void
}) {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Info banner */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
        <div>
          <p className="text-xs font-medium text-amber-400">
            Execution Preview Only
          </p>
          <p className="mt-0.5 text-[11px] text-amber-400/70">
            This panel simulates execution against the target database. In
            production, the generated .sql file would be executed via SQL Server
            Management Studio or an automated deployment pipeline.
          </p>
        </div>
      </div>

      {/* Affected Tables Summary */}
      <div className="mb-4 rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Database className="h-3.5 w-3.5" />
          Affected Tables ({result.affectedTables.length})
        </div>
        <div className="flex flex-wrap gap-2">
          {result.affectedTables.map((table) => {
            const stmts = result.generatedSql.filter((s) => s.table === table)
            const inserts = stmts.filter((s) => s.operation === "INSERT").length
            const updates = stmts.filter((s) => s.operation === "UPDATE").length
            return (
              <div
                key={table}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5"
              >
                <span className="font-mono text-[11px] text-foreground">
                  {table}
                </span>
                {inserts > 0 && (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/20 text-[9px] text-emerald-400"
                  >
                    +{inserts}
                  </Badge>
                )}
                {updates > 0 && (
                  <Badge
                    variant="outline"
                    className="border-blue-500/20 text-[9px] text-blue-400"
                  >
                    ~{updates}
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Transaction Info */}
      <div className="mb-4 rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Transaction Safety
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            SET XACT_ABORT ON -- auto-rollback on any error
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            BEGIN TRY / BEGIN CATCH -- structured error handling
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            IF EXISTS guards -- no duplicate records
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Ordered execution -- base entities first, relations last
          </div>
        </div>
      </div>

      {/* Simulate Button */}
      {!simulated ? (
        <Button
          size="sm"
          className="gap-1.5 bg-emerald-600 text-xs text-foreground hover:bg-emerald-700"
          onClick={onSimulate}
        >
          <Eye className="h-3 w-3" />
          Simulate Execution
        </Button>
      ) : (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-400">
                Simulation Complete
              </p>
              <p className="text-[11px] text-emerald-400/70">
                All {result.totalStatements} statements would execute
                successfully. Transaction would COMMIT.
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-1">
            {result.generatedSql.map((stmt, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                <span className="text-muted-foreground">
                  [{stmt.operation}] {stmt.entityName}
                </span>
                <span className="font-mono text-muted-foreground/50">
                  {stmt.table}:{stmt.affectedId}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
