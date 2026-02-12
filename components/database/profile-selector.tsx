"use client"

import { useState, useEffect, useCallback } from "react"
import { Database, Server, ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  type GameDatabase,
  type EnvironmentBinding,
  GAME_DBS,
  getAllProfiles,
  getBinding,
  setBinding,
} from "@/lib/db-profiles"
import type { EnvironmentId } from "@/lib/environment-schemas"

interface ProfileSelectorProps {
  envId: EnvironmentId
}

export function ProfileSelector({ envId }: ProfileSelectorProps) {
  const [profiles, setProfiles] = useState(getAllProfiles())
  const [binding, setLocalBinding] = useState<EnvironmentBinding>(getBinding(envId))
  const [open, setOpen] = useState(false)

  // Refresh profiles when popover opens
  useEffect(() => {
    if (open) {
      setProfiles(getAllProfiles())
      setLocalBinding(getBinding(envId))
    }
  }, [open, envId])

  const updateBinding = useCallback(
    (partial: Partial<EnvironmentBinding>) => {
      const next = { ...binding, ...partial }
      setLocalBinding(next)
      setBinding(envId, next)
    },
    [binding, envId],
  )

  const selectedProfile = profiles.find((p) => p.id === binding.profileId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 bg-transparent text-xs"
        >
          <Database className="h-3 w-3" />
          {selectedProfile ? (
            <span className="max-w-[120px] truncate">{selectedProfile.name}</span>
          ) : (
            <span className="text-muted-foreground">No Profile</span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="border-b border-border px-3 py-2.5">
          <p className="text-xs font-semibold text-foreground">Server Profile</p>
          <p className="text-[10px] text-muted-foreground">
            Select which connection profile this environment uses
          </p>
        </div>

        <div className="max-h-48 overflow-auto">
          {profiles.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              No profiles configured
            </div>
          )}
          {profiles.map((p) => {
            const isSelected = p.id === binding.profileId
            return (
              <button
                key={p.id}
                onClick={() => updateBinding({ profileId: p.id })}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent ${
                  isSelected ? "bg-accent/50" : ""
                }`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                  <Server className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-xs font-medium text-foreground">{p.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {p.host}:{p.port}
                  </p>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-foreground" />}
                {p.lastTestSuccess === true && (
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                )}
              </button>
            )
          })}
        </div>

        {selectedProfile && (
          <>
            <div className="border-t border-border px-3 py-2.5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Database
              </p>
              <Select
                value={binding.database ?? ""}
                onValueChange={(v) => updateBinding({ database: v as GameDatabase })}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Select database role..." />
                </SelectTrigger>
                <SelectContent>
                  {GAME_DBS.map((db) => (
                    <SelectItem key={db} value={db} className="text-xs">
                      {db}
                      {selectedProfile.databaseMap[db] !== db && (
                        <span className="ml-1 text-muted-foreground">
                          ({selectedProfile.databaseMap[db]})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-border px-3 py-2">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Override (optional)
              </p>
              <input
                value={binding.overrideDatabase ?? ""}
                onChange={(e) => updateBinding({ overrideDatabase: e.target.value || null })}
                placeholder="Custom database name..."
                className="h-7 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
