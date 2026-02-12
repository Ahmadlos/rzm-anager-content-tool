// =============================================
// RZManager – Local Change Tracking System
// =============================================
// Strictly a View Layer utility.
// NO database interaction, NO commit/deploy, NO SQL.

import type { Node, Edge } from "@xyflow/react"

// ---- Change Types ----

export type ChangeType = "added" | "removed" | "modified"

export interface FieldChange {
  nodeId: string
  nodeLabel: string
  nodeCategory: string
  fieldName: string
  fieldLabel: string
  oldValue: unknown
  newValue: unknown
  changeType: ChangeType
}

export interface NodeChange {
  nodeId: string
  nodeLabel: string
  nodeCategory: string
  changeType: ChangeType
}

export interface EdgeChange {
  edgeId: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  changeType: ChangeType
}

export interface ChangesSummary {
  fieldChanges: FieldChange[]
  nodeChanges: NodeChange[]
  edgeChanges: EdgeChange[]
  totalChanges: number
  hasChanges: boolean
}

// ---- Snapshot Types ----

export interface GraphSnapshot {
  nodes: SerializedNode[]
  edges: SerializedEdge[]
  timestamp: number
}

interface SerializedNode {
  id: string
  type: string | undefined
  position: { x: number; y: number }
  data: Record<string, unknown>
  schemaType?: string
  schemaLabel?: string
  schemaCategory?: string
}

interface SerializedEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
}

// ---- Serialization ----

export function serializeNodes(nodes: Node[]): SerializedNode[] {
  return nodes.map((n) => {
    const data = n.data as Record<string, unknown>
    const schema = data.schema as { type?: string; label?: string; category?: string } | undefined
    const values = (data.values as Record<string, unknown>) || {}

    return {
      id: n.id,
      type: n.type,
      position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
      data: values,
      schemaType: schema?.type,
      schemaLabel: schema?.label,
      schemaCategory: schema?.category,
    }
  })
}

export function serializeEdges(edges: Edge[]): SerializedEdge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
  }))
}

export function createSnapshot(nodes: Node[], edges: Edge[]): GraphSnapshot {
  return {
    nodes: serializeNodes(nodes),
    edges: serializeEdges(edges),
    timestamp: Date.now(),
  }
}

// ---- Diff Engine ----

export function computeChanges(
  snapshot: GraphSnapshot,
  currentNodes: Node[],
  currentEdges: Edge[]
): ChangesSummary {
  const fieldChanges: FieldChange[] = []
  const nodeChanges: NodeChange[] = []
  const edgeChanges: EdgeChange[] = []

  const currentSerialized = serializeNodes(currentNodes)
  const currentEdgesSerialized = serializeEdges(currentEdges)

  const snapshotNodeMap = new Map(snapshot.nodes.map((n) => [n.id, n]))
  const currentNodeMap = new Map(currentSerialized.map((n) => [n.id, n]))

  // Detect added nodes
  for (const current of currentSerialized) {
    if (!snapshotNodeMap.has(current.id)) {
      nodeChanges.push({
        nodeId: current.id,
        nodeLabel: current.schemaLabel || current.id,
        nodeCategory: current.schemaCategory || "unknown",
        changeType: "added",
      })
    }
  }

  // Detect removed nodes
  for (const snap of snapshot.nodes) {
    if (!currentNodeMap.has(snap.id)) {
      nodeChanges.push({
        nodeId: snap.id,
        nodeLabel: snap.schemaLabel || snap.id,
        nodeCategory: snap.schemaCategory || "unknown",
        changeType: "removed",
      })
    }
  }

  // Detect modified node fields
  for (const current of currentSerialized) {
    const snap = snapshotNodeMap.get(current.id)
    if (!snap) continue // already handled as added

    const allKeys = new Set([
      ...Object.keys(snap.data),
      ...Object.keys(current.data),
    ])

    for (const key of allKeys) {
      const oldVal = snap.data[key]
      const newVal = current.data[key]

      if (oldVal === undefined && newVal !== undefined) {
        fieldChanges.push({
          nodeId: current.id,
          nodeLabel: current.schemaLabel || current.id,
          nodeCategory: current.schemaCategory || "unknown",
          fieldName: key,
          fieldLabel: key,
          oldValue: undefined,
          newValue: newVal,
          changeType: "added",
        })
      } else if (oldVal !== undefined && newVal === undefined) {
        fieldChanges.push({
          nodeId: current.id,
          nodeLabel: current.schemaLabel || current.id,
          nodeCategory: current.schemaCategory || "unknown",
          fieldName: key,
          fieldLabel: key,
          oldValue: oldVal,
          newValue: undefined,
          changeType: "removed",
        })
      } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        fieldChanges.push({
          nodeId: current.id,
          nodeLabel: current.schemaLabel || current.id,
          nodeCategory: current.schemaCategory || "unknown",
          fieldName: key,
          fieldLabel: key,
          oldValue: oldVal,
          newValue: newVal,
          changeType: "modified",
        })
      }
    }
  }

  // Detect edge changes
  const snapshotEdgeMap = new Map(snapshot.edges.map((e) => [e.id, e]))
  const currentEdgeMap = new Map(currentEdgesSerialized.map((e) => [e.id, e]))

  for (const current of currentEdgesSerialized) {
    if (!snapshotEdgeMap.has(current.id)) {
      edgeChanges.push({
        ...current,
        edgeId: current.id,
        changeType: "added",
      })
    } else {
      const snap = snapshotEdgeMap.get(current.id)!
      if (
        snap.source !== current.source ||
        snap.target !== current.target ||
        snap.sourceHandle !== current.sourceHandle ||
        snap.targetHandle !== current.targetHandle
      ) {
        edgeChanges.push({
          ...current,
          edgeId: current.id,
          changeType: "modified",
        })
      }
    }
  }

  for (const snap of snapshot.edges) {
    if (!currentEdgeMap.has(snap.id)) {
      edgeChanges.push({
        ...snap,
        edgeId: snap.id,
        changeType: "removed",
      })
    }
  }

  const totalChanges = fieldChanges.length + nodeChanges.length + edgeChanges.length

  return {
    fieldChanges,
    nodeChanges,
    edgeChanges,
    totalChanges,
    hasChanges: totalChanges > 0,
  }
}

// ---- Revert Helpers ----

/**
 * Revert a single field on a node to its snapshot value.
 * Returns updated nodes array.
 */
export function revertField(
  snapshot: GraphSnapshot,
  nodes: Node[],
  nodeId: string,
  fieldName: string
): Node[] {
  const snapNode = snapshot.nodes.find((n) => n.id === nodeId)
  if (!snapNode) return nodes

  return nodes.map((n) => {
    if (n.id !== nodeId) return n
    const data = n.data as { schema: unknown; values: Record<string, unknown> }
    return {
      ...n,
      data: {
        ...data,
        values: {
          ...data.values,
          [fieldName]: snapNode.data[fieldName],
        },
      },
    }
  })
}

/**
 * Revert the entire graph to the snapshot state.
 * Returns { nodes, edges } to restore.
 */
export function revertAll(
  snapshot: GraphSnapshot,
  currentNodes: Node[]
): { nodes: Node[]; edges: Edge[] } {
  // Rebuild nodes from snapshot
  const restoredNodes: Node[] = snapshot.nodes.map((snap) => {
    const current = currentNodes.find((n) => n.id === snap.id)
    const currentData = current?.data as { schema?: unknown } | undefined

    return {
      id: snap.id,
      type: snap.type || "schema-node",
      position: snap.position,
      data: {
        schema: currentData?.schema,
        values: { ...snap.data },
      },
      deletable: snap.schemaCategory !== "root",
    } as Node
  })

  const restoredEdges: Edge[] = snapshot.edges.map((snap) => ({
    id: snap.id,
    source: snap.source,
    target: snap.target,
    sourceHandle: snap.sourceHandle,
    targetHandle: snap.targetHandle,
    animated: true,
    style: { stroke: "oklch(0.35 0 0)" },
  }))

  return { nodes: restoredNodes, edges: restoredEdges }
}

/**
 * Get set of modified node IDs (for highlighting)
 */
export function getModifiedNodeIds(changes: ChangesSummary): Set<string> {
  const ids = new Set<string>()
  for (const c of changes.nodeChanges) ids.add(c.nodeId)
  for (const c of changes.fieldChanges) ids.add(c.nodeId)
  return ids
}

/**
 * Get set of modified field keys for a specific node
 */
export function getModifiedFieldsForNode(
  changes: ChangesSummary,
  nodeId: string
): Set<string> {
  const fields = new Set<string>()
  for (const c of changes.fieldChanges) {
    if (c.nodeId === nodeId) fields.add(c.fieldName)
  }
  return fields
}
