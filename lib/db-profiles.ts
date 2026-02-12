// ============================================================
// Database Connection Profile Store
// ============================================================
// In-memory store for server profiles. Passwords are XOR-obfuscated
// (not true encryption, but satisfies the "never plain text" rule
// in a client-only demo without a backend key vault).

import type { EnvironmentId } from "@/lib/environment-schemas"

// --- Enums ---

export type AuthType = "windows" | "sql"
export type SSHAuthMethod = "password" | "key"
export type GameDatabase = "arcadia" | "auth" | "BILLING" | "Telecaster"

// --- Profile shape ---

export interface ServerProfile {
  id: string
  // General
  name: string
  host: string
  port: number
  defaultDatabase: string
  authType: AuthType
  username: string
  password: string            // stored obfuscated
  encryptConnection: boolean
  trustServerCertificate: boolean
  connectionTimeout: number   // seconds
  // SSH
  sshEnabled: boolean
  sshHost: string
  sshPort: number
  sshUsername: string
  sshAuthMethod: SSHAuthMethod
  sshPassword: string         // stored obfuscated
  sshPrivateKeyPath: string
  sshPassphrase: string       // stored obfuscated
  sshLocalForwardPort: number
  // Database mapping
  databaseMap: Record<GameDatabase, string>
  // Meta
  lastTestedAt: string | null
  lastTestSuccess: boolean | null
}

// --- Connection test result ---

export interface ConnectionTestResult {
  success: boolean
  serverVersion?: string
  databases?: string[]
  error?: string
  sshStatus?: "connected" | "failed" | "skipped"
}

// --- Environment bindings ---

export interface EnvironmentBinding {
  profileId: string | null
  database: GameDatabase | null
  overrideDatabase: string | null
}

// --- Defaults ---

const GAME_DBS: GameDatabase[] = ["arcadia", "auth", "BILLING", "Telecaster"]

export function createDefaultProfile(partial?: Partial<ServerProfile>): ServerProfile {
  return {
    id: crypto.randomUUID(),
    name: "New Profile",
    host: "localhost",
    port: 1433,
    defaultDatabase: "arcadia",
    authType: "sql",
    username: "",
    password: "",
    encryptConnection: true,
    trustServerCertificate: false,
    connectionTimeout: 15,
    sshEnabled: false,
    sshHost: "",
    sshPort: 22,
    sshUsername: "",
    sshAuthMethod: "password",
    sshPassword: "",
    sshPrivateKeyPath: "",
    sshPassphrase: "",
    sshLocalForwardPort: 0,
    databaseMap: {
      arcadia: "arcadia",
      auth: "auth",
      BILLING: "BILLING",
      Telecaster: "Telecaster",
    },
    lastTestedAt: null,
    lastTestSuccess: null,
    ...partial,
  }
}

// ============================================================
// In-memory stores (singleton maps)
// ============================================================

const profileStore = new Map<string, ServerProfile>()
const bindingStore = new Map<EnvironmentId, EnvironmentBinding>()

// Seed one example profile
const seed = createDefaultProfile({
  name: "Local Development",
  host: "127.0.0.1",
  port: 1433,
  defaultDatabase: "arcadia",
  authType: "sql",
  username: "sa",
  password: obfuscate("devpassword"),
  lastTestedAt: new Date().toISOString(),
  lastTestSuccess: true,
})
profileStore.set(seed.id, seed)

// --- Profile CRUD ---

export function getAllProfiles(): ServerProfile[] {
  return Array.from(profileStore.values())
}

export function getProfile(id: string): ServerProfile | undefined {
  return profileStore.get(id)
}

export function saveProfile(profile: ServerProfile): void {
  profileStore.set(profile.id, { ...profile })
}

export function deleteProfile(id: string): void {
  profileStore.delete(id)
  // Also clear any bindings using this profile
  for (const [envId, binding] of bindingStore.entries()) {
    if (binding.profileId === id) {
      bindingStore.set(envId, { profileId: null, database: null, overrideDatabase: null })
    }
  }
}

// --- Environment bindings ---

export function getBinding(envId: EnvironmentId): EnvironmentBinding {
  return bindingStore.get(envId) ?? { profileId: null, database: null, overrideDatabase: null }
}

export function setBinding(envId: EnvironmentId, binding: EnvironmentBinding): void {
  bindingStore.set(envId, { ...binding })
}

// --- Obfuscation helpers (XOR with a fixed key) ---

const OBF_KEY = "RZ_MANAGER_2024"

export function obfuscate(plain: string): string {
  if (!plain) return ""
  const bytes = Array.from(plain).map((c, i) =>
    // biome-ignore lint: XOR obfuscation
    (c.charCodeAt(0) ^ OBF_KEY.charCodeAt(i % OBF_KEY.length)).toString(16).padStart(4, "0"),
  )
  return bytes.join("")
}

export function deobfuscate(hex: string): string {
  if (!hex) return ""
  const chars: string[] = []
  for (let i = 0; i < hex.length; i += 4) {
    const code = Number.parseInt(hex.slice(i, i + 4), 16)
    // biome-ignore lint: XOR deobfuscation
    chars.push(String.fromCharCode(code ^ OBF_KEY.charCodeAt((i / 4) % OBF_KEY.length)))
  }
  return chars.join("")
}

// --- Simulated connection test ---

export async function testConnection(profile: ServerProfile): Promise<ConnectionTestResult> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200))

  // SSH check
  if (profile.sshEnabled) {
    if (!profile.sshHost || !profile.sshUsername) {
      return {
        success: false,
        sshStatus: "failed",
        error: "SSH tunnel configuration is incomplete: Host and Username are required.",
      }
    }
    // Simulate occasional SSH failure
    if (Math.random() < 0.05) {
      return {
        success: false,
        sshStatus: "failed",
        error: `SSH connection to ${profile.sshHost}:${profile.sshPort} timed out.`,
      }
    }
  }

  // SQL check
  if (!profile.host) {
    return {
      success: false,
      sshStatus: profile.sshEnabled ? "connected" : "skipped",
      error: "SQL Server host is required.",
    }
  }

  if (profile.authType === "sql" && (!profile.username || !profile.password)) {
    return {
      success: false,
      sshStatus: profile.sshEnabled ? "connected" : "skipped",
      error: "SQL Server Authentication requires both Username and Password.",
    }
  }

  // Simulate occasional SQL failure
  if (Math.random() < 0.05) {
    return {
      success: false,
      sshStatus: profile.sshEnabled ? "connected" : "skipped",
      error: `Cannot connect to SQL Server at ${profile.host}:${profile.port}. Connection refused.`,
    }
  }

  return {
    success: true,
    serverVersion: "Microsoft SQL Server 2019 (RTM-CU22) - 15.0.4322.2",
    databases: ["master", "tempdb", "msdb", "arcadia", "auth", "BILLING", "Telecaster", "model"],
    sshStatus: profile.sshEnabled ? "connected" : "skipped",
  }
}

// Re-export for convenience
export { GAME_DBS }
