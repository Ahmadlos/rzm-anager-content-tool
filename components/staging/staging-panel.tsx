"use client"

import { useState, useCallback, useMemo } from "react"
import {
  GitCommit,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronRight,
  FileText,
  AlertTriangle,
  Check,
  X as XIcon,
  Package,
  Users,
  Bug,
  ScrollText,
  Zap,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  type StagedChange,
  type EntityType,
  type OperationType,
  getDraftChanges,
  deleteStagedChange,
  createCommit,
  ensureSeedData,
} from "@/lib/staging-store"
import { getActiveWorkspace } from "@/lib/workspace-store"

// --- Entity icon mapping ---

const entityIcons: Record<EntityType, typeof Users> = {
  NPC: Users,
  Item: Package,
  Monster: Bug,
  Quest: ScrollText,
  Skill: Zap,
  State: Shield,
}

const operationColors: Record<OperationType, { bg: string; text: string; label: string }> = {
  Create: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "CREATE" },
  Update: { bg: "bg-amber-500/10", text: "text-amber-400", label: "UPDATE" },
  Delete: { bg: "bg-red-500/10", text: "text-red-400", label: "DELETE" },
}

// --- Staging Panel ---

interface StagingPanelProps {
  onSelectChange?: (change: StagedChange) => void
  onCommitCreated?: () => void
  selectedChangeId?: string | null
}

export function StagingPanel({
  onSelectChange,
  onCommitCreated,
  selectedChangeId,
}: StagingPanelProps) {
  const [showCommitDialog, setShowCommitDialog] = useState(false)
  const [commitMessage, setCommitMessage] = useState("")
  const [commitAuthor, setCommitAuthor] = useState("admin")
  const [expandedTypes, setExpandedTypes] = useState<Set<EntityType>>(
    new Set(["NPC", "Item", "Monster", "Quest", "Skill", "State"]),
  )
  const [refreshKey, setRefreshKey] = useState(0)

  // Ensure seed data exists
  useMemo(() => {
    ensureSeedData()
  }, [])

  const workspace = useMemo(() => getActiveWorkspace(), [])

  const draftChanges = useMemo(() => {
    if (!workspace) return []
    return getDraftChanges(workspace.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace, refreshKey])

  // Group by entity type
  const grouped = useMemo(() => {
    const map = new Map<EntityType, StagedChange[]>()
    for (const change of draftChanges) {
      const list = map.get(change.entityType) || []
      list.push(change)
      map.set(change.entityType, list)
    }
    return map
  }, [draftChanges])

  const toggleType = useCallback((type: EntityType) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  const handleDiscard = useCallback(
    (id: string) => {
      deleteStagedChange(id)
      setRefreshKey((k) => k + 1)
    },
    [],
  )

  const handleCommitAll = useCallback(() => {
    if (!workspace || draftChanges.length === 0) return
    if (!commitMessage.trim()) return

    createCommit(
      workspace.id,
      workspace.profileId,
      commitMessage.trim(),
      commitAuthor.trim() || "admin",
      draftChanges.map((c) => c.id),
    )

    setCommitMessage("")
    setShowCommitDialog(false)
    setRefreshKey((k) => k + 1)
    onCommitCreated?.()
  }, [workspace, draftChanges, commitMessage, commitAuthor, onCommitCreated])

  if (!workspace) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-400" />
        <p className="text-sm text-muted-foreground">
          No active workspace. Activate a workspace to stage changes.
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-foreground">Staging Area</h3>
            {draftChanges.length > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px]"
              >
                {draftChanges.length}
              </Badge>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-[10px]"
                disabled={draftChanges.length === 0}
                onClick={() => setShowCommitDialog(true)}
              >
                <GitCommit className="h-3 w-3" />
                Commit
              </Button>
            </TooltipTrigger>
            <TooltipContent className="border-border bg-card text-foreground">
              <span className="text-xs">Commit all draft changes</span>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Commit dialog */}
        {showCommitDialog && (
          <div className="border-b border-border bg-card/80 p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-medium text-muted-foreground">
                  Commit Message *
                </label>
                <Input
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Describe what changed..."
                  className="h-8 text-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && commitMessage.trim()) {
                      handleCommitAll()
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-medium text-muted-foreground">
                  Author
                </label>
                <Input
                  value={commitAuthor}
                  onChange={(e) => setCommitAuthor(e.target.value)}
                  placeholder="admin"
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {draftChanges.length} change{draftChanges.length !== 1 ? "s" : ""} will be committed
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={() => setShowCommitDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 gap-1 text-[10px]"
                    disabled={!commitMessage.trim()}
                    onClick={handleCommitAll}
                  >
                    <Check className="h-3 w-3" />
                    Confirm Commit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Changes list */}
        <ScrollArea className="flex-1">
          {draftChanges.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card">
                <Check className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">No draft changes</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Edit entities in the canvas to generate staged changes.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2">
              {(["NPC", "Item", "Monster", "Quest", "Skill", "State"] as EntityType[]).map(
                (type) => {
                  const changes = grouped.get(type)
                  if (!changes || changes.length === 0) return null
                  const expanded = expandedTypes.has(type)
                  const Icon = entityIcons[type]

                  return (
                    <div key={type} className="mb-1">
                      {/* Type header */}
                      <button
                        onClick={() => toggleType(type)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/50"
                      >
                        {expanded ? (
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        )}
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">{type}</span>
                        <Badge
                          variant="secondary"
                          className="ml-auto h-4 px-1 text-[9px]"
                        >
                          {changes.length}
                        </Badge>
                      </button>

                      {/* Changes under this type */}
                      {expanded && (
                        <div className="ml-5 flex flex-col gap-0.5 py-1">
                          {changes.map((change) => {
                            const opStyle = operationColors[change.operationType]
                            const isSelected = selectedChangeId === change.id
                            return (
                              <div
                                key={change.id}
                                className={`group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-accent/80 border border-border"
                                    : "hover:bg-accent/30 border border-transparent"
                                }`}
                                onClick={() => onSelectChange?.(change)}
                              >
                                <Badge
                                  className={`h-4 px-1 text-[8px] font-mono ${opStyle.bg} ${opStyle.text} border-0`}
                                >
                                  {opStyle.label}
                                </Badge>
                                <span className="flex-1 truncate text-[11px] text-foreground">
                                  {change.entityName}
                                </span>
                                <span className="text-[9px] text-muted-foreground font-mono">
                                  #{String(change.entityId)}
                                </span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      className="ml-1 hidden rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive group-hover:block"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDiscard(change.id)
                                      }}
                                    >
                                      <XIcon className="h-3 w-3" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="border-border bg-card text-foreground">
                                    <span className="text-xs">Discard change</span>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                },
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </TooltipProvider>
  )
}
