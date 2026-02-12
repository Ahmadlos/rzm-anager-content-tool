"use client"

import { useState, useEffect } from "react"
import { DashboardHub } from "@/components/dashboard/dashboard-hub"
import { EnvironmentLoader } from "@/components/dashboard/environment-loader"
import { EnvironmentShell } from "@/components/environments/environment-shell"
import { ConnectionManager } from "@/components/database/connection-manager"
import type { EnvironmentId } from "@/lib/environment-schemas"

type AppView = "dashboard" | "loading" | "connection-manager" | EnvironmentId

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
      />
    )
  }

  if (view === "connection-manager") {
    return <ConnectionManager onBack={handleBack} />
  }

  // All environment IDs use the unified EnvironmentShell
  return <EnvironmentShell envId={view as EnvironmentId} onBack={handleBack} />
}
