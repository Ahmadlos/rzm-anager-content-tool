// =============================================
// RZManager Environment Schema Definitions
// =============================================
// Each environment is fully isolated with its own
// node types, connection rules, and validation logic.

import type { ComponentType } from "react"

// ---- Environment IDs ----
export type EnvironmentId = "npc" | "item" | "monster" | "quest" | "skill" | "state"

// ---- Handle/Port Types (typed connections) ----
export type PortType = "string-code" | "number" | "script" | "reference"

export interface PortDefinition {
  id: string
  label: string
  portType: PortType
  required?: boolean
}

export interface NodeSchema {
  type: string
  label: string
  category: "root" | "string" | "script" | "reference" | "structured"
  color: string          // Tailwind-compatible color classes for header
  borderColor: string    // Border accent color
  inputs: PortDefinition[]
  outputs: PortDefinition[]
  maxInstances?: number  // e.g. 1 for root nodes
  deletable?: boolean    // false for root nodes
}

export interface ConnectionRule {
  sourceNodeType: string
  sourcePort: string
  targetNodeType: string
  targetPort: string
}

export interface EnvironmentSchema {
  id: EnvironmentId
  title: string
  description: string
  icon: string // lucide icon name for reference
  accentColor: string
  nodes: NodeSchema[]
  connectionRules: ConnectionRule[]
}

// ---- NPC Environment Schema ----

export const npcSchema: EnvironmentSchema = {
  id: "npc",
  title: "NPC Environment",
  description: "Create and manage non-player characters with visual node-based editing.",
  icon: "Users",
  accentColor: "emerald",
  nodes: [
    {
      type: "npc-root",
      label: "NPCResource",
      category: "root",
      color: "bg-emerald-500/10 text-emerald-400",
      borderColor: "border-emerald-500/20",
      maxInstances: 1,
      deletable: false,
      inputs: [
        { id: "name_text_id", label: "name_text_id", portType: "string-code", required: true },
        { id: "text_id", label: "text_id", portType: "string-code", required: true },
        { id: "level", label: "level", portType: "number" },
        { id: "race_id", label: "race_id", portType: "number" },
        { id: "sexsual_id", label: "sexsual_id", portType: "number" },
        { id: "x", label: "x", portType: "number" },
        { id: "y", label: "y", portType: "number" },
        { id: "z", label: "z", portType: "number" },
        { id: "stat_id", label: "stat_id", portType: "number" },
        { id: "weapon_item_id", label: "weapon_item_id", portType: "reference" },
        { id: "shield_item_id", label: "shield_item_id", portType: "reference" },
        { id: "clothes_item_id", label: "clothes_item_id", portType: "reference" },
        { id: "ai_script", label: "ai_script", portType: "script" },
        { id: "contact_script", label: "contact_script", portType: "script" },
      ],
      outputs: [
        { id: "npc_id", label: "npc_id", portType: "number" },
      ],
    },
    {
      type: "string-node",
      label: "StringResource",
      category: "string",
      color: "bg-blue-500/10 text-blue-400",
      borderColor: "border-blue-500/20",
      inputs: [
        { id: "value", label: "value", portType: "string-code" },
        { id: "language", label: "language", portType: "string-code" },
        { id: "group_id", label: "group_id", portType: "number" },
      ],
      outputs: [
        { id: "code", label: "code", portType: "string-code" },
      ],
    },
    {
      type: "script-ai",
      label: "Script_AI",
      category: "script",
      color: "bg-amber-500/10 text-amber-400",
      borderColor: "border-amber-500/20",
      inputs: [
        { id: "script_text", label: "script_text", portType: "script" },
      ],
      outputs: [
        { id: "ai_script", label: "ai_script", portType: "script" },
      ],
    },
    {
      type: "script-contact",
      label: "Script_Contact",
      category: "script",
      color: "bg-amber-500/10 text-amber-400",
      borderColor: "border-amber-500/20",
      inputs: [
        { id: "script_text", label: "script_text", portType: "script" },
      ],
      outputs: [
        { id: "contact_script", label: "contact_script", portType: "script" },
      ],
    },
    {
      type: "ref-item",
      label: "Item Reference",
      category: "reference",
      color: "bg-rose-500/10 text-rose-400",
      borderColor: "border-rose-500/20",
      inputs: [
        { id: "selected_item_id", label: "selected_item_id", portType: "number" },
      ],
      outputs: [
        { id: "item_id", label: "item_id", portType: "reference" },
      ],
    },
    {
      type: "stat-node",
      label: "Stat Node",
      category: "structured",
      color: "bg-cyan-500/10 text-cyan-400",
      borderColor: "border-cyan-500/20",
      inputs: [
        { id: "selected_stat_id", label: "selected_stat_id", portType: "number" },
      ],
      outputs: [
        { id: "stat_id", label: "stat_id", portType: "number" },
      ],
    },
  ],
  connectionRules: [
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "npc-root", targetPort: "name_text_id" },
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "npc-root", targetPort: "text_id" },
    { sourceNodeType: "script-ai", sourcePort: "ai_script", targetNodeType: "npc-root", targetPort: "ai_script" },
    { sourceNodeType: "script-contact", sourcePort: "contact_script", targetNodeType: "npc-root", targetPort: "contact_script" },
    { sourceNodeType: "ref-item", sourcePort: "item_id", targetNodeType: "npc-root", targetPort: "weapon_item_id" },
    { sourceNodeType: "ref-item", sourcePort: "item_id", targetNodeType: "npc-root", targetPort: "shield_item_id" },
    { sourceNodeType: "ref-item", sourcePort: "item_id", targetNodeType: "npc-root", targetPort: "clothes_item_id" },
    { sourceNodeType: "stat-node", sourcePort: "stat_id", targetNodeType: "npc-root", targetPort: "stat_id" },
  ],
}

// ---- Item Environment Schema ----

export const itemSchema: EnvironmentSchema = {
  id: "item",
  title: "Item Environment",
  description: "Design weapons, armor, consumables, and materials with stats and scripts.",
  icon: "Package",
  accentColor: "amber",
  nodes: [
    {
      type: "item-root",
      label: "ItemResource",
      category: "root",
      color: "bg-amber-500/10 text-amber-400",
      borderColor: "border-amber-500/20",
      maxInstances: 1,
      deletable: false,
      inputs: [
        { id: "name_id", label: "name_id", portType: "string-code", required: true },
        { id: "tooltip_id", label: "tooltip_id", portType: "string-code", required: true },
        { id: "type", label: "type", portType: "number" },
        { id: "level", label: "level", portType: "number" },
        { id: "grade", label: "grade", portType: "number" },
        { id: "skill_id", label: "skill_id", portType: "reference" },
        { id: "state_id", label: "state_id", portType: "reference" },
        { id: "script_text", label: "script_text", portType: "script" },
      ],
      outputs: [
        { id: "item_id", label: "item_id", portType: "number" },
      ],
    },
    {
      type: "string-node",
      label: "StringResource",
      category: "string",
      color: "bg-blue-500/10 text-blue-400",
      borderColor: "border-blue-500/20",
      inputs: [
        { id: "value", label: "value", portType: "string-code" },
        { id: "language", label: "language", portType: "string-code" },
        { id: "group_id", label: "group_id", portType: "number" },
      ],
      outputs: [
        { id: "code", label: "code", portType: "string-code" },
      ],
    },
    {
      type: "script-text",
      label: "Script_text",
      category: "script",
      color: "bg-amber-500/10 text-amber-400",
      borderColor: "border-amber-500/20",
      inputs: [
        { id: "script_text", label: "script_text", portType: "script" },
      ],
      outputs: [
        { id: "script_text_out", label: "script_text", portType: "script" },
      ],
    },
    {
      type: "ref-skill",
      label: "Skill Reference",
      category: "reference",
      color: "bg-rose-500/10 text-rose-400",
      borderColor: "border-rose-500/20",
      inputs: [
        { id: "selected_skill_id", label: "selected_skill_id", portType: "number" },
      ],
      outputs: [
        { id: "skill_id", label: "skill_id", portType: "reference" },
      ],
    },
    {
      type: "ref-state",
      label: "State Reference",
      category: "reference",
      color: "bg-rose-500/10 text-rose-400",
      borderColor: "border-rose-500/20",
      inputs: [
        { id: "selected_state_id", label: "selected_state_id", portType: "number" },
      ],
      outputs: [
        { id: "state_id", label: "state_id", portType: "reference" },
      ],
    },
  ],
  connectionRules: [
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "item-root", targetPort: "name_id" },
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "item-root", targetPort: "tooltip_id" },
    { sourceNodeType: "script-text", sourcePort: "script_text_out", targetNodeType: "item-root", targetPort: "script_text" },
    { sourceNodeType: "ref-skill", sourcePort: "skill_id", targetNodeType: "item-root", targetPort: "skill_id" },
    { sourceNodeType: "ref-state", sourcePort: "state_id", targetNodeType: "item-root", targetPort: "state_id" },
  ],
}

// ---- Monster Environment Schema ----

export const monsterSchema: EnvironmentSchema = {
  id: "monster",
  title: "Monster Environment",
  description: "Define creatures, enemies, and bosses with drop tables and behavior scripts.",
  icon: "Bug",
  accentColor: "red",
  nodes: [
    {
      type: "monster-root",
      label: "MonsterResource",
      category: "root",
      color: "bg-red-500/10 text-red-400",
      borderColor: "border-red-500/20",
      maxInstances: 1,
      deletable: false,
      inputs: [
        { id: "name_id", label: "name_id", portType: "string-code", required: true },
        { id: "level", label: "level", portType: "number" },
        { id: "stat_id", label: "stat_id", portType: "number" },
        { id: "monster_skill_link_id", label: "monster_skill_link_id", portType: "number" },
        { id: "drop_table_link_id", label: "drop_table_link_id", portType: "number" },
        { id: "script_on_dead", label: "script_on_dead", portType: "script" },
      ],
      outputs: [
        { id: "monster_id", label: "monster_id", portType: "number" },
      ],
    },
    {
      type: "string-node",
      label: "StringResource",
      category: "string",
      color: "bg-blue-500/10 text-blue-400",
      borderColor: "border-blue-500/20",
      inputs: [
        { id: "value", label: "value", portType: "string-code" },
        { id: "language", label: "language", portType: "string-code" },
        { id: "group_id", label: "group_id", portType: "number" },
      ],
      outputs: [
        { id: "code", label: "code", portType: "string-code" },
      ],
    },
    {
      type: "script-on-dead",
      label: "Script_OnDead",
      category: "script",
      color: "bg-amber-500/10 text-amber-400",
      borderColor: "border-amber-500/20",
      inputs: [
        { id: "script_text", label: "script_text", portType: "script" },
      ],
      outputs: [
        { id: "script_on_dead", label: "script_on_dead", portType: "script" },
      ],
    },
  ],
  connectionRules: [
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "monster-root", targetPort: "name_id" },
    { sourceNodeType: "script-on-dead", sourcePort: "script_on_dead", targetNodeType: "monster-root", targetPort: "script_on_dead" },
  ],
}

// ---- Quest Environment Schema ----

export const questSchema: EnvironmentSchema = {
  id: "quest",
  title: "Quest Environment",
  description: "Design quests, missions, and story-driven content with script hooks.",
  icon: "ScrollText",
  accentColor: "blue",
  nodes: [
    {
      type: "quest-root",
      label: "QuestResource",
      category: "root",
      color: "bg-blue-500/10 text-blue-400",
      borderColor: "border-blue-500/20",
      maxInstances: 1,
      deletable: false,
      inputs: [
        { id: "text_id_quest", label: "text_id_quest", portType: "string-code", required: true },
        { id: "text_id_summary", label: "text_id_summary", portType: "string-code", required: true },
        { id: "text_id_status", label: "text_id_status", portType: "string-code" },
        { id: "script_start_text", label: "script_start_text", portType: "script" },
        { id: "script_end_text", label: "script_end_text", portType: "script" },
        { id: "script_drop_text", label: "script_drop_text", portType: "script" },
      ],
      outputs: [
        { id: "quest_id", label: "quest_id", portType: "number" },
      ],
    },
    {
      type: "string-node",
      label: "StringResource",
      category: "string",
      color: "bg-blue-500/10 text-blue-400",
      borderColor: "border-blue-500/20",
      inputs: [
        { id: "value", label: "value", portType: "string-code" },
        { id: "language", label: "language", portType: "string-code" },
        { id: "group_id", label: "group_id", portType: "number" },
      ],
      outputs: [
        { id: "code", label: "code", portType: "string-code" },
      ],
    },
    {
      type: "script-quest-start",
      label: "Script_Quest_Start",
      category: "script",
      color: "bg-amber-500/10 text-amber-400",
      borderColor: "border-amber-500/20",
      inputs: [
        { id: "script_text", label: "script_text", portType: "script" },
      ],
      outputs: [
        { id: "script_start_text", label: "script_start_text", portType: "script" },
      ],
    },
    {
      type: "script-quest-end",
      label: "Script_Quest_End",
      category: "script",
      color: "bg-amber-500/10 text-amber-400",
      borderColor: "border-amber-500/20",
      inputs: [
        { id: "script_text", label: "script_text", portType: "script" },
      ],
      outputs: [
        { id: "script_end_text", label: "script_end_text", portType: "script" },
      ],
    },
    {
      type: "script-quest-drop",
      label: "Script_Quest_Drop",
      category: "script",
      color: "bg-amber-500/10 text-amber-400",
      borderColor: "border-amber-500/20",
      inputs: [
        { id: "script_text", label: "script_text", portType: "script" },
      ],
      outputs: [
        { id: "script_drop_text", label: "script_drop_text", portType: "script" },
      ],
    },
  ],
  connectionRules: [
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "quest-root", targetPort: "text_id_quest" },
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "quest-root", targetPort: "text_id_summary" },
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "quest-root", targetPort: "text_id_status" },
    { sourceNodeType: "script-quest-start", sourcePort: "script_start_text", targetNodeType: "quest-root", targetPort: "script_start_text" },
    { sourceNodeType: "script-quest-end", sourcePort: "script_end_text", targetNodeType: "quest-root", targetPort: "script_end_text" },
    { sourceNodeType: "script-quest-drop", sourcePort: "script_drop_text", targetNodeType: "quest-root", targetPort: "script_drop_text" },
  ],
}

// ---- Skill Environment Schema ----

export const skillSchema: EnvironmentSchema = {
  id: "skill",
  title: "Skill Environment",
  description: "Define character abilities with text, tooltips, and state links.",
  icon: "Zap",
  accentColor: "cyan",
  nodes: [
    {
      type: "skill-root",
      label: "SkillResource",
      category: "root",
      color: "bg-cyan-500/10 text-cyan-400",
      borderColor: "border-cyan-500/20",
      maxInstances: 1,
      deletable: false,
      inputs: [
        { id: "text_id", label: "text_id", portType: "string-code", required: true },
        { id: "desc_id", label: "desc_id", portType: "string-code", required: true },
        { id: "tooltip_id", label: "tooltip_id", portType: "string-code" },
        { id: "state_id", label: "state_id", portType: "number" },
      ],
      outputs: [
        { id: "skill_id", label: "skill_id", portType: "number" },
      ],
    },
    {
      type: "string-node",
      label: "StringResource",
      category: "string",
      color: "bg-blue-500/10 text-blue-400",
      borderColor: "border-blue-500/20",
      inputs: [
        { id: "value", label: "value", portType: "string-code" },
        { id: "language", label: "language", portType: "string-code" },
        { id: "group_id", label: "group_id", portType: "number" },
      ],
      outputs: [
        { id: "code", label: "code", portType: "string-code" },
      ],
    },
  ],
  connectionRules: [
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "skill-root", targetPort: "text_id" },
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "skill-root", targetPort: "desc_id" },
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "skill-root", targetPort: "tooltip_id" },
  ],
}

// ---- State Environment Schema ----

export const stateSchema: EnvironmentSchema = {
  id: "state",
  title: "State Environment",
  description: "Define buffs, debuffs, and state effects with up to 20 value parameters.",
  icon: "Shield",
  accentColor: "rose",
  nodes: [
    {
      type: "state-root",
      label: "StateResource",
      category: "root",
      color: "bg-rose-500/10 text-rose-400",
      borderColor: "border-rose-500/20",
      maxInstances: 1,
      deletable: false,
      inputs: [
        { id: "text_id", label: "text_id", portType: "string-code", required: true },
        { id: "tooltip_id", label: "tooltip_id", portType: "string-code" },
        ...Array.from({ length: 20 }, (_, i) => ({
          id: `value_${i}`,
          label: `value_${i}`,
          portType: "number" as PortType,
        })),
      ],
      outputs: [
        { id: "state_id", label: "state_id", portType: "number" },
      ],
    },
    {
      type: "string-node",
      label: "StringResource",
      category: "string",
      color: "bg-blue-500/10 text-blue-400",
      borderColor: "border-blue-500/20",
      inputs: [
        { id: "value", label: "value", portType: "string-code" },
        { id: "language", label: "language", portType: "string-code" },
        { id: "group_id", label: "group_id", portType: "number" },
      ],
      outputs: [
        { id: "code", label: "code", portType: "string-code" },
      ],
    },
  ],
  connectionRules: [
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "state-root", targetPort: "text_id" },
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "state-root", targetPort: "tooltip_id" },
  ],
}

// ---- Schema Registry ----

export const environmentSchemas: Record<EnvironmentId, EnvironmentSchema> = {
  npc: npcSchema,
  item: itemSchema,
  monster: monsterSchema,
  quest: questSchema,
  skill: skillSchema,
  state: stateSchema,
}

// ---- Port Type Colors (for visual distinction) ----

export const portTypeColors: Record<PortType, string> = {
  "string-code": "!bg-blue-400",
  number: "!bg-emerald-400",
  script: "!bg-amber-400",
  reference: "!bg-rose-400",
}

// ---- Validation Helpers ----

export interface ValidationError {
  nodeId: string
  field: string
  message: string
  severity: "error" | "warning"
}

export function validateGraph(
  schema: EnvironmentSchema,
  nodes: { id: string; type?: string; data: Record<string, unknown> }[],
  edges: { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }[],
): ValidationError[] {
  const errors: ValidationError[] = []

  // Check exactly one root node
  const rootSchema = schema.nodes.find((n) => n.category === "root")
  if (rootSchema) {
    const rootNodes = nodes.filter((n) => n.type === rootSchema.type)
    if (rootNodes.length === 0) {
      errors.push({
        nodeId: "graph",
        field: "root",
        message: `Missing required root node: ${rootSchema.label}`,
        severity: "error",
      })
    } else if (rootNodes.length > 1) {
      errors.push({
        nodeId: "graph",
        field: "root",
        message: `Only one ${rootSchema.label} allowed per graph`,
        severity: "error",
      })
    }
  }

  // Check required connections on root node
  if (rootSchema) {
    const rootNode = nodes.find((n) => n.type === rootSchema.type)
    if (rootNode) {
      for (const input of rootSchema.inputs) {
        if (input.required) {
          const hasConnection = edges.some(
            (e) => e.target === rootNode.id && e.targetHandle === input.id,
          )
          if (!hasConnection) {
            errors.push({
              nodeId: rootNode.id,
              field: input.id,
              message: `Required field "${input.label}" is not connected`,
              severity: "error",
            })
          }
        }
      }
    }
  }

  // Check string length limits (3072 chars max for StringResource values)
  nodes.forEach((node) => {
    const nodeSchema = schema.nodes.find((s) => s.type === node.type)
    if (nodeSchema?.category === "string") {
      const value = node.data.value as string | undefined
      if (value && value.length > 3072) {
        errors.push({
          nodeId: node.id,
          field: "value",
          message: `String value exceeds max length (${value.length}/3072)`,
          severity: "error",
        })
      }
    }
  })

  return errors
}
