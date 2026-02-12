"use client"

import { useMemo } from "react"
import {
  FolderOpen,
  Server,
  Database,
  Lock,
  Unlock,
  Network,
  Plug,
  AlertTriangle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getActiveWorkspace } from "@/lib/workspace-store"
import { getProfile } from "@/lib/db-profiles"

interface WorkspaceStatusBarProps {
  onOpenWorkspaceManager?: () => void
}

export function WorkspaceStatusBar({ onOpenWorkspaceManager }: WorkspaceStatusBarProps) {
  const workspace = useMemo(() => getActiveWorkspace(), [])
  const profile = useMemo(
    () => (workspace ? getProfile(workspace.profileId) : undefined),
    [workspace],
  )

  if (!workspace) {
    return (
      <button
        onClick={onOpenWorkspaceManager}
        className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 text-left transition-colors hover:bg-amber-500/10"
      >
        <AlertTriangle className="h-3 w-3 text-amber-400" />
        <span className="text-[10px] font-medium text-amber-400">No Active Workspace</span>
      </button>
    )
  }

  return (
    <button
      onClick={onOpenWorkspaceManager}
      className="flex items-center gap-2 rounded-md border border-border bg-card/50 px-2.5 py-1 text-left transition-colors hover:bg-accent/50"
    >
      {/* Workspace name */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <FolderOpen className="h-3 w-3 text-muted-foreground" />
            <span className="max-w-[100px] truncate text-[10px] font-medium text-foreground">
              {workspace.name}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="border-border bg-card text-foreground">
          <span className="text-xs">Workspace: {workspace.name}</span>
        </TooltipContent>
      </Tooltip>

      <div className="h-3 w-px bg-border" />

      {/* Profile */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <Server className="h-3 w-3 text-muted-foreground" />
            <span className="max-w-[80px] truncate text-[10px] text-muted-foreground">
              {profile?.name ?? "N/A"}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="border-border bg-card text-foreground">
          <span className="text-xs">
            Profile: {profile?.name ?? "Unknown"}
            {profile ? ` (${profile.host}:${profile.port})` : ""}
          </span>
        </TooltipContent>
      </Tooltip>

      <div className="h-3 w-px bg-border" />

      {/* Arcadia DB */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            <Database className="h-3 w-3 text-emerald-400/70" />
            <span className="max-w-[60px] truncate text-[10px] text-muted-foreground">
              {workspace.databases.arcadia ?? "-"}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="border-border bg-card text-foreground">
          <span className="text-xs">Arcadia: {workspace.databases.arcadia ?? "Not set"}</span>
        </TooltipContent>
      </Tooltip>

      {/* Telecaster DB */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            <Database className="h-3 w-3 text-cyan-400/70" />
            <span className="max-w-[60px] truncate text-[10px] text-muted-foreground">
              {workspace.databases.telecaster ?? "-"}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="border-border bg-card text-foreground">
          <span className="text-xs">Telecaster: {workspace.databases.telecaster ?? "Not set"}</span>
        </TooltipContent>
      </Tooltip>

      <div className="h-3 w-px bg-border" />

      {/* Connection type */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            {profile?.sshEnabled ? (
              <Network className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Plug className="h-3 w-3 text-muted-foreground" />
            )}
            <span className="text-[10px] text-muted-foreground">
              {profile?.sshEnabled ? "SSH" : "Direct"}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="border-border bg-card text-foreground">
          <span className="text-xs">
            Connection: {profile?.sshEnabled ? "SSH Tunnel" : "Direct"}
          </span>
        </TooltipContent>
      </Tooltip>

      {/* Version lock indicator */}
      {workspace.versionLockEnabled ? (
        <Lock className="h-3 w-3 text-amber-400/70" />
      ) : (
        <Unlock className="h-3 w-3 text-muted-foreground/50" />
      )}
    </button>
  )
}
