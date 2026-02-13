"use client"

import { useState } from "react"
import {
  ArrowLeft,
  GitBranch,
  Check,
  FileText,
  ChevronDown,
  ChevronRight,
  Play,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface StagedEntity {
  id: string
  name: string
  environment: string
  changeType: "created" | "modified" | "deleted"
  fields: number
}

const mockStaged: StagedEntity[] = [
  { id: "s-1", name: "Elder Marcus", environment: "NPC", changeType: "modified", fields: 3 },
  { id: "s-2", name: "Dragon Scale Shield", environment: "Item", changeType: "created", fields: 8 },
  { id: "s-3", name: "Fire Drake", environment: "Monster", changeType: "modified", fields: 2 },
  { id: "s-4", name: "Village Elder Quest", environment: "Quest", changeType: "created", fields: 6 },
  { id: "s-5", name: "Old Wooden Sword", environment: "Item", changeType: "deleted", fields: 0 },
]

const mockSqlPreview = `-- Auto-generated SQL for staged changes
BEGIN TRANSACTION;

-- NPC: Elder Marcus (modified)
UPDATE npc_resources
SET   display_name = 'Elder Marcus the Wise',
      level = 45,
      faction_id = 3
WHERE resource_id = 'npc_elder_marcus';

-- Item: Dragon Scale Shield (created)
INSERT INTO item_resources
  (resource_id, display_name, item_type, grade, tooltip)
VALUES
  ('item_dragon_scale_shield', 'Dragon Scale Shield', 'ARMOR', 'LEGENDARY',
   'Forged from the scales of an ancient dragon.');

-- Monster: Fire Drake (modified)
UPDATE monster_resources
SET   base_hp = 12000,
      base_attack = 850
WHERE resource_id = 'mon_fire_drake';

-- Quest: Village Elder Quest (created)
INSERT INTO quest_resources
  (resource_id, title, summary, status)
VALUES
  ('quest_village_elder', 'The Village Elder''s Request',
   'Help the village elder recover the stolen artifact.',
   'AVAILABLE');

-- Item: Old Wooden Sword (deleted)
DELETE FROM item_resources
WHERE resource_id = 'item_old_wooden_sword';

COMMIT;`

interface TransactionLogEntry {
  id: string
  message: string
  entities: number
  timestamp: string
  status: "success" | "failed"
}

const mockLog: TransactionLogEntry[] = [
  { id: "tx-1", message: "Added Fireball skill and state refs", entities: 3, timestamp: "3 days ago", status: "success" },
  { id: "tx-2", message: "Initial NPC batch import", entities: 6, timestamp: "5 days ago", status: "success" },
  { id: "tx-3", message: "Quest script hook test", entities: 1, timestamp: "1 week ago", status: "failed" },
]

const changeTypeConfig = {
  created: { label: "New", className: "border-emerald-500/30 text-emerald-400" },
  modified: { label: "Mod", className: "border-amber-500/30 text-amber-400" },
  deleted: { label: "Del", className: "border-destructive/30 text-destructive" },
} as const

interface CommitDeployViewProps {
  onBack: () => void
}

export function CommitDeployView({ onBack }: CommitDeployViewProps) {
  const [commitMessage, setCommitMessage] = useState("")
  const [sqlExpanded, setSqlExpanded] = useState(true)
  const [logExpanded, setLogExpanded] = useState(false)

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
              <GitBranch className="h-3.5 w-3.5 text-foreground" />
            </div>
            <h1 className="text-sm font-semibold text-foreground">{"Commit & Deploy"}</h1>
          </div>

          <div className="flex-1" />

          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            {mockStaged.length} staged changes
          </Badge>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Left: Staged Entities + Commit */}
            <div className="flex flex-col gap-4 lg:col-span-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Staged Entities</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Entities with pending changes to commit to the database.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {mockStaged.map((entity) => {
                  const cfg = changeTypeConfig[entity.changeType]
                  return (
                    <div
                      key={entity.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">
                          {entity.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {entity.environment}
                          {entity.fields > 0 && ` \u00B7 ${entity.fields} fields`}
                        </p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${cfg.className}`}>
                        {cfg.label}
                      </Badge>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="commit-msg" className="text-xs font-medium text-foreground">
                  Commit Message
                </label>
                <Textarea
                  id="commit-msg"
                  placeholder="Describe your changes..."
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="min-h-[80px] resize-none text-xs"
                />
                <Button size="sm" className="gap-1.5 self-end text-xs" disabled={!commitMessage.trim()}>
                  <Play className="h-3 w-3" />
                  Execute Commit
                </Button>
              </div>
            </div>

            {/* Right: SQL Preview + Transaction Log */}
            <div className="flex flex-col gap-4 lg:col-span-3">
              {/* SQL Preview */}
              <div className="rounded-lg border border-border bg-card">
                <button
                  className="flex w-full items-center gap-2 px-4 py-3 text-left"
                  onClick={() => setSqlExpanded(!sqlExpanded)}
                >
                  {sqlExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs font-semibold text-foreground">SQL Preview</span>
                  <Badge variant="outline" className="ml-auto text-[10px] text-muted-foreground">
                    Read-only
                  </Badge>
                </button>
                {sqlExpanded && (
                  <div className="border-t border-border">
                    <pre className="max-h-[400px] overflow-auto p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
                      {mockSqlPreview}
                    </pre>
                  </div>
                )}
              </div>

              {/* Transaction Log */}
              <div className="rounded-lg border border-border bg-card">
                <button
                  className="flex w-full items-center gap-2 px-4 py-3 text-left"
                  onClick={() => setLogExpanded(!logExpanded)}
                >
                  {logExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs font-semibold text-foreground">Transaction Log</span>
                </button>
                {logExpanded && (
                  <div className="border-t border-border">
                    {mockLog.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
                      >
                        {entry.status === "success" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs text-foreground">{entry.message}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {entry.entities} entities
                          </p>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {entry.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
