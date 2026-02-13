"use client"

import { useState, useEffect } from "react"
import { DashboardHub } from "@/components/dashboard/dashboard-hub"
import { EnvironmentLoader } from "@/components/dashboard/environment-loader"
import { EnvironmentShell } from "@/components/environments/environment-shell"
import { WorkspacesView } from "@/components/views/workspaces-view"
import { DatabaseConnectionsView } from "@/components/views/database-connections-view"
import { CommitDeployView } from "@/components/views/commit-deploy-view"
import { ExplorerView } from "@/components/views/explorer-view"
import { CompareView } from "@/components/views/compare-view"
import { RdbExportView } from "@/components/views/rdb-export-view"
import { SettingsView } from "@/components/views/settings-view"
import type { AppView } from "@/lib/view-controller"
import type { EnvironmentId } from "@/lib/environment-schemas"

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

  const handleNavigate = (target: AppView) => {
    setView(target)
  }

  if (view === "loading" && loadingTarget) {
    return <EnvironmentLoader envId={loadingTarget} />
  }

  if (view === "dashboard") {
    return (
      <DashboardHub
        onEnterEnvironment={handleEnterEnvironment}
        onNavigate={handleNavigate}
        activeView={view}
      />
    )
  }

  // Top-level module views
  switch (view) {
    case "workspaces":
      return <WorkspacesView onBack={handleBack} />
    case "database-connections":
      return <DatabaseConnectionsView onBack={handleBack} />
    case "commit-deploy":
      return <CommitDeployView onBack={handleBack} />
    case "explorer":
      return <ExplorerView onBack={handleBack} />
    case "compare":
      return <CompareView onBack={handleBack} />
    case "rdb-export":
      return <RdbExportView onBack={handleBack} />
    case "settings":
      return <SettingsView onBack={handleBack} />
  }

  // All environment IDs use the unified EnvironmentShell
  return <EnvironmentShell envId={view as EnvironmentId} onBack={handleBack} />
}
