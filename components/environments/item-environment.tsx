"use client"

import { ArrowLeft, Package, Save, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ItemsManager } from "@/components/managers/items-manager"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ItemEnvironmentProps {
  onBack: () => void
}

export function ItemEnvironment({ onBack }: ItemEnvironmentProps) {
  const handleExport = () => {
    const data = { exportedAt: new Date().toISOString(), type: "items", format: "json" }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "items_export.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
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
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10">
              <Package className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <h1 className="text-sm font-semibold text-foreground">Item Manager</h1>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-xs">
              <Save className="h-3 w-3" />
              Save All
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-xs" onClick={handleExport}>
              <Download className="h-3 w-3" />
              Export JSON
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <ItemsManager />
        </main>
      </div>
    </TooltipProvider>
  )
}
