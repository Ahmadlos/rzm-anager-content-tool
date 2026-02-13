"use client"

import { useState } from "react"
import {
  ArrowLeft,
  GitCompare,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type CompareMode = "schema" | "data"

interface DiffEntry {
  table: string
  status: "match" | "modified" | "missing_source" | "missing_target"
  sourceCount: number
  targetCount: number
  details: string
}

const mockDiffs: DiffEntry[] = [
  { table: "npc_resources", status: "modified", sourceCount: 142, targetCount: 138, details: "4 rows differ (level, faction_id columns)" },
  { table: "item_resources", status: "modified", sourceCount: 387, targetCount: 385, details: "2 new items in source, 1 tooltip mismatch" },
  { table: "monster_resources", status: "match", sourceCount: 89, targetCount: 89, details: "Fully synchronized" },
  { table: "quest_resources", status: "missing_target", sourceCount: 64, targetCount: 0, details: "Table does not exist in target" },
  { table: "skill_resources", status: "match", sourceCount: 215, targetCount: 215, details: "Fully synchronized" },
  { table: "state_resources", status: "modified", sourceCount: 48, targetCount: 46, details: "2 new state entries in source" },
]

const statusConfig = {
  match: { label: "Match", icon: CheckCircle2, className: "text-emerald-400", badgeClass: "border-emerald-500/30 text-emerald-400" },
  modified: { label: "Modified", icon: AlertTriangle, className: "text-amber-400", badgeClass: "border-amber-500/30 text-amber-400" },
  missing_source: { label: "Missing in Source", icon: XCircle, className: "text-destructive", badgeClass: "border-destructive/30 text-destructive" },
  missing_target: { label: "Missing in Target", icon: XCircle, className: "text-destructive", badgeClass: "border-destructive/30 text-destructive" },
} as const

interface CompareViewProps {
  onBack: () => void
}

export function CompareView({ onBack }: CompareViewProps) {
  const [source, setSource] = useState("production")
  const [target, setTarget] = useState("staging")
  const [mode, setMode] = useState<CompareMode>("schema")
  const [hasRun, setHasRun] = useState(true)

  const summary = {
    total: mockDiffs.length,
    matched: mockDiffs.filter((d) => d.status === "match").length,
    modified: mockDiffs.filter((d) => d.status === "modified").length,
    missing: mockDiffs.filter((d) => d.status === "missing_source" || d.status === "missing_target").length,
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
              <GitCompare className="h-3.5 w-3.5 text-foreground" />
            </div>
            <h1 className="text-sm font-semibold text-foreground">DB Comparison</h1>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-4xl">
            {/* Controls */}
            <div className="mb-6 flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">Source</label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="h-8 w-48 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="production" className="text-xs">Production - Arcadia</SelectItem>
                    <SelectItem value="staging" className="text-xs">Staging - Arcadia</SelectItem>
                    <SelectItem value="development" className="text-xs">Development Local</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ArrowRight className="mb-1 h-4 w-4 text-muted-foreground" />

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">Target</label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger className="h-8 w-48 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="production" className="text-xs">Production - Arcadia</SelectItem>
                    <SelectItem value="staging" className="text-xs">Staging - Arcadia</SelectItem>
                    <SelectItem value="development" className="text-xs">Development Local</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">Mode</label>
                <Select value={mode} onValueChange={(v) => setMode(v as CompareMode)}>
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="schema" className="text-xs">Schema</SelectItem>
                    <SelectItem value="data" className="text-xs">Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setHasRun(true)}
              >
                <RefreshCw className="h-3 w-3" />
                Run Comparison
              </Button>
            </div>

            {hasRun && (
              <>
                {/* Summary */}
                <div className="mb-4 flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{summary.total}</span> tables compared
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {summary.matched} matched
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    {summary.modified} modified
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <XCircle className="h-3 w-3" />
                    {summary.missing} missing
                  </div>
                </div>

                {/* Results */}
                <div className="rounded-lg border border-border bg-card">
                  {mockDiffs.map((diff, i) => {
                    const cfg = statusConfig[diff.status]
                    const StatusIcon = cfg.icon
                    return (
                      <div
                        key={diff.table}
                        className={`flex items-center gap-4 px-4 py-3 ${i < mockDiffs.length - 1 ? "border-b border-border" : ""}`}
                      >
                        <StatusIcon className={`h-4 w-4 ${cfg.className}`} />
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-xs font-medium text-foreground">{diff.table}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">{diff.details}</p>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span>{diff.sourceCount} rows</span>
                          <ArrowRight className="h-3 w-3" />
                          <span>{diff.targetCount} rows</span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${cfg.badgeClass}`}>
                          {cfg.label}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
