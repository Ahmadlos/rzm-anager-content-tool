// ============================================================
// NPC Change Tracking Store
// ============================================================
// Git-like change tracking for NPC entities at the editor level.
// Entity = File, Workspace = Repository, Commit & Deploy = Git Engine.
//
// Rules:
//  - No direct DB writes from NPC Environment
//  - No direct commit from NPC editor
//  - Staging only -- commit happens at Workspace level

import type { Node, Edge } from "@xyflow/react"

// --- Types ---

export type DiffType = "added" | "modified" | "removed"

export interface FieldDiff {
  field: string
  diffType: DiffType
  oldValue: unknown
  newValue: unknown
}

export interface ConnectionDiff {
  diffType: DiffType
  edgeId: string
  source: string
  target: string
}

export interface EntityDiff {
  entityId: string
  entityName: string
  fieldDiffs: FieldDiff[]
  connectionDiffs: ConnectionDiff[]
  hasChanges: boolean
  isNew: boolean
  isDeleted: boolean
}

export interface EntitySnapshot {
  entityId: string
  entityName: string
  timestamp: string
  nodes: SnapshotNode[]
  edges: SnapshotEdge[]
}

export interface SnapshotNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface SnapshotEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
}

export interface TrackedEntity {
  entityId: string
  entityName: string
  isModified: boolean
  isStaged: boolean
  isNew: boolean
  lastSnapshot: EntitySnapshot
  currentNodes: Node[]
  currentEdges: Edge[]
  diff: EntityDiff | null
}

// ============================================================
// In-memory stores
// ============================================================

const snapshotStore = new Map<string, EntitySnapshot>()
const stagedEntities = new Set<string>()
const openEntities = new Map<string, { nodes: Node[]; edges: Edge[] }>()
const entityNames = new Map<string, string>()

// --- Snapshot helpers ---

function nodesToSnapshot(nodes: Node[]): SnapshotNode[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.type || "unknown",
    position: { x: n.position.x, y: n.position.y },
    data: structuredClone(n.data as Record<string, unknown>),
  }))
}

function edgesToSnapshot(edges: Edge[]): SnapshotEdge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? null,
    targetHandle: e.targetHandle ?? null,
  }))
}

// --- Core API ---

/** Save initial snapshot when entity is first opened or explicitly saved */
export function saveSnapshot(
  entityId: string,
  entityName: string,
  nodes: Node[],
  edges: Edge[],
): EntitySnapshot {
  const snapshot: EntitySnapshot = {
    entityId,
    entityName,
    timestamp: new Date().toISOString(),
    nodes: nodesToSnapshot(nodes),
    edges: edgesToSnapshot(edges),
  }
  snapshotStore.set(entityId, snapshot)
  entityNames.set(entityId, entityName)
  return snapshot
}

/** Get the last saved snapshot */
export function getSnapshot(entityId: string): EntitySnapshot | undefined {
  return snapshotStore.get(entityId)
}

/** Track current state of an open entity (call on every node/edge change) */
export function updateCurrentState(
  entityId: string,
  nodes: Node[],
  edges: Edge[],
): void {
  openEntities.set(entityId, { nodes: [...nodes], edges: [...edges] })
}

/** Remove entity from tracking (closed tab) */
export function closeEntity(entityId: string): void {
  openEntities.delete(entityId)
}

// ============================================================
// Diff Engine
// ============================================================

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a !== typeof b) return false
  if (typeof a !== "object") return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, i) => deepEqual(item, b[i]))
  }

  if (Array.isArray(a) || Array.isArray(b)) return false

  const keysA = Object.keys(a as Record<string, unknown>)
  const keysB = Object.keys(b as Record<string, unknown>)
  if (keysA.length !== keysB.length) return false

  return keysA.every((key) =>
    deepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ),
  )
}

/** Compute structured diff between snapshot and current state */
export function computeDiff(entityId: string): EntityDiff {
  const snapshot = snapshotStore.get(entityId)
  const current = openEntities.get(entityId)
  const name = entityNames.get(entityId) || entityId

  if (!snapshot || !current) {
    return {
      entityId,
      entityName: name,
      fieldDiffs: [],
      connectionDiffs: [],
      hasChanges: false,
      isNew: !snapshot,
      isDeleted: false,
    }
  }

  const fieldDiffs: FieldDiff[] = []
  const connectionDiffs: ConnectionDiff[] = []

  // --- Compare Nodes ---
  const snapNodeMap = new Map(snapshot.nodes.map((n) => [n.id, n]))
  const currNodeMap = new Map(current.nodes.map((n) => [n.id, n]))

  // Added nodes
  for (const [id, node] of currNodeMap) {
    if (!snapNodeMap.has(id)) {
      const data = node.data as Record<string, unknown>
      for (const [key, value] of Object.entries(data)) {
        fieldDiffs.push({
          field: `${node.type || "node"}[${id}].${key}`,
          diffType: "added",
          oldValue: undefined,
          newValue: value,
        })
      }
    }
  }

  // Removed nodes
  for (const [id, node] of snapNodeMap) {
    if (!currNodeMap.has(id)) {
      for (const [key, value] of Object.entries(node.data)) {
        fieldDiffs.push({
          field: `${node.type}[${id}].${key}`,
          diffType: "removed",
          oldValue: value,
          newValue: undefined,
        })
      }
    }
  }

  // Modified node data
  for (const [id, snapNode] of snapNodeMap) {
    const currNode = currNodeMap.get(id)
    if (!currNode) continue

    const snapData = snapNode.data
    const currData = currNode.data as Record<string, unknown>
    const allKeys = new Set([...Object.keys(snapData), ...Object.keys(currData)])

    for (const key of allKeys) {
      const oldVal = snapData[key]
      const newVal = currData[key]
      if (!deepEqual(oldVal, newVal)) {
        fieldDiffs.push({
          field: `${snapNode.type}[${id}].${key}`,
          diffType: oldVal === undefined ? "added" : newVal === undefined ? "removed" : "modified",
          oldValue: oldVal,
          newValue: newVal,
        })
      }
    }
  }

  // --- Compare Edges ---
  const snapEdgeMap = new Map(snapshot.edges.map((e) => [e.id, e]))
  const currEdges = edgesToSnapshot(current.edges)
  const currEdgeMap = new Map(currEdges.map((e) => [e.id, e]))

  for (const [id, edge] of currEdgeMap) {
    if (!snapEdgeMap.has(id)) {
      connectionDiffs.push({
        diffType: "added",
        edgeId: id,
        source: edge.source,
        target: edge.target,
      })
    }
  }

  for (const [id, edge] of snapEdgeMap) {
    if (!currEdgeMap.has(id)) {
      connectionDiffs.push({
        diffType: "removed",
        edgeId: id,
        source: edge.source,
        target: edge.target,
      })
    }
  }

  const hasChanges = fieldDiffs.length > 0 || connectionDiffs.length > 0

  return {
    entityId,
    entityName: name,
    fieldDiffs,
    connectionDiffs,
    hasChanges,
    isNew: false,
    isDeleted: false,
  }
}

/** Check if entity has been modified since last snapshot */
export function isEntityModified(entityId: string): boolean {
  const diff = computeDiff(entityId)
  return diff.hasChanges
}

// ============================================================
// Staging API (stage for Workspace commit)
// ============================================================

/** Stage entity for commit at workspace level */
export function stageEntity(entityId: string): void {
  stagedEntities.add(entityId)
}

/** Unstage entity */
export function unstageEntity(entityId: string): void {
  stagedEntities.delete(entityId)
}

/** Check if entity is staged */
export function isEntityStaged(entityId: string): boolean {
  return stagedEntities.has(entityId)
}

/** Get all staged entity IDs */
export function getStagedEntityIds(): string[] {
  return Array.from(stagedEntities)
}

/** Get all staged entities with their diffs */
export function getStagedEntitiesWithDiffs(): { entityId: string; entityName: string; diff: EntityDiff }[] {
  return Array.from(stagedEntities).map((id) => {
    const diff = computeDiff(id)
    return { entityId: id, entityName: diff.entityName, diff }
  })
}

// ============================================================
// Revert / Reset
// ============================================================

/** Revert entity to last snapshot (discard current changes) */
export function revertToSnapshot(entityId: string): { nodes: Node[]; edges: Edge[] } | null {
  const snapshot = snapshotStore.get(entityId)
  if (!snapshot) return null

  // Convert snapshot back to live nodes/edges
  const nodes: Node[] = snapshot.nodes.map((sn) => ({
    id: sn.id,
    type: sn.type,
    position: { ...sn.position },
    data: structuredClone(sn.data),
  }))

  const edges: Edge[] = snapshot.edges.map((se) => ({
    id: se.id,
    source: se.source,
    target: se.target,
    sourceHandle: se.sourceHandle,
    targetHandle: se.targetHandle,
    animated: true,
    style: { stroke: "oklch(0.35 0 0)" },
  }))

  // Update current state to match snapshot
  openEntities.set(entityId, { nodes, edges })

  // Unstage if staged
  stagedEntities.delete(entityId)

  return { nodes, edges }
}

// ============================================================
// Tracked entity aggregation
// ============================================================

/** Get all open tracked entities with their modification state */
export function getAllTrackedEntities(): TrackedEntity[] {
  const result: TrackedEntity[] = []

  for (const [entityId, current] of openEntities) {
    const snapshot = snapshotStore.get(entityId)
    const name = entityNames.get(entityId) || entityId
    const diff = computeDiff(entityId)

    result.push({
      entityId,
      entityName: name,
      isModified: diff.hasChanges,
      isStaged: stagedEntities.has(entityId),
      isNew: !snapshot,
      lastSnapshot: snapshot || {
        entityId,
        entityName: name,
        timestamp: new Date().toISOString(),
        nodes: [],
        edges: [],
      },
      currentNodes: current.nodes,
      currentEdges: current.edges,
      diff,
    })
  }

  return result
}

/** Count of modified (unsaved) entities */
export function getModifiedCount(): number {
  let count = 0
  for (const entityId of openEntities.keys()) {
    if (isEntityModified(entityId)) count++
  }
  return count
}

/** Count of staged entities */
export function getStagedCount(): number {
  return stagedEntities.size
}
