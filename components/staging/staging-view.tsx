"use client"

import { useState, useCallback, useMemo } from "react"
import {
  ArrowLeft,
  FileText,
  GitCommit,
  Code,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { StagingPanel } from "./staging-panel"
import { SQLPreviewPanel } from "./sql-preview-panel"
import { CommitHistory } from "./commit-history"
import type { StagedChange, Commit } from "@/lib/staging-store"
import { getDraftChanges, getWorkspaceCommits } from "@/lib/staging-store"
import { getActiveWorkspace } from "@/lib/workspace-store"
import { WorkspaceStatusBar } from "@/components/workspace/workspace-status-bar"

type LeftTab = "staging" | "history"

interface StagingViewProps {
  onBack: () => void
  onOpenWorkspaceManager?: () => void
}

export function StagingView({ onBack, onOpenWorkspaceManager }: StagingViewProps) {
  const [leftTab, setLeftTab] = useState<LeftTab>("staging")
  const [selectedChange, setSelectedChange] = useState<StagedChange | null>(null)
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null)
  const [sqlOpen, setSqlOpen] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const workspace = useMemo(() => getActiveWorkspace(), [])

  const counts = useMemo(() => {
    if (!workspace) return { drafts: 0, commits: 0 }
    return {
      drafts: getDraftChanges(workspace.id).length,
      commits: getWorkspaceCommits(workspace.id).length,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace, refreshKey])

  const handleSelectChange = useCallback((change: StagedChange) => {
    setSelectedChange(change)
    setSelectedCommit(null)
    setSqlOpen(true)
  }, [])

  const handleSelectCommit = useCallback((commit: Commit) => {
    setSelectedCommit(commit)
    setSelectedChange(null)
    setSqlOpen(true)
  }, [])

  const handleCommitCreated = useCallback(() => {
    setRefreshKey((k) => k + 1)
    setLeftTab("history")
  }, [])

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
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground/5">
              <GitCommit className="h-3.5 w-3.5 text-foreground/70" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">
                Commit & Deploy
              </h1>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <WorkspaceStatusBar onOpenWorkspaceManager={onOpenWorkspaceManager} />
            <div className="h-5 w-px bg-border" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => setSqlOpen((v) => !v)}
                >
                  {sqlOpen ? (
                    <PanelRightClose className="h-4 w-4" />
                  ) : (
                    <PanelRightOpen className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="border-border bg-card text-foreground">
                <span className="text-xs">{sqlOpen ? "Hide SQL Preview" : "Show SQL Preview"}</span>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Main content: left tabs + right SQL preview */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel: tabs */}
          <div
            className={`flex flex-col border-r border-border ${
              sqlOpen ? "w-1/2 min-w-[360px]" : "flex-1"
            }`}
          >
            {/* Tab bar */}
            <div className="flex items-center border-b border-border bg-card/30">
              <button
                onClick={() => setLeftTab("staging")}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
                  leftTab === "staging"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Staging
                {counts.drafts > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 px-1 text-[9px]"
                  >
                    {counts.drafts}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setLeftTab("history")}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
                  leftTab === "history"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <GitCommit className="h-3.5 w-3.5" />
                History
                {counts.commits > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 px-1 text-[9px]"
                  >
                    {counts.commits}
                  </Badge>
                )}
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
              {leftTab === "staging" ? (
                <StagingPanel
                  onSelectChange={handleSelectChange}
                  onCommitCreated={handleCommitCreated}
                  selectedChangeId={selectedChange?.id}
                />
              ) : (
                <CommitHistory
                  onSelectCommit={handleSelectCommit}
                  selectedCommitId={selectedCommit?.id}
                />
              )}
            </div>
          </div>

          {/* Right panel: SQL Preview */}
          {sqlOpen && (
            <div className="flex-1 min-w-[300px]">
              <SQLPreviewPanel
                selectedChange={selectedChange}
                selectedCommit={selectedCommit}
              />
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
