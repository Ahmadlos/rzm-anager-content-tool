"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardHub } from "@/components/dashboard/dashboard-hub"
import { EnvironmentLoader } from "@/components/dashboard/environment-loader"
import { EnvironmentShell } from "@/components/environments/environment-shell"
import { WorkspacesView } from "@/components/modules/workspaces-view"
import { DatabaseConnectionsView } from "@/components/modules/database-connections-view"
import { CommitDeployView } from "@/components/modules/commit-deploy-view"
import { DatabaseExplorerView } from "@/components/modules/database-explorer-view"
import { DBComparisonView } from "@/components/modules/db-comparison-view"
import { SettingsView } from "@/components/modules/settings-view"
import { TopActionBar } from "@/components/top-action-bar"
import type { EnvironmentId } from "@/lib/environment-schemas"

// Centralized ViewController enum
export type ModuleView =
  | "dashboard"
  | "workspaces"
  | "database-connections"
  | "commit-deploy"
  | "explorer"
  | "compare"
  | "settings"

type AppView = ModuleView | "loading" | EnvironmentId

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

  const handleNavigate = useCallback((target: ModuleView) => {
    setView(target)
  }, [])

  // Determine which module views show the shared top action bar
  const moduleViews: ModuleView[] = [
    "dashboard",
    "workspaces",
    "database-connections",
    "commit-deploy",
    "explorer",
    "compare",
    "settings",
  ]

  const isModuleView = moduleViews.includes(view as ModuleView)

  if (view === "loading" && loadingTarget) {
    return <EnvironmentLoader envId={loadingTarget} />
  }

  // Environment shells handle their own header
  if (!isModuleView) {
    return (
      <EnvironmentShell
        envId={view as EnvironmentId}
        onBack={handleBack}
        onNavigate={handleNavigate}
      />
    )
  }

  // Module views share a common top action bar
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopActionBar
        activeView={view as ModuleView}
        onNavigate={handleNavigate}
      />
      <main className="flex-1 overflow-auto">
        {view === "dashboard" && (
          <DashboardHub onEnterEnvironment={handleEnterEnvironment} />
        )}
        {view === "workspaces" && <WorkspacesView />}
        {view === "database-connections" && <DatabaseConnectionsView />}
        {view === "commit-deploy" && <CommitDeployView />}
        {view === "explorer" && <DatabaseExplorerView />}
        {view === "compare" && <DBComparisonView />}
        {view === "settings" && <SettingsView />}
      </main>
    </div>
  )
}
