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
} from "lucide-react"
import type { NodeSchema, PortType } from "@/lib/environment-schemas"

const portColors: Record<PortType, string> = {
  "string-code": "!bg-blue-400 hover:!bg-blue-300",
  number: "!bg-emerald-400 hover:!bg-emerald-300",
  script: "!bg-amber-400 hover:!bg-amber-300",
  reference: "!bg-rose-400 hover:!bg-rose-300",
}

const portBorderColors: Record<PortType, string> = {
  "string-code": "!border-blue-600",
  number: "!border-emerald-600",
  script: "!border-amber-600",
  reference: "!border-rose-600",
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  root: Database,
  string: FileText,
  script: Code,
  reference: Link,
  structured: LayoutGrid,
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

  // For the root node, show a compact field list of direct-input values (numbers that don't need connections)
  const directInputs = schema.inputs.filter(
    (p) => p.portType === "number" && !["stat_id", "weapon_item_id", "shield_item_id", "clothes_item_id", "skill_id", "state_id", "monster_skill_link_id", "drop_table_link_id", "selected_item_id", "selected_stat_id", "selected_skill_id", "selected_state_id"].includes(p.id),
  )

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
