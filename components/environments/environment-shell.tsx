"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Save,
  Download,
  Users,
  Package,
  Bug,
  ScrollText,
  Zap,
  Shield,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { EnvironmentCanvas } from "@/components/canvas/environment-canvas"
import { ProfileSelector } from "@/components/database/profile-selector"
import {
  type EnvironmentId,
  environmentSchemas,
} from "@/lib/environment-schemas"
import type { SelectedEntity } from "@/lib/graph-store"

// Manager imports
import { NPCsManager } from "@/components/managers/npcs-manager"
import { ItemsManager } from "@/components/managers/items-manager"
import { MonstersManager } from "@/components/managers/monsters-manager"
import { QuestsManager } from "@/components/managers/quests-manager"
import { SkillsManager } from "@/components/managers/skills-manager"
import { StatesManager } from "@/components/managers/states-manager"

const envIcons: Record<
  EnvironmentId,
  { icon: typeof Users; accentBg: string; accentText: string }
> = {
  npc: {
    icon: Users,
    accentBg: "bg-emerald-500/10",
    accentText: "text-emerald-400",
  },
  item: {
    icon: Package,
    accentBg: "bg-amber-500/10",
    accentText: "text-amber-400",
  },
  monster: {
    icon: Bug,
    accentBg: "bg-red-500/10",
    accentText: "text-red-400",
  },
  quest: {
    icon: ScrollText,
    accentBg: "bg-blue-500/10",
    accentText: "text-blue-400",
  },
  skill: {
    icon: Zap,
    accentBg: "bg-cyan-500/10",
    accentText: "text-cyan-400",
  },
  state: {
    icon: Shield,
    accentBg: "bg-rose-500/10",
    accentText: "text-rose-400",
  },
}

const envTitles: Record<EnvironmentId, string> = {
  npc: "NPC Environment",
  item: "Item Environment",
  monster: "Monster Environment",
  quest: "Quest Environment",
  skill: "Skill Environment",
  state: "State Environment",
}

function CanvasLoadingScreen({ envId }: { envId: EnvironmentId }) {
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
          <h2 className="text-sm font-semibold text-foreground">
            Loading Node Editor
          </h2>
          <p className="text-xs text-muted-foreground">
            Preparing {envTitles[envId]} workspace...
          </p>
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

function ManagerContent({
  envId,
  onOpenCanvas,
}: {
  envId: EnvironmentId
  onOpenCanvas: (entity?: SelectedEntity) => void
}) {
  switch (envId) {
    case "npc":
      return <NPCsManager onOpenCanvas={onOpenCanvas} />
    case "item":
      return <ItemsManager onOpenCanvas={onOpenCanvas} />
    case "monster":
      return <MonstersManager onOpenCanvas={onOpenCanvas} />
    case "quest":
      return <QuestsManager onOpenCanvas={onOpenCanvas} />
    case "skill":
      return <SkillsManager onOpenCanvas={onOpenCanvas} />
    case "state":
      return <StatesManager onOpenCanvas={onOpenCanvas} />
  }
}

interface EnvironmentShellProps {
  envId: EnvironmentId
  onBack: () => void
}

type SubView = "manager" | "canvas" | "loading"

export function EnvironmentShell({ envId, onBack }: EnvironmentShellProps) {
  const [subView, setSubView] = useState<SubView>("manager")
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null)
  const schema = environmentSchemas[envId]
  const envConfig = envIcons[envId]
  const Icon = envConfig.icon

  const handleOpenCanvas = (entity?: SelectedEntity) => {
    setSelectedEntity(entity || null)
    setSubView("loading")
    setTimeout(() => setSubView("canvas"), 1200)
  }

  if (subView === "loading") {
    return <CanvasLoadingScreen envId={envId} />
  }

  if (subView === "canvas") {
    return (
      <EnvironmentCanvas
        schema={schema}
        entity={selectedEntity}
        onBack={() => {
          setSubView("manager")
          setSelectedEntity(null)
        }}
      />
    )
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
            <TooltipContent className="border-border bg-card text-foreground">
              <span className="text-xs">Back to Dashboard</span>
            </TooltipContent>
          </Tooltip>

          <div className="h-5 w-px bg-border" />

          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-md ${envConfig.accentBg}`}
            >
              <Icon className={`h-3.5 w-3.5 ${envConfig.accentText}`} />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">
                {envTitles[envId]}
              </h1>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <ProfileSelector envId={envId} />
            <div className="h-5 w-px bg-border" />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-transparent text-xs"
            >
              <Save className="h-3 w-3" />
              Save All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-transparent text-xs"
            >
              <Download className="h-3 w-3" />
              Export
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <ManagerContent envId={envId} onOpenCanvas={handleOpenCanvas} />
        </main>
      </div>
    </TooltipProvider>
  )
}
