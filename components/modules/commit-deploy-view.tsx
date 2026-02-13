"use client"

import { useState } from "react"
import {
  GitBranch,
  FileText,
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  Code,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface StagedEntity {
  id: string
  name: string
  type: string
  environment: string
  action: "insert" | "update" | "delete"
  staged: boolean
}

interface TransactionLog {
  id: string
  message: string
  timestamp: string
  status: "success" | "error" | "pending"
  entities: number
}

const initialStaged: StagedEntity[] = [
  { id: "s1", name: "Elder Marcus", type: "NPCResource", environment: "NPC", action: "update", staged: true },
  { id: "s2", name: "Dragon Scale Shield", type: "ItemResource", environment: "Item", action: "insert", staged: true },
  { id: "s3", name: "Fire Drake", type: "MonsterResource", environment: "Monster", action: "update", staged: true },
  { id: "s4", name: "Fireball", type: "SkillResource", environment: "Skill", action: "insert", staged: false },
  { id: "s5", name: "Ancient Key", type: "ItemResource", environment: "Item", action: "delete", staged: false },
]

const initialLogs: TransactionLog[] = [
  { id: "t1", message: "Deployed 3 NPC entities to staging", timestamp: "Today 14:22", status: "success", entities: 3 },
  { id: "t2", message: "Updated item drop tables", timestamp: "Today 11:05", status: "success", entities: 5 },
  { id: "t3", message: "Failed: FK constraint on skill_id", timestamp: "Yesterday 18:40", status: "error", entities: 1 },
  { id: "t4", message: "Initial monster batch insert", timestamp: "Yesterday 09:15", status: "success", entities: 12 },
]

const actionColors: Record<string, string> = {
  insert: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  update: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  delete: "bg-red-500/10 text-red-400 border-red-500/20",
}

const statusIcons: Record<string, { icon: typeof CheckCircle; color: string }> = {
  success: { icon: CheckCircle, color: "text-emerald-400" },
  error: { icon: AlertTriangle, color: "text-destructive" },
  pending: { icon: Clock, color: "text-amber-400" },
}

export function CommitDeployView() {
  const [staged, setStaged] = useState<StagedEntity[]>(initialStaged)
  const [commitMessage, setCommitMessage] = useState("")
  const [executing, setExecuting] = useState(false)
  const [logs, setLogs] = useState<TransactionLog[]>(initialLogs)
  const [showPreview, setShowPreview] = useState(false)

  const stagedCount = staged.filter((s) => s.staged).length

  const toggleStaged = (id: string) => {
    setStaged((prev) =>
      prev.map((s) => (s.id === id ? { ...s, staged: !s.staged } : s)),
    )
  }

  const handleExecute = () => {
    if (!commitMessage.trim() || stagedCount === 0) return
    setExecuting(true)
    setTimeout(() => {
      const newLog: TransactionLog = {
        id: `t-${Date.now()}`,
        message: commitMessage.trim(),
        timestamp: "Just now",
        status: "success",
        entities: stagedCount,
      }
      setLogs((prev) => [newLog, ...prev])
      setStaged((prev) => prev.filter((s) => !s.staged))
      setCommitMessage("")
      setExecuting(false)
    }, 2000)
  }

  const sqlPreview = staged
    .filter((s) => s.staged)
    .map((s) => {
      if (s.action === "insert") return `INSERT INTO ${s.type} (name, ...) VALUES ('${s.name}', ...);`
      if (s.action === "update") return `UPDATE ${s.type} SET ... WHERE name = '${s.name}';`
      return `DELETE FROM ${s.type} WHERE name = '${s.name}';`
    })
    .join("\n")

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-foreground" />
          <h2 className="text-xl font-bold text-foreground">{"Commit & Deploy"}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Review staged changes, preview SQL, and commit to the database.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: Staged + Commit */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          {/* Staged Entities */}
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-foreground">
                  Staged Entities
                </h3>
                <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                  {stagedCount}/{staged.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] text-muted-foreground"
                onClick={() =>
                  setStaged((prev) => prev.map((s) => ({ ...s, staged: true })))
                }
              >
                Stage All
              </Button>
            </div>
            <ScrollArea className="max-h-64">
              <div className="flex flex-col">
                {staged.map((entity) => (
                  <div
                    key={entity.id}
                    className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
                  >
                    <Checkbox
                      checked={entity.staged}
                      onCheckedChange={() => toggleStaged(entity.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">
                          {entity.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] ${actionColors[entity.action]}`}
                        >
                          {entity.action.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {entity.type} - {entity.environment} Environment
                      </p>
                    </div>
                  </div>
                ))}
                {staged.length === 0 && (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-xs text-muted-foreground">
                      No entities to stage
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* SQL Preview */}
          <div className="rounded-lg border border-border bg-card">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-foreground">SQL Preview</h3>
              </div>
              <ChevronRight
                className={`h-4 w-4 text-muted-foreground transition-transform ${showPreview ? "rotate-90" : ""}`}
              />
            </button>
            {showPreview && (
              <div className="border-t border-border px-4 py-3">
                <pre className="max-h-40 overflow-auto rounded-md bg-secondary/50 p-3 font-mono text-[11px] leading-relaxed text-foreground">
                  {sqlPreview || "-- No staged entities selected"}
                </pre>
              </div>
            )}
          </div>

          {/* Commit Message + Execute */}
          <div className="rounded-lg border border-border bg-card p-4">
            <Label className="mb-2 block text-xs font-semibold text-foreground">
              Commit Message
            </Label>
            <Textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Describe your changes..."
              className="mb-3 text-xs"
              rows={3}
            />
            <Button
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleExecute}
              disabled={executing || !commitMessage.trim() || stagedCount === 0}
            >
              {executing ? (
                <>
                  <Clock className="h-3 w-3 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Execute Commit ({stagedCount} entities)
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right: Transaction Log */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-xs font-semibold text-foreground">
                Transaction Log
              </h3>
            </div>
            <ScrollArea className="max-h-[calc(100vh-320px)]">
              <div className="flex flex-col">
                {logs.map((log) => {
                  const st = statusIcons[log.status]
                  const StatusIcon = st.icon
                  return (
                    <div
                      key={log.id}
                      className="flex gap-3 border-b border-border px-4 py-3 last:border-b-0"
                    >
                      <StatusIcon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${st.color}`} />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground">{log.message}</p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{log.timestamp}</span>
                          <span>{log.entities} entities</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}
