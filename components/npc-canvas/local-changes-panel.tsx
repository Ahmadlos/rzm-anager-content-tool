"use client"

import { useState } from "react"
import {
  GitBranch,
  ChevronDown,
  ChevronRight,
  Circle,
  Plus,
  Minus,
  Pencil,
  RotateCcw,
  ArrowUpFromLine,
  ArrowDownFromLine,
  FileText,
  Link2,
  X as XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  type TrackedEntity,
  type EntityDiff,
  type FieldDiff,
  type ConnectionDiff,
  stageEntity,
  unstageEntity,
  revertToSnapshot,
  getAllTrackedEntities,
  getModifiedCount,
  getStagedCount,
} from "@/lib/npc-tracking-store"
import type { Node, Edge } from "@xyflow/react"

interface LocalChangesPanelProps {
  trackedEntities: TrackedEntity[]
  onRevert: (entityId: string, nodes: Node[], edges: Edge[]) => void
  onSelectEntity: (entityId: string) => void
  onRefresh: () => void
}

function DiffIcon({ type }: { type: "added" | "modified" | "removed" }) {
  if (type === "added") return <Plus className="h-3 w-3 text-emerald-400" />
  if (type === "removed") return <Minus className="h-3 w-3 text-red-400" />
  return <Pencil className="h-3 w-3 text-amber-400" />
}

function DiffBadge({ type }: { type: "added" | "modified" | "removed" }) {
  const colors = {
    added: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    modified: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    removed: "bg-red-500/15 text-red-400 border-red-500/30",
  }
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${colors[type]}`}>
      {type}
    </Badge>
  )
}

function formatValue(val: unknown): string {
  if (val === undefined || val === null) return "(none)"
  if (typeof val === "string") return `"${val}"`
  if (Array.isArray(val)) return `[${val.map((v) => `"${v}"`).join(", ")}]`
  return String(val)
}

function FieldDiffRow({ diff }: { diff: FieldDiff }) {
  return (
    <div className="flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50 transition-colors">
      <DiffIcon type={diff.diffType} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-foreground truncate">{diff.field}</span>
          <DiffBadge type={diff.diffType} />
        </div>
        {diff.diffType === "modified" && (
          <div className="mt-1 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-red-400/70 font-mono line-through truncate max-w-[180px]">
                {formatValue(diff.oldValue)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-emerald-400/70 font-mono truncate max-w-[180px]">
                {formatValue(diff.newValue)}
              </span>
            </div>
          </div>
        )}
        {diff.diffType === "added" && (
          <span className="text-[10px] text-emerald-400/70 font-mono truncate block max-w-[180px]">
            {formatValue(diff.newValue)}
          </span>
        )}
        {diff.diffType === "removed" && (
          <span className="text-[10px] text-red-400/70 font-mono line-through truncate block max-w-[180px]">
            {formatValue(diff.oldValue)}
          </span>
        )}
      </div>
    </div>
  )
}

function ConnectionDiffRow({ diff }: { diff: ConnectionDiff }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50 transition-colors">
      <Link2 className="h-3 w-3 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-foreground truncate">
            {diff.source} &rarr; {diff.target}
          </span>
          <DiffBadge type={diff.diffType} />
        </div>
      </div>
    </div>
  )
}

function EntityDiffSection({
  entity,
  onStage,
  onUnstage,
  onRevert,
  onSelect,
}: {
  entity: TrackedEntity
  onStage: (id: string) => void
  onUnstage: (id: string) => void
  onRevert: (id: string) => void
  onSelect: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const diff = entity.diff

  if (!diff || !diff.hasChanges) return null

  const totalChanges = diff.fieldDiffs.length + diff.connectionDiffs.length

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-accent/50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
        <Circle className={`h-2 w-2 shrink-0 ${entity.isModified ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />
        <span className="text-xs font-medium text-foreground truncate flex-1">{entity.entityName}</span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground">
          {totalChanges}
        </Badge>
        {entity.isStaged && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
            staged
          </Badge>
        )}
      </button>

      {expanded && (
        <div className="border-t border-border">
          {/* Field diffs */}
          {diff.fieldDiffs.length > 0 && (
            <div className="px-2 py-1.5">
              <div className="flex items-center gap-1.5 px-2 py-1">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Field Changes ({diff.fieldDiffs.length})
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {diff.fieldDiffs.map((fd, i) => (
                  <FieldDiffRow key={`${fd.field}-${i}`} diff={fd} />
                ))}
              </div>
            </div>
          )}

          {/* Connection diffs */}
          {diff.connectionDiffs.length > 0 && (
            <div className="px-2 py-1.5 border-t border-border">
              <div className="flex items-center gap-1.5 px-2 py-1">
                <Link2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Connection Changes ({diff.connectionDiffs.length})
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {diff.connectionDiffs.map((cd, i) => (
                  <ConnectionDiffRow key={`${cd.edgeId}-${i}`} diff={cd} />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1.5 border-t border-border px-2 py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-[11px]"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect(entity.entityId)
                  }}
                >
                  <FileText className="h-3 w-3" />
                  View
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-card border-border text-foreground">
                <span className="text-xs">Focus entity on canvas</span>
              </TooltipContent>
            </Tooltip>

            {entity.isStaged ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-[11px] text-amber-400"
                    onClick={(e) => {
                      e.stopPropagation()
                      onUnstage(entity.entityId)
                    }}
                  >
                    <ArrowDownFromLine className="h-3 w-3" />
                    Unstage
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-card border-border text-foreground">
                  <span className="text-xs">Remove from staging</span>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-[11px] text-emerald-400"
                    onClick={(e) => {
                      e.stopPropagation()
                      onStage(entity.entityId)
                    }}
                  >
                    <ArrowUpFromLine className="h-3 w-3" />
                    Stage
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-card border-border text-foreground">
                  <span className="text-xs">Stage this entity for commit</span>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-[11px] text-red-400"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRevert(entity.entityId)
                  }}
                >
                  <RotateCcw className="h-3 w-3" />
                  Revert
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-card border-border text-foreground">
                <span className="text-xs">Revert to last snapshot</span>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  )
}

export function LocalChangesPanel({
  trackedEntities,
  onRevert,
  onSelectEntity,
  onRefresh,
}: LocalChangesPanelProps) {
  const modifiedEntities = trackedEntities.filter((e) => e.isModified)
  const stagedEntitiesList = trackedEntities.filter((e) => e.isStaged)
  const modifiedCount = modifiedEntities.length
  const stagedCount = stagedEntitiesList.length

  const handleStage = (entityId: string) => {
    stageEntity(entityId)
    onRefresh()
  }

  const handleUnstage = (entityId: string) => {
    unstageEntity(entityId)
    onRefresh()
  }

  const handleRevert = (entityId: string) => {
    const result = revertToSnapshot(entityId)
    if (result) {
      onRevert(entityId, result.nodes, result.edges)
    }
    onRefresh()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Local Changes</span>
        </div>
        <div className="flex items-center gap-1.5">
          {modifiedCount > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/15 text-amber-400 border-amber-500/30">
              {modifiedCount} modified
            </Badge>
          )}
          {stagedCount > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
              {stagedCount} staged
            </Badge>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-3">
          {modifiedEntities.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary">
                <GitBranch className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">No Changes</p>
                <p className="text-[11px] text-muted-foreground">
                  Edit nodes to see changes appear here
                </p>
              </div>
            </div>
          )}

          {/* Staged section */}
          {stagedEntitiesList.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 px-1">
                <ArrowUpFromLine className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  Staged Changes
                </span>
              </div>
              {stagedEntitiesList
                .filter((e) => e.isModified)
                .map((entity) => (
                  <EntityDiffSection
                    key={entity.entityId}
                    entity={entity}
                    onStage={handleStage}
                    onUnstage={handleUnstage}
                    onRevert={handleRevert}
                    onSelect={onSelectEntity}
                  />
                ))}
              <Separator className="my-1" />
            </>
          )}

          {/* Unstaged section */}
          {modifiedEntities.filter((e) => !e.isStaged).length > 0 && (
            <>
              <div className="flex items-center gap-1.5 px-1">
                <Circle className="h-3 w-3 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Unstaged Changes
                </span>
              </div>
              {modifiedEntities
                .filter((e) => !e.isStaged)
                .map((entity) => (
                  <EntityDiffSection
                    key={entity.entityId}
                    entity={entity}
                    onStage={handleStage}
                    onUnstage={handleUnstage}
                    onRevert={handleRevert}
                    onSelect={onSelectEntity}
                  />
                ))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer info */}
      <div className="border-t border-border px-3 py-2">
        <p className="text-[10px] text-muted-foreground text-center">
          Commits happen at Workspace level
        </p>
      </div>
    </div>
  )
}
