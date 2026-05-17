export const RECEIVER_ENTITLEMENT_STATUS = Object.freeze({
  FREE: "FREE",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
});

export function isReceiverPremium(entitlement, now = new Date()) {
  if (!entitlement || entitlement.status !== RECEIVER_ENTITLEMENT_STATUS.ACTIVE) {
    return false;
  }
  if (!entitlement.expiresAt) return true;
  return new Date(entitlement.expiresAt) > now;
}

export function receiverEntitlementCapabilities(entitlement, now = new Date()) {
  const premium = isReceiverPremium(entitlement, now);
  return {
    hasPremium: premium,
    canUseAdvancedReminders: premium,
    canUseInsights: premium,
    canUseUnlimitedCaregivers: premium,
    canUseAdvancedCoordination: premium,
  };
}
