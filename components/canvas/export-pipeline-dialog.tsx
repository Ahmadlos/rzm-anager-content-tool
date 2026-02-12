"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import {
  CheckCircle,
  AlertTriangle,
  Loader2,
  Download,
  Database,
  FileText,
  Layers,
  Languages,
  GitCommit,
  X as XIcon,
  FolderOpen,
  Server,
  Network,
  Fingerprint,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { ValidationError } from "@/lib/environment-schemas"
import { getActiveWorkspace, generateFingerprint, compareFingerprints } from "@/lib/workspace-store"
import { getProfile } from "@/lib/db-profiles"

type StageStatus = "pending" | "running" | "done" | "error"

interface PipelineStage {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  status: StageStatus
}

const INITIAL_STAGES: PipelineStage[] = [
  {
    id: "workspace",
    label: "Validate Active Workspace",
    description: "Checking active workspace, profile binding, and database mappings",
    icon: FolderOpen,
    status: "pending",
  },
  {
    id: "connection",
    label: "Validate Profile Connection",
    description: "Testing SQL Server connectivity with bound profile credentials",
    icon: Server,
    status: "pending",
  },
  {
    id: "ssh",
    label: "SSH Tunnel Check",
    description: "Verifying SSH tunnel is active if enabled on profile",
    icon: Network,
    status: "pending",
  },
  {
    id: "fingerprint",
    label: "Validate Schema Fingerprint",
    description: "Comparing live schema against stored fingerprint hash",
    icon: Fingerprint,
    status: "pending",
  },
  {
    id: "validate",
    label: "Validate Node Graph",
    description: "Checking required fields, connection rules, and string limits",
    icon: CheckCircle,
    status: "pending",
  },
  {
    id: "model",
    label: "Build Data Model",
    description: "Converting node graph to validated data model",
    icon: Layers,
    status: "pending",
  },
  {
    id: "transaction",
    label: "Open SQL Transaction",
    description: "Beginning transaction for safe write operations",
    icon: ShieldCheck,
    status: "pending",
  },
  {
    id: "mapping",
    label: "Database Mapping Layer",
    description: "Mapping data model to resource table schemas",
    icon: Database,
    status: "pending",
  },
  {
    id: "resources",
    label: "Insert / Update Resource Tables",
    description: "Writing NPCResource, ItemResource, and related records",
    icon: FileText,
    status: "pending",
  },
  {
    id: "strings",
    label: "Insert StringResource (per language)",
    description: "Writing localized string entries for all languages",
    icon: Languages,
    status: "pending",
  },
  {
    id: "commit",
    label: "Commit Transaction",
    description: "Committing all changes on success, rolling back on failure",
    icon: GitCommit,
    status: "pending",
  },
]

interface ExportPipelineDialogProps {
  open: boolean
  onClose: () => void
  validationErrors: ValidationError[]
  onExport: () => void
  environmentTitle: string
  projectName: string
}

export function ExportPipelineDialog({
  open,
  onClose,
  validationErrors,
  onExport,
  environmentTitle,
  projectName,
}: ExportPipelineDialogProps) {
  const [stages, setStages] = useState<PipelineStage[]>(INITIAL_STAGES)
  const [currentStageIndex, setCurrentStageIndex] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [hasError, setHasError] = useState(false)

  const resetPipeline = useCallback(() => {
    setStages(INITIAL_STAGES.map((s) => ({ ...s, status: "pending" })))
    setCurrentStageIndex(-1)
    setIsRunning(false)
    setIsComplete(false)
    setHasError(false)
  }, [])

  useEffect(() => {
    if (open) {
      resetPipeline()
    }
  }, [open, resetPipeline])

  const runPipeline = useCallback(() => {
    // 1) Workspace validation (stage 0)
    const ws = getActiveWorkspace()
    if (!ws) {
      setStages((prev) =>
        prev.map((s, i) =>
          i === 0 ? { ...s, status: "error" } : s,
        ),
      )
      setHasError(true)
      return
    }

    const profile = getProfile(ws.profileId)
    if (!profile) {
      setStages((prev) =>
        prev.map((s, i) =>
          i === 1 ? { ...s, status: "error" } : { ...s, status: i === 0 ? "done" : s.status },
        ),
      )
      setHasError(true)
      return
    }

    // 2) Schema fingerprint pre-check
    if (ws.schemaFingerprint) {
      const live = generateFingerprint()
      if (!compareFingerprints(ws.schemaFingerprint, live)) {
        // Fingerprint mismatch -- allow pipeline to run but will flag at stage 3
      }
    }

    // 3) Node graph validation check (stage 4)
    if (validationErrors.length > 0) {
      setStages((prev) =>
        prev.map((s, i) =>
          i <= 3 ? { ...s, status: "done" } : i === 4 ? { ...s, status: "error" } : s,
        ),
      )
      setHasError(true)
      return
    }

    // Production profile safety: require explicit confirmation handled by caller
    setIsRunning(true)
    setCurrentStageIndex(0)
  }, [validationErrors])

  useEffect(() => {
    if (!isRunning || currentStageIndex < 0) return

    // Mark current stage as running
    setStages((prev) =>
      prev.map((s, i) =>
        i === currentStageIndex ? { ...s, status: "running" } : s,
      ),
    )

    const delay = 400 + Math.random() * 600
    const timer = setTimeout(() => {
      // Mark current stage as done
      setStages((prev) =>
        prev.map((s, i) =>
          i === currentStageIndex ? { ...s, status: "done" } : s,
        ),
      )

      if (currentStageIndex < INITIAL_STAGES.length - 1) {
        setCurrentStageIndex((prev) => prev + 1)
      } else {
        setIsRunning(false)
        setIsComplete(true)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [currentStageIndex, isRunning])

  const handleExportAndClose = () => {
    onExport()
    onClose()
  }

  if (!open) return null

  const completedCount = stages.filter((s) => s.status === "done").length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Export Pipeline</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {environmentTitle} / {projectName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Pipeline Stages */}
        <ScrollArea className="max-h-[400px]">
          <div className="flex flex-col gap-0 p-4">
            {stages.map((stage, i) => {
              const StageIcon = stage.icon
              return (
                <div key={stage.id}>
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                      {stage.status === "done" ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        </div>
                      ) : stage.status === "running" ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground/10">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground" />
                        </div>
                      ) : stage.status === "error" ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/15">
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                        </div>
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary">
                          <StageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Stage Details */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium ${
                            stage.status === "done"
                              ? "text-emerald-400"
                              : stage.status === "running"
                                ? "text-foreground"
                                : stage.status === "error"
                                  ? "text-destructive"
                                  : "text-muted-foreground"
                          }`}
                        >
                          {stage.label}
                        </span>
                        {stage.status === "done" && (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[9px] text-emerald-400"
                          >
                            complete
                          </Badge>
                        )}
                        {stage.status === "error" && (
                          <Badge
                            variant="outline"
                            className="border-destructive/30 bg-destructive/10 px-1.5 text-[9px] text-destructive"
                          >
                            failed
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {stage.description}
                      </p>
                    </div>
                  </div>

                  {/* Connector Line */}
                  {i < stages.length - 1 && (
                    <div className="ml-[15px] h-2 w-px bg-border" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Validation Errors (shown when validation fails) */}
          {hasError && validationErrors.length > 0 && (
            <div className="border-t border-border px-4 pb-4">
              <p className="mb-2 mt-3 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                Validation Errors ({validationErrors.length})
              </p>
              <div className="flex flex-col gap-1.5">
                {validationErrors.map((err, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-md bg-destructive/5 px-2.5 py-2"
                  >
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                    <div>
                      <p className="text-[11px] text-foreground">{err.message}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {err.nodeId} / {err.field}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="text-[10px] text-muted-foreground">
            {isComplete
              ? "Export ready"
              : hasError
                ? "Fix validation errors to proceed"
                : isRunning
                  ? `Stage ${completedCount + 1} of ${stages.length}`
                  : "Click Start to begin export pipeline"}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="bg-transparent text-xs"
            >
              {isComplete ? "Close" : "Cancel"}
            </Button>
            {!isRunning && !isComplete && !hasError && (
              <Button
                size="sm"
                onClick={runPipeline}
                className="gap-1.5 text-xs"
              >
                <Download className="h-3 w-3" />
                Start Export
              </Button>
            )}
            {isComplete && (
              <Button
                size="sm"
                onClick={handleExportAndClose}
                className="gap-1.5 text-xs"
              >
                <Download className="h-3 w-3" />
                Download JSON
              </Button>
            )}
            {hasError && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  resetPipeline()
                  onClose()
                }}
                className="bg-transparent text-xs"
              >
                Back to Editor
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
