// ============================================================
// Workspace Store
// ============================================================
// Top-level entity representing one Rappelz Server Project.
// Each workspace is bound to exactly one ServerProfile and
// manages database selections, schema fingerprint, version lock.

import type { EnvironmentId } from "@/lib/environment-schemas"
import type { ServerProfile } from "@/lib/db-profiles"

// --- Types ---

export type DatabaseRole = "arcadia" | "telecaster" | "auth" | "billing"

export const DATABASE_ROLES: DatabaseRole[] = ["arcadia", "telecaster", "auth", "billing"]

export interface DatabaseSelection {
  role: DatabaseRole
  databaseName: string | null
}

export interface SchemaFingerprint {
  hash: string
  tables: string[]
  generatedAt: string
}

export interface Workspace {
  id: string
  name: string
  profileId: string        // Bound server profile -- immutable after creation
  databases: Record<DatabaseRole, string | null>
  schemaFingerprint: SchemaFingerprint | null
  versionLockEnabled: boolean
  createdAt: string
  lastModifiedAt: string
  active: boolean
}

// --- Detection patterns (case-insensitive) ---

const DETECTION_PATTERNS: Record<DatabaseRole, RegExp> = {
  arcadia: /^arcadia/i,
  telecaster: /^telecaster/i,
  auth: /^auth/i,
  billing: /^billing/i,
}

/**
 * Auto-detect databases from a list of DB names, grouped by role.
 * Returns a map of role -> matched database names.
 */
export function detectDatabasesByRole(dbNames: string[]): Record<DatabaseRole, string[]> {
  const result: Record<DatabaseRole, string[]> = {
    arcadia: [],
    telecaster: [],
    auth: [],
    billing: [],
  }
  for (const name of dbNames) {
    for (const role of DATABASE_ROLES) {
      if (DETECTION_PATTERNS[role].test(name)) {
        result[role].push(name)
      }
    }
  }
  return result
}

// --- Schema fingerprint ---

/** Required tables for a valid Rappelz schema */
const REQUIRED_TABLES = ["dbo.ItemResource", "dbo.MonsterResource", "dbo.NPCResource"]

/** Required columns per table (subset for validation) */
const REQUIRED_COLUMNS: Record<string, string[]> = {
  "dbo.ItemResource": ["id", "name_id", "tooltip_id", "type", "group", "class"],
  "dbo.MonsterResource": ["id", "name_id", "level", "hp", "mp", "attack"],
  "dbo.NPCResource": ["id", "name_text_id", "text_id", "x", "y", "z"],
}

export interface SchemaValidationResult {
  valid: boolean
  missingTables: string[]
  missingColumns: Record<string, string[]>
}

/**
 * Simulate schema validation against the required tables/columns.
 * In a real app this would query the database.
 */
export function validateSchema(): SchemaValidationResult {
  // Simulated: all tables exist
  return {
    valid: true,
    missingTables: [],
    missingColumns: {},
  }
}

/**
 * Generate a lightweight schema hash.
 * In production this would hash actual column definitions.
 */
export function generateFingerprint(): SchemaFingerprint {
  const payload = REQUIRED_TABLES.join("|") + ":" + Date.now().toString(36)
  let hash = 0
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i)
    hash = ((hash << 5) - hash + ch) | 0
  }
  return {
    hash: Math.abs(hash).toString(16).padStart(8, "0"),
    tables: [...REQUIRED_TABLES],
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Compare a live fingerprint against a stored one.
 * Returns true if they match.
 */
export function compareFingerprints(
  stored: SchemaFingerprint | null,
  live: SchemaFingerprint,
): boolean {
  if (!stored) return false
  return stored.hash === live.hash
}

// ============================================================
// In-memory workspace store
// ============================================================

const workspaceStore = new Map<string, Workspace>()

// --- Seed a default workspace ---

const seedWorkspace: Workspace = {
  id: crypto.randomUUID(),
  name: "Local Dev Project",
  profileId: "", // will be linked to the seed profile from db-profiles
  databases: {
    arcadia: "arcadia",
    telecaster: "Telecaster",
    auth: "auth",
    billing: null,
  },
  schemaFingerprint: generateFingerprint(),
  versionLockEnabled: true,
  createdAt: new Date().toISOString(),
  lastModifiedAt: new Date().toISOString(),
  active: true,
}

// We'll link to the first profile on init
let seedProfileLinked = false

function ensureSeedLinked() {
  if (seedProfileLinked) return
  // Lazy-link: import at runtime to avoid circular dependency issues
  try {
    const { getAllProfiles } = require("@/lib/db-profiles")
    const profiles = getAllProfiles()
    if (profiles.length > 0) {
      seedWorkspace.profileId = profiles[0].id
    }
  } catch {
    // If import fails, leave blank
  }
  seedProfileLinked = true
  workspaceStore.set(seedWorkspace.id, seedWorkspace)
}

// --- CRUD ---

export function getAllWorkspaces(): Workspace[] {
  ensureSeedLinked()
  return Array.from(workspaceStore.values())
}

export function getWorkspace(id: string): Workspace | undefined {
  ensureSeedLinked()
  return workspaceStore.get(id)
}

export function getActiveWorkspace(): Workspace | undefined {
  ensureSeedLinked()
  return Array.from(workspaceStore.values()).find((w) => w.active)
}

export function saveWorkspace(workspace: Workspace): void {
  ensureSeedLinked()
  workspaceStore.set(workspace.id, { ...workspace, lastModifiedAt: new Date().toISOString() })
}

export function deleteWorkspace(id: string): void {
  ensureSeedLinked()
  workspaceStore.delete(id)
}

/**
 * Set a workspace as active, deactivating all others.
 */
export function activateWorkspace(id: string): void {
  ensureSeedLinked()
  for (const [wid, ws] of workspaceStore.entries()) {
    workspaceStore.set(wid, { ...ws, active: wid === id })
  }
}

/**
 * Create a new default workspace bound to a profile.
 */
export function createWorkspace(name: string, profileId: string): Workspace {
  ensureSeedLinked()
  const ws: Workspace = {
    id: crypto.randomUUID(),
    name,
    profileId,
    databases: {
      arcadia: null,
      telecaster: null,
      auth: null,
      billing: null,
    },
    schemaFingerprint: null,
    versionLockEnabled: true,
    createdAt: new Date().toISOString(),
    lastModifiedAt: new Date().toISOString(),
    active: false,
  }
  workspaceStore.set(ws.id, ws)
  return ws
}

// --- Clone ---

export interface CloneOptions {
  newName: string
  newProfileId?: string        // If provided, forces re-detection
  keepDatabaseVersions: boolean
  copyFingerprint: boolean
  resetVersionLock: boolean
}

/**
 * Clone a workspace with full isolation.
 * Cloned workspace never shares references with the original.
 */
export function cloneWorkspace(sourceId: string, options: CloneOptions): Workspace | null {
  ensureSeedLinked()
  const source = workspaceStore.get(sourceId)
  if (!source) return null

  const cloned: Workspace = {
    id: crypto.randomUUID(),
    name: options.newName,
    profileId: options.newProfileId || source.profileId,
    databases: options.keepDatabaseVersions && !options.newProfileId
      ? { ...source.databases }
      : { arcadia: null, telecaster: null, auth: null, billing: null },
    schemaFingerprint: options.copyFingerprint && !options.newProfileId
      ? source.schemaFingerprint
        ? { ...source.schemaFingerprint }
        : null
      : null,
    versionLockEnabled: options.resetVersionLock ? true : source.versionLockEnabled,
    createdAt: new Date().toISOString(),
    lastModifiedAt: new Date().toISOString(),
    active: false,
  }

  workspaceStore.set(cloned.id, cloned)
  return cloned
}

// --- Version Lock helpers ---

/**
 * Check if changing databases requires closing environments.
 * Returns true if version lock is active and the workspace has
 * arcadia or telecaster databases already set.
 */
export function requiresVersionLockConfirmation(workspace: Workspace): boolean {
  if (!workspace.versionLockEnabled) return false
  return !!(workspace.databases.arcadia || workspace.databases.telecaster)
}

// Re-export for convenience
export { REQUIRED_TABLES, REQUIRED_COLUMNS }
