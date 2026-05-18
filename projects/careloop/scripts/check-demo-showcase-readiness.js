import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), "..");
const repoRoot = path.resolve(projectRoot, "..", "..");

const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
const seedPath = path.join(projectRoot, "scripts", "seed-demo-showcase.js");
const launcherPath = path.join(repoRoot, "scripts", "careloop-demo-room-setup.js");
const storeKitPath = path.join(repoRoot, "projects", "careloop-ios", "CareLoop", "Configuration", "CareLoop.storekit");
const subscriptionManagerPath = path.join(repoRoot, "projects", "careloop-ios", "CareLoop", "App", "SubscriptionManager.swift");

const seed = fs.readFileSync(seedPath, "utf8");
const launcher = fs.readFileSync(launcherPath, "utf8");
const storeKit = JSON.parse(fs.readFileSync(storeKitPath, "utf8"));
const subscriptionManager = fs.readFileSync(subscriptionManagerPath, "utf8");

const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function countMatches(pattern) {
  return [...seed.matchAll(pattern)].length;
}

const scenarios = [
  ["aging-parent", "Aging parent support"],
  ["post-surgery", "Post-surgery recovery"],
  ["new-parent", "Postpartum and newborn support"],
  ["memory-care", "Memory care and home safety"],
];

check(packageJson.scripts?.["careloop:demo"] === "node ../../scripts/careloop-demo-room-setup.js", "package.json must expose npm run careloop:demo from projects/careloop");
check(packageJson.scripts?.["qa:seed:showcase"] === "node scripts/seed-demo-showcase.js", "package.json must expose qa:seed:showcase");
check(packageJson.scripts?.["check:demo-showcase"] === "node scripts/check-demo-showcase-readiness.js", "package.json must expose check:demo-showcase");
check(packageJson.scripts?.["check:careloop-demo-readiness"] === "node scripts/check-demo-showcase-readiness.js", "package.json must expose check:careloop-demo-readiness");
check(fs.existsSync(launcherPath), "one-command launcher script must exist");
check(launcher.includes("selectSimulatorDevices(profiles.length)"), "launcher must open one simulator per launch profile");
check(launcher.includes("CARELOOP_DEMO_FORCE_BUILD"), "launcher must support force rebuild for fresh demo installs");
check(launcher.includes("refreshManifestTokens"), "launcher must refresh demo tokens after seeding");

for (const [key, useCase] of scenarios) {
  check(seed.includes(`key: "${key}"`), `demo seed missing scenario ${key}`);
  check(seed.includes(`useCase: "${useCase}"`), `demo seed missing use case label ${useCase}`);
}

check(countMatches(/accessTo:\s*\[/g) >= 8, "demo seed must grant caregiver receiver access across scenarios");
check(countMatches(/pendingInvites:\s*\[/g) >= 4, "demo seed must include pending invites across scenarios");
check(countMatches(/status:\s*"PENDING"/g) >= 8, "demo seed must include pending tasks");
check(countMatches(/status:\s*"IN_PROGRESS"/g) >= 3, "demo seed must include in-progress tasks");
check(countMatches(/status:\s*"DONE"/g) >= 4, "demo seed must include completed task history");
check(countMatches(/status:\s*"SKIPPED"/g) >= 2, "demo seed must include skipped task history");
check(countMatches(/status:\s*"ESCALATED"/g) >= 2, "demo seed must include escalated reminders");
check(countMatches(/status:\s*"SNOOZED"/g) >= 2, "demo seed must include snoozed reminders");
check(countMatches(/comments:\s*\[/g) >= 8, "demo seed must include task history comments");
check(seed.includes("premiumRequests:"), "demo seed must include premium upgrade request moments");
check(seed.includes("expiresAtHoursFromNow: -"), "demo seed must include expired premium state");
check(seed.includes('source: "MANUAL"'), "demo seed must include non-App-Store/manual premium state for demo flexibility");
check(seed.includes("com.careloop.ios.premium.monthly"), "demo seed must include monthly premium product id");
check(seed.includes("com.careloop.ios.premium.yearly"), "demo seed must include yearly premium product id");
check(!/demo\.[^"@\s]+@(gmail|yahoo|outlook|hotmail|icloud)\.com/i.test(seed), "demo seed must not use real consumer email domains");

const launchProfileKeys = [
  "aging-organizer",
  "recovery-recipient",
  "new-parent-caregiver",
  "memory-caregiver",
];
for (const key of launchProfileKeys) {
  check(seed.includes(`key: "${key}"`), `manifest missing launch profile ${key}`);
}
check(seed.includes('userKey: "organizer"'), "launch profiles must include organizer persona");
check(seed.includes('userKey: "recoveryRecipient"'), "launch profiles must include care receiver persona");
check(seed.includes('userKey: "newParentCaregiver"') && seed.includes('userKey: "memoryCaregiver"'), "launch profiles must include caregiver personas");

const subscriptions = (storeKit.subscriptionGroups ?? []).flatMap((group) => group.subscriptions ?? []);
const productIds = subscriptions.map((subscription) => subscription.productID);
const monthlyID = subscriptionManager.match(/static let monthlyID\s*=\s*"([^"]+)"/)?.[1];
const yearlyID = subscriptionManager.match(/static let yearlyID\s*=\s*"([^"]+)"/)?.[1];

check(productIds.includes(monthlyID), "StoreKit config missing monthly product id from SubscriptionManager");
check(productIds.includes(yearlyID), "StoreKit config missing yearly product id from SubscriptionManager");
check(subscriptions.find((item) => item.productID === monthlyID)?.recurringSubscriptionPeriod === "P1M", "monthly StoreKit product must recur monthly");
check(subscriptions.find((item) => item.productID === yearlyID)?.recurringSubscriptionPeriod === "P1Y", "yearly StoreKit product must recur yearly");

if (failures.length) {
  console.error("CareLoop demo showcase readiness failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("CareLoop demo showcase readiness passed.");
