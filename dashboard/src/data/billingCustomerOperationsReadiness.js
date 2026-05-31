import { buildBillingMeteringCustomerOperationsPreview } from "../../../shared/billingMeteringCustomerOperationsPreview.js";

export const BILLING_CUSTOMER_OPERATIONS_READINESS_PHASE = "P144.4";
export const BILLING_CUSTOMER_OPERATIONS_READINESS_VERSION = "1.0";

const DEFAULT_PREVIEW = buildBillingMeteringCustomerOperationsPreview();

const TYPE_LABELS = {
  billing_account: "Billing Account",
  usage_meter: "Usage Meter",
  invoice_preview: "Invoice Preview",
  entitlement: "Entitlement",
  support_handoff: "Support Handoff",
  customer_operation: "Customer Operation",
};

const TYPE_NEXT_ACTIONS = {
  billing_account: "Review account posture before any future billing authority is considered.",
  usage_meter: "Review usage posture while usage writes and rollups stay blocked.",
  invoice_preview: "Review invoice posture while invoice creation and payment collection stay blocked.",
  entitlement: "Review entitlement posture while grants and revokes stay blocked.",
  support_handoff: "Review support posture while ticket creation and customer contact stay blocked.",
  customer_operation: "Review customer operation posture while execution and customer contact stay blocked.",
};

function displayState(value = "") {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

function displayText(value = "") {
  return String(value || "")
    .replace(/P\d+(?:\.\d+)?/g, "the governed billing review")
    .replace(/\braw JSON\b/gi, "internal data")
    .replace(/\braw logs?\b/gi, "internal logs")
    .replace(/\braw policy dumps?\b/gi, "policy details")
    .replace(/\s+/g, " ")
    .trim();
}

function buildDisplayRows(preview = DEFAULT_PREVIEW) {
  return (preview.previewRows || []).map((row, index) => ({
    rowKey: `billing-customer-display-row-${index + 1}`,
    type: TYPE_LABELS[row.sourceType] || displayState(row.sourceType || "Customer Review"),
    label: displayText(row.displayName || "Customer operation posture"),
    currentState: displayState(row.currentState || "Display only"),
    nextAction: TYPE_NEXT_ACTIONS[row.sourceType] || "Review the display-only row before any future authority is considered.",
    blocker: displayText((row.blockers || [])[0] || row.disabledReason || "Billing and customer authority remains blocked."),
    disabledReason: "Display-only customer operations review; billing, payment, support, customer contact, execution, provider calls, DB writes, network calls, and spend remain blocked.",
    ownerCapability: row.ownerCapability || preview.ownerCapability || "NEXUS Billing Customer Operations Guard",
    evidenceLocation: "Billing customer operations report",
    activityLocation: "OS phase status report",
    costImpact: "$0.00 estimated and actual; no provider or payment-provider spend.",
  }));
}

function buildStatusCards(preview = DEFAULT_PREVIEW) {
  const summary = preview.readinessSummary || {};
  return [
    {
      label: "Preview rows",
      value: `${summary.rowCount || 0}`,
      tone: "teal",
      detail: "Billing, usage, invoice, entitlement, support, and customer operation rows are visible for review.",
    },
    {
      label: "Blocked rows",
      value: `${summary.blockedRowCount || 0}`,
      tone: "amber",
      detail: "Every row remains display-only; no billing or customer operation can run.",
    },
    {
      label: "Runnable actions",
      value: `${summary.runnableActionCount || 0}`,
      tone: "green",
      detail: "Execution, provider calls, DB writes, payment collection, and customer contact stay blocked.",
    },
    {
      label: "Cost impact",
      value: "$0.00",
      tone: "green",
      detail: "No provider spend, payment-provider spend, or network calls.",
    },
  ];
}

function buildSectionRows(preview = DEFAULT_PREVIEW) {
  return (preview.previewSections || []).map((section) => ({
    label: displayText(section.label),
    rowCount: section.rowCount || 0,
    blockedCount: section.blockedCount || 0,
    nextAction: displayText(section.nextAction),
  }));
}

function buildSafetyRows(preview = DEFAULT_PREVIEW) {
  return [
    { label: "Billing account mutation", value: preview.billingAccountMutationAllowed ? "Enabled" : "Blocked" },
    { label: "Usage writes and rollups", value: preview.usageWriteAllowed || preview.usageRollupAllowed ? "Enabled" : "Blocked" },
    { label: "Invoice creation", value: preview.invoiceCreationAllowed ? "Enabled" : "Blocked" },
    { label: "Payment collection", value: preview.paymentCollectionAllowed ? "Enabled" : "Blocked" },
    { label: "Entitlement changes", value: preview.entitlementMutationAllowed ? "Enabled" : "Blocked" },
    { label: "Support tickets", value: preview.supportTicketCreationAllowed ? "Enabled" : "Blocked" },
    { label: "Customer contact", value: preview.customerContactAllowed ? "Enabled" : "Blocked" },
    { label: "Customer operation execution", value: preview.customerOperationExecutionAllowed ? "Enabled" : "Blocked" },
    { label: "DB/runtime writes", value: preview.dbRuntimeWriteAllowed ? "Enabled" : "Blocked" },
    { label: "Provider, network, and spend", value: preview.providerModelCallAllowed || preview.networkCallAllowed || preview.providerSpendAllowed ? "Enabled" : "Blocked" },
  ];
}

export function buildBillingCustomerOperationsReadinessViewModel(input = {}) {
  const preview = input.preview || DEFAULT_PREVIEW;
  const previewRows = buildDisplayRows(preview);
  const rowCount = previewRows.length;
  const blockedRowCount = (preview.readinessSummary || {}).blockedRowCount || rowCount;

  return {
    phase: BILLING_CUSTOMER_OPERATIONS_READINESS_PHASE,
    version: BILLING_CUSTOMER_OPERATIONS_READINESS_VERSION,
    routeId: "billing-customer-operations-readiness",
    currentState: "Display-only customer operations review is ready.",
    whatChanged: "Billing, metering, invoice, entitlement, support, and customer operation previews are visible in Cost Center.",
    nextAction: "Review blocked customer-operation rows before any future billing or customer authority is admitted.",
    blocker: "Billing mutation, usage writes, invoice creation, payment collection, support tickets, customer contact, execution, DB writes, provider calls, network calls, and spend remain blocked.",
    disabledReason: "Customer operations are readable in Command Center only; no billing, payment, support, customer contact, runtime, provider, network, or spend authority is enabled.",
    ownerCapability: preview.ownerCapability || "NEXUS Billing Customer Operations Guard",
    evidenceLocation: "Billing customer operations report",
    activityLocation: "OS phase status report",
    costImpact: "$0.00 estimated and actual; no provider or payment-provider spend.",
    previewOnly: true,
    readOnly: true,
    localOnly: true,
    commandCenterVisible: true,
    rawPayloadVisible: false,
    rawPrivateIdsVisible: false,
    rawInternalPayloadsVisible: false,
    rowCount,
    blockedRowCount,
    runnableActionCount: 0,
    statusCards: buildStatusCards(preview),
    sectionRows: buildSectionRows(preview),
    previewRows,
    safetyRows: buildSafetyRows(preview),
    blockedActions: [
      "Billing account mutation",
      "Usage writes and rollups",
      "Invoice creation",
      "Payment collection",
      "Subscription mutation",
      "Entitlement grants and revokes",
      "Support ticket creation",
      "Customer contact",
      "Customer operation execution",
      "DB/runtime writes",
      "Provider/model calls",
      "Payment-provider calls",
      "Tool execution",
      "Agent dispatch",
      "Project mutation",
      "Deploy, release, export, or package actions",
      "Network calls",
      "Provider spend",
    ],
    themeRequirement: "Uses existing Command Center cards, tabs, safety rows, and summary rows; dark, light, and system themes inherit the current route shell.",
  };
}

export const billingCustomerOperationsReadinessViewModel =
  buildBillingCustomerOperationsReadinessViewModel();
