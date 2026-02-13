"use client"

import { useState } from "react"
import {
  GitCompare,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SchemaDiff {
  table: string
  type: "added" | "removed" | "modified" | "unchanged"
  details?: string
  columns?: { name: string; status: "added" | "removed" | "modified" | "unchanged"; detail?: string }[]
}

const mockSchemaDiffs: SchemaDiff[] = [
  {
    table: "npc_resource",
    type: "modified",
    details: "2 columns changed",
    columns: [
      { name: "id", status: "unchanged" },
      { name: "name_text", status: "unchanged" },
      { name: "identity_text", status: "unchanged" },
      { name: "hp", status: "modified", detail: "DEFAULT changed: 100 -> 150" },
      { name: "mp", status: "unchanged" },
      { name: "weapon_item_id", status: "unchanged" },
      { name: "script_on_talk", status: "unchanged" },
      { name: "dialog_tree_id", status: "added", detail: "INT, nullable, FK to dialog_tree" },
    ],
  },
  {
    table: "item_resource",
    type: "unchanged",
  },
  {
    table: "monster_resource",
    type: "modified",
    details: "1 column removed",
    columns: [
      { name: "id", status: "unchanged" },
      { name: "name_text", status: "unchanged" },
      { name: "hp", status: "unchanged" },
      { name: "attack", status: "unchanged" },
      { name: "defense", status: "unchanged" },
      { name: "script_on_death", status: "removed", detail: "Column dropped" },
    ],
  },
  {
    table: "quest_resource",
    type: "unchanged",
  },
  {
    table: "dialog_tree",
    type: "added",
    details: "New table with 4 columns",
  },
]

interface DataDiff {
  table: string
  inserts: number
  updates: number
  deletes: number
}

const mockDataDiffs: DataDiff[] = [
  { table: "npc_resource", inserts: 5, updates: 12, deletes: 0 },
  { table: "item_resource", inserts: 0, updates: 3, deletes: 1 },
  { table: "monster_resource", inserts: 2, updates: 0, deletes: 0 },
  { table: "quest_resource", inserts: 0, updates: 0, deletes: 0 },
]

const diffTypeConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
  added: { icon: PlusCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  removed: { icon: MinusCircle, color: "text-red-400", bg: "bg-red-500/10" },
  modified: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
  unchanged: { icon: CheckCircle, color: "text-muted-foreground", bg: "bg-secondary/30" },
}

export function DBComparisonView() {
  const [source, setSource] = useState("arcadia_prod")
  const [target, setTarget] = useState("arcadia_staging")
  const [comparing, setComparing] = useState(false)
  const [hasResults, setHasResults] = useState(true)

  const handleCompare = () => {
    setComparing(true)
    setTimeout(() => {
      setComparing(false)
      setHasResults(true)
    }, 1500)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-foreground" />
          <h2 className="text-xl font-bold text-foreground">DB Comparison</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare schema or data between two database targets.
        </p>
      </div>

      {/* Source / Target Selector */}
      <div className="mb-6 flex items-end gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex-1">
          <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Source</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-card">
              <SelectItem value="arcadia_prod" className="text-xs">Arcadia Production</SelectItem>
              <SelectItem value="arcadia_staging" className="text-xs">Staging Server</SelectItem>
              <SelectItem value="arcadia_dev" className="text-xs">Local Dev</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex h-9 items-center">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Target</Label>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-card">
              <SelectItem value="arcadia_prod" className="text-xs">Arcadia Production</SelectItem>
              <SelectItem value="arcadia_staging" className="text-xs">Staging Server</SelectItem>
              <SelectItem value="arcadia_dev" className="text-xs">Local Dev</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          className="gap-1.5 text-xs"
          onClick={handleCompare}
          disabled={comparing || source === target}
        >
          {comparing ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Comparing...
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3" />
              Compare
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {hasResults && (
        <Tabs defaultValue="schema" className="w-full">
          <TabsList className="mb-4 bg-secondary/50">
            <TabsTrigger value="schema" className="text-xs">
              Schema Diff
            </TabsTrigger>
            <TabsTrigger value="data" className="text-xs">
              Data Diff
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schema">
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="flex flex-col gap-3">
                {mockSchemaDiffs.map((diff) => {
                  const cfg = diffTypeConfig[diff.type]
                  const DiffIcon = cfg.icon
                  return (
                    <div key={diff.table} className="rounded-lg border border-border bg-card">
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                          <DiffIcon className={`h-4 w-4 ${cfg.color}`} />
                          <span className="font-mono text-xs font-medium text-foreground">
                            {diff.table}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] ${cfg.color} border-current/20`}
                          >
                            {diff.type.toUpperCase()}
                          </Badge>
                        </div>
                        {diff.details && (
                          <span className="text-[11px] text-muted-foreground">{diff.details}</span>
                        )}
                      </div>
                      {diff.columns && (
                        <div className="border-t border-border">
                          {diff.columns.map((col) => {
                            const colCfg = diffTypeConfig[col.status]
                            const ColIcon = colCfg.icon
                            return (
                              <div
                                key={col.name}
                                className={`flex items-center justify-between border-b border-border px-4 py-1.5 last:border-b-0 ${col.status !== "unchanged" ? colCfg.bg : ""}`}
                              >
                                <div className="flex items-center gap-2">
                                  <ColIcon className={`h-3 w-3 ${colCfg.color}`} />
                                  <span className="font-mono text-[11px] text-foreground">{col.name}</span>
                                </div>
                                {col.detail && (
                                  <span className={`text-[10px] ${colCfg.color}`}>{col.detail}</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="data">
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="rounded-lg border border-border bg-card">
                <div className="grid grid-cols-4 gap-2 border-b border-border bg-secondary/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <div>Table</div>
                  <div>Inserts</div>
                  <div>Updates</div>
                  <div>Deletes</div>
                </div>
                {mockDataDiffs.map((diff) => {
                  const hasChanges = diff.inserts > 0 || diff.updates > 0 || diff.deletes > 0
                  return (
                    <div
                      key={diff.table}
                      className={`grid grid-cols-4 items-center gap-2 border-b border-border px-4 py-2.5 last:border-b-0 ${hasChanges ? "" : "opacity-50"}`}
                    >
                      <span className="font-mono text-xs text-foreground">{diff.table}</span>
                      <span className={`text-xs ${diff.inserts > 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                        {diff.inserts > 0 ? `+${diff.inserts}` : "0"}
                      </span>
                      <span className={`text-xs ${diff.updates > 0 ? "text-amber-400" : "text-muted-foreground"}`}>
                        {diff.updates > 0 ? `~${diff.updates}` : "0"}
                      </span>
                      <span className={`text-xs ${diff.deletes > 0 ? "text-red-400" : "text-muted-foreground"}`}>
                        {diff.deletes > 0 ? `-${diff.deletes}` : "0"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
