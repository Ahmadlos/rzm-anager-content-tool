"use client"

import { useState, useCallback, useMemo } from "react"
import {
  GitCommit,
  Play,
  Undo2,
  Trash2,
  Download,
  FileText,
  Code,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  ArrowLeftRight,
  Users,
  Package,
  Bug,
  ScrollText,
  Zap,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  type Commit,
  type CommitStatus,
  type StagedChange,
  type EntityType,
  getWorkspaceCommits,
  getChangesForCommit,
  applyCommit,
  discardCommit,
  createRevertCommit,
  exportCommitAsSQL,
  exportCommitAsJSON,
} from "@/lib/staging-store"
import { getActiveWorkspace } from "@/lib/workspace-store"

// --- Status styling ---

const statusConfig: Record<CommitStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
  Pending: { icon: Clock, color: "text-amber-400", label: "Pending" },
  Applied: { icon: CheckCircle, color: "text-emerald-400", label: "Applied" },
  Failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
  Reverted: { icon: Undo2, color: "text-muted-foreground", label: "Reverted" },
}

const entityIcons: Record<EntityType, typeof Users> = {
  NPC: Users,
  Item: Package,
  Monster: Bug,
  Quest: ScrollText,
  Skill: Zap,
  State: Shield,
}

// --- Diff Viewer ---

function DiffViewer({
  previous,
  current,
}: {
  previous: Record<string, unknown> | null
  current: Record<string, unknown> | null
}) {
  const allKeys = useMemo(() => {
    const keys = new Set<string>()
    if (previous) Object.keys(previous).forEach((k) => keys.add(k))
    if (current) Object.keys(current).forEach((k) => keys.add(k))
    return Array.from(keys)
  }, [previous, current])

  if (!previous && !current) {
    return (
      <p className="px-3 py-2 text-[10px] text-muted-foreground">No snapshot data available.</p>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-background">
      <div className="grid grid-cols-[1fr_auto_1fr] text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="border-b border-r border-border bg-red-500/5 px-3 py-1.5">Previous</div>
        <div className="border-b border-r border-border px-2 py-1.5">Field</div>
        <div className="border-b border-border bg-emerald-500/5 px-3 py-1.5">Current</div>
      </div>
      <ScrollArea className="max-h-48">
        {allKeys.map((key) => {
          const prev = previous?.[key]
          const curr = current?.[key]
          const changed = JSON.stringify(prev) !== JSON.stringify(curr)
          return (
            <div
              key={key}
              className={`grid grid-cols-[1fr_auto_1fr] border-b border-border last:border-0 ${
                changed ? "bg-amber-500/5" : ""
              }`}
            >
              <div
                className={`border-r border-border px-3 py-1 font-mono text-[10px] ${
                  prev !== undefined && changed
                    ? "text-red-400 line-through"
                    : "text-muted-foreground"
                }`}
              >
                {prev !== undefined ? String(prev) : "-"}
              </div>
              <div className="border-r border-border px-2 py-1 text-[10px] font-medium text-foreground">
                {key}
              </div>
              <div
                className={`px-3 py-1 font-mono text-[10px] ${
                  curr !== undefined && changed ? "text-emerald-400 font-medium" : "text-muted-foreground"
                }`}
              >
                {curr !== undefined ? String(curr) : "-"}
              </div>
            </div>
          )
        })}
      </ScrollArea>
    </div>
  )
}

// --- Commit History ---

interface CommitHistoryProps {
  onSelectCommit?: (commit: Commit) => void
  selectedCommitId?: string | null
}

export function CommitHistory({
  onSelectCommit,
  selectedCommitId,
}: CommitHistoryProps) {
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null)
  const [diffChangeId, setDiffChangeId] = useState<string | null>(null)
  const [applying, setApplying] = useState<string | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState<string | null>(null)
  const [confirmRevert, setConfirmRevert] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const workspace = useMemo(() => getActiveWorkspace(), [])

  const commits = useMemo(() => {
    if (!workspace) return []
    return getWorkspaceCommits(workspace.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace, refreshKey])

  const handleApply = useCallback(async (commitId: string) => {
    setApplying(commitId)
    const result = await applyCommit(commitId)
    setApplying(null)
    setRefreshKey((k) => k + 1)
    if (!result.success) {
      // Error is shown via status
    }
  }, [])

  const handleDiscard = useCallback((commitId: string) => {
    discardCommit(commitId)
    setConfirmDiscard(null)
    setRefreshKey((k) => k + 1)
  }, [])

  const handleRevert = useCallback((commitId: string) => {
    createRevertCommit(commitId, "admin")
    setConfirmRevert(null)
    setRefreshKey((k) => k + 1)
  }, [])

  const handleExportSQL = useCallback((commitId: string) => {
    const sql = exportCommitAsSQL(commitId)
    const blob = new Blob([sql], { type: "text/sql" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `commit_${commitId.slice(0, 8)}.sql`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleExportJSON = useCallback((commitId: string) => {
    const json = exportCommitAsJSON(commitId)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `commit_${commitId.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  if (!workspace) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-400" />
        <p className="text-sm text-muted-foreground">No active workspace.</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-foreground">Commit History</h3>
            {commits.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {commits.length}
              </Badge>
            )}
          </div>
        </div>

        {/* Commit list */}
        <ScrollArea className="flex-1">
          {commits.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card">
                <GitCommit className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">No commits yet</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Stage changes and commit them to see history here.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-2">
              {commits.map((commit) => {
                const status = statusConfig[commit.status]
                const StatusIcon = status.icon
                const isExpanded = expandedCommit === commit.id
                const isSelected = selectedCommitId === commit.id
                const changes = isExpanded ? getChangesForCommit(commit.id) : []

                return (
                  <div key={commit.id} className="flex flex-col">
                    {/* Commit header */}
                    <div
                      className={`flex flex-col gap-1.5 rounded-lg border p-3 transition-colors cursor-pointer ${
                        isSelected
                          ? "border-border bg-accent/60"
                          : "border-transparent hover:bg-accent/30"
                      }`}
                      onClick={() => {
                        onSelectCommit?.(commit)
                        setExpandedCommit(isExpanded ? null : commit.id)
                      }}
                    >
                      <div className="flex items-start gap-2">
                        {isExpanded ? (
                          <ChevronDown className="mt-0.5 h-3 w-3 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="mt-0.5 h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-foreground truncate">
                            {commit.message}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-[9px] text-muted-foreground">
                            <span className="font-mono">{commit.id.slice(0, 8)}</span>
                            <span>by {commit.author}</span>
                            <span>{new Date(commit.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            className={`h-4 px-1.5 text-[8px] border-0 ${
                              commit.status === "Applied"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : commit.status === "Failed"
                                  ? "bg-red-500/10 text-red-400"
                                  : commit.status === "Reverted"
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            <StatusIcon className="mr-0.5 h-2.5 w-2.5" />
                            {status.label}
                          </Badge>
                          <Badge variant="secondary" className="h-4 px-1 text-[8px]">
                            {commit.changeIds.length}
                          </Badge>
                        </div>
                      </div>

                      {/* Error log */}
                      {commit.errorLog && (
                        <div className="ml-5 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2">
                          <p className="text-[10px] font-mono text-red-400">{commit.errorLog}</p>
                        </div>
                      )}
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="ml-5 flex flex-col gap-2 px-3 py-2">
                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          {commit.status === "Pending" && (
                            <>
                              <Button
                                size="sm"
                                className="h-6 gap-1 text-[9px]"
                                disabled={applying === commit.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleApply(commit.id)
                                }}
                              >
                                {applying === commit.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Play className="h-3 w-3" />
                                )}
                                Apply to Database
                              </Button>
                              {confirmDiscard === commit.id ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-destructive">Discard?</span>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-6 text-[9px]"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDiscard(commit.id)
                                    }}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[9px]"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setConfirmDiscard(null)
                                    }}
                                  >
                                    No
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 gap-1 text-[9px]"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setConfirmDiscard(commit.id)
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Discard
                                </Button>
                              )}
                            </>
                          )}
                          {commit.status === "Applied" && (
                            <>
                              {confirmRevert === commit.id ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-amber-400">
                                    Create revert commit?
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-[9px]"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRevert(commit.id)
                                    }}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[9px]"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setConfirmRevert(null)
                                    }}
                                  >
                                    No
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 gap-1 text-[9px]"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setConfirmRevert(commit.id)
                                  }}
                                >
                                  <Undo2 className="h-3 w-3" />
                                  Revert
                                </Button>
                              )}
                            </>
                          )}

                          <div className="flex-1" />

                          {/* Export buttons */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleExportSQL(commit.id)
                                }}
                              >
                                <Code className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="border-border bg-card text-foreground">
                              <span className="text-xs">Export as SQL</span>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleExportJSON(commit.id)
                                }}
                              >
                                <FileText className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="border-border bg-card text-foreground">
                              <span className="text-xs">Export as JSON</span>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        <Separator />

                        {/* Changes in this commit */}
                        <div className="flex flex-col gap-1">
                          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                            Changes
                          </p>
                          {changes.map((change) => {
                            const EntityIcon = entityIcons[change.entityType]
                            const showDiff = diffChangeId === change.id
                            return (
                              <div key={change.id} className="flex flex-col">
                                <button
                                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/30"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDiffChangeId(showDiff ? null : change.id)
                                  }}
                                >
                                  <EntityIcon className="h-3 w-3 text-muted-foreground" />
                                  <Badge
                                    className={`h-4 px-1 text-[8px] font-mono border-0 ${
                                      change.operationType === "Create"
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : change.operationType === "Delete"
                                          ? "bg-red-500/10 text-red-400"
                                          : "bg-amber-500/10 text-amber-400"
                                    }`}
                                  >
                                    {change.operationType}
                                  </Badge>
                                  <span className="flex-1 truncate text-[10px] text-foreground">
                                    {change.entityName}
                                  </span>
                                  <ArrowLeftRight className="h-3 w-3 text-muted-foreground/50" />
                                </button>

                                {/* Inline diff viewer */}
                                {showDiff && (
                                  <div className="ml-5 mb-2 mt-1">
                                    <DiffViewer
                                      previous={change.previousSnapshot}
                                      current={change.newSnapshot}
                                    />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </TooltipProvider>
  )
}
