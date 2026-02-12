// ============================================================
// Database Explorer Store (Read-Only Inspection)
// ============================================================
// Simulated SQL Server schema and data for the Database Explorer panel.
// Security: Read-only by default. No INSERT/UPDATE/DELETE from this panel.

// --- Types ---

export interface DbColumn {
  name: string
  type: string
  nullable: boolean
  isPrimaryKey: boolean
  isForeignKey: boolean
  fkReference?: string  // "TableName.ColumnName"
  defaultValue?: string
}

export interface DbIndex {
  name: string
  columns: string[]
  isUnique: boolean
  isClustered: boolean
}

export interface DbForeignKey {
  name: string
  column: string
  referencedTable: string
  referencedColumn: string
}

export interface DbTable {
  name: string
  schema: string
  columns: DbColumn[]
  indexes: DbIndex[]
  foreignKeys: DbForeignKey[]
  rowCount: number
}

export interface DbView {
  name: string
  schema: string
  definition: string
}

export interface DbStoredProcedure {
  name: string
  schema: string
  definition: string
}

export interface DbDatabase {
  name: string
  tables: DbTable[]
  views: DbView[]
  storedProcedures: DbStoredProcedure[]
}

export interface DbServer {
  name: string
  version: string
  databases: DbDatabase[]
}

export type FilterOperator = "=" | "LIKE" | ">" | "<" | "BETWEEN" | "IN" | "!="
export type FilterLogic = "AND" | "OR"

export interface QueryFilter {
  id: string
  column: string
  operator: FilterOperator
  value: string
  value2?: string  // for BETWEEN
  logic: FilterLogic
}

export interface DataRow {
  [key: string]: string | number | boolean | null
}

// ============================================================
// Simulated Rappelz Database Schema
// ============================================================

const npcResourceTable: DbTable = {
  name: "NPCResource",
  schema: "dbo",
  columns: [
    { name: "id", type: "INT", nullable: false, isPrimaryKey: true, isForeignKey: false },
    { name: "name_text_id", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: true, fkReference: "StringResource.text_id" },
    { name: "text_id", type: "INT", nullable: true, isPrimaryKey: false, isForeignKey: true, fkReference: "StringResource.text_id" },
    { name: "model_file", type: "VARCHAR(255)", nullable: false, isPrimaryKey: false, isForeignKey: false },
    { name: "x", type: "FLOAT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
    { name: "y", type: "FLOAT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
    { name: "z", type: "FLOAT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
    { name: "face_x", type: "FLOAT", nullable: true, isPrimaryKey: false, isForeignKey: false },
    { name: "face_y", type: "FLOAT", nullable: true, isPrimaryKey: false, isForeignKey: false },
    { name: "face_z", type: "FLOAT", nullable: true, isPrimaryKey: false, isForeignKey: false },
    { name: "speed", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "100" },
    { name: "run_speed", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "200" },
    { name: "level", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "1" },
    { name: "hp", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "100" },
    { name: "attack", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "10" },
    { name: "defense", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "5" },
  ],
  indexes: [
    { name: "PK_NPCResource", columns: ["id"], isUnique: true, isClustered: true },
    { name: "IX_NPCResource_name", columns: ["name_text_id"], isUnique: false, isClustered: false },
    { name: "IX_NPCResource_level", columns: ["level"], isUnique: false, isClustered: false },
  ],
  foreignKeys: [
    { name: "FK_NPC_NameString", column: "name_text_id", referencedTable: "StringResource", referencedColumn: "text_id" },
    { name: "FK_NPC_TextString", column: "text_id", referencedTable: "StringResource", referencedColumn: "text_id" },
  ],
  rowCount: 2847,
}

const itemResourceTable: DbTable = {
  name: "ItemResource",
  schema: "dbo",
  columns: [
    { name: "id", type: "INT", nullable: false, isPrimaryKey: true, isForeignKey: false },
    { name: "name_id", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: true, fkReference: "StringResource.text_id" },
    { name: "tooltip_id", type: "INT", nullable: true, isPrimaryKey: false, isForeignKey: true, fkReference: "StringResource.text_id" },
    { name: "type", type: "TINYINT", nullable: false, isPrimaryKey: false, isForeignKey: false },
    { name: "group", type: "TINYINT", nullable: false, isPrimaryKey: false, isForeignKey: false },
    { name: "class", type: "TINYINT", nullable: false, isPrimaryKey: false, isForeignKey: false },
    { name: "set_id", type: "INT", nullable: true, isPrimaryKey: false, isForeignKey: false },
    { name: "attack_min", type: "INT", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
    { name: "attack_max", type: "INT", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
    { name: "defense", type: "INT", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
    { name: "level_limit", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "1" },
    { name: "price", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
    { name: "icon_file", type: "VARCHAR(255)", nullable: true, isPrimaryKey: false, isForeignKey: false },
    { name: "model_file", type: "VARCHAR(255)", nullable: true, isPrimaryKey: false, isForeignKey: false },
  ],
  indexes: [
    { name: "PK_ItemResource", columns: ["id"], isUnique: true, isClustered: true },
    { name: "IX_ItemResource_type", columns: ["type", "group"], isUnique: false, isClustered: false },
    { name: "IX_ItemResource_level", columns: ["level_limit"], isUnique: false, isClustered: false },
  ],
  foreignKeys: [
    { name: "FK_Item_NameString", column: "name_id", referencedTable: "StringResource", referencedColumn: "text_id" },
    { name: "FK_Item_TooltipString", column: "tooltip_id", referencedTable: "StringResource", referencedColumn: "text_id" },
  ],
  rowCount: 12450,
}

const monsterResourceTable: DbTable = {
  name: "MonsterResource",
  schema: "dbo",
  columns: [
    { name: "id", type: "INT", nullable: false, isPrimaryKey: true, isForeignKey: false },
    { name: "name_id", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: true, fkReference: "StringResource.text_id" },
    { name: "level", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false },
    { name: "hp", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false },
    { name: "mp", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
    { name: "attack", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false },
    { name: "defence", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false },
    { name: "magic_attack", type: "INT", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
    { name: "magic_defence", type: "INT", nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
    { name: "exp", type: "BIGINT", nullable: false, isPrimaryKey: false, isForeignKey: false },
    { name: "model_file", type: "VARCHAR(255)", nullable: false, isPrimaryKey: false, isForeignKey: false },
    { name: "aggressive", type: "BIT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
  ],
  indexes: [
    { name: "PK_MonsterResource", columns: ["id"], isUnique: true, isClustered: true },
    { name: "IX_MonsterResource_level", columns: ["level"], isUnique: false, isClustered: false },
  ],
  foreignKeys: [
    { name: "FK_Monster_NameString", column: "name_id", referencedTable: "StringResource", referencedColumn: "text_id" },
  ],
  rowCount: 4210,
}

const stringResourceTable: DbTable = {
  name: "StringResource",
  schema: "dbo",
  columns: [
    { name: "text_id", type: "INT", nullable: false, isPrimaryKey: true, isForeignKey: false },
    { name: "language", type: "VARCHAR(10)", nullable: false, isPrimaryKey: false, isForeignKey: false },
    { name: "value", type: "NVARCHAR(MAX)", nullable: false, isPrimaryKey: false, isForeignKey: false },
    { name: "category", type: "VARCHAR(50)", nullable: true, isPrimaryKey: false, isForeignKey: false },
  ],
  indexes: [
    { name: "PK_StringResource", columns: ["text_id", "language"], isUnique: true, isClustered: true },
    { name: "IX_StringResource_category", columns: ["category"], isUnique: false, isClustered: false },
  ],
  foreignKeys: [],
  rowCount: 245000,
}

const questResourceTable: DbTable = {
  name: "QuestResource",
  schema: "dbo",
  columns: [
    { name: "id", type: "INT", nullable: false, isPrimaryKey: true, isForeignKey: false },
    { name: "name_id", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: true, fkReference: "StringResource.text_id" },
    { name: "desc_id", type: "INT", nullable: true, isPrimaryKey: false, isForeignKey: true, fkReference: "StringResource.text_id" },
    { name: "level_min", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "1" },
    { name: "level_max", type: "INT", nullable: true, isPrimaryKey: false, isForeignKey: false },
    { name: "npc_start_id", type: "INT", nullable: true, isPrimaryKey: false, isForeignKey: true, fkReference: "NPCResource.id" },
    { name: "npc_end_id", type: "INT", nullable: true, isPrimaryKey: false, isForeignKey: true, fkReference: "NPCResource.id" },
    { name: "exp_reward", type: "BIGINT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
    { name: "gold_reward", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
  ],
  indexes: [
    { name: "PK_QuestResource", columns: ["id"], isUnique: true, isClustered: true },
  ],
  foreignKeys: [
    { name: "FK_Quest_NPCStart", column: "npc_start_id", referencedTable: "NPCResource", referencedColumn: "id" },
    { name: "FK_Quest_NPCEnd", column: "npc_end_id", referencedTable: "NPCResource", referencedColumn: "id" },
  ],
  rowCount: 890,
}

const skillResourceTable: DbTable = {
  name: "SkillResource",
  schema: "dbo",
  columns: [
    { name: "id", type: "INT", nullable: false, isPrimaryKey: true, isForeignKey: false },
    { name: "name_id", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: true, fkReference: "StringResource.text_id" },
    { name: "tooltip_id", type: "INT", nullable: true, isPrimaryKey: false, isForeignKey: true, fkReference: "StringResource.text_id" },
    { name: "type", type: "TINYINT", nullable: false, isPrimaryKey: false, isForeignKey: false },
    { name: "target_type", type: "TINYINT", nullable: false, isPrimaryKey: false, isForeignKey: false },
    { name: "damage", type: "INT", nullable: true, isPrimaryKey: false, isForeignKey: false },
    { name: "mp_cost", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
    { name: "cooldown", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "0" },
    { name: "level_limit", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "1" },
    { name: "icon_file", type: "VARCHAR(255)", nullable: true, isPrimaryKey: false, isForeignKey: false },
  ],
  indexes: [
    { name: "PK_SkillResource", columns: ["id"], isUnique: true, isClustered: true },
  ],
  foreignKeys: [],
  rowCount: 3200,
}

// Views
const npcStatsView: DbView = {
  name: "vw_NPCStats",
  schema: "dbo",
  definition: `CREATE VIEW [dbo].[vw_NPCStats] AS
SELECT n.id, s.value AS name, n.level, n.hp, n.attack, n.defense,
       n.x, n.y, n.z, n.model_file
FROM dbo.NPCResource n
JOIN dbo.StringResource s ON s.text_id = n.name_text_id AND s.language = 'en'`,
}

const itemDropView: DbView = {
  name: "vw_ItemDropRates",
  schema: "dbo",
  definition: `CREATE VIEW [dbo].[vw_ItemDropRates] AS
SELECT m.id AS monster_id, ms.value AS monster_name,
       i.id AS item_id, istr.value AS item_name,
       d.drop_rate, d.min_count, d.max_count
FROM dbo.MonsterResource m
JOIN dbo.StringResource ms ON ms.text_id = m.name_id AND ms.language = 'en'
JOIN dbo.DropTable d ON d.monster_id = m.id
JOIN dbo.ItemResource i ON i.id = d.item_id
JOIN dbo.StringResource istr ON istr.text_id = i.name_id AND istr.language = 'en'`,
}

// Stored Procedures
const spGetNPC: DbStoredProcedure = {
  name: "sp_GetNPCById",
  schema: "dbo",
  definition: `CREATE PROCEDURE [dbo].[sp_GetNPCById]
    @NpcId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT n.*, s.value AS display_name
    FROM dbo.NPCResource n
    LEFT JOIN dbo.StringResource s ON s.text_id = n.name_text_id AND s.language = 'en'
    WHERE n.id = @NpcId;
END`,
}

const spSearchItems: DbStoredProcedure = {
  name: "sp_SearchItems",
  schema: "dbo",
  definition: `CREATE PROCEDURE [dbo].[sp_SearchItems]
    @SearchTerm NVARCHAR(255),
    @MinLevel INT = 1,
    @MaxLevel INT = 999
AS
BEGIN
    SET NOCOUNT ON;
    SELECT i.*, s.value AS display_name
    FROM dbo.ItemResource i
    JOIN dbo.StringResource s ON s.text_id = i.name_id AND s.language = 'en'
    WHERE s.value LIKE '%' + @SearchTerm + '%'
      AND i.level_limit BETWEEN @MinLevel AND @MaxLevel
    ORDER BY i.level_limit;
END`,
}

// Assemble the server
const arcadiaDb: DbDatabase = {
  name: "arcadia",
  tables: [npcResourceTable, itemResourceTable, monsterResourceTable, stringResourceTable, questResourceTable, skillResourceTable],
  views: [npcStatsView, itemDropView],
  storedProcedures: [spGetNPC, spSearchItems],
}

const telecasterDb: DbDatabase = {
  name: "Telecaster",
  tables: [
    {
      name: "ServerConfig", schema: "dbo",
      columns: [
        { name: "key", type: "VARCHAR(100)", nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: "value", type: "NVARCHAR(MAX)", nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: "category", type: "VARCHAR(50)", nullable: true, isPrimaryKey: false, isForeignKey: false },
      ],
      indexes: [{ name: "PK_ServerConfig", columns: ["key"], isUnique: true, isClustered: true }],
      foreignKeys: [], rowCount: 340,
    },
    {
      name: "CharacterInfo", schema: "dbo",
      columns: [
        { name: "sid", type: "INT", nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: "name", type: "NVARCHAR(60)", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "account_id", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "level", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "job", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "exp", type: "BIGINT", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "hp", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "mp", type: "INT", nullable: false, isPrimaryKey: false, isForeignKey: false },
      ],
      indexes: [
        { name: "PK_CharacterInfo", columns: ["sid"], isUnique: true, isClustered: true },
        { name: "IX_CharacterInfo_name", columns: ["name"], isUnique: true, isClustered: false },
      ],
      foreignKeys: [], rowCount: 185000,
    },
  ],
  views: [],
  storedProcedures: [],
}

export const simulatedServer: DbServer = {
  name: "RZDEV-SQL01",
  version: "Microsoft SQL Server 2019 (RTM-CU22) - 15.0.4322.2",
  databases: [arcadiaDb, telecasterDb],
}

// ============================================================
// Simulated Row Data Generator
// ============================================================

const npcNames = [
  "Village Elder Rowan", "Guard Captain Aldric", "Merchant Hilda", "Shadow Whisper",
  "Mystic Serena", "Blacksmith Forge", "Inn Keeper Rosa", "Scout Liana",
  "Dark Mage Vorath", "Priest Celestine", "Arena Master Kain", "Tailor Silk",
]

const itemNames = [
  "Iron Sword", "Steel Shield", "Health Potion", "Mana Elixir",
  "Dragon Scale Armor", "Phoenix Feather", "Enchanted Staff", "Shadow Cloak",
  "Crystal Ring", "Ancient Scroll", "Thunder Hammer", "Ice Arrow",
]

const monsterNames = [
  "Forest Wolf", "Cave Spider", "Dark Skeleton", "Fire Imp",
  "Shadow Wraith", "Stone Golem", "Corrupted Treant", "Ice Elemental",
  "Demon Guard", "Dragon Whelp", "Undead Knight", "Toxic Mushroom",
]

function generateNPCRows(count: number, offset: number): DataRow[] {
  const rows: DataRow[] = []
  for (let i = 0; i < count; i++) {
    const id = 1000 + offset + i
    rows.push({
      id,
      name_text_id: 500000 + id,
      text_id: 500100 + id,
      model_file: `db/npc/npc_${String(id).padStart(4, "0")}.nif`,
      x: Math.round((Math.random() * 5000 - 2500) * 10) / 10,
      y: 0,
      z: Math.round((Math.random() * 5000 - 2500) * 10) / 10,
      face_x: 0,
      face_y: 1,
      face_z: 0,
      speed: 100 + Math.floor(Math.random() * 100),
      run_speed: 200 + Math.floor(Math.random() * 100),
      level: 1 + Math.floor(Math.random() * 80),
      hp: 100 + Math.floor(Math.random() * 50000),
      attack: 10 + Math.floor(Math.random() * 500),
      defense: 5 + Math.floor(Math.random() * 300),
    })
  }
  return rows
}

function generateItemRows(count: number, offset: number): DataRow[] {
  const rows: DataRow[] = []
  for (let i = 0; i < count; i++) {
    const id = 2000 + offset + i
    rows.push({
      id,
      name_id: 200000 + id,
      tooltip_id: 200100 + id,
      type: Math.floor(Math.random() * 10),
      group: Math.floor(Math.random() * 20),
      class: Math.floor(Math.random() * 5),
      set_id: Math.random() > 0.7 ? Math.floor(Math.random() * 50) : null,
      attack_min: Math.floor(Math.random() * 200),
      attack_max: Math.floor(Math.random() * 300),
      defense: Math.floor(Math.random() * 200),
      level_limit: 1 + Math.floor(Math.random() * 80),
      price: Math.floor(Math.random() * 100000),
      icon_file: `db/item/icon_${String(id).padStart(4, "0")}.png`,
      model_file: `db/item/model_${String(id).padStart(4, "0")}.nif`,
    })
  }
  return rows
}

function generateMonsterRows(count: number, offset: number): DataRow[] {
  const rows: DataRow[] = []
  for (let i = 0; i < count; i++) {
    const id = 7000 + offset + i
    rows.push({
      id,
      name_id: 300000 + id,
      level: 1 + Math.floor(Math.random() * 99),
      hp: 100 + Math.floor(Math.random() * 100000),
      mp: Math.floor(Math.random() * 5000),
      attack: 10 + Math.floor(Math.random() * 1000),
      defence: 5 + Math.floor(Math.random() * 500),
      magic_attack: Math.floor(Math.random() * 500),
      magic_defence: Math.floor(Math.random() * 300),
      exp: Math.floor(Math.random() * 50000),
      model_file: `db/monster/mon_${String(id).padStart(4, "0")}.nif`,
      aggressive: Math.random() > 0.5 ? 1 : 0,
    })
  }
  return rows
}

function generateStringRows(count: number, offset: number): DataRow[] {
  const rows: DataRow[] = []
  const categories = ["NPC", "Item", "Monster", "Quest", "Skill", "System", "UI"]
  for (let i = 0; i < count; i++) {
    const id = 100000 + offset + i
    rows.push({
      text_id: id,
      language: "en",
      value: `${categories[i % categories.length]} Text Entry #${id}`,
      category: categories[i % categories.length],
    })
  }
  return rows
}

// Data cache to avoid regenerating
const dataCache = new Map<string, DataRow[]>()

/** Fetch paginated data for a table (simulated) */
export async function fetchTableData(
  databaseName: string,
  tableName: string,
  page: number,
  pageSize: number,
  filters?: QueryFilter[],
): Promise<{ rows: DataRow[]; totalRows: number; generatedSQL: string }> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 400))

  const cacheKey = `${databaseName}.${tableName}`
  let allRows = dataCache.get(cacheKey)

  if (!allRows) {
    // Generate data based on table name
    switch (tableName) {
      case "NPCResource":
        allRows = generateNPCRows(100, 0)
        break
      case "ItemResource":
        allRows = generateItemRows(100, 0)
        break
      case "MonsterResource":
        allRows = generateMonsterRows(100, 0)
        break
      case "StringResource":
        allRows = generateStringRows(100, 0)
        break
      case "QuestResource":
        allRows = generateNPCRows(50, 500) // reuse NPC generator shape
        break
      case "SkillResource":
        allRows = generateItemRows(50, 500) // reuse item generator shape
        break
      case "ServerConfig":
        allRows = Array.from({ length: 20 }, (_, i) => ({
          key: `config_key_${i}`,
          value: `config_value_${i}`,
          category: ["general", "network", "gameplay", "security"][i % 4],
        }))
        break
      case "CharacterInfo":
        allRows = Array.from({ length: 100 }, (_, i) => ({
          sid: 10000 + i,
          name: `Player_${String(i).padStart(4, "0")}`,
          account_id: 1000 + i,
          level: 1 + Math.floor(Math.random() * 99),
          job: Math.floor(Math.random() * 8),
          exp: Math.floor(Math.random() * 10000000),
          hp: 1000 + Math.floor(Math.random() * 50000),
          mp: 500 + Math.floor(Math.random() * 10000),
        }))
        break
      default:
        allRows = []
    }
    dataCache.set(cacheKey, allRows)
  }

  // Apply filters (simulated)
  let filteredRows = [...allRows]
  if (filters && filters.length > 0) {
    filteredRows = allRows.filter((row) => {
      return filters.every((f) => {
        const val = row[f.column]
        if (val === null || val === undefined) return f.operator === "=" && f.value === "NULL"
        const strVal = String(val).toLowerCase()
        const filterVal = f.value.toLowerCase()

        switch (f.operator) {
          case "=": return strVal === filterVal
          case "!=": return strVal !== filterVal
          case "LIKE": return strVal.includes(filterVal.replace(/%/g, ""))
          case ">": return Number(val) > Number(f.value)
          case "<": return Number(val) < Number(f.value)
          case "BETWEEN": return Number(val) >= Number(f.value) && Number(val) <= Number(f.value2 || f.value)
          case "IN": return f.value.split(",").map((v) => v.trim().toLowerCase()).includes(strVal)
          default: return true
        }
      })
    })
  }

  const totalRows = filteredRows.length
  const start = page * pageSize
  const rows = filteredRows.slice(start, start + pageSize)

  // Generate the SQL preview
  const whereClause = filters && filters.length > 0
    ? `\nWHERE ${filters.map((f, i) => {
        const prefix = i > 0 ? `${f.logic} ` : ""
        if (f.operator === "BETWEEN") return `${prefix}[${f.column}] BETWEEN ${f.value} AND ${f.value2}`
        if (f.operator === "LIKE") return `${prefix}[${f.column}] LIKE '${f.value}'`
        if (f.operator === "IN") return `${prefix}[${f.column}] IN (${f.value})`
        return `${prefix}[${f.column}] ${f.operator} ${isNaN(Number(f.value)) ? `'${f.value}'` : f.value}`
      }).join("\n  ")}`
    : ""

  const generatedSQL = `SELECT TOP ${pageSize} *\nFROM [${databaseName}].[dbo].[${tableName}]${whereClause}\nORDER BY 1\nOFFSET ${start} ROWS;`

  return { rows, totalRows, generatedSQL }
}

/** Execute a SELECT-only query (simulated) */
export async function executeSelectQuery(
  _databaseName: string,
  query: string,
): Promise<{ rows: DataRow[]; columns: string[]; error?: string }> {
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 500))

  // Safety: reject non-SELECT queries
  const trimmed = query.trim().toUpperCase()
  if (!trimmed.startsWith("SELECT")) {
    return { rows: [], columns: [], error: "Only SELECT queries are allowed in the Database Explorer." }
  }

  // Check for dangerous keywords
  const forbidden = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "EXEC"]
  for (const keyword of forbidden) {
    if (trimmed.includes(keyword)) {
      return { rows: [], columns: [], error: `Forbidden keyword "${keyword}" detected. Only SELECT queries are allowed.` }
    }
  }

  // Return sample data
  return {
    rows: [
      { id: 1001, name: "Village Elder Rowan", level: 50, hp: 12000 },
      { id: 1002, name: "Guard Captain Aldric", level: 40, hp: 8500 },
      { id: 1003, name: "Merchant Hilda", level: 35, hp: 5000 },
    ],
    columns: ["id", "name", "level", "hp"],
  }
}
