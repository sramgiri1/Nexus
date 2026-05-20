import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import process from "node:process";
import { getSqliteRuntimeConfig, isSqliteCliAvailable } from "./sqliteRuntime.js";

const ROOT = process.cwd();

function loadSchema() {
  return JSON.parse(readFileSync(join(ROOT, "db/schema.json"), "utf8"));
}

function camelToSnake(value = "") {
  return String(value).replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
}

function buildEntityMap() {
  const schema = loadSchema();
  return new Map(schema.entities.map((entity) => {
    const fields = Object.entries(entity.fields).map(([fieldName, fieldType]) => ({
      fieldName,
      fieldType,
      columnName: camelToSnake(fieldName),
    }));
    return [entity.name, {
      ...entity,
      tableName: entity.name,
      primaryKeyColumn: camelToSnake(entity.primaryKey),
      fields,
      fieldMap: new Map(fields.map((field) => [field.fieldName, field])),
      columnMap: new Map(fields.map((field) => [field.columnName, field])),
    }];
  }));
}

const ENTITY_MAP = buildEntityMap();
const IDENTIFIER_PATTERN = /^[a-z][a-z0-9_]*$/;

function assertIdentifier(value, label) {
  if (!IDENTIFIER_PATTERN.test(value)) throw new Error(`Invalid SQLite ${label}`);
  return value;
}

function getEntity(entityName) {
  const entity = ENTITY_MAP.get(entityName);
  if (!entity) throw new Error(`Unknown SQLite entity: ${entityName}`);
  assertIdentifier(entity.tableName, "table");
  entity.fields.forEach((field) => assertIdentifier(field.columnName, "column"));
  return entity;
}

function sqlLiteral(value, fieldType = "string") {
  if (value === undefined) return "NULL";
  if (value === null) return "NULL";
  if (fieldType === "boolean") return value ? "1" : "0";
  if (fieldType === "array" || typeof value === "object") {
    return `'${JSON.stringify(value).replaceAll("'", "''")}'`;
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}

function deserializeValue(value, fieldType = "string") {
  if (value === null || value === undefined) return null;
  if (fieldType === "boolean") return value === 1 || value === true || value === "1";
  if (fieldType === "integer") return Number.isFinite(Number(value)) ? Number(value) : value;
  if (fieldType === "array") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return value;
}

function rowToRecord(entity, row) {
  return Object.fromEntries(entity.fields.map((field) => [
    field.fieldName,
    deserializeValue(row[field.columnName], field.fieldType),
  ]));
}

function runSqliteQuery(config, sql) {
  const output = execFileSync(config.sqliteCli, ["-json", config.dbPath, sql], { encoding: "utf8" }).trim();
  if (!output) return [];
  return JSON.parse(output);
}

function runSqliteMutation(config, sql) {
  execFileSync(config.sqliteCli, [config.dbPath], {
    input: sql,
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function resolveConfig(input = {}) {
  const config = getSqliteRuntimeConfig(input);
  if (!isSqliteCliAvailable(config.sqliteCli)) throw new Error("SQLite CLI is not available");
  if (!existsSync(config.dbPath)) throw new Error("SQLite DB is not initialized");
  if (!config.sqliteLiveAllowed) throw new Error("SQLite CRUD requires NEXUS_DB_MODE=sqlite-live");
  return config;
}

function assertWritesAllowed(config) {
  if (!config.dbWritesEnabled) {
    throw new Error("SQLite CRUD writes require NEXUS_DB_MODE=sqlite-live and NEXUS_DB_ENABLE_WRITES=1");
  }
}

function buildKnownFieldList(entity, record) {
  return Object.keys(record).map((fieldName) => {
    const field = entity.fieldMap.get(fieldName);
    if (!field) throw new Error(`Unknown field for ${entity.name}: ${fieldName}`);
    return field;
  });
}

function ensurePrimaryKey(entity, recordOrId) {
  const value = typeof recordOrId === "object" ? recordOrId?.[entity.primaryKey] : recordOrId;
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing primary key for ${entity.name}: ${entity.primaryKey}`);
  }
  return value;
}

export function listSqliteCrudEntities() {
  return Array.from(ENTITY_MAP.values()).map((entity) => ({
    name: entity.name,
    primaryKey: entity.primaryKey,
    fields: Object.fromEntries(entity.fields.map((field) => [field.fieldName, field.fieldType])),
    requiredFields: entity.requiredFields,
  }));
}

export function describeSqliteCrudEntity(entityName) {
  const entity = getEntity(entityName);
  return {
    name: entity.name,
    tableName: entity.tableName,
    primaryKey: entity.primaryKey,
    fields: Object.fromEntries(entity.fields.map((field) => [field.fieldName, {
      type: field.fieldType,
      column: field.columnName,
    }])),
    requiredFields: entity.requiredFields,
  };
}

export function createSqliteCrudRepository(input = {}) {
  return {
    mode: "sqlite-live",
    dbWritesEnabled: getSqliteRuntimeConfig(input).dbWritesEnabled,
    fileFallbackRequired: true,
    listEntities: () => listSqliteCrudEntities(),
    describeEntity: (entityName) => describeSqliteCrudEntity(entityName),
    list: (entityName, options = {}) => listSqliteEntityRecords(entityName, options, input),
    get: (entityName, id) => getSqliteEntityById(entityName, id, input),
    insert: (entityName, record) => insertSqliteEntity(entityName, record, input),
    update: (entityName, id, patch) => updateSqliteEntity(entityName, id, patch, input),
    delete: (entityName, id) => deleteSqliteEntity(entityName, id, input),
  };
}

export function listSqliteEntityRecords(entityName, options = {}, input = {}) {
  const entity = getEntity(entityName);
  const config = resolveConfig(input);
  const limit = Math.max(1, Math.min(Number(options.limit || 100), 500));
  const orderColumn = entity.fieldMap.has("createdAt")
    ? "created_at"
    : entity.primaryKeyColumn;
  const rows = runSqliteQuery(
    config,
    `SELECT * FROM ${entity.tableName} ORDER BY ${orderColumn} DESC LIMIT ${limit};`,
  );
  return rows.map((row) => rowToRecord(entity, row));
}

export function getSqliteEntityById(entityName, id, input = {}) {
  const entity = getEntity(entityName);
  const config = resolveConfig(input);
  const primaryKeyValue = ensurePrimaryKey(entity, id);
  const rows = runSqliteQuery(
    config,
    `SELECT * FROM ${entity.tableName} WHERE ${entity.primaryKeyColumn} = ${sqlLiteral(primaryKeyValue)} LIMIT 1;`,
  );
  return rows[0] ? rowToRecord(entity, rows[0]) : null;
}

export function insertSqliteEntity(entityName, record, input = {}) {
  const entity = getEntity(entityName);
  const config = resolveConfig(input);
  assertWritesAllowed(config);
  ensurePrimaryKey(entity, record);
  const fields = buildKnownFieldList(entity, record);
  const columns = fields.map((field) => field.columnName).join(", ");
  const values = fields.map((field) => sqlLiteral(record[field.fieldName], field.fieldType)).join(", ");
  runSqliteMutation(config, `INSERT INTO ${entity.tableName} (${columns}) VALUES (${values});`);
  return getSqliteEntityById(entityName, record[entity.primaryKey], input);
}

export function updateSqliteEntity(entityName, id, patch, input = {}) {
  const entity = getEntity(entityName);
  const config = resolveConfig(input);
  assertWritesAllowed(config);
  const primaryKeyValue = ensurePrimaryKey(entity, id);
  const patchFields = buildKnownFieldList(entity, patch)
    .filter((field) => field.fieldName !== entity.primaryKey);
  if (patchFields.length === 0) throw new Error(`No mutable fields provided for ${entity.name}`);
  const assignments = patchFields.map((field) => {
    return `${field.columnName} = ${sqlLiteral(patch[field.fieldName], field.fieldType)}`;
  }).join(", ");
  runSqliteMutation(
    config,
    `UPDATE ${entity.tableName} SET ${assignments} WHERE ${entity.primaryKeyColumn} = ${sqlLiteral(primaryKeyValue)};`,
  );
  return getSqliteEntityById(entityName, id, input);
}

export function deleteSqliteEntity(entityName, id, input = {}) {
  const entity = getEntity(entityName);
  const config = resolveConfig(input);
  assertWritesAllowed(config);
  const primaryKeyValue = ensurePrimaryKey(entity, id);
  const existing = getSqliteEntityById(entityName, primaryKeyValue, input);
  runSqliteMutation(
    config,
    `DELETE FROM ${entity.tableName} WHERE ${entity.primaryKeyColumn} = ${sqlLiteral(primaryKeyValue)};`,
  );
  return { deleted: Boolean(existing), entity: entity.name, id: primaryKeyValue };
}

export function validateSqliteCrudRepository(input = {}) {
  const entities = listSqliteCrudEntities();
  const config = getSqliteRuntimeConfig(input);
  return {
    phase: "P92.2",
    entityCount: entities.length,
    entities: entities.map((entity) => entity.name),
    sqliteLiveAllowed: config.sqliteLiveAllowed,
    dbWritesEnabled: config.dbWritesEnabled,
    fileFallbackRequired: true,
    mutationGate: "NEXUS_DB_MODE=sqlite-live and NEXUS_DB_ENABLE_WRITES=1",
    rawSqlAccepted: false,
  };
}
