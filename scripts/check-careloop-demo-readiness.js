import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const seedPath = path.join(root, "projects", "careloop", "scripts", "seed-demo-showcase.js");
const storeKitPath = path.join(root, "projects", "careloop-ios", "CareLoop", "Configuration", "CareLoop.storekit");
const subscriptionManagerPath = path.join(root, "projects", "careloop-ios", "CareLoop", "App", "SubscriptionManager.swift");

const seed = fs.readFileSync(seedPath, "utf8");
const subscriptionManager = fs.readFileSync(subscriptionManagerPath, "utf8");
const storeKit = JSON.parse(fs.readFileSync(storeKitPath, "utf8"));

const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

check(packageJson.scripts?.["careloop:demo"] === "node scripts/careloop-demo-room-setup.js", "package.json must expose npm run careloop:demo");
check(packageJson.scripts?.["careloop:demo:room"] === "node scripts/careloop-demo-room-setup.js", "package.json must expose npm run careloop:demo:room");

for (const scenario of ["aging-parent", "post-surgery", "new-parent", "memory-care"]) {
  check(seed.includes(`key: "${scenario}"`), `demo seed missing ${scenario} scenario`);
}

check(seed.includes("premiumRequests:"), "demo seed must include a request-pending premium moment");
check(seed.includes("expiresAtHoursFromNow: -"), "demo seed must include an expired premium entitlement");
check(seed.includes("com.careloop.ios.premium.monthly"), "demo seed must include monthly premium product id");
check(seed.includes("com.careloop.ios.premium.yearly"), "demo seed must include yearly premium product id");

const subscriptions = (storeKit.subscriptionGroups ?? []).flatMap((group) => group.subscriptions ?? []);
const productIds = subscriptions.map((subscription) => subscription.productID);
const monthlyID = subscriptionManager.match(/static let monthlyID\s*=\s*"([^"]+)"/)?.[1];
const yearlyID = subscriptionManager.match(/static let yearlyID\s*=\s*"([^"]+)"/)?.[1];

check(monthlyID === "com.careloop.ios.premium.monthly", "SubscriptionManager monthly product id changed unexpectedly");
check(yearlyID === "com.careloop.ios.premium.yearly", "SubscriptionManager yearly product id changed unexpectedly");
check(productIds.includes(monthlyID), "StoreKit config missing monthly product id");
check(productIds.includes(yearlyID), "StoreKit config missing yearly product id");
check(subscriptions.find((item) => item.productID === monthlyID)?.recurringSubscriptionPeriod === "P1M", "StoreKit monthly product must recur monthly");
check(subscriptions.find((item) => item.productID === yearlyID)?.recurringSubscriptionPeriod === "P1Y", "StoreKit yearly product must recur yearly");

if (failures.length > 0) {
  console.error("CareLoop demo readiness check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("CareLoop demo readiness check passed.");
