// Graph Store - persists node graphs per entity across the app session
// Keyed by environment + entity id so each entity has its own graph

import type { Node, Edge } from "@xyflow/react"

export interface GraphData {
  nodes: Node[]
  edges: Edge[]
  projectName: string
}

const graphs = new Map<string, GraphData>()

function key(envId: string, entityId: number | string) {
  return `${envId}:${entityId}`
}

export function saveGraph(envId: string, entityId: number | string, data: GraphData) {
  graphs.set(key(envId, entityId), structuredClone(data))
}

export function loadGraph(envId: string, entityId: number | string): GraphData | null {
  const g = graphs.get(key(envId, entityId))
  return g ? structuredClone(g) : null
}

export function hasGraph(envId: string, entityId: number | string): boolean {
  return graphs.has(key(envId, entityId))
}

export function deleteGraph(envId: string, entityId: number | string) {
  graphs.delete(key(envId, entityId))
}

// Entity info passed from manager to canvas
export interface SelectedEntity {
  id: number | string
  name: string
}
