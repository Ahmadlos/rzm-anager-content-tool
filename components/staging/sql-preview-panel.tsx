"use client"

import { useMemo } from "react"
import { Code, FileText, Copy, Check } from "lucide-react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { StagedChange, Commit } from "@/lib/staging-store"
import { getCommitSQL, getChangesForCommit } from "@/lib/staging-store"

// --- SQL Syntax Highlighting (lightweight, no external deps) ---

function highlightSQL(sql: string): React.ReactNode[] {
  const keywords = new Set([
    "SELECT", "INSERT", "INTO", "UPDATE", "DELETE", "FROM", "WHERE",
    "SET", "VALUES", "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION",
    "CREATE", "ALTER", "DROP", "TABLE", "INDEX", "AND", "OR", "NOT",
    "NULL", "IN", "ON", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER",
    "ORDER", "BY", "GROUP", "HAVING", "AS", "IS", "LIKE", "BETWEEN",
    "EXEC", "EXECUTE", "DECLARE", "IF", "ELSE", "END", "GO",
    "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "CONSTRAINT",
    "DEFAULT", "CHECK", "UNIQUE", "CASCADE", "IDENTITY",
  ])

  const lines = sql.split("\n")
  return lines.map((line, lineIdx) => {
    const tokens: React.ReactNode[] = []
    let remaining = line

    // Check for comment lines
    if (remaining.trimStart().startsWith("--")) {
      return (
        <div key={lineIdx} className="flex">
          <span className="mr-4 inline-block w-8 text-right text-muted-foreground/40 select-none">
            {lineIdx + 1}
          </span>
          <span className="text-muted-foreground/60 italic">{line}</span>
        </div>
      )
    }

    // Tokenize
    const regex = /(\b[A-Z_][A-Z_0-9]*\b|N?'[^']*'|\b\d+(?:\.\d+)?\b|[(),;=*.]|--.*$|\S+)/g
    let match: RegExpExecArray | null = null
    let lastIndex = 0
    const parts: React.ReactNode[] = []
    let partIdx = 0

    // biome-ignore lint: regex exec in loop
    while ((match = regex.exec(remaining)) !== null) {
      // Add any whitespace before this token
      if (match.index > lastIndex) {
        parts.push(
          <span key={`ws-${partIdx++}`}>{remaining.slice(lastIndex, match.index)}</span>,
        )
      }

      const token = match[0]

      if (token.startsWith("--")) {
        parts.push(
          <span key={`t-${partIdx++}`} className="text-muted-foreground/60 italic">
            {token}
          </span>,
        )
      } else if (keywords.has(token.toUpperCase())) {
        parts.push(
          <span key={`t-${partIdx++}`} className="font-semibold text-cyan-400">
            {token}
          </span>,
        )
      } else if (/^N?'/.test(token)) {
        parts.push(
          <span key={`t-${partIdx++}`} className="text-amber-400">
            {token}
          </span>,
        )
      } else if (/^\d/.test(token)) {
        parts.push(
          <span key={`t-${partIdx++}`} className="text-emerald-400">
            {token}
          </span>,
        )
      } else if (token.startsWith("dbo.")) {
        parts.push(
          <span key={`t-${partIdx++}`} className="text-foreground font-medium">
            {token}
          </span>,
        )
      } else {
        parts.push(<span key={`t-${partIdx++}`}>{token}</span>)
      }

      lastIndex = match.index + token.length
    }

    // Trailing whitespace
    if (lastIndex < remaining.length) {
      parts.push(
        <span key={`trail-${partIdx}`}>{remaining.slice(lastIndex)}</span>,
      )
    }

    return (
      <div key={lineIdx} className="flex">
        <span className="mr-4 inline-block w-8 text-right text-muted-foreground/40 select-none">
          {lineIdx + 1}
        </span>
        <span className="flex-1">{parts}</span>
      </div>
    )
  })
}

// --- SQL Preview Panel ---

type PreviewMode = "entity" | "commit"

interface SQLPreviewPanelProps {
  selectedChange?: StagedChange | null
  selectedCommit?: Commit | null
}

export function SQLPreviewPanel({
  selectedChange,
  selectedCommit,
}: SQLPreviewPanelProps) {
  const [mode, setMode] = useState<PreviewMode>("entity")
  const [copied, setCopied] = useState(false)

  const sql = useMemo(() => {
    if (mode === "commit" && selectedCommit) {
      return getCommitSQL(selectedCommit.id)
    }
    if (mode === "entity" && selectedChange) {
      return selectedChange.generatedSQL
    }
    return null
  }, [mode, selectedChange, selectedCommit])

  const highlighted = useMemo(() => {
    if (!sql) return null
    return highlightSQL(sql)
  }, [sql])

  const handleCopy = useCallback(() => {
    if (!sql) return
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [sql])

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-foreground">SQL Preview</h3>
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              Read-Only
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Mode toggle */}
            <div className="flex items-center rounded-md border border-border bg-background">
              <button
                onClick={() => setMode("entity")}
                className={`flex items-center gap-1 rounded-l-md px-2 py-1 text-[10px] font-medium transition-colors ${
                  mode === "entity"
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-3 w-3" />
                Entity
              </button>
              <button
                onClick={() => setMode("commit")}
                className={`flex items-center gap-1 rounded-r-md px-2 py-1 text-[10px] font-medium transition-colors ${
                  mode === "commit"
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code className="h-3 w-3" />
                Commit
              </button>
            </div>

            {/* Copy button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={!sql}
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="border-border bg-card text-foreground">
                <span className="text-xs">{copied ? "Copied!" : "Copy SQL"}</span>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* SQL content */}
        <ScrollArea className="flex-1">
          {!sql ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card">
                <Code className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  {mode === "entity" ? "Select a staged change" : "Select a commit"}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {mode === "entity"
                    ? "Click on a change in the staging area to preview its SQL."
                    : "Select a commit from the history to preview aggregated SQL."}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <pre className="font-mono text-xs leading-5 text-foreground/80">
                <code>{highlighted}</code>
              </pre>
            </div>
          )}
        </ScrollArea>
      </div>
    </TooltipProvider>
  )
}
