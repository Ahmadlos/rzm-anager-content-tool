"use client"

import { useState, useEffect } from "react"
import { DashboardHub } from "@/components/dashboard/dashboard-hub"
import { EnvironmentLoader } from "@/components/dashboard/environment-loader"
import { EnvironmentShell } from "@/components/environments/environment-shell"
import { ConnectionManager } from "@/components/database/connection-manager"
import { WorkspaceManager } from "@/components/workspace/workspace-manager"
import { StagingView } from "@/components/staging/staging-view"
import { DatabaseExplorer } from "@/components/database/database-explorer"
import { DatabaseComparison } from "@/components/database/database-comparison"
import type { EnvironmentId } from "@/lib/environment-schemas"

type AppView = "dashboard" | "loading" | "connection-manager" | "workspace-manager" | "staging" | "db-explorer" | "db-comparison" | EnvironmentId

export default function App() {
  const [view, setView] = useState<AppView>("dashboard")
  const [loadingTarget, setLoadingTarget] = useState<EnvironmentId | null>(null)

  const handleEnterEnvironment = (envId: EnvironmentId) => {
    setLoadingTarget(envId)
    setView("loading")
  }

  useEffect(() => {
    if (view === "loading" && loadingTarget) {
      const timer = setTimeout(() => {
        setView(loadingTarget)
        setLoadingTarget(null)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [view, loadingTarget])

  const handleBack = () => {
    setView("dashboard")
  }

  if (view === "loading" && loadingTarget) {
    return <EnvironmentLoader envId={loadingTarget} />
  }

  if (view === "dashboard") {
    return (
      <DashboardHub
        onEnterEnvironment={handleEnterEnvironment}
        onOpenConnectionManager={() => setView("connection-manager")}
        onOpenWorkspaceManager={() => setView("workspace-manager")}
        onOpenStaging={() => setView("staging")}
        onOpenDatabaseExplorer={() => setView("db-explorer")}
        onOpenDatabaseComparison={() => setView("db-comparison")}
      />
    )
  }

  if (view === "connection-manager") {
    return <ConnectionManager onBack={handleBack} />
  }

  if (view === "workspace-manager") {
    return (
      <WorkspaceManager
        onBack={handleBack}
        onOpenConnectionManager={() => setView("connection-manager")}
      />
    )
  }

  if (view === "staging") {
    return (
      <StagingView
        onBack={handleBack}
        onOpenWorkspaceManager={() => setView("workspace-manager")}
      />
    )
  }

  if (view === "db-explorer") {
    return <DatabaseExplorer onBack={handleBack} />
  }

  if (view === "db-comparison") {
    return <DatabaseComparison onBack={handleBack} />
  }

  // All environment IDs use the unified EnvironmentShell
  return (
    <EnvironmentShell
      envId={view as EnvironmentId}
      onBack={handleBack}
      onOpenWorkspaceManager={() => setView("workspace-manager")}
      onOpenStaging={() => setView("staging")}
    />
  )
}
