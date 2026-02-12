"use client"

import React, { useState } from "react"
import {
  X,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  GitCompare,
  Plus,
  Minus,
  Pencil,
  Link,
  Trash2,
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
import type {
  ChangesSummary,
  FieldChange,
  NodeChange,
  EdgeChange,
  ChangeType,
} from "@/lib/change-tracker"

// ---- Change Type Styling ----

const changeTypeConfig: Record<
  ChangeType,
  { label: string; color: string; bgColor: string; icon: typeof Plus }
> = {
  added: {
    label: "Added",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    icon: Plus,
  },
  removed: {
    label: "Removed",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    icon: Minus,
  },
  modified: {
    label: "Modified",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    icon: Pencil,
  },
}

// ---- Sub-components ----

function ChangeTypeBadge({ type }: { type: ChangeType }) {
  const config = changeTypeConfig[type]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium ${config.bgColor} ${config.color}`}
    >
      <config.icon className="h-2.5 w-2.5" />
      {config.label}
    </span>
  )
}

function ValueDisplay({ value, type }: { value: unknown; type: "old" | "new" }) {
  const displayValue =
    value === undefined
      ? "(empty)"
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value)

  const truncated = displayValue.length > 60 ? `${displayValue.slice(0, 60)}...` : displayValue

  return (
    <span
      className={`inline-block max-w-[160px] truncate rounded px-1.5 py-0.5 font-mono text-[10px] ${
        type === "old"
          ? "bg-red-500/10 text-red-300 line-through"
          : "bg-emerald-500/10 text-emerald-300"
      }`}
    >
      {truncated}
    </span>
  )
}

function FieldChangeRow({
  change,
  onRevertField,
}: {
  change: FieldChange
  onRevertField?: (nodeId: string, fieldName: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="group rounded-md border border-border/50 bg-background/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-accent/30"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 truncate font-mono text-[11px] text-foreground">
          {change.fieldLabel}
        </span>
        <ChangeTypeBadge type={change.changeType} />
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-2.5 py-2">
          <div className="flex flex-col gap-1.5">
            {change.changeType !== "added" && (
              <div className="flex items-center gap-2">
                <span className="w-8 text-[9px] font-medium text-red-400">OLD</span>
                <ValueDisplay value={change.oldValue} type="old" />
              </div>
            )}
            {change.changeType !== "removed" && (
              <div className="flex items-center gap-2">
                <span className="w-8 text-[9px] font-medium text-emerald-400">NEW</span>
                <ValueDisplay value={change.newValue} type="new" />
              </div>
            )}
          </div>
          {onRevertField && change.changeType !== "added" && (
            <div className="mt-2 flex justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRevertField(change.nodeId, change.fieldName)
                    }}
                    className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Revert
                  </button>
                </TooltipTrigger>
                <TooltipContent className="border-border bg-card text-foreground">
                  <span className="text-xs">Revert this field to saved value</span>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NodeChangeGroup({
  nodeId,
  nodeLabel,
  nodeCategory,
  nodeChangeType,
  fieldChanges,
  onRevertField,
  onNavigateToNode,
}: {
  nodeId: string
  nodeLabel: string
  nodeCategory: string
  nodeChangeType?: ChangeType
  fieldChanges: FieldChange[]
  onRevertField?: (nodeId: string, fieldName: string) => void
  onNavigateToNode?: (nodeId: string) => void
}) {
  const [expanded, setExpanded] = useState(true)

  const changeCount = fieldChanges.length + (nodeChangeType ? 1 : 0)

  return (
    <div className="rounded-lg border border-border bg-card/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent/20"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          <span className="truncate text-xs font-semibold text-foreground">
            {nodeLabel}
          </span>
          <span className="shrink-0 text-[9px] text-muted-foreground">
            {nodeCategory}
          </span>
        </div>
        {nodeChangeType && <ChangeTypeBadge type={nodeChangeType} />}
        <Badge
          variant="outline"
          className="shrink-0 border-border px-1.5 text-[9px] text-muted-foreground"
        >
          {changeCount}
        </Badge>
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-2 py-2">
          {onNavigateToNode && (
            <button
              onClick={() => onNavigateToNode(nodeId)}
              className="mb-2 flex w-full items-center gap-1.5 rounded px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <GitCompare className="h-3 w-3" />
              Focus this node on canvas
            </button>
          )}

          {nodeChangeType === "added" && (
            <div className="mb-2 rounded-md bg-emerald-500/5 px-2.5 py-2 text-[10px] text-emerald-400">
              This node was added in the current session.
            </div>
          )}

          {nodeChangeType === "removed" && (
            <div className="mb-2 rounded-md bg-red-500/5 px-2.5 py-2 text-[10px] text-red-400">
              This node was removed from the graph.
            </div>
          )}

          {fieldChanges.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {fieldChanges.map((fc) => (
                <FieldChangeRow
                  key={`${fc.nodeId}-${fc.fieldName}`}
                  change={fc}
                  onRevertField={onRevertField}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EdgeChangeItem({ change }: { change: EdgeChange }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border/50 bg-background/50 px-2.5 py-2">
      <Link className="h-3 w-3 shrink-0 text-muted-foreground" />
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <span className="truncate font-mono text-[10px] text-foreground">
          {change.source} {"=>"} {change.target}
        </span>
        {change.sourceHandle && (
          <span className="truncate text-[9px] text-muted-foreground">
            {change.sourceHandle} {"=>"} {change.targetHandle}
          </span>
        )}
      </div>
      <ChangeTypeBadge type={change.changeType} />
    </div>
  )
}

// ---- Main Changes Panel ----

interface ChangesPanelProps {
  changes: ChangesSummary
  onClose: () => void
  onRevertField?: (nodeId: string, fieldName: string) => void
  onRevertAll?: () => void
  onClearChanges?: () => void
  onNavigateToNode?: (nodeId: string) => void
}

export function ChangesPanel({
  changes,
  onClose,
  onRevertField,
  onRevertAll,
  onClearChanges,
  onNavigateToNode,
}: ChangesPanelProps) {
  const [activeTab, setActiveTab] = useState<"structured" | "raw">("structured")

  // Group field changes by node
  const fieldsByNode = new Map<string, FieldChange[]>()
  for (const fc of changes.fieldChanges) {
    if (!fieldsByNode.has(fc.nodeId)) {
      fieldsByNode.set(fc.nodeId, [])
    }
    fieldsByNode.get(fc.nodeId)!.push(fc)
  }

  // Build node groups
  const nodeGroupIds = new Set<string>()
  for (const nc of changes.nodeChanges) nodeGroupIds.add(nc.nodeId)
  for (const fc of changes.fieldChanges) nodeGroupIds.add(fc.nodeId)

  const nodeGroups = Array.from(nodeGroupIds).map((nodeId) => {
    const nodeChange = changes.nodeChanges.find((nc) => nc.nodeId === nodeId)
    const fieldChanges = fieldsByNode.get(nodeId) || []

    const label =
      nodeChange?.nodeLabel ||
      (fieldChanges[0]?.nodeLabel ?? nodeId)
    const category =
      nodeChange?.nodeCategory ||
      (fieldChanges[0]?.nodeCategory ?? "unknown")

    return {
      nodeId,
      nodeLabel: label,
      nodeCategory: category,
      nodeChangeType: nodeChange?.changeType,
      fieldChanges,
    }
  })

  return (
    <div className="flex h-full w-72 flex-col border-l border-border bg-card/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-muted-foreground" />
          <div>
            <h3 className="text-xs font-semibold text-foreground">Changes</h3>
            <p className="text-[10px] text-muted-foreground">
              {changes.totalChanges} change{changes.totalChanges !== 1 ? "s" : ""} detected
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border px-2">
        <button
          onClick={() => setActiveTab("structured")}
          className={`px-3 py-2 text-[10px] font-medium transition-colors ${
            activeTab === "structured"
              ? "border-b-2 border-foreground text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Structured
        </button>
        <button
          onClick={() => setActiveTab("raw")}
          className={`px-3 py-2 text-[10px] font-medium transition-colors ${
            activeTab === "raw"
              ? "border-b-2 border-foreground text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Raw JSON
        </button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {!changes.hasChanges ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12">
            <GitCompare className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">No changes detected</p>
            <p className="text-center text-[10px] text-muted-foreground/60">
              Modifications to nodes, fields, and connections will appear here.
            </p>
          </div>
        ) : activeTab === "structured" ? (
          <div className="flex flex-col gap-2 p-3">
            {/* Summary counts */}
            <div className="flex items-center gap-2 rounded-md bg-background/50 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-muted-foreground">
                  {changes.nodeChanges.filter((c) => c.changeType === "added").length +
                    changes.fieldChanges.filter((c) => c.changeType === "added").length +
                    changes.edgeChanges.filter((c) => c.changeType === "added").length}{" "}
                  added
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-[10px] text-muted-foreground">
                  {changes.fieldChanges.filter((c) => c.changeType === "modified").length +
                    changes.edgeChanges.filter((c) => c.changeType === "modified").length}{" "}
                  modified
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-400" />
                <span className="text-[10px] text-muted-foreground">
                  {changes.nodeChanges.filter((c) => c.changeType === "removed").length +
                    changes.fieldChanges.filter((c) => c.changeType === "removed").length +
                    changes.edgeChanges.filter((c) => c.changeType === "removed").length}{" "}
                  removed
                </span>
              </div>
            </div>

            {/* Node changes */}
            {nodeGroups.length > 0 && (
              <>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Nodes
                </p>
                {nodeGroups.map((group) => (
                  <NodeChangeGroup
                    key={group.nodeId}
                    {...group}
                    onRevertField={onRevertField}
                    onNavigateToNode={onNavigateToNode}
                  />
                ))}
              </>
            )}

            {/* Edge changes */}
            {changes.edgeChanges.length > 0 && (
              <>
                <Separator className="my-1" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Connections
                </p>
                <div className="flex flex-col gap-1.5">
                  {changes.edgeChanges.map((ec) => (
                    <EdgeChangeItem key={ec.edgeId} change={ec} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="p-3">
            <pre className="overflow-x-auto rounded-md bg-background/80 p-3 font-mono text-[10px] leading-relaxed text-foreground/80">
              {JSON.stringify(
                {
                  nodeChanges: changes.nodeChanges,
                  fieldChanges: changes.fieldChanges,
                  edgeChanges: changes.edgeChanges,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </ScrollArea>

      {/* Footer Actions */}
      {changes.hasChanges && (
        <div className="flex items-center gap-2 border-t border-border px-3 py-2.5">
          {onRevertAll && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 bg-transparent text-[10px]"
                  onClick={onRevertAll}
                >
                  <RotateCcw className="h-3 w-3" />
                  Revert All
                </Button>
              </TooltipTrigger>
              <TooltipContent className="border-border bg-card text-foreground">
                <span className="text-xs">Revert all changes to last saved state</span>
              </TooltipContent>
            </Tooltip>
          )}
          {onClearChanges && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 bg-transparent text-[10px]"
                  onClick={onClearChanges}
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </Button>
              </TooltipTrigger>
              <TooltipContent className="border-border bg-card text-foreground">
                <span className="text-xs">Accept current state as new baseline</span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  )
}
