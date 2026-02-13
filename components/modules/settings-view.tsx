"use client"

import { useState } from "react"
import {
  Settings,
  Palette,
  Monitor,
  Gauge,
  Code,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"

export function SettingsView() {
  // UI Preferences
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [showMinimap, setShowMinimap] = useState(true)
  const [animateTransitions, setAnimateTransitions] = useState(true)

  // Theme
  const [theme, setTheme] = useState("dark")
  const [accentColor, setAccentColor] = useState("default")

  // Performance
  const [maxNodes, setMaxNodes] = useState([500])
  const [autoSaveInterval, setAutoSaveInterval] = useState("60")
  const [enableHardwareAccel, setEnableHardwareAccel] = useState(true)

  // Developer
  const [debugMode, setDebugMode] = useState(false)
  const [verboseLogging, setVerboseLogging] = useState(false)
  const [showNodeIds, setShowNodeIds] = useState(false)
  const [sqlDryRun, setSqlDryRun] = useState(true)

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-foreground" />
            <h2 className="text-xl font-bold text-foreground">Settings</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your RZManager preferences.
          </p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs">
          <Save className="h-3.5 w-3.5" />
          Save Settings
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="flex flex-col gap-6 pr-4">
          {/* UI Preferences */}
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">UI Preferences</h3>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Collapsed Sidebar</Label>
                  <p className="text-[11px] text-muted-foreground">Start with sidebar collapsed</p>
                </div>
                <Switch checked={sidebarCollapsed} onCheckedChange={setSidebarCollapsed} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Compact Mode</Label>
                  <p className="text-[11px] text-muted-foreground">Reduce spacing in UI elements</p>
                </div>
                <Switch checked={compactMode} onCheckedChange={setCompactMode} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Show Minimap</Label>
                  <p className="text-[11px] text-muted-foreground">Display canvas minimap overlay</p>
                </div>
                <Switch checked={showMinimap} onCheckedChange={setShowMinimap} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Animate Transitions</Label>
                  <p className="text-[11px] text-muted-foreground">Smooth transitions between views</p>
                </div>
                <Switch checked={animateTransitions} onCheckedChange={setAnimateTransitions} />
              </div>
            </div>
          </section>

          {/* Theme */}
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Theme</h3>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Color Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="dark" className="text-xs">Dark</SelectItem>
                    <SelectItem value="light" className="text-xs">Light</SelectItem>
                    <SelectItem value="system" className="text-xs">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label className="text-xs">Accent Color</Label>
                <Select value={accentColor} onValueChange={setAccentColor}>
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="default" className="text-xs">Default</SelectItem>
                    <SelectItem value="blue" className="text-xs">Blue</SelectItem>
                    <SelectItem value="emerald" className="text-xs">Emerald</SelectItem>
                    <SelectItem value="amber" className="text-xs">Amber</SelectItem>
                    <SelectItem value="rose" className="text-xs">Rose</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Performance */}
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Performance</h3>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-xs">Max Nodes per Canvas</Label>
                  <span className="text-xs text-muted-foreground">{maxNodes[0]}</span>
                </div>
                <Slider value={maxNodes} onValueChange={setMaxNodes} min={100} max={2000} step={50} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Auto-Save Interval</Label>
                  <p className="text-[11px] text-muted-foreground">Seconds between auto-saves</p>
                </div>
                <Input
                  type="number"
                  value={autoSaveInterval}
                  onChange={(e) => setAutoSaveInterval(e.target.value)}
                  className="h-8 w-24 text-xs"
                  min={10}
                  max={600}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Hardware Acceleration</Label>
                  <p className="text-[11px] text-muted-foreground">Use GPU for canvas rendering</p>
                </div>
                <Switch checked={enableHardwareAccel} onCheckedChange={setEnableHardwareAccel} />
              </div>
            </div>
          </section>

          {/* Developer */}
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Code className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Advanced / Developer</h3>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Debug Mode</Label>
                  <p className="text-[11px] text-muted-foreground">Show debug overlays and info</p>
                </div>
                <Switch checked={debugMode} onCheckedChange={setDebugMode} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Verbose Logging</Label>
                  <p className="text-[11px] text-muted-foreground">Extra detail in console output</p>
                </div>
                <Switch checked={verboseLogging} onCheckedChange={setVerboseLogging} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Show Node IDs</Label>
                  <p className="text-[11px] text-muted-foreground">Display internal IDs on nodes</p>
                </div>
                <Switch checked={showNodeIds} onCheckedChange={setShowNodeIds} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">SQL Dry Run</Label>
                  <p className="text-[11px] text-muted-foreground">Preview SQL without executing</p>
                </div>
                <Switch checked={sqlDryRun} onCheckedChange={setSqlDryRun} />
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  )
}
