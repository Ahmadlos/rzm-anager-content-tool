"use client"

import { useState, useEffect } from "react"
import { DashboardHub, type EnvironmentId } from "@/components/dashboard/dashboard-hub"
import { EnvironmentLoader } from "@/components/dashboard/environment-loader"
import { NPCEnvironment } from "@/components/environments/npc-environment"
import { ItemEnvironment } from "@/components/environments/item-environment"
import { DatabaseEnvironment } from "@/components/environments/database-environment"
import { NodeEditorEnvironment } from "@/components/environments/node-editor-environment"

type AppView = "dashboard" | "loading" | EnvironmentId

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

  switch (view) {
    case "npc":
      return <NPCEnvironment onBack={handleBack} />
    case "item":
      return <ItemEnvironment onBack={handleBack} />
    case "database":
      return <DatabaseEnvironment onBack={handleBack} />
    case "node-editor":
      return <NodeEditorEnvironment onBack={handleBack} />
    default:
      return <DashboardHub onEnterEnvironment={handleEnterEnvironment} />
  }
}
