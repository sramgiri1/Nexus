import { buildModeGuardResult } from "./modeGuard.js";
import { summarizeRedaction } from "./redaction.js";
import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";
import {
  BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE,
  BILLING_METERING_CUSTOMER_OPERATIONS_SAFETY_FLAG_NAMES,
  buildBillingMeteringCustomerOperationsModel,
  validateBillingMeteringCustomerOperationsModel,
} from "./billingMeteringCustomerOperationsModel.js";

export const BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_PHASE = "P144.3";
export const BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_VERSION = "1.0";
export const BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_SAFETY_FLAG_NAMES = BILLING_METERING_CUSTOMER_OPERATIONS_SAFETY_FLAG_NAMES;

const OWNER_CAPABILITY = "NEXUS Billing Metering Customer Operations Preview Guard";
const DEFAULT_REPORT_REF = "reports/p1443-billing-metering-customer-operations-report.md";
const DEFAULT_ACTIVITY_REF = "os-roadmap/phase-status.json#P144.3";
const DISABLED_REASON = "P144.3 produces a display-safe, non-runnable billing and customer operations preview. Billing account mutation, usage writes, invoice creation, payment collection, subscription mutation, entitlement changes, support ticket creation, customer contact, customer operation execution, DB/runtime writes, provider/model calls, payment provider calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, and spend remain blocked.";

function blockedSafetyFlags() {
  return Object.fromEntries(BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_SAFETY_FLAG_NAMES.map((flag) => [flag, false]));
}

function normalizeText(value = "", fallback = "") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function asArray(value = []) {
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item));
  if (value === undefined || value === null || value === "") return [];
  return [String(value)];
}

function uniqueList(values = []) {
  return [...new Set(asArray(values))];
}

function displayRef(prefix, sequence) {
  return `${prefix}-${Number.isFinite(Number(sequence)) ? Number(sequence) : 1}`;
}

function evidenceRefs(extra = []) {
  return uniqueList([DEFAULT_REPORT_REF, ...asArray(extra)]);
}

function activityRefs(extra = []) {
  return uniqueList([DEFAULT_ACTIVITY_REF, ...asArray(extra)]);
}

function buildCostImpact() {
  return {
    estimatedUsd: 0,
    actualUsd: 0,
    billingJobsAllowed: false,
    usageJobsAllowed: false,
    invoiceJobsAllowed: false,
    paymentJobsAllowed: false,
    supportJobsAllowed: false,
    customerOpsAllowed: false,
    networkCallsAllowed: false,
    providerSpendAllowed: false,
    paymentProviderSpendAllowed: false,
  };
}

function hasUnsafeIdentifier(value) {
  return /(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|billing|payment|invoice|subscription|entitlement|customer|support|meter|usage)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify(value));
}

function sourceFields(source = {}, sourceType = "", sequence = 1) {
  const sourceRef = source.accountRef
    || source.meterRef
    || source.invoiceRef
    || source.entitlementRef
    || source.handoffRef
    || source.operationRef
    || displayRef("billing-preview-source", sequence);
  return {
    sourceRef,
    displayName: source.displayName || `${sourceType.replace(/_/g, " ")} preview`,
    currentState: source.currentState || source.planState || source.captureState || source.previewState || source.billingStatus || "blocked_preview",
    nextAction: source.nextAction || "Review this preview row before any future billing or customer authority is considered.",
    blockers: source.blockers || [DISABLED_REASON],
    ownerCapability: source.ownerCapability || OWNER_CAPABILITY,
    evidenceRefs: source.evidenceRefs,
    activityRefs: source.activityRefs,
    costImpact: source.costImpact,
    authorityFlags: source.authorityFlags,
  };
}

export function buildPreviewRow(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  const sourceType = normalizeText(input.sourceType, "billing_customer_review");
  const source = sourceFields(input.source || {}, sourceType, sequence);
  const flags = blockedSafetyFlags();
  const row = {
    rowRef: normalizeText(input.rowRef, displayRef("billing-customer-preview-row", sequence)),
    schemaVersion: BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_VERSION,
    phase: BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_PHASE,
    sourceModelPhase: BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE,
    sourceType,
    sourceRef: normalizeText(input.sourceRef, source.sourceRef),
    displayName: normalizeText(input.displayName, source.displayName),
    currentState: normalizeText(input.currentState, source.currentState),
    previewState: "blocked_dry_run_ready_for_review",
    nextAction: normalizeText(input.nextAction, source.nextAction),
    blockers: uniqueList([
      ...asArray(source.blockers),
      ...asArray(input.blockers),
      "Executable billing and customer operation payloads are not generated by this preview.",
      DISABLED_REASON,
    ]),
    ownerCapability: normalizeText(input.ownerCapability, source.ownerCapability),
    disabledReason: DISABLED_REASON,
    previewOnly: true,
    readOnly: true,
    localOnly: true,
    dryRunOnly: true,
    executionAllowed: false,
    executablePayload: null,
    billingMutationPayload: null,
    usageWritePayload: null,
    usageRollupPayload: null,
    invoiceCreationPayload: null,
    paymentCollectionPayload: null,
    subscriptionMutationPayload: null,
    entitlementMutationPayload: null,
    supportTicketPayload: null,
    customerContactPayload: null,
    customerOperationPayload: null,
    providerPayload: null,
    paymentProviderPayload: null,
    toolPayload: null,
    agentDispatchPayload: null,
    projectMutationPayload: null,
    dbRuntimeMutationPayload: null,
    deployReleaseExportPackagePayload: null,
    networkPayload: null,
    rawPayloadVisible: false,
    rawPrivateIdsVisible: false,
    rawInternalPayloadsVisible: false,
    evidenceRefs: evidenceRefs(input.evidenceRefs || source.evidenceRefs),
    activityRefs: activityRefs(input.activityRefs || source.activityRefs),
    costImpact: {
      ...buildCostImpact(),
      ...source.costImpact,
      estimatedUsd: 0,
      actualUsd: 0,
      providerSpendAllowed: false,
      paymentProviderSpendAllowed: false,
      networkCallsAllowed: false,
    },
    authorityFlags: {
      ...flags,
      ...(source.authorityFlags || {}),
      ...flags,
    },
    safetyFlags: flags,
    ...flags,
  };
  return row;
}

export function validatePreviewRow(row = {}) {
  const errors = [];
  for (const field of ["rowRef", "sourceType", "sourceRef", "displayName", "currentState", "previewState", "nextAction", "blockers", "ownerCapability", "disabledReason", "evidenceRefs", "activityRefs", "costImpact", "authorityFlags", "safetyFlags"]) {
    if (!(field in row)) errors.push(`${field} is required`);
  }
  if (row.phase !== BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_PHASE) errors.push("phase must be P144.3");
  if (row.sourceModelPhase !== BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE) errors.push("sourceModelPhase must be P144.2");
  if (row.previewOnly !== true || row.readOnly !== true || row.localOnly !== true || row.dryRunOnly !== true) errors.push("row must remain local read-only preview metadata");
  if (row.executionAllowed !== false) errors.push("executionAllowed must remain false");
  for (const field of ["executablePayload", "billingMutationPayload", "usageWritePayload", "usageRollupPayload", "invoiceCreationPayload", "paymentCollectionPayload", "subscriptionMutationPayload", "entitlementMutationPayload", "supportTicketPayload", "customerContactPayload", "customerOperationPayload", "providerPayload", "paymentProviderPayload", "toolPayload", "agentDispatchPayload", "projectMutationPayload", "dbRuntimeMutationPayload", "deployReleaseExportPackagePayload", "networkPayload"]) {
    if (row[field] !== null) errors.push(`${field} must be null`);
  }
  if (row.rawPayloadVisible !== false || row.rawPrivateIdsVisible !== false || row.rawInternalPayloadsVisible !== false) errors.push("row must hide raw internals");
  if (!Array.isArray(row.blockers) || row.blockers.length < 2) errors.push("blockers must explain blocked authority");
  if (!Array.isArray(row.evidenceRefs) || row.evidenceRefs.length === 0) errors.push("evidenceRefs are required");
  if (!Array.isArray(row.activityRefs) || row.activityRefs.length === 0) errors.push("activityRefs are required");
  if (row.costImpact?.estimatedUsd !== 0 || row.costImpact?.actualUsd !== 0 || row.costImpact?.providerSpendAllowed !== false || row.costImpact?.paymentProviderSpendAllowed !== false || row.costImpact?.networkCallsAllowed !== false) errors.push("costImpact must remain zero-spend and local-only");
  for (const flag of BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_SAFETY_FLAG_NAMES) {
    if (row[flag] !== false) errors.push(`${flag} must be false`);
    if (row.safetyFlags?.[flag] !== false) errors.push(`safetyFlags.${flag} must be false`);
    if (row.authorityFlags?.[flag] !== false) errors.push(`authorityFlags.${flag} must be false`);
  }
  if (!/remain blocked/i.test(row.disabledReason || "")) errors.push("disabledReason must explain blocked authority");
  if (hasUnsafeIdentifier(row)) errors.push("row must not expose raw private identifiers");
  const serialized = JSON.stringify(row);
  if (/create invoice now|collect payment now|charge now|subscribe now|cancel subscription now|grant entitlement now|revoke entitlement now|record usage now|write usage now|create ticket now|contact customer now|run customer operation now|write db now|call payment provider now|call provider now|run tool now|dispatch agent now|mutate project now|spend now/i.test(serialized)) errors.push("row must not expose fake runnable actions");
  if (/raw json|raw logs|raw policy dump|raw billing payload|raw payment payload|raw customer payload|raw invoice payload|raw usage payload/i.test(serialized)) errors.push("row must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}

function buildPreviewRows(sourceModel = {}) {
  const rows = [];
  for (const [sourceType, collection] of [
    ["billing_account", sourceModel.billingAccounts || []],
    ["usage_meter", sourceModel.usageMeters || []],
    ["invoice_preview", sourceModel.invoicePreviews || []],
    ["entitlement", sourceModel.entitlements || []],
    ["support_handoff", sourceModel.supportHandoffs || []],
    ["customer_operation", sourceModel.customerOperations || []],
  ]) {
    for (const source of collection) {
      rows.push(buildPreviewRow({
        sequence: rows.length + 1,
        sourceType,
        source,
        evidenceRefs: sourceModel.evidenceRefs,
        activityRefs: sourceModel.activityRefs,
      }));
    }
  }
  return rows;
}

function buildPreviewSections(rows = []) {
  return [
    {
      sectionRef: "billing-account-usage-preview",
      label: "Billing account and usage preview",
      rowCount: rows.filter((row) => ["billing_account", "usage_meter"].includes(row.sourceType)).length,
      blockedCount: rows.filter((row) => ["billing_account", "usage_meter"].includes(row.sourceType)).length,
      nextAction: "Review billing account and usage posture without mutation or usage writes.",
    },
    {
      sectionRef: "invoice-entitlement-preview",
      label: "Invoice and entitlement preview",
      rowCount: rows.filter((row) => ["invoice_preview", "entitlement"].includes(row.sourceType)).length,
      blockedCount: rows.filter((row) => ["invoice_preview", "entitlement"].includes(row.sourceType)).length,
      nextAction: "Review invoice and entitlement posture without invoice creation, payment collection, grants, or revokes.",
    },
    {
      sectionRef: "support-customer-ops-preview",
      label: "Support and customer operations preview",
      rowCount: rows.filter((row) => ["support_handoff", "customer_operation"].includes(row.sourceType)).length,
      blockedCount: rows.filter((row) => ["support_handoff", "customer_operation"].includes(row.sourceType)).length,
      nextAction: "Review support handoff and customer operations posture without ticket creation, customer contact, or execution.",
    },
  ];
}

function buildReadinessSummary(rows = [], sourceModel = {}) {
  return {
    sourceModelPhase: sourceModel.phase,
    rowCount: rows.length,
    blockedRowCount: rows.length,
    runnableActionCount: 0,
    billingMutationCandidateCount: 0,
    usageWriteCandidateCount: 0,
    usageRollupCandidateCount: 0,
    invoiceCreationCandidateCount: 0,
    paymentCollectionCandidateCount: 0,
    subscriptionMutationCandidateCount: 0,
    entitlementMutationCandidateCount: 0,
    supportTicketCandidateCount: 0,
    customerContactCandidateCount: 0,
    customerOperationExecutionCandidateCount: 0,
    dbRuntimeWriteCandidateCount: 0,
    providerModelCallCandidateCount: 0,
    paymentProviderCallCandidateCount: 0,
    toolExecutionCandidateCount: 0,
    agentDispatchCandidateCount: 0,
    projectMutationCandidateCount: 0,
    networkCallCandidateCount: 0,
    providerSpendCandidateCount: 0,
    nextAction: "Route P144.3 preview to P144.4 Command Center UX without enabling billing or customer authority.",
  };
}

export function buildBillingMeteringCustomerOperationsPreview(input = {}) {
  const sourceModel = input.sourceModel || input.model || buildBillingMeteringCustomerOperationsModel(input);
  const sourceValidation = validateBillingMeteringCustomerOperationsModel(sourceModel);
  const rows = sourceValidation.valid ? buildPreviewRows(sourceModel) : [];
  const flags = blockedSafetyFlags();
  const redaction = summarizeRedaction({ rows });
  return {
    phase: BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_PHASE,
    schemaVersion: BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_VERSION,
    mode: "display-safe-billing-metering-customer-operations-preview",
    sourceModelPhase: sourceModel.phase,
    sourceModelValid: sourceValidation.valid,
    sourceModelErrors: sourceValidation.errors,
    previewOnly: true,
    readOnly: true,
    localOnly: true,
    dryRunOnly: true,
    commandCenterVisible: true,
    currentState: "billing_customer_preview_ready_execution_blocked",
    modeGuard: buildModeGuardResult(input.mode || "public-safe", ["public-safe", "local-private", "test"]),
    ownerCapability: OWNER_CAPABILITY,
    rows,
    previewRows: rows,
    previewSections: buildPreviewSections(rows),
    readinessSummary: buildReadinessSummary(rows, sourceModel),
    blockers: [
      "Billing account mutation, usage writes, invoice creation, payment collection, and subscription mutation remain blocked.",
      "Entitlement changes, support ticket creation, customer contact, and customer operation execution remain blocked.",
      "DB/runtime writes, provider/model calls, payment provider calls, tool execution, MCP startup, agent dispatch, project mutation, network calls, and spend remain blocked.",
    ],
    disabledReason: DISABLED_REASON,
    nextAction: "Route this non-runnable billing/customer preview to P144.4 Command Center UX without creating invoices, collecting payments, writing usage, or executing customer operations.",
    evidenceRefs: evidenceRefs(input.evidenceRefs || sourceModel.evidenceRefs),
    activityRefs: activityRefs(input.activityRefs || sourceModel.activityRefs),
    costImpact: buildCostImpact(),
    redaction: {
      changed: redaction.changed,
      redactionCount: redaction.redactionCount,
      rawPrivateIdsVisible: false,
      rawInternalPayloadsVisible: false,
      credentialValuesVisible: false,
      paymentValuesVisible: false,
      customerIdentifiersVisible: false,
    },
    safetyFlags: flags,
    ...flags,
  };
}

export function validateBillingMeteringCustomerOperationsPreview(preview = {}) {
  const errors = [];
  if (preview.phase !== BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_PHASE) errors.push("phase must be P144.3");
  if (preview.schemaVersion !== BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_VERSION) errors.push("schemaVersion must be 1.0");
  if (preview.mode !== "display-safe-billing-metering-customer-operations-preview") errors.push("mode must be display-safe-billing-metering-customer-operations-preview");
  if (preview.sourceModelPhase !== BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE || preview.sourceModelValid !== true) errors.push("preview must consume a valid P144.2 source model");
  if (preview.previewOnly !== true || preview.readOnly !== true || preview.localOnly !== true || preview.dryRunOnly !== true) errors.push("preview must remain local read-only dry run metadata");
  if (preview.commandCenterVisible !== true) errors.push("preview must be available to Command Center projection");
  if (!preview.modeGuard?.ok) errors.push("mode guard must pass");
  if (!Array.isArray(preview.rows) || preview.rows.length < 14 || preview.rows !== preview.previewRows) errors.push("preview rows must be visible and reused as previewRows");
  for (const row of preview.rows || []) {
    const validation = validatePreviewRow(row);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${row.rowRef || "row"}: ${error}`));
  }
  if (!Array.isArray(preview.previewSections) || preview.previewSections.length < 3) errors.push("previewSections must summarize rows");
  if (preview.previewSections?.some((section) => section.blockedCount !== section.rowCount)) errors.push("all preview section rows must remain blocked");
  if (preview.readinessSummary?.rowCount !== preview.rows?.length || preview.readinessSummary?.blockedRowCount !== preview.rows?.length || preview.readinessSummary?.runnableActionCount !== 0) errors.push("readiness summary must keep rows blocked and non-runnable");
  for (const field of ["billingMutationCandidateCount", "usageWriteCandidateCount", "usageRollupCandidateCount", "invoiceCreationCandidateCount", "paymentCollectionCandidateCount", "subscriptionMutationCandidateCount", "entitlementMutationCandidateCount", "supportTicketCandidateCount", "customerContactCandidateCount", "customerOperationExecutionCandidateCount", "dbRuntimeWriteCandidateCount", "providerModelCallCandidateCount", "paymentProviderCallCandidateCount", "toolExecutionCandidateCount", "agentDispatchCandidateCount", "projectMutationCandidateCount", "networkCallCandidateCount", "providerSpendCandidateCount"]) {
    if (preview.readinessSummary?.[field] !== 0) errors.push(`${field} must be zero`);
  }
  if (!Array.isArray(preview.blockers) || preview.blockers.length < 3) errors.push("blockers are required");
  if (!Array.isArray(preview.evidenceRefs) || preview.evidenceRefs.length === 0) errors.push("evidenceRefs are required");
  if (!Array.isArray(preview.activityRefs) || preview.activityRefs.length === 0) errors.push("activityRefs are required");
  if (preview.costImpact?.estimatedUsd !== 0 || preview.costImpact?.actualUsd !== 0 || preview.costImpact?.providerSpendAllowed !== false || preview.costImpact?.paymentProviderSpendAllowed !== false || preview.costImpact?.networkCallsAllowed !== false) errors.push("costImpact must remain zero-spend and local-only");
  if (preview.redaction?.rawPrivateIdsVisible !== false || preview.redaction?.rawInternalPayloadsVisible !== false || preview.redaction?.credentialValuesVisible !== false || preview.redaction?.paymentValuesVisible !== false || preview.redaction?.customerIdentifiersVisible !== false) errors.push("redaction must hide internals, credential values, payment values, and customer identifiers");
  for (const flag of BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_SAFETY_FLAG_NAMES) {
    if (preview[flag] !== false) errors.push(`${flag} must be false`);
    if (preview.safetyFlags?.[flag] !== false) errors.push(`safetyFlags.${flag} must be false`);
  }
  if (!/remain blocked/i.test(preview.disabledReason || "")) errors.push("disabledReason must explain blocked authority");
  if (!/without/i.test(preview.nextAction || "")) errors.push("nextAction must route forward without authority");
  if (hasUnsafeIdentifier(preview)) errors.push("preview must not expose raw private identifiers");
  const serialized = JSON.stringify(preview);
  if (/create invoice now|collect payment now|charge now|subscribe now|cancel subscription now|grant entitlement now|revoke entitlement now|record usage now|write usage now|create ticket now|contact customer now|run customer operation now|write db now|call payment provider now|call provider now|run tool now|dispatch agent now|mutate project now|spend now/i.test(serialized)) errors.push("preview must not expose fake runnable actions");
  if (/raw json|raw logs|raw policy dump|raw billing payload|raw payment payload|raw customer payload|raw invoice payload|raw usage payload/i.test(serialized)) errors.push("preview must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}

export function buildBillingMeteringCustomerOperationsPreviewEnvelope(input = {}) {
  const preview = input.preview || buildBillingMeteringCustomerOperationsPreview(input);
  const validation = validateBillingMeteringCustomerOperationsPreview(preview);
  const envelope = createPassResult({
    phase: BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_PHASE,
    mode: "display-safe-billing-metering-customer-operations-preview",
    source: "shared/billingMeteringCustomerOperationsPreview.js",
    summary: validation.valid
      ? "P144.3 display-safe billing and customer operations preview is valid; billing, usage, invoice, payment, customer, DB/runtime, provider/model, payment provider, network, and spend authority remain blocked."
      : "P144.3 display-safe billing and customer operations preview is invalid.",
    data: { preview },
    warnings: validation.valid ? [] : validation.errors,
    evidence: preview.evidenceRefs || [],
  });
  const envelopeValidation = validateResultEnvelope(envelope);
  return {
    ...envelope,
    ok: validation.valid && envelopeValidation.valid,
    status: validation.valid && envelopeValidation.valid ? "PASS" : "FAIL",
    errors: [...validation.errors, ...envelopeValidation.errors],
    envelopeValid: envelopeValidation.valid,
    envelopeErrors: envelopeValidation.errors,
  };
}
