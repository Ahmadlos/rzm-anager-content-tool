// =============================================
// RZManager Environment Schema Definitions
// =============================================
// Each environment is fully isolated with its own
// node types, connection rules, and validation logic.

import type { ComponentType } from "react"

// ---- Environment IDs ----
export type EnvironmentId = "npc" | "item" | "monster" | "quest" | "skill" | "state"

// ---- Handle/Port Types (typed connections) ----
export type PortType = "string-code" | "number" | "script" | "reference" | "stat-block" | "model-block" | "condition" | "reward" | "cost" | "timing" | "effect" | "fx"

export interface PortDefinition {
  id: string
  label: string
  portType: PortType
  required?: boolean
}

export type NodeCategory =
  | "root"
  | "string"
  | "script"
  | "reference"
  | "structured"
  | "condition"
  | "reward"
  | "cost"
  | "timing"
  | "effect"
  | "fx"

export interface NodeSchema {
  type: string
  label: string
  category: NodeCategory
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
        { id: "race_id", label: "race_id", portType: "number" },
        { id: "sexual_id", label: "sexual_id", portType: "number" },
        { id: "x", label: "x", portType: "number" },
        { id: "y", label: "y", portType: "number" },
        { id: "z", label: "z", portType: "number" },
        { id: "face_x", label: "face_x", portType: "number" },
        { id: "face_y", label: "face_y", portType: "number" },
        { id: "face_z", label: "face_z", portType: "number" },
        { id: "model_file", label: "model_file", portType: "script" },
        { id: "motion_id", label: "motion_id", portType: "number" },
        { id: "roaming_flag", label: "roaming_flag", portType: "number" },
        { id: "speed", label: "speed", portType: "number" },
        { id: "run_speed", label: "run_speed", portType: "number" },
        { id: "combat_flag", label: "combat_flag", portType: "number" },
        { id: "stat_id", label: "stat_id", portType: "number" },
        // Equipment references
        { id: "weapon_item_id", label: "weapon_item_id", portType: "reference" },
        { id: "shield_item_id", label: "shield_item_id", portType: "reference" },
        { id: "clothes_item_id", label: "clothes_item_id", portType: "reference" },
        { id: "helm_item_id", label: "helm_item_id", portType: "reference" },
        { id: "gloves_item_id", label: "gloves_item_id", portType: "reference" },
        { id: "boots_item_id", label: "boots_item_id", portType: "reference" },
        { id: "belt_item_id", label: "belt_item_id", portType: "reference" },
        { id: "mantle_item_id", label: "mantle_item_id", portType: "reference" },
        { id: "necklace_item_id", label: "necklace_item_id", portType: "reference" },
        { id: "earring_item_id", label: "earring_item_id", portType: "reference" },
        { id: "ring1_item_id", label: "ring1_item_id", portType: "reference" },
        { id: "ring2_item_id", label: "ring2_item_id", portType: "reference" },
        // Script connections
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
        { id: "value", label: "value", portType: "string-code", required: true },
        { id: "group_id", label: "group_id", portType: "number", required: true },
        { id: "language", label: "language", portType: "string-code" },
      ],
      outputs: [
        { id: "code", label: "code", portType: "string-code" },
      ],
    },
    {
      type: "script-ai",
      label: "AI Script",
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
      label: "Contact Script",
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
      label: "Stat Reference",
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
    // String connections
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "npc-root", targetPort: "name_text_id" },
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "npc-root", targetPort: "text_id" },
    // Script connections
    { sourceNodeType: "script-ai", sourcePort: "ai_script", targetNodeType: "npc-root", targetPort: "ai_script" },
    { sourceNodeType: "script-contact", sourcePort: "contact_script", targetNodeType: "npc-root", targetPort: "contact_script" },
    // Equipment references (all 12 slots)
    { sourceNodeType: "ref-item", sourcePort: "item_id", targetNodeType: "npc-root", targetPort: "weapon_item_id" },
    { sourceNodeType: "ref-item", sourcePort: "item_id", targetNodeType: "npc-root", targetPort: "shield_item_id" },
    { sourceNodeType: "ref-item", sourcePort: "item_id", targetNodeType: "npc-root", targetPort: "clothes_item_id" },
    { sourceNodeType: "ref-item", sourcePort: "item_id", targetNodeType: "npc-root", targetPort: "helm_item_id" },
    { sourceNodeType: "ref-item", sourcePort: "item_id", targetNodeType: "npc-root", targetPort: "gloves_item_id" },
    { sourceNodeType: "ref-item", sourcePort: "item_id", targetNodeType: "npc-root", targetPort: "boots_item_id" },
    { sourceNodeType: "ref-item", sourcePort: "item_id", targetNodeType: "npc-root", targetPort: "belt_item_id" },
    { sourceNodeType: "ref-item", sourcePort: "item_id", targetNodeType: "npc-root", targetPort: "mantle_item_id" },
    { sourceNodeType: "ref-item", sourcePort: "item_id", targetNodeType: "npc-root", targetPort: "necklace_item_id" },
    { sourceNodeType: "ref-item", sourcePort: "item_id", targetNodeType: "npc-root", targetPort: "earring_item_id" },
    { sourceNodeType: "ref-item", sourcePort: "item_id", targetNodeType: "npc-root", targetPort: "ring1_item_id" },
    { sourceNodeType: "ref-item", sourcePort: "item_id", targetNodeType: "npc-root", targetPort: "ring2_item_id" },
    // Stat
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
        { id: "group", label: "group", portType: "number" },
        { id: "class", label: "class", portType: "number" },
        { id: "wear_type", label: "wear_type", portType: "number" },
        { id: "grade", label: "grade", portType: "number" },
        { id: "rank", label: "rank", portType: "number" },
        { id: "level", label: "level", portType: "number" },
        { id: "enhance", label: "enhance", portType: "number" },
        { id: "price", label: "price", portType: "number" },
        { id: "weight", label: "weight", portType: "number" },
        { id: "range", label: "range", portType: "number" },
        { id: "limit_deva", label: "limit_deva", portType: "number" },
        { id: "limit_asura", label: "limit_asura", portType: "number" },
        { id: "limit_gaia", label: "limit_gaia", portType: "number" },
        { id: "icon_id", label: "icon_id", portType: "number" },
        { id: "icon_file_name", label: "icon_file_name", portType: "script" },
        // Stat blocks
        { id: "base_stat_block", label: "base_stat_block", portType: "stat-block" },
        { id: "opt_stat_block", label: "opt_stat_block", portType: "stat-block" },
        { id: "model_set", label: "model_set", portType: "model-block" },
        // Foreign keys
        { id: "effect_id", label: "effect_id", portType: "reference" },
        { id: "enhance_id", label: "enhance_id", portType: "reference" },
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
        { id: "value", label: "value", portType: "string-code", required: true },
        { id: "group_id", label: "group_id", portType: "number", required: true },
        { id: "language", label: "language", portType: "string-code" },
      ],
      outputs: [
        { id: "code", label: "code", portType: "string-code" },
      ],
    },
    {
      type: "item-base-stat",
      label: "Base Stat Node",
      category: "structured",
      color: "bg-cyan-500/10 text-cyan-400",
      borderColor: "border-cyan-500/20",
      inputs: [
        { id: "base_type_0", label: "base_type_0", portType: "number" },
        { id: "base_var1_0", label: "base_var1_0", portType: "number" },
        { id: "base_var2_0", label: "base_var2_0", portType: "number" },
        { id: "base_type_1", label: "base_type_1", portType: "number" },
        { id: "base_var1_1", label: "base_var1_1", portType: "number" },
        { id: "base_var2_1", label: "base_var2_1", portType: "number" },
        { id: "base_type_2", label: "base_type_2", portType: "number" },
        { id: "base_var1_2", label: "base_var1_2", portType: "number" },
        { id: "base_var2_2", label: "base_var2_2", portType: "number" },
        { id: "base_type_3", label: "base_type_3", portType: "number" },
        { id: "base_var1_3", label: "base_var1_3", portType: "number" },
        { id: "base_var2_3", label: "base_var2_3", portType: "number" },
      ],
      outputs: [
        { id: "base_stat_block", label: "base_stat_block", portType: "stat-block" },
      ],
    },
    {
      type: "item-opt-stat",
      label: "Option Stat Node",
      category: "structured",
      color: "bg-cyan-500/10 text-cyan-400",
      borderColor: "border-cyan-500/20",
      inputs: [
        { id: "opt_type_0", label: "opt_type_0", portType: "number" },
        { id: "opt_var1_0", label: "opt_var1_0", portType: "number" },
        { id: "opt_var2_0", label: "opt_var2_0", portType: "number" },
        { id: "opt_type_1", label: "opt_type_1", portType: "number" },
        { id: "opt_var1_1", label: "opt_var1_1", portType: "number" },
        { id: "opt_var2_1", label: "opt_var2_1", portType: "number" },
        { id: "opt_type_2", label: "opt_type_2", portType: "number" },
        { id: "opt_var1_2", label: "opt_var1_2", portType: "number" },
        { id: "opt_var2_2", label: "opt_var2_2", portType: "number" },
        { id: "opt_type_3", label: "opt_type_3", portType: "number" },
        { id: "opt_var1_3", label: "opt_var1_3", portType: "number" },
        { id: "opt_var2_3", label: "opt_var2_3", portType: "number" },
      ],
      outputs: [
        { id: "opt_stat_block", label: "opt_stat_block", portType: "stat-block" },
      ],
    },
    {
      type: "item-model-set",
      label: "Model Set Node",
      category: "structured",
      color: "bg-violet-500/10 text-violet-400",
      borderColor: "border-violet-500/20",
      inputs: [
        ...Array.from({ length: 18 }, (_, i) => ({
          id: `model_${String(i).padStart(2, "0")}`,
          label: `model_${String(i).padStart(2, "0")}`,
          portType: "number" as PortType,
        })),
      ],
      outputs: [
        { id: "model_set", label: "model_set", portType: "model-block" },
      ],
    },
    {
      type: "script-text",
      label: "Script Node",
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
    {
      type: "ref-effect",
      label: "Effect Reference",
      category: "reference",
      color: "bg-rose-500/10 text-rose-400",
      borderColor: "border-rose-500/20",
      inputs: [
        { id: "selected_effect_id", label: "selected_effect_id", portType: "number" },
      ],
      outputs: [
        { id: "effect_id", label: "effect_id", portType: "reference" },
      ],
    },
    {
      type: "ref-enhance",
      label: "Enhance Reference",
      category: "reference",
      color: "bg-rose-500/10 text-rose-400",
      borderColor: "border-rose-500/20",
      inputs: [
        { id: "selected_enhance_id", label: "selected_enhance_id", portType: "number" },
      ],
      outputs: [
        { id: "enhance_id", label: "enhance_id", portType: "reference" },
      ],
    },
  ],
  connectionRules: [
    // String
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "item-root", targetPort: "name_id" },
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "item-root", targetPort: "tooltip_id" },
    // Stat blocks
    { sourceNodeType: "item-base-stat", sourcePort: "base_stat_block", targetNodeType: "item-root", targetPort: "base_stat_block" },
    { sourceNodeType: "item-opt-stat", sourcePort: "opt_stat_block", targetNodeType: "item-root", targetPort: "opt_stat_block" },
    { sourceNodeType: "item-model-set", sourcePort: "model_set", targetNodeType: "item-root", targetPort: "model_set" },
    // Script
    { sourceNodeType: "script-text", sourcePort: "script_text_out", targetNodeType: "item-root", targetPort: "script_text" },
    // References
    { sourceNodeType: "ref-skill", sourcePort: "skill_id", targetNodeType: "item-root", targetPort: "skill_id" },
    { sourceNodeType: "ref-state", sourcePort: "state_id", targetNodeType: "item-root", targetPort: "state_id" },
    { sourceNodeType: "ref-effect", sourcePort: "effect_id", targetNodeType: "item-root", targetPort: "effect_id" },
    { sourceNodeType: "ref-enhance", sourcePort: "enhance_id", targetNodeType: "item-root", targetPort: "enhance_id" },
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
        { id: "monster_group", label: "monster_group", portType: "number" },
        { id: "location_id", label: "location_id", portType: "number" },
        { id: "model", label: "model", portType: "number" },
        { id: "motion_file_id", label: "motion_file_id", portType: "number" },
        { id: "size", label: "size", portType: "number" },
        { id: "scale", label: "scale", portType: "number" },
        { id: "camera_x", label: "camera_x", portType: "number" },
        { id: "camera_y", label: "camera_y", portType: "number" },
        { id: "camera_z", label: "camera_z", portType: "number" },
        { id: "target_x", label: "target_x", portType: "number" },
        { id: "target_y", label: "target_y", portType: "number" },
        { id: "target_z", label: "target_z", portType: "number" },
        { id: "level", label: "level", portType: "number" },
        { id: "race", label: "race", portType: "number" },
        { id: "species_id", label: "species_id", portType: "number" },
        { id: "visible_range", label: "visible_range", portType: "number" },
        { id: "chase_range", label: "chase_range", portType: "number" },
        // Stat
        { id: "stat_id", label: "stat_id", portType: "number" },
        // Combat stats
        { id: "hp", label: "hp", portType: "number" },
        { id: "mp", label: "mp", portType: "number" },
        { id: "attack", label: "attack", portType: "number" },
        { id: "defence", label: "defence", portType: "number" },
        { id: "magic_attack", label: "magic_attack", portType: "number" },
        { id: "magic_defence", label: "magic_defence", portType: "number" },
        // Rewards
        { id: "exp_min", label: "exp_min", portType: "number" },
        { id: "exp_max", label: "exp_max", portType: "number" },
        { id: "jp_min", label: "jp_min", portType: "number" },
        { id: "jp_max", label: "jp_max", portType: "number" },
        { id: "gold_min", label: "gold_min", portType: "number" },
        { id: "gold_max", label: "gold_max", portType: "number" },
        { id: "respawn_group", label: "respawn_group", portType: "number" },
        // Reference links
        { id: "monster_skill_link_id", label: "monster_skill_link_id", portType: "reference" },
        { id: "drop_table_link_id", label: "drop_table_link_id", portType: "reference" },
        // Script
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
        { id: "value", label: "value", portType: "string-code", required: true },
        { id: "group_id", label: "group_id", portType: "number", required: true },
        { id: "language", label: "language", portType: "string-code" },
      ],
      outputs: [
        { id: "code", label: "code", portType: "string-code" },
      ],
    },
    {
      type: "script-on-dead",
      label: "OnDead Script",
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
    {
      type: "stat-node",
      label: "Stat Reference",
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
    {
      type: "ref-monster-skill",
      label: "Monster Skill Link",
      category: "reference",
      color: "bg-rose-500/10 text-rose-400",
      borderColor: "border-rose-500/20",
      inputs: [
        { id: "selected_skill_link_id", label: "selected_skill_link_id", portType: "number" },
      ],
      outputs: [
        { id: "monster_skill_link_id", label: "monster_skill_link_id", portType: "reference" },
      ],
    },
    {
      type: "ref-drop-table",
      label: "Drop Table Link",
      category: "reference",
      color: "bg-rose-500/10 text-rose-400",
      borderColor: "border-rose-500/20",
      inputs: [
        { id: "selected_drop_table_id", label: "selected_drop_table_id", portType: "number" },
      ],
      outputs: [
        { id: "drop_table_link_id", label: "drop_table_link_id", portType: "reference" },
      ],
    },
  ],
  connectionRules: [
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "monster-root", targetPort: "name_id" },
    { sourceNodeType: "script-on-dead", sourcePort: "script_on_dead", targetNodeType: "monster-root", targetPort: "script_on_dead" },
    { sourceNodeType: "stat-node", sourcePort: "stat_id", targetNodeType: "monster-root", targetPort: "stat_id" },
    { sourceNodeType: "ref-monster-skill", sourcePort: "monster_skill_link_id", targetNodeType: "monster-root", targetPort: "monster_skill_link_id" },
    { sourceNodeType: "ref-drop-table", sourcePort: "drop_table_link_id", targetNodeType: "monster-root", targetPort: "drop_table_link_id" },
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
        // Text
        { id: "text_id_quest", label: "text_id_quest", portType: "string-code", required: true },
        { id: "text_id_summary", label: "text_id_summary", portType: "string-code", required: true },
        { id: "text_id_status", label: "text_id_status", portType: "string-code" },
        // Conditions
        { id: "limit_level", label: "limit_level", portType: "condition" },
        { id: "limit_job", label: "limit_job", portType: "condition" },
        { id: "limit_race", label: "limit_race", portType: "condition" },
        { id: "limit_time", label: "limit_time", portType: "condition" },
        // Rewards
        { id: "reward_default", label: "reward_default", portType: "reward" },
        { id: "reward_optional_1", label: "reward_optional_1", portType: "reward" },
        { id: "reward_optional_2", label: "reward_optional_2", portType: "reward" },
        { id: "reward_optional_3", label: "reward_optional_3", portType: "reward" },
        { id: "reward_optional_4", label: "reward_optional_4", portType: "reward" },
        { id: "reward_optional_5", label: "reward_optional_5", portType: "reward" },
        { id: "reward_optional_6", label: "reward_optional_6", portType: "reward" },
        // Scripts
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
        { id: "value", label: "value", portType: "string-code", required: true },
        { id: "group_id", label: "group_id", portType: "number", required: true },
        { id: "language", label: "language", portType: "string-code" },
      ],
      outputs: [
        { id: "code", label: "code", portType: "string-code" },
      ],
    },
    // -- Condition Nodes --
    {
      type: "cond-level-limit",
      label: "Level Limit",
      category: "condition",
      color: "bg-orange-500/10 text-orange-400",
      borderColor: "border-orange-500/20",
      inputs: [
        { id: "min_level", label: "min_level", portType: "number" },
        { id: "max_level", label: "max_level", portType: "number" },
      ],
      outputs: [
        { id: "limit_level", label: "limit_level", portType: "condition" },
      ],
    },
    {
      type: "cond-job-limit",
      label: "Job Limit",
      category: "condition",
      color: "bg-orange-500/10 text-orange-400",
      borderColor: "border-orange-500/20",
      inputs: [
        { id: "allowed_jobs", label: "allowed_jobs", portType: "number" },
      ],
      outputs: [
        { id: "limit_job", label: "limit_job", portType: "condition" },
      ],
    },
    {
      type: "cond-race-limit",
      label: "Race Limit",
      category: "condition",
      color: "bg-orange-500/10 text-orange-400",
      borderColor: "border-orange-500/20",
      inputs: [
        { id: "allowed_races", label: "allowed_races", portType: "number" },
      ],
      outputs: [
        { id: "limit_race", label: "limit_race", portType: "condition" },
      ],
    },
    {
      type: "cond-time-limit",
      label: "Time Limit",
      category: "condition",
      color: "bg-orange-500/10 text-orange-400",
      borderColor: "border-orange-500/20",
      inputs: [
        { id: "time_limit_sec", label: "time_limit_sec", portType: "number" },
      ],
      outputs: [
        { id: "limit_time", label: "limit_time", portType: "condition" },
      ],
    },
    // -- Reward Nodes --
    {
      type: "reward-default",
      label: "Default Reward",
      category: "reward",
      color: "bg-yellow-500/10 text-yellow-400",
      borderColor: "border-yellow-500/20",
      inputs: [
        { id: "reward_item_id", label: "reward_item_id", portType: "number" },
        { id: "reward_count", label: "reward_count", portType: "number" },
        { id: "reward_gold", label: "reward_gold", portType: "number" },
        { id: "reward_exp", label: "reward_exp", portType: "number" },
        { id: "reward_jp", label: "reward_jp", portType: "number" },
      ],
      outputs: [
        { id: "reward_default", label: "reward_default", portType: "reward" },
      ],
    },
    {
      type: "reward-optional",
      label: "Optional Reward",
      category: "reward",
      color: "bg-yellow-500/10 text-yellow-400",
      borderColor: "border-yellow-500/20",
      inputs: [
        { id: "reward_item_id", label: "reward_item_id", portType: "number" },
        { id: "reward_count", label: "reward_count", portType: "number" },
        { id: "reward_gold", label: "reward_gold", portType: "number" },
        { id: "reward_exp", label: "reward_exp", portType: "number" },
      ],
      outputs: [
        { id: "reward_optional", label: "reward_optional", portType: "reward" },
      ],
    },
    // -- Script Nodes --
    {
      type: "script-quest-start",
      label: "Quest Start Script",
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
      label: "Quest End Script",
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
      label: "Quest Drop Script",
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
    // Text
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "quest-root", targetPort: "text_id_quest" },
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "quest-root", targetPort: "text_id_summary" },
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "quest-root", targetPort: "text_id_status" },
    // Conditions
    { sourceNodeType: "cond-level-limit", sourcePort: "limit_level", targetNodeType: "quest-root", targetPort: "limit_level" },
    { sourceNodeType: "cond-job-limit", sourcePort: "limit_job", targetNodeType: "quest-root", targetPort: "limit_job" },
    { sourceNodeType: "cond-race-limit", sourcePort: "limit_race", targetNodeType: "quest-root", targetPort: "limit_race" },
    { sourceNodeType: "cond-time-limit", sourcePort: "limit_time", targetNodeType: "quest-root", targetPort: "limit_time" },
    // Rewards
    { sourceNodeType: "reward-default", sourcePort: "reward_default", targetNodeType: "quest-root", targetPort: "reward_default" },
    { sourceNodeType: "reward-optional", sourcePort: "reward_optional", targetNodeType: "quest-root", targetPort: "reward_optional_1" },
    { sourceNodeType: "reward-optional", sourcePort: "reward_optional", targetNodeType: "quest-root", targetPort: "reward_optional_2" },
    { sourceNodeType: "reward-optional", sourcePort: "reward_optional", targetNodeType: "quest-root", targetPort: "reward_optional_3" },
    { sourceNodeType: "reward-optional", sourcePort: "reward_optional", targetNodeType: "quest-root", targetPort: "reward_optional_4" },
    { sourceNodeType: "reward-optional", sourcePort: "reward_optional", targetNodeType: "quest-root", targetPort: "reward_optional_5" },
    { sourceNodeType: "reward-optional", sourcePort: "reward_optional", targetNodeType: "quest-root", targetPort: "reward_optional_6" },
    // Scripts
    { sourceNodeType: "script-quest-start", sourcePort: "script_start_text", targetNodeType: "quest-root", targetPort: "script_start_text" },
    { sourceNodeType: "script-quest-end", sourcePort: "script_end_text", targetNodeType: "quest-root", targetPort: "script_end_text" },
    { sourceNodeType: "script-quest-drop", sourcePort: "script_drop_text", targetNodeType: "quest-root", targetPort: "script_drop_text" },
  ],
}

// ---- Skill Environment Schema ----

export const skillSchema: EnvironmentSchema = {
  id: "skill",
  title: "Skill Environment",
  description: "Define character abilities with costs, requirements, effects, and timing.",
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
        // Text
        { id: "text_id", label: "text_id", portType: "string-code", required: true },
        { id: "desc_id", label: "desc_id", portType: "string-code", required: true },
        { id: "tooltip_id", label: "tooltip_id", portType: "string-code" },
        // Cost
        { id: "hp_cost", label: "hp_cost", portType: "cost" },
        { id: "mp_cost", label: "mp_cost", portType: "cost" },
        { id: "item_cost", label: "item_cost", portType: "cost" },
        { id: "energy_cost", label: "energy_cost", portType: "cost" },
        // Requirements
        { id: "level_req", label: "level_req", portType: "condition" },
        { id: "state_req", label: "state_req", portType: "condition" },
        { id: "weapon_filter", label: "weapon_filter", portType: "condition" },
        // Effects
        { id: "state_id", label: "state_id", portType: "effect" },
        { id: "damage_formula", label: "damage_formula", portType: "effect" },
        { id: "probability", label: "probability", portType: "effect" },
        // Timing
        { id: "cast_delay", label: "cast_delay", portType: "timing" },
        { id: "cooldown", label: "cooldown", portType: "timing" },
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
        { id: "value", label: "value", portType: "string-code", required: true },
        { id: "group_id", label: "group_id", portType: "number", required: true },
        { id: "language", label: "language", portType: "string-code" },
      ],
      outputs: [
        { id: "code", label: "code", portType: "string-code" },
      ],
    },
    // -- Cost Nodes --
    {
      type: "cost-hp",
      label: "HP Cost",
      category: "cost",
      color: "bg-pink-500/10 text-pink-400",
      borderColor: "border-pink-500/20",
      inputs: [
        { id: "hp_amount", label: "hp_amount", portType: "number" },
      ],
      outputs: [
        { id: "hp_cost", label: "hp_cost", portType: "cost" },
      ],
    },
    {
      type: "cost-mp",
      label: "MP Cost",
      category: "cost",
      color: "bg-pink-500/10 text-pink-400",
      borderColor: "border-pink-500/20",
      inputs: [
        { id: "mp_amount", label: "mp_amount", portType: "number" },
      ],
      outputs: [
        { id: "mp_cost", label: "mp_cost", portType: "cost" },
      ],
    },
    {
      type: "cost-item",
      label: "Item Cost",
      category: "cost",
      color: "bg-pink-500/10 text-pink-400",
      borderColor: "border-pink-500/20",
      inputs: [
        { id: "cost_item_id", label: "cost_item_id", portType: "number" },
        { id: "cost_item_count", label: "cost_item_count", portType: "number" },
      ],
      outputs: [
        { id: "item_cost", label: "item_cost", portType: "cost" },
      ],
    },
    {
      type: "cost-energy",
      label: "Energy Cost",
      category: "cost",
      color: "bg-pink-500/10 text-pink-400",
      borderColor: "border-pink-500/20",
      inputs: [
        { id: "energy_amount", label: "energy_amount", portType: "number" },
      ],
      outputs: [
        { id: "energy_cost", label: "energy_cost", portType: "cost" },
      ],
    },
    // -- Requirement Nodes --
    {
      type: "req-level",
      label: "Level Requirement",
      category: "condition",
      color: "bg-orange-500/10 text-orange-400",
      borderColor: "border-orange-500/20",
      inputs: [
        { id: "min_level", label: "min_level", portType: "number" },
      ],
      outputs: [
        { id: "level_req", label: "level_req", portType: "condition" },
      ],
    },
    {
      type: "req-state",
      label: "State Requirement",
      category: "condition",
      color: "bg-orange-500/10 text-orange-400",
      borderColor: "border-orange-500/20",
      inputs: [
        { id: "required_state_id", label: "required_state_id", portType: "number" },
      ],
      outputs: [
        { id: "state_req", label: "state_req", portType: "condition" },
      ],
    },
    {
      type: "req-weapon",
      label: "Weapon Filter",
      category: "condition",
      color: "bg-orange-500/10 text-orange-400",
      borderColor: "border-orange-500/20",
      inputs: [
        { id: "weapon_type", label: "weapon_type", portType: "number" },
      ],
      outputs: [
        { id: "weapon_filter", label: "weapon_filter", portType: "condition" },
      ],
    },
    // -- Effect Nodes --
    {
      type: "effect-state-apply",
      label: "State Apply",
      category: "effect",
      color: "bg-indigo-500/10 text-indigo-400",
      borderColor: "border-indigo-500/20",
      inputs: [
        { id: "apply_state_id", label: "apply_state_id", portType: "number" },
        { id: "duration", label: "duration", portType: "number" },
      ],
      outputs: [
        { id: "state_id", label: "state_id", portType: "effect" },
      ],
    },
    {
      type: "effect-damage-formula",
      label: "Damage Formula",
      category: "effect",
      color: "bg-indigo-500/10 text-indigo-400",
      borderColor: "border-indigo-500/20",
      inputs: [
        { id: "var1", label: "var1", portType: "number" },
        { id: "var2", label: "var2", portType: "number" },
        { id: "var3", label: "var3", portType: "number" },
        { id: "damage_type", label: "damage_type", portType: "number" },
      ],
      outputs: [
        { id: "damage_formula", label: "damage_formula", portType: "effect" },
      ],
    },
    {
      type: "effect-probability",
      label: "Probability",
      category: "effect",
      color: "bg-indigo-500/10 text-indigo-400",
      borderColor: "border-indigo-500/20",
      inputs: [
        { id: "chance_percent", label: "chance_percent", portType: "number" },
      ],
      outputs: [
        { id: "probability", label: "probability", portType: "effect" },
      ],
    },
    // -- Timing Nodes --
    {
      type: "timing-cast-delay",
      label: "Cast Delay",
      category: "timing",
      color: "bg-teal-500/10 text-teal-400",
      borderColor: "border-teal-500/20",
      inputs: [
        { id: "delay_ms", label: "delay_ms", portType: "number" },
      ],
      outputs: [
        { id: "cast_delay", label: "cast_delay", portType: "timing" },
      ],
    },
    {
      type: "timing-cooldown",
      label: "Cooldown",
      category: "timing",
      color: "bg-teal-500/10 text-teal-400",
      borderColor: "border-teal-500/20",
      inputs: [
        { id: "cooldown_ms", label: "cooldown_ms", portType: "number" },
      ],
      outputs: [
        { id: "cooldown", label: "cooldown", portType: "timing" },
      ],
    },
  ],
  connectionRules: [
    // Text
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "skill-root", targetPort: "text_id" },
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "skill-root", targetPort: "desc_id" },
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "skill-root", targetPort: "tooltip_id" },
    // Cost
    { sourceNodeType: "cost-hp", sourcePort: "hp_cost", targetNodeType: "skill-root", targetPort: "hp_cost" },
    { sourceNodeType: "cost-mp", sourcePort: "mp_cost", targetNodeType: "skill-root", targetPort: "mp_cost" },
    { sourceNodeType: "cost-item", sourcePort: "item_cost", targetNodeType: "skill-root", targetPort: "item_cost" },
    { sourceNodeType: "cost-energy", sourcePort: "energy_cost", targetNodeType: "skill-root", targetPort: "energy_cost" },
    // Requirements
    { sourceNodeType: "req-level", sourcePort: "level_req", targetNodeType: "skill-root", targetPort: "level_req" },
    { sourceNodeType: "req-state", sourcePort: "state_req", targetNodeType: "skill-root", targetPort: "state_req" },
    { sourceNodeType: "req-weapon", sourcePort: "weapon_filter", targetNodeType: "skill-root", targetPort: "weapon_filter" },
    // Effects
    { sourceNodeType: "effect-state-apply", sourcePort: "state_id", targetNodeType: "skill-root", targetPort: "state_id" },
    { sourceNodeType: "effect-damage-formula", sourcePort: "damage_formula", targetNodeType: "skill-root", targetPort: "damage_formula" },
    { sourceNodeType: "effect-probability", sourcePort: "probability", targetNodeType: "skill-root", targetPort: "probability" },
    // Timing
    { sourceNodeType: "timing-cast-delay", sourcePort: "cast_delay", targetNodeType: "skill-root", targetPort: "cast_delay" },
    { sourceNodeType: "timing-cooldown", sourcePort: "cooldown", targetNodeType: "skill-root", targetPort: "cooldown" },
  ],
}

// ---- State Environment Schema ----

export const stateSchema: EnvironmentSchema = {
  id: "state",
  title: "State Environment",
  description: "Define buffs, debuffs, and state effects with effect nodes and FX layers.",
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
        // Text
        { id: "text_id", label: "text_id", portType: "string-code", required: true },
        { id: "tooltip_id", label: "tooltip_id", portType: "string-code" },
        // Effect slots (populated via effect nodes)
        { id: "base_effect", label: "base_effect", portType: "effect" },
        { id: "amplify_effect", label: "amplify_effect", portType: "effect" },
        { id: "add_damage_effect", label: "add_damage_effect", portType: "effect" },
        // FX slots
        { id: "cast_fx", label: "cast_fx", portType: "fx" },
        { id: "hit_fx", label: "hit_fx", portType: "fx" },
        { id: "state_fx", label: "state_fx", portType: "fx" },
        // value_0..value_19 (populated only via effect node outputs)
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
        { id: "value", label: "value", portType: "string-code", required: true },
        { id: "group_id", label: "group_id", portType: "number", required: true },
        { id: "language", label: "language", portType: "string-code" },
      ],
      outputs: [
        { id: "code", label: "code", portType: "string-code" },
      ],
    },
    // -- Effect Nodes --
    {
      type: "effect-base",
      label: "Base Effect",
      category: "effect",
      color: "bg-indigo-500/10 text-indigo-400",
      borderColor: "border-indigo-500/20",
      inputs: [
        { id: "effect_type", label: "effect_type", portType: "number" },
        { id: "effect_value", label: "effect_value", portType: "number" },
        { id: "effect_rate", label: "effect_rate", portType: "number" },
      ],
      outputs: [
        { id: "base_effect", label: "base_effect", portType: "effect" },
      ],
    },
    {
      type: "effect-amplify",
      label: "Amplify Effect",
      category: "effect",
      color: "bg-indigo-500/10 text-indigo-400",
      borderColor: "border-indigo-500/20",
      inputs: [
        { id: "amplify_type", label: "amplify_type", portType: "number" },
        { id: "amplify_value", label: "amplify_value", portType: "number" },
        { id: "amplify_rate", label: "amplify_rate", portType: "number" },
      ],
      outputs: [
        { id: "amplify_effect", label: "amplify_effect", portType: "effect" },
      ],
    },
    {
      type: "effect-add-damage",
      label: "Add Damage",
      category: "effect",
      color: "bg-indigo-500/10 text-indigo-400",
      borderColor: "border-indigo-500/20",
      inputs: [
        { id: "damage_type", label: "damage_type", portType: "number" },
        { id: "damage_value", label: "damage_value", portType: "number" },
        { id: "damage_rate", label: "damage_rate", portType: "number" },
      ],
      outputs: [
        { id: "add_damage_effect", label: "add_damage_effect", portType: "effect" },
      ],
    },
    // -- FX Nodes --
    {
      type: "fx-cast",
      label: "Cast FX",
      category: "fx",
      color: "bg-fuchsia-500/10 text-fuchsia-400",
      borderColor: "border-fuchsia-500/20",
      inputs: [
        { id: "fx_id", label: "fx_id", portType: "number" },
        { id: "pos_id", label: "pos_id", portType: "number" },
      ],
      outputs: [
        { id: "cast_fx", label: "cast_fx", portType: "fx" },
      ],
    },
    {
      type: "fx-hit",
      label: "Hit FX",
      category: "fx",
      color: "bg-fuchsia-500/10 text-fuchsia-400",
      borderColor: "border-fuchsia-500/20",
      inputs: [
        { id: "fx_id", label: "fx_id", portType: "number" },
        { id: "pos_id", label: "pos_id", portType: "number" },
      ],
      outputs: [
        { id: "hit_fx", label: "hit_fx", portType: "fx" },
      ],
    },
    {
      type: "fx-state",
      label: "State FX",
      category: "fx",
      color: "bg-fuchsia-500/10 text-fuchsia-400",
      borderColor: "border-fuchsia-500/20",
      inputs: [
        { id: "fx_id", label: "fx_id", portType: "number" },
        { id: "pos_id", label: "pos_id", portType: "number" },
      ],
      outputs: [
        { id: "state_fx", label: "state_fx", portType: "fx" },
      ],
    },
  ],
  connectionRules: [
    // Text
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "state-root", targetPort: "text_id" },
    { sourceNodeType: "string-node", sourcePort: "code", targetNodeType: "state-root", targetPort: "tooltip_id" },
    // Effects
    { sourceNodeType: "effect-base", sourcePort: "base_effect", targetNodeType: "state-root", targetPort: "base_effect" },
    { sourceNodeType: "effect-amplify", sourcePort: "amplify_effect", targetNodeType: "state-root", targetPort: "amplify_effect" },
    { sourceNodeType: "effect-add-damage", sourcePort: "add_damage_effect", targetNodeType: "state-root", targetPort: "add_damage_effect" },
    // FX
    { sourceNodeType: "fx-cast", sourcePort: "cast_fx", targetNodeType: "state-root", targetPort: "cast_fx" },
    { sourceNodeType: "fx-hit", sourcePort: "hit_fx", targetNodeType: "state-root", targetPort: "hit_fx" },
    { sourceNodeType: "fx-state", sourcePort: "state_fx", targetNodeType: "state-root", targetPort: "state_fx" },
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
  "stat-block": "!bg-cyan-400",
  "model-block": "!bg-violet-400",
  condition: "!bg-orange-400",
  reward: "!bg-yellow-400",
  cost: "!bg-pink-400",
  timing: "!bg-teal-400",
  effect: "!bg-indigo-400",
  fx: "!bg-fuchsia-400",
}

// ---- Validation Helpers ----

export interface ValidationError {
  nodeId: string
  field: string
  message: string
  severity: "error" | "warning"
}

// Port types that represent foreign key / reference connections
const FK_PORT_TYPES: PortType[] = ["reference", "string-code", "stat-block", "model-block", "condition", "reward", "cost", "timing", "effect", "fx"]

export function validateGraph(
  schema: EnvironmentSchema,
  nodes: { id: string; type?: string; data: Record<string, unknown> }[],
  edges: { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }[],
): ValidationError[] {
  const errors: ValidationError[] = []

  // 1. Check exactly one root node
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

  // 2. Check required connections (NOT NULL fields) on root node
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
              message: `Required field "${input.label}" is not connected (NOT NULL)`,
              severity: "error",
            })
          }
        }
      }

      // 3. Check FK / reference port connections - warn if unconnected
      for (const input of rootSchema.inputs) {
        if (FK_PORT_TYPES.includes(input.portType) && !input.required) {
          const hasConnection = edges.some(
            (e) => e.target === rootNode.id && e.targetHandle === input.id,
          )
          if (!hasConnection) {
            errors.push({
              nodeId: rootNode.id,
              field: input.id,
              message: `Foreign key "${input.label}" has no source node connected`,
              severity: "warning",
            })
          }
        }
      }
    }
  }

  // 4. Check string length limits (3072 chars max for StringResource values)
  for (const node of nodes) {
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
      // Require non-empty value on string nodes
      if (!value || !value.trim()) {
        errors.push({
          nodeId: node.id,
          field: "value",
          message: `StringResource value is empty`,
          severity: "warning",
        })
      }
    }
  }

  // 5. Check script fields accept only valid paths (non-empty, no spaces at start/end)
  for (const node of nodes) {
    const nodeSchema = schema.nodes.find((s) => s.type === node.type)
    if (nodeSchema?.category === "script") {
      const scriptText = node.data.script_text as string | undefined
      if (scriptText && scriptText !== scriptText.trim()) {
        errors.push({
          nodeId: node.id,
          field: "script_text",
          message: `Script path has leading/trailing whitespace`,
          severity: "warning",
        })
      }
    }
  }

  // 6. Check reference nodes have a selected value > 0
  for (const node of nodes) {
    const nodeSchema = schema.nodes.find((s) => s.type === node.type)
    if (nodeSchema?.category === "reference") {
      const firstInput = nodeSchema.inputs[0]
      if (firstInput) {
        const val = node.data[firstInput.id]
        if (!val || Number(val) <= 0) {
          errors.push({
            nodeId: node.id,
            field: firstInput.id,
            message: `Reference "${nodeSchema.label}" has no selection (ID must be > 0)`,
            severity: "warning",
          })
        }
      }
    }
  }

  return errors
}
