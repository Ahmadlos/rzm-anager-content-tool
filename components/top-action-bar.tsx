"use client"

import {
  Gamepad2,
  LayoutGrid,
  Database,
  GitBranch,
  Wrench,
  TableProperties,
  GitCompare,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ModuleView } from "@/app/page"

interface TopActionBarProps {
  activeView: ModuleView
  onNavigate: (target: ModuleView) => void
}

export function TopActionBar({ activeView, onNavigate }: TopActionBarProps) {
  const navButtons: { id: ModuleView; label: string; icon: typeof LayoutGrid }[] = [
    { id: "workspaces", label: "Workspaces", icon: LayoutGrid },
    { id: "database-connections", label: "Database Connections", icon: Database },
    { id: "commit-deploy", label: "Commit & Deploy", icon: GitBranch },
  ]

  const toolItems: { id: ModuleView; label: string; icon: typeof TableProperties }[] = [
    { id: "explorer", label: "Database Explorer", icon: TableProperties },
    { id: "compare", label: "DB Comparison", icon: GitCompare },
  ]

  const isToolActive = toolItems.some((t) => t.id === activeView)

  return (
    <TooltipProvider>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
        {/* Left: Logo + Title */}
        <button
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/10">
            <Gamepad2 className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-left">
            <h1 className="text-sm font-semibold text-foreground">RZManager</h1>
            <p className="text-[10px] text-muted-foreground">Arcadia Schema Editor</p>
          </div>
        </button>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1.5">
          {navButtons.map((btn) => {
            const active = activeView === btn.id
            return (
              <Button
                key={btn.id}
                variant="outline"
                size="sm"
                className={`gap-1.5 text-xs transition-colors ${
                  active
                    ? "border-foreground/30 bg-foreground/5 text-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => onNavigate(btn.id)}
              >
                <btn.icon className="h-3 w-3" />
                {btn.label}
              </Button>
            )
          })}

          {/* Tools Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`gap-1.5 text-xs transition-colors ${
                  isToolActive
                    ? "border-foreground/30 bg-foreground/5 text-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wrench className="h-3 w-3" />
                Tools
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 border-border bg-card">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Developer Tools
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {toolItems.map((tool) => (
                <DropdownMenuItem
                  key={tool.id}
                  className={`gap-2 text-xs ${
                    activeView === tool.id ? "bg-accent text-foreground" : ""
                  }`}
                  onClick={() => onNavigate(tool.id)}
                >
                  <tool.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {tool.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="mx-1 h-5 w-px bg-border" />

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeView === "settings" ? "outline" : "ghost"}
                size="icon"
                className={`h-8 w-8 ${
                  activeView === "settings"
                    ? "border-foreground/30 bg-foreground/5 text-foreground"
                    : "text-muted-foreground"
                }`}
                onClick={() => onNavigate("settings")}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="border-border bg-card text-foreground">
              <span className="text-xs">Settings</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  )
}
