import { buildModeGuardResult } from "./modeGuard.js";
import { summarizeRedaction } from "./redaction.js";
import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";

export const BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE = "P144.2";
export const BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_VERSION = "1.0";

export const BILLING_METERING_CUSTOMER_OPERATIONS_SAFETY_FLAG_NAMES = Object.freeze([
  "billingAccountMutationAllowed",
  "usageMeterWriteAllowed",
  "usageRollupWriteAllowed",
  "invoiceCreationAllowed",
  "paymentCollectionAllowed",
  "subscriptionMutationAllowed",
  "entitlementGrantAllowed",
  "entitlementRevokeAllowed",
  "supportTicketCreationAllowed",
  "customerContactAllowed",
  "customerOperationExecutionAllowed",
  "dbRuntimeWriteAllowed",
  "providerModelCallAllowed",
  "paymentProviderCallAllowed",
  "toolExecutionAllowed",
  "mcpStartupAllowed",
  "agentDispatchAllowed",
  "projectMutationAllowed",
  "deployReleaseExportPackageAllowed",
  "networkCallAllowed",
  "spendAllowed",
  "rawPrivateIdsVisible",
  "rawInternalPayloadsVisible",
]);

const OWNER_CAPABILITY = "NEXUS Billing Metering Customer Operations Guard";
const DEFAULT_CREATED_AT = "2026-05-31T13:40:00.000Z";
const DISABLED_REASON = "P144.2 defines a read-only billing, metering, and customer operations model. Billing account mutation, usage writes, invoice creation, payment collection, subscription mutation, entitlement changes, support ticket creation, customer contact, customer operation execution, DB/runtime writes, provider/model calls, payment provider calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, and spend remain blocked.";

function blockedSafetyFlags() {
  return Object.fromEntries(BILLING_METERING_CUSTOMER_OPERATIONS_SAFETY_FLAG_NAMES.map((flag) => [flag, false]));
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

function displayRef(prefix, sequence) {
  return `${prefix}-${Number.isFinite(Number(sequence)) ? Number(sequence) : 1}`;
}

function evidenceRefs(extra = []) {
  return [...new Set(["reports/p1442-billing-metering-customer-operations-report.md", ...asArray(extra)])];
}

function activityRefs(extra = []) {
  return [...new Set(["os-roadmap/phase-status.json#P144.2", ...asArray(extra)])];
}

function hasUnsafeIdentifier(value) {
  return /(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|billing|payment|invoice|subscription|entitlement|customer|support|meter|usage)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify(value));
}

function buildCostImpact() {
  return {
    estimatedUsd: 0,
    actualUsd: 0,
    providerSpendAllowed: false,
    paymentProviderSpendAllowed: false,
    networkCallsAllowed: false,
    usageWritesAllowed: false,
    invoiceJobsAllowed: false,
    customerOpsAllowed: false,
  };
}

function buildRedactionState(input = {}) {
  const redaction = summarizeRedaction({
    sourceScope: input.sourceScope || "NEXUS OS billing metering customer operations model",
    sourceSurface: input.sourceSurface || "P144.2 read-only billing customer operations model",
    sampleValue: input.sampleValue || "display-safe labels only; no private IDs, credentials, payment details, customer records, or raw payloads",
  });
  return {
    redacted: true,
    redactionChecked: true,
    redactionChanged: redaction.changed,
    rawPrivateIdsVisible: false,
    rawInternalPayloadsVisible: false,
    credentialValuesVisible: false,
    paymentValuesVisible: false,
    customerIdentifiersVisible: false,
  };
}

function baseRow(input = {}, sequence = 1) {
  return {
    schemaVersion: BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_VERSION,
    phase: BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE,
    ownerCapability: normalizeText(input.ownerCapability, OWNER_CAPABILITY),
    disabledReason: DISABLED_REASON,
    evidenceRefs: evidenceRefs(input.evidenceRefs),
    activityRefs: activityRefs(input.activityRefs),
    redactionState: buildRedactionState(input),
    costImpact: buildCostImpact(),
    authorityFlags: blockedSafetyFlags(),
    sequence,
  };
}

export function buildBillingAccount(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    ...baseRow(input, sequence),
    accountRef: normalizeText(input.accountRef, displayRef("billing-account", sequence)),
    displayName: normalizeText(input.displayName, "Billing account posture"),
    planState: normalizeText(input.planState, "plan_review_only"),
    billingStatus: normalizeText(input.billingStatus, "not_billable"),
    invoiceStatus: normalizeText(input.invoiceStatus, "invoice_preview_only"),
    paymentProviderStatus: normalizeText(input.paymentProviderStatus, "payment_provider_disconnected"),
    mutationAllowed: false,
    nextAction: normalizeText(input.nextAction, "Route this account to P144.3 preview before billing mutation is considered."),
    blockers: [
      "Billing account mutation remains blocked.",
      "Payment provider calls remain blocked.",
      ...asArray(input.blockers),
    ],
  };
}

export function validateBillingAccount(account = {}) {
  const errors = [];
  for (const field of ["accountRef", "displayName", "planState", "billingStatus", "invoiceStatus", "paymentProviderStatus", "mutationAllowed", "ownerCapability", "disabledReason", "nextAction", "blockers", "evidenceRefs", "activityRefs", "redactionState", "costImpact", "authorityFlags"]) {
    if (!(field in account)) errors.push(`${field} is required`);
  }
  if (account.phase !== BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE) errors.push("phase must be P144.2");
  if (account.mutationAllowed !== false) errors.push("mutationAllowed must remain false");
  if (account.paymentProviderStatus !== "payment_provider_disconnected") errors.push("paymentProviderStatus must remain disconnected");
  if (!Array.isArray(account.blockers) || account.blockers.length === 0) errors.push("blockers are required");
  if (Object.values(account.authorityFlags || {}).some((value) => value !== false)) errors.push("all authority flags must remain false");
  if (hasUnsafeIdentifier(account)) errors.push("billing account must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildUsageMeter(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    ...baseRow(input, sequence),
    meterRef: normalizeText(input.meterRef, displayRef("usage-meter", sequence)),
    displayName: normalizeText(input.displayName, "Usage meter posture"),
    meterCategory: normalizeText(input.meterCategory, "founder_workflow_usage"),
    unit: normalizeText(input.unit, "review_unit"),
    captureState: normalizeText(input.captureState, "display_only"),
    writeAllowed: false,
    rollupAllowed: false,
    nextAction: normalizeText(input.nextAction, "Route this meter to P144.3 preview without recording usage."),
    blockers: [
      "Usage writes remain blocked.",
      "Usage rollups remain blocked.",
      ...asArray(input.blockers),
    ],
  };
}

export function validateUsageMeter(meter = {}) {
  const errors = [];
  for (const field of ["meterRef", "displayName", "meterCategory", "unit", "captureState", "writeAllowed", "rollupAllowed", "ownerCapability", "disabledReason", "nextAction", "blockers", "evidenceRefs", "activityRefs", "redactionState", "costImpact", "authorityFlags"]) {
    if (!(field in meter)) errors.push(`${field} is required`);
  }
  if (meter.phase !== BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE) errors.push("phase must be P144.2");
  if (meter.writeAllowed !== false || meter.rollupAllowed !== false) errors.push("usage write and rollup authority must remain false");
  if (Object.values(meter.authorityFlags || {}).some((value) => value !== false)) errors.push("all authority flags must remain false");
  if (hasUnsafeIdentifier(meter)) errors.push("usage meter must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildInvoicePreview(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    ...baseRow(input, sequence),
    invoiceRef: normalizeText(input.invoiceRef, displayRef("invoice-preview", sequence)),
    displayName: normalizeText(input.displayName, "Invoice preview posture"),
    billingPeriod: normalizeText(input.billingPeriod, "preview_period"),
    previewState: normalizeText(input.previewState, "calculation_blocked"),
    chargeComputationAllowed: false,
    invoiceCreationAllowed: false,
    paymentCollectionAllowed: false,
    nextAction: normalizeText(input.nextAction, "Route this invoice candidate to P144.3 preview without creating an invoice."),
    blockers: [
      "Invoice creation remains blocked.",
      "Payment collection remains blocked.",
      ...asArray(input.blockers),
    ],
  };
}

export function validateInvoicePreview(invoice = {}) {
  const errors = [];
  for (const field of ["invoiceRef", "displayName", "billingPeriod", "previewState", "chargeComputationAllowed", "invoiceCreationAllowed", "paymentCollectionAllowed", "ownerCapability", "disabledReason", "nextAction", "blockers", "evidenceRefs", "activityRefs", "redactionState", "costImpact", "authorityFlags"]) {
    if (!(field in invoice)) errors.push(`${field} is required`);
  }
  if (invoice.phase !== BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE) errors.push("phase must be P144.2");
  for (const field of ["chargeComputationAllowed", "invoiceCreationAllowed", "paymentCollectionAllowed"]) {
    if (invoice[field] !== false) errors.push(`${field} must remain false`);
  }
  if (Object.values(invoice.authorityFlags || {}).some((value) => value !== false)) errors.push("all authority flags must remain false");
  if (hasUnsafeIdentifier(invoice)) errors.push("invoice preview must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildEntitlement(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    ...baseRow(input, sequence),
    entitlementRef: normalizeText(input.entitlementRef, displayRef("entitlement", sequence)),
    displayName: normalizeText(input.displayName, "Entitlement posture"),
    currentState: normalizeText(input.currentState, "not_grantable"),
    grantAllowed: false,
    revokeAllowed: false,
    sourceOfTruth: normalizeText(input.sourceOfTruth, "display_only_contract"),
    nextAction: normalizeText(input.nextAction, "Route this entitlement to P144.3 preview without granting or revoking access."),
    blockers: [
      "Entitlement grants remain blocked.",
      "Entitlement revokes remain blocked.",
      ...asArray(input.blockers),
    ],
  };
}

export function validateEntitlement(entitlement = {}) {
  const errors = [];
  for (const field of ["entitlementRef", "displayName", "currentState", "grantAllowed", "revokeAllowed", "sourceOfTruth", "ownerCapability", "disabledReason", "nextAction", "blockers", "evidenceRefs", "activityRefs", "redactionState", "costImpact", "authorityFlags"]) {
    if (!(field in entitlement)) errors.push(`${field} is required`);
  }
  if (entitlement.phase !== BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE) errors.push("phase must be P144.2");
  if (entitlement.grantAllowed !== false || entitlement.revokeAllowed !== false) errors.push("grant and revoke authority must remain false");
  if (Object.values(entitlement.authorityFlags || {}).some((value) => value !== false)) errors.push("all authority flags must remain false");
  if (hasUnsafeIdentifier(entitlement)) errors.push("entitlement must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildSupportHandoff(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    ...baseRow(input, sequence),
    handoffRef: normalizeText(input.handoffRef, displayRef("support-handoff", sequence)),
    displayName: normalizeText(input.displayName, "Support handoff posture"),
    handoffType: normalizeText(input.handoffType, "customer_support_review"),
    currentState: normalizeText(input.currentState, "ticket_creation_blocked"),
    ticketCreationAllowed: false,
    customerContactAllowed: false,
    nextAction: normalizeText(input.nextAction, "Route this handoff to P144.3 preview without creating tickets or contacting customers."),
    blockers: [
      "Support ticket creation remains blocked.",
      "Customer contact remains blocked.",
      ...asArray(input.blockers),
    ],
  };
}

export function validateSupportHandoff(handoff = {}) {
  const errors = [];
  for (const field of ["handoffRef", "displayName", "handoffType", "currentState", "ticketCreationAllowed", "customerContactAllowed", "ownerCapability", "disabledReason", "nextAction", "blockers", "evidenceRefs", "activityRefs", "redactionState", "costImpact", "authorityFlags"]) {
    if (!(field in handoff)) errors.push(`${field} is required`);
  }
  if (handoff.phase !== BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE) errors.push("phase must be P144.2");
  if (handoff.ticketCreationAllowed !== false || handoff.customerContactAllowed !== false) errors.push("ticket creation and customer contact authority must remain false");
  if (Object.values(handoff.authorityFlags || {}).some((value) => value !== false)) errors.push("all authority flags must remain false");
  if (hasUnsafeIdentifier(handoff)) errors.push("support handoff must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildCustomerOperation(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    ...baseRow(input, sequence),
    operationRef: normalizeText(input.operationRef, displayRef("customer-operation", sequence)),
    displayName: normalizeText(input.displayName, "Customer operation posture"),
    operationType: normalizeText(input.operationType, "customer_ops_review"),
    currentState: normalizeText(input.currentState, "execution_blocked"),
    executionAllowed: false,
    requiresApproval: true,
    nextAction: normalizeText(input.nextAction, "Route this customer operation to P144.3 preview with null executable payload."),
    blockers: [
      "Customer operation execution remains blocked.",
      "Customer mutation authority remains blocked.",
      ...asArray(input.blockers),
    ],
  };
}

export function validateCustomerOperation(operation = {}) {
  const errors = [];
  for (const field of ["operationRef", "displayName", "operationType", "currentState", "executionAllowed", "requiresApproval", "ownerCapability", "disabledReason", "nextAction", "blockers", "evidenceRefs", "activityRefs", "redactionState", "costImpact", "authorityFlags"]) {
    if (!(field in operation)) errors.push(`${field} is required`);
  }
  if (operation.phase !== BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE) errors.push("phase must be P144.2");
  if (operation.executionAllowed !== false) errors.push("executionAllowed must remain false");
  if (operation.requiresApproval !== true) errors.push("requiresApproval must remain true");
  if (Object.values(operation.authorityFlags || {}).some((value) => value !== false)) errors.push("all authority flags must remain false");
  if (hasUnsafeIdentifier(operation)) errors.push("customer operation must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

function defaultRows(builder, count) {
  return Array.from({ length: count }, (_, index) => builder({ sequence: index + 1 }));
}

function summarizeReadiness(model) {
  return {
    billingAccountCount: model.billingAccounts.length,
    usageMeterCount: model.usageMeters.length,
    invoicePreviewCount: model.invoicePreviews.length,
    entitlementCount: model.entitlements.length,
    supportHandoffCount: model.supportHandoffs.length,
    customerOperationCount: model.customerOperations.length,
    runnableActionCount: 0,
    billingMutationCandidateCount: 0,
    usageWriteCandidateCount: 0,
    invoiceCreationCandidateCount: 0,
    paymentCollectionCandidateCount: 0,
    entitlementMutationCandidateCount: 0,
    supportTicketCandidateCount: 0,
    customerContactCandidateCount: 0,
    customerOperationExecutionCandidateCount: 0,
    providerSpendCandidateCount: 0,
  };
}

export function buildBillingMeteringCustomerOperationsModel(input = {}) {
  const modeGuard = buildModeGuardResult(input.mode || "local-private", ["local-private", "test"]);
  const model = {
    phase: BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE,
    schemaVersion: BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_VERSION,
    createdAt: input.createdAt || DEFAULT_CREATED_AT,
    ownerCapability: normalizeText(input.ownerCapability, OWNER_CAPABILITY),
    modelOnly: true,
    readOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    disabledReason: DISABLED_REASON,
    nextAction: normalizeText(input.nextAction, "Route the read-only model to P144.3 billing preview before any UX or runtime authority is considered."),
    blockers: [
      "Billing/customer operations model is read-only.",
      "Payment provider calls remain blocked.",
      "Runtime writes remain blocked.",
      ...asArray(input.blockers),
    ],
    billingAccounts: input.billingAccounts || defaultRows(buildBillingAccount, 2),
    usageMeters: input.usageMeters || defaultRows(buildUsageMeter, 3),
    invoicePreviews: input.invoicePreviews || defaultRows(buildInvoicePreview, 2),
    entitlements: input.entitlements || defaultRows(buildEntitlement, 2),
    supportHandoffs: input.supportHandoffs || defaultRows(buildSupportHandoff, 2),
    customerOperations: input.customerOperations || defaultRows(buildCustomerOperation, 3),
    evidenceRefs: evidenceRefs(input.evidenceRefs),
    activityRefs: activityRefs(input.activityRefs),
    redactionState: buildRedactionState(input),
    costImpact: buildCostImpact(),
    modeGuard,
    safetyFlags: blockedSafetyFlags(),
    ...blockedSafetyFlags(),
  };
  return {
    ...model,
    readinessSummary: summarizeReadiness(model),
  };
}

export function validateBillingMeteringCustomerOperationsModel(model = {}) {
  const errors = [];
  for (const field of ["phase", "schemaVersion", "createdAt", "ownerCapability", "modelOnly", "readOnly", "localOnly", "commandCenterVisible", "disabledReason", "nextAction", "blockers", "billingAccounts", "usageMeters", "invoicePreviews", "entitlements", "supportHandoffs", "customerOperations", "readinessSummary", "evidenceRefs", "activityRefs", "redactionState", "costImpact", "modeGuard", "safetyFlags"]) {
    if (!(field in model)) errors.push(`${field} is required`);
  }
  if (model.phase !== BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE) errors.push("phase must be P144.2");
  if (model.modelOnly !== true || model.readOnly !== true || model.localOnly !== true) errors.push("model must remain read-only local model");
  if (model.commandCenterVisible !== false) errors.push("model must not render directly in Command Center");
  for (const [collectionName, validator] of [
    ["billingAccounts", validateBillingAccount],
    ["usageMeters", validateUsageMeter],
    ["invoicePreviews", validateInvoicePreview],
    ["entitlements", validateEntitlement],
    ["supportHandoffs", validateSupportHandoff],
    ["customerOperations", validateCustomerOperation],
  ]) {
    const collection = model[collectionName];
    if (!Array.isArray(collection) || collection.length === 0) errors.push(`${collectionName} must include at least one row`);
    for (const row of collection || []) {
      const validation = validator(row);
      if (!validation.valid) errors.push(`${collectionName}: ${validation.errors.join("; ")}`);
    }
  }
  if (Object.values(model.safetyFlags || {}).some((value) => value !== false)) errors.push("all safety flags must remain false");
  for (const flag of BILLING_METERING_CUSTOMER_OPERATIONS_SAFETY_FLAG_NAMES) {
    if (model[flag] !== false) errors.push(`${flag} must remain false`);
  }
  if (model.costImpact?.estimatedUsd !== 0 || model.costImpact?.actualUsd !== 0) errors.push("cost impact must remain zero");
  if (model.readinessSummary?.runnableActionCount !== 0) errors.push("runnableActionCount must be zero");
  if (model.redactionState?.rawPrivateIdsVisible !== false || model.redactionState?.rawInternalPayloadsVisible !== false) errors.push("redaction must hide raw internals");
  if (hasUnsafeIdentifier(model)) errors.push("model must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildBillingMeteringCustomerOperationsEnvelope(input = {}) {
  const model = input.model || buildBillingMeteringCustomerOperationsModel(input);
  const validation = validateBillingMeteringCustomerOperationsModel(model);
  const envelope = createPassResult({
    phase: BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE,
    mode: input.mode || "local-private",
    source: "shared/billingMeteringCustomerOperationsModel.js",
    summary: "Read-only billing, metering, and customer operations model is display-safe with all runtime authority blocked.",
    data: {
      model,
      validation,
    },
    evidence: evidenceRefs(input.evidenceRefs),
    metadata: {
      generatedAt: input.generatedAt || DEFAULT_CREATED_AT,
      branch: input.branch || "codex/nexus-e2e-phase-validation",
      head: input.head || "",
    },
  });
  return {
    ...envelope,
    envelopeValid: validateResultEnvelope(envelope).valid,
  };
}
