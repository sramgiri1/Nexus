/**
 * db/index.js — P41-LOCAL DB module re-exports.
 */

export { loadDbConfig, validateDbConfig, getDbMode } from "./dbConfig.js";
export { getDbHealth, getDbReadiness, summarizeDbStatus } from "./dbHealth.js";
export {
  createDbRepository,
  getFileBackedRepositoryMode,
  getRepositoryMode,
  getRepositoryReadStatus,
  readProjects,
  readMissions,
  readTasks,
  readAgents,
  readEvidence,
  readAuditEvents,
  readRuntimeEvents,
  readContracts,
  readRoadmap,
  readActions,
  writeNotSupportedYet,
} from "./dbRepository.js";
export {
  buildDbImportPlan,
  validateDbImportPlan,
  summarizeImportReadiness,
  writeImportPlanReport,
} from "./dbImportPlan.js";
export {
  getSqliteRuntimeConfig,
  getSqliteRuntimeStatus,
  initializeSqliteRuntime,
  isSqliteCliAvailable,
  loadSqliteSchema,
  transformSchemaForSqlite,
} from "./sqliteRuntime.js";
export {
  createSqliteCrudRepository,
  deleteSqliteEntity,
  describeSqliteCrudEntity,
  getSqliteEntityById,
  insertSqliteEntity,
  listSqliteCrudEntities,
  listSqliteEntityRecords,
  updateSqliteEntity,
  validateSqliteCrudRepository,
} from "./sqliteCrudRepository.js";
export {
  mapLocalStateToDbEntities,
  mapReportsToDbEntities,
  createDbSeedPreview,
  validateDbSeedPreview,
  writeDbFoundationStatus,
} from "./dbSnapshotMapper.js";
