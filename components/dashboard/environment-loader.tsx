"use client"

import { useState, useEffect } from "react"
import { Spinner } from "@/components/ui/spinner"
import type { EnvironmentId } from "./dashboard-hub"

const envLabels: Record<EnvironmentId, { title: string; subtitle: string }> = {
  npc: { title: "NPC Editor", subtitle: "Loading character workspace..." },
  item: { title: "Item Manager", subtitle: "Loading inventory tools..." },
  database: { title: "Database Viewer", subtitle: "Connecting to data tables..." },
  "node-editor": { title: "Node Editor", subtitle: "Loading visual scripting tools..." },
}

interface EnvironmentLoaderProps {
  envId: EnvironmentId
}

export function EnvironmentLoader({ envId }: EnvironmentLoaderProps) {
  const [progress, setProgress] = useState(0)
  const config = envLabels[envId]

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + Math.random() * 15 + 5
      })
    }, 80)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card">
          <Spinner className="size-6 text-foreground" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <h2 className="text-sm font-semibold text-foreground">{config.title}</h2>
          <p className="text-xs text-muted-foreground">{config.subtitle}</p>
        </div>
      </div>
      <div className="w-48">
        <div className="h-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-200 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
