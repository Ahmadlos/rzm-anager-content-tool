"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Settings,
  Monitor,
  Palette,
  Gauge,
  Code,
  Moon,
  Sun,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SettingsViewProps {
  onBack: () => void
}

export function SettingsView({ onBack }: SettingsViewProps) {
  const [theme, setTheme] = useState("dark")
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [autoSave, setAutoSave] = useState(true)
  const [autoSaveInterval, setAutoSaveInterval] = useState("30")
  const [showMinimap, setShowMinimap] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [debugMode, setDebugMode] = useState(false)
  const [verboseLogging, setVerboseLogging] = useState(false)
  const [experimentalFeatures, setExperimentalFeatures] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
        {/* Header */}
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
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground/10">
              <Settings className="h-3.5 w-3.5 text-foreground" />
            </div>
            <h1 className="text-sm font-semibold text-foreground">Settings</h1>
          </div>

          <div className="flex-1" />

          <Button size="sm" className="gap-1.5 text-xs" onClick={handleSave}>
            {saved ? <Check className="h-3 w-3" /> : null}
            {saved ? "Saved" : "Save Changes"}
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-8">
            {/* UI Preferences */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">UI Preferences</h2>
              </div>
              <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
                {/* Theme */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium text-foreground">Theme</Label>
                    <p className="text-[11px] text-muted-foreground">Select the application color theme.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(["light", "dark", "system"] as const).map((t) => (
                      <Button
                        key={t}
                        variant={theme === t ? "secondary" : "ghost"}
                        size="sm"
                        className="gap-1.5 text-xs capitalize"
                        onClick={() => setTheme(t)}
                      >
                        {t === "light" && <Sun className="h-3 w-3" />}
                        {t === "dark" && <Moon className="h-3 w-3" />}
                        {t === "system" && <Monitor className="h-3 w-3" />}
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Animations */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium text-foreground">Animations</Label>
                    <p className="text-[11px] text-muted-foreground">Enable UI transition animations.</p>
                  </div>
                  <Switch checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
                </div>
              </div>
            </section>

            {/* Canvas Performance */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Canvas Performance</h2>
              </div>
              <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium text-foreground">Show Minimap</Label>
                    <p className="text-[11px] text-muted-foreground">Display the node editor minimap overlay.</p>
                  </div>
                  <Switch checked={showMinimap} onCheckedChange={setShowMinimap} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium text-foreground">Snap to Grid</Label>
                    <p className="text-[11px] text-muted-foreground">Align nodes to a 16px grid when dragging.</p>
                  </div>
                  <Switch checked={snapToGrid} onCheckedChange={setSnapToGrid} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium text-foreground">Auto-save</Label>
                    <p className="text-[11px] text-muted-foreground">Periodically save canvas state.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                    {autoSave && (
                      <Select value={autoSaveInterval} onValueChange={setAutoSaveInterval}>
                        <SelectTrigger className="h-7 w-20 text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-card">
                          <SelectItem value="15" className="text-xs">15s</SelectItem>
                          <SelectItem value="30" className="text-xs">30s</SelectItem>
                          <SelectItem value="60" className="text-xs">60s</SelectItem>
                          <SelectItem value="120" className="text-xs">120s</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Developer Settings */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Advanced / Developer</h2>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Advanced
                </Badge>
              </div>
              <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium text-foreground">Debug Mode</Label>
                    <p className="text-[11px] text-muted-foreground">Show debug overlays and node IDs.</p>
                  </div>
                  <Switch checked={debugMode} onCheckedChange={setDebugMode} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium text-foreground">Verbose Logging</Label>
                    <p className="text-[11px] text-muted-foreground">Output detailed logs to the console.</p>
                  </div>
                  <Switch checked={verboseLogging} onCheckedChange={setVerboseLogging} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium text-foreground">Experimental Features</Label>
                    <p className="text-[11px] text-muted-foreground">Enable unstable features in development.</p>
                  </div>
                  <Switch checked={experimentalFeatures} onCheckedChange={setExperimentalFeatures} />
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
