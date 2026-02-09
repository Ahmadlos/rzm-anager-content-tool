"use client"

import React from "react"

import type { NodeProps } from "@xyflow/react"
import { Handle, Position } from "@xyflow/react"
import { User, Heart, MessageSquare, Brain, Palette, Backpack } from "lucide-react"

function NodeShell({
  label,
  icon: Icon,
  color,
  children,
  hasInput = true,
  hasOutput = true,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  children: React.ReactNode
  hasInput?: boolean
  hasOutput?: boolean
}) {
  return (
    <div className="min-w-[220px] rounded-lg border border-border bg-card shadow-lg">
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !rounded-full !border-2 !border-border !bg-muted-foreground hover:!bg-foreground hover:!scale-125 !transition-all"
        />
      )}
      <div className={`flex items-center gap-2 rounded-t-lg border-b border-border px-3 py-2 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex flex-col gap-2 p-3 text-xs">
        {children}
      </div>
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !rounded-full !border-2 !border-border !bg-muted-foreground hover:!bg-foreground hover:!scale-125 !transition-all"
        />
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

export function IdentityNode({ data }: NodeProps) {
  return (
    <NodeShell label="Identity" icon={User} color="bg-foreground/[0.06] text-foreground" hasInput={false}>
      <Field label="Name" value={(data.name as string) || "Unnamed"} />
      <Field label="Role" value={(data.role as string) || "None"} />
      <Field label="Level" value={String(data.level ?? 1)} />
      <Field label="Location" value={(data.location as string) || "Unknown"} />
    </NodeShell>
  )
}

export function StatsNode({ data }: NodeProps) {
  return (
    <NodeShell label="Stats" icon={Heart} color="bg-red-500/10 text-red-400">
      <Field label="HP" value={String(data.hp ?? 100)} />
      <Field label="Attack" value={String(data.attack ?? 10)} />
      <Field label="Defense" value={String(data.defense ?? 5)} />
      <Field label="Speed" value={String(data.speed ?? 10)} />
    </NodeShell>
  )
}

export function DialogueNode({ data }: NodeProps) {
  return (
    <NodeShell label="Dialogue" icon={MessageSquare} color="bg-emerald-500/10 text-emerald-400">
      <div className="flex flex-col gap-1.5">
        <span className="text-muted-foreground">Greeting</span>
        <p className="rounded border border-border bg-background px-2 py-1.5 leading-relaxed text-foreground">
          {(data.greeting as string) || "Hello, traveler..."}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-muted-foreground">Farewell</span>
        <p className="rounded border border-border bg-background px-2 py-1.5 leading-relaxed text-foreground">
          {(data.farewell as string) || "Safe travels."}
        </p>
      </div>
    </NodeShell>
  )
}

export function BehaviorNode({ data }: NodeProps) {
  return (
    <NodeShell label="Behavior" icon={Brain} color="bg-amber-500/10 text-amber-400">
      <Field label="AI Type" value={(data.aiType as string) || "Idle"} />
      <Field label="Aggression" value={(data.aggression as string) || "Passive"} />
      <Field label="Patrol" value={(data.patrol as string) || "None"} />
      <Field label="Schedule" value={(data.schedule as string) || "24h"} />
    </NodeShell>
  )
}

export function AppearanceNode({ data }: NodeProps) {
  return (
    <NodeShell label="Appearance" icon={Palette} color="bg-blue-500/10 text-blue-400">
      <Field label="Race" value={(data.race as string) || "Human"} />
      <Field label="Gender" value={(data.gender as string) || "Male"} />
      <Field label="Hair" value={(data.hair as string) || "Brown"} />
      <Field label="Outfit" value={(data.outfit as string) || "Default"} />
    </NodeShell>
  )
}

export function InventoryNode({ data }: NodeProps) {
  const items = (data.items as string[]) || ["Health Potion", "Iron Key"]
  return (
    <NodeShell label="Inventory" icon={Backpack} color="bg-zinc-500/10 text-zinc-400" hasOutput={false}>
      <div className="flex flex-col gap-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 rounded border border-border bg-background px-2 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            <span className="text-foreground">{item}</span>
          </div>
        ))}
      </div>
      <Field label="Gold" value={String(data.gold ?? 50)} />
    </NodeShell>
  )
}

export const npcNodeTypes = {
  identity: IdentityNode,
  stats: StatsNode,
  dialogue: DialogueNode,
  behavior: BehaviorNode,
  appearance: AppearanceNode,
  inventory: InventoryNode,
}
