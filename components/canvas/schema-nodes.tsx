"use client"

import React from "react"
import type { NodeProps } from "@xyflow/react"
import { Handle, Position } from "@xyflow/react"
import {
  Database,
  FileText,
  Code,
  Link,
  LayoutGrid,
  Lock,
  Filter,
  Gift,
  Coins,
  Clock,
  Sparkles,
  Wand2,
} from "lucide-react"
import type { NodeSchema, PortType } from "@/lib/environment-schemas"

const portColors: Record<PortType, string> = {
  "string-code": "!bg-blue-400 hover:!bg-blue-300",
  number: "!bg-emerald-400 hover:!bg-emerald-300",
  script: "!bg-amber-400 hover:!bg-amber-300",
  reference: "!bg-rose-400 hover:!bg-rose-300",
  "stat-block": "!bg-cyan-400 hover:!bg-cyan-300",
  "model-block": "!bg-violet-400 hover:!bg-violet-300",
  condition: "!bg-orange-400 hover:!bg-orange-300",
  reward: "!bg-yellow-400 hover:!bg-yellow-300",
  cost: "!bg-pink-400 hover:!bg-pink-300",
  timing: "!bg-teal-400 hover:!bg-teal-300",
  effect: "!bg-indigo-400 hover:!bg-indigo-300",
  fx: "!bg-fuchsia-400 hover:!bg-fuchsia-300",
}

const portBorderColors: Record<PortType, string> = {
  "string-code": "!border-blue-600",
  number: "!border-emerald-600",
  script: "!border-amber-600",
  reference: "!border-rose-600",
  "stat-block": "!border-cyan-600",
  "model-block": "!border-violet-600",
  condition: "!border-orange-600",
  reward: "!border-yellow-600",
  cost: "!border-pink-600",
  timing: "!border-teal-600",
  effect: "!border-indigo-600",
  fx: "!border-fuchsia-600",
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  root: Database,
  string: FileText,
  script: Code,
  reference: Link,
  structured: LayoutGrid,
  condition: Filter,
  reward: Gift,
  cost: Coins,
  timing: Clock,
  effect: Sparkles,
  fx: Wand2,
}

interface SchemaNodeData {
  schema: NodeSchema
  values: Record<string, unknown>
  [key: string]: unknown
}

function PortLabel({ label, portType, required, side }: { label: string; portType: PortType; required?: boolean; side: "input" | "output" }) {
  const colorDot: Record<PortType, string> = {
    "string-code": "bg-blue-400",
    number: "bg-emerald-400",
    script: "bg-amber-400",
    reference: "bg-rose-400",
    "stat-block": "bg-cyan-400",
    "model-block": "bg-violet-400",
    condition: "bg-orange-400",
    reward: "bg-yellow-400",
    cost: "bg-pink-400",
    timing: "bg-teal-400",
    effect: "bg-indigo-400",
    fx: "bg-fuchsia-400",
  }

  return (
    <div className={`flex items-center gap-1.5 ${side === "output" ? "flex-row-reverse" : ""}`}>
      <div className={`h-1.5 w-1.5 rounded-full ${colorDot[portType]}`} />
      <span className="font-mono text-[10px] text-muted-foreground">
        {label}
        {required && <span className="text-destructive">*</span>}
      </span>
    </div>
  )
}

export function SchemaNode({ data }: NodeProps) {
  const { schema, values } = data as unknown as SchemaNodeData
  if (!schema) return null

  const Icon = categoryIcons[schema.category] || Database
  const isRoot = schema.category === "root"

  // For the root node, show a compact field list of direct-input values
  // (numbers that are NOT connected via foreign key / reference / structured ports)
  const connectedPortTypes = new Set(["string-code", "script", "reference", "stat-block", "model-block", "condition", "reward", "cost", "timing", "effect", "fx"])
  const directInputs = isRoot
    ? schema.inputs.filter((p) => p.portType === "number" && !connectedPortTypes.has(p.portType))
    : []

  return (
    <div className={`min-w-[240px] max-w-[300px] rounded-lg border bg-card shadow-lg ${schema.borderColor}`}>
      {/* Input Handles */}
      {schema.inputs.map((input, i) => (
        <Handle
          key={`in-${input.id}`}
          type="target"
          position={Position.Left}
          id={input.id}
          className={`!h-2.5 !w-2.5 !rounded-full !border-2 ${portColors[input.portType]} ${portBorderColors[input.portType]} hover:!scale-125 !transition-all`}
          style={{ top: `${44 + i * 22}px` }}
        />
      ))}

      {/* Header */}
      <div className={`flex items-center gap-2 rounded-t-lg border-b border-border px-3 py-2 ${schema.color}`}>
        {isRoot ? <Lock className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
        <span className="text-xs font-semibold uppercase tracking-wider">{schema.label}</span>
        {isRoot && (
          <span className="ml-auto rounded bg-background/20 px-1.5 py-0.5 text-[9px] font-medium">ROOT</span>
        )}
      </div>

      {/* Port Labels */}
      <div className="flex gap-4 p-3">
        {/* Inputs */}
        <div className="flex flex-1 flex-col gap-1">
          {schema.inputs.map((input) => (
            <PortLabel
              key={input.id}
              label={input.label}
              portType={input.portType}
              required={input.required}
              side="input"
            />
          ))}
        </div>

        {/* Outputs */}
        {schema.outputs.length > 0 && (
          <div className="flex flex-col gap-1">
            {schema.outputs.map((output) => (
              <PortLabel
                key={output.id}
                label={output.label}
                portType={output.portType}
                side="output"
              />
            ))}
          </div>
        )}
      </div>

      {/* Direct Value Fields (editable numbers on root nodes) */}
      {directInputs.length > 0 && values && (
        <div className="border-t border-border px-3 py-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {directInputs.slice(0, 8).map((input) => (
              <div key={input.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-[10px] text-muted-foreground">{input.label}</span>
                <span className="font-mono text-[10px] text-foreground">{String(values[input.id] ?? 0)}</span>
              </div>
            ))}
          </div>
          {directInputs.length > 8 && (
            <p className="mt-1 text-[9px] text-muted-foreground/60">+{directInputs.length - 8} more fields</p>
          )}
        </div>
      )}

      {/* String Node Value Preview */}
      {schema.category === "string" && values?.value && (
        <div className="border-t border-border px-3 py-2">
          <p className="line-clamp-2 text-[10px] leading-relaxed text-foreground">
            {String(values.value).substring(0, 80)}
            {String(values.value).length > 80 ? "..." : ""}
          </p>
          {values.language && (
            <span className="mt-1 inline-block rounded bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
              {String(values.language)}
            </span>
          )}
        </div>
      )}

      {/* Script Node Preview */}
      {schema.category === "script" && values?.script_text && (
        <div className="border-t border-border px-3 py-2">
          <pre className="line-clamp-3 overflow-hidden font-mono text-[10px] leading-relaxed text-foreground/80">
            {String(values.script_text).substring(0, 120)}
          </pre>
        </div>
      )}

      {/* Reference / Structured Node Value */}
      {(schema.category === "reference" || schema.category === "structured") && (
        <div className="border-t border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <Link className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {schema.category === "reference" ? "Read-only reference" : "Linked resource"}
            </span>
          </div>
          {values && schema.inputs[0] && values[schema.inputs[0].id] !== undefined && Number(values[schema.inputs[0].id]) > 0 && (
            <span className="mt-1 inline-block rounded bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-foreground">
              ID: {String(values[schema.inputs[0].id])}
            </span>
          )}
        </div>
      )}

      {/* Category preview for cost / condition / reward / timing / effect / fx */}
      {["condition", "reward", "cost", "timing", "effect", "fx"].includes(schema.category) && values && (
        <div className="border-t border-border px-3 py-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {schema.inputs.slice(0, 4).map((input) => (
              <div key={input.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-[10px] text-muted-foreground">{input.label}</span>
                <span className="font-mono text-[10px] text-foreground">{String(values[input.id] ?? 0)}</span>
              </div>
            ))}
          </div>
          {schema.inputs.length > 4 && (
            <p className="mt-1 text-[9px] text-muted-foreground/60">+{schema.inputs.length - 4} more fields</p>
          )}
        </div>
      )}

      {/* Output Handles */}
      {schema.outputs.map((output, i) => (
        <Handle
          key={`out-${output.id}`}
          type="source"
          position={Position.Right}
          id={output.id}
          className={`!h-2.5 !w-2.5 !rounded-full !border-2 ${portColors[output.portType]} ${portBorderColors[output.portType]} hover:!scale-125 !transition-all`}
          style={{ top: `${44 + i * 22}px` }}
        />
      ))}
    </div>
  )
}

// Build nodeTypes map for ReactFlow - single type since all nodes use SchemaNode
export function createNodeTypes() {
  return {
    "schema-node": SchemaNode,
  }
}
