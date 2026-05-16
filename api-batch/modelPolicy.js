export const MODEL_POLICIES = {
  unset: {
    modelPolicy: "unset",
    label: "Unset",
    pricingKnown: false,
    inputUsdPer1k: null,
    outputUsdPer1k: null,
  },
  low_cost: {
    modelPolicy: "low_cost",
    label: "Low Cost",
    pricingKnown: true,
    inputUsdPer1k: 0.00015,
    outputUsdPer1k: 0.0006,
  },
  balanced: {
    modelPolicy: "balanced",
    label: "Balanced",
    pricingKnown: true,
    inputUsdPer1k: 0.005,
    outputUsdPer1k: 0.015,
  },
  high_quality: {
    modelPolicy: "high_quality",
    label: "High Quality",
    pricingKnown: false,
    inputUsdPer1k: null,
    outputUsdPer1k: null,
  },
};

export function getModelPolicy(modelPolicy = "unset") {
  return MODEL_POLICIES[modelPolicy] || MODEL_POLICIES.unset;
}
