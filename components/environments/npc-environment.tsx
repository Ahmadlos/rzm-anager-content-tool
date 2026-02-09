"use client"

import { useState } from "react"
import { ArrowLeft, Users, Plus, Download, Save, List, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NPCsManager } from "@/components/managers/npcs-manager"
import { NPCCanvas } from "@/components/npc-canvas/npc-canvas"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NPCEnvironmentProps {
  onBack: () => void
}

function CanvasLoadingScreen() {
  const [progress, setProgress] = useState(0)

  // biome-ignore lint: progress effect
  useState(() => {
    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 15 + 5
      if (p >= 100) {
        clearInterval(interval)
        p = 100
      }
      setProgress(p)
    }, 80)
  })

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card">
          <Spinner className="size-6 text-foreground" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <h2 className="text-sm font-semibold text-foreground">Loading NPC Editor</h2>
          <p className="text-xs text-muted-foreground">Preparing character workspace...</p>
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

type SubView = "manager" | "canvas" | "loading"

export function NPCEnvironment({ onBack }: NPCEnvironmentProps) {
  const [subView, setSubView] = useState<SubView>("manager")

  const handleOpenCanvas = () => {
    setSubView("loading")
    setTimeout(() => setSubView("canvas"), 1200)
  }

  if (subView === "loading") {
    return <CanvasLoadingScreen />
  }

  if (subView === "canvas") {
    return <NPCCanvas onBack={() => setSubView("manager")} />
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
        {/* Environment Header */}
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
            <TooltipContent className="bg-card border-border text-foreground">
              <span className="text-xs">Back to Dashboard</span>
            </TooltipContent>
          </Tooltip>

          <div className="h-5 w-px bg-border" />

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10">
              <Users className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">NPC Editor</h1>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-xs">
              <Save className="h-3 w-3" />
              Save All
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-xs">
              <Download className="h-3 w-3" />
              Export
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <NPCsManager onOpenCanvas={handleOpenCanvas} />
        </main>
      </div>
    </TooltipProvider>
  )
}
