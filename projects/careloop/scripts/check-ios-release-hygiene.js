import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), "..");
const repoRoot = path.resolve(projectRoot, "..", "..");
const iosRoot = path.join(repoRoot, "projects", "careloop-ios");

const files = {
  pbxproj: path.join(iosRoot, "CareLoop.xcodeproj", "project.pbxproj"),
  app: path.join(iosRoot, "CareLoop", "App", "CareLoopApp.swift"),
  uiTestScenario: path.join(iosRoot, "CareLoop", "App", "UITestScenario.swift"),
  demoLaunch: path.join(iosRoot, "CareLoop", "App", "DemoLaunchSession.swift"),
  infoPlist: path.join(iosRoot, "CareLoop", "Resources", "Info.plist"),
  storeKit: path.join(iosRoot, "CareLoop", "Configuration", "CareLoop.storekit"),
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, fs.readFileSync(file, "utf8")]),
);

const failures = [];
const warnings = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function warn(condition, message) {
  if (!condition) warnings.push(message);
}

check(source.pbxproj.includes("UITestScenario.swift in Sources"), "Xcode target membership audit must see UITestScenario.swift in the app target");
check(source.pbxproj.includes("DemoLaunchSession.swift in Sources"), "Xcode target membership audit must see DemoLaunchSession.swift in the app target");
check(source.uiTestScenario.includes("#if DEBUG\nextension AppState"), "UITestScenario AppState fixture initializer must be DEBUG-gated");
check(source.uiTestScenario.includes("#if DEBUG\nprivate struct UITestScenarioFixture"), "UITestScenario fixture data must be DEBUG-gated");
check(source.uiTestScenario.includes("#else\n        nil\n        #endif"), "UITestScenario.current must be inert outside DEBUG");
check(source.demoLaunch.includes("#if DEBUG"), "DemoLaunchSession.current must be DEBUG-gated");
check(source.demoLaunch.includes("#else\n        nil\n        #endif"), "DemoLaunchSession.current must return nil outside DEBUG");
check(source.app.includes("#if DEBUG\n        if let scenario = UITestScenario.current"), "CareLoopApp must only activate UI-test scenarios in DEBUG");
check(source.app.includes("if let launchSession = DemoLaunchSession.current"), "CareLoopApp must keep demo launch session path explicit");
check(source.app.includes("#endif\n        _appState = StateObject(wrappedValue: AppState())"), "CareLoopApp must fall back to production AppState outside DEBUG");
check(!/organizer@careloop\.test|caregiver@careloop\.test|mom@careloop\.test/.test(source.app), "CareLoopApp must not contain fixture accounts");
check(!/CARELOOP_DEMO_ACCESS_TOKEN/.test(source.app), "CareLoopApp must not directly read demo tokens");
check(!/careloop-ui-scenario/.test(source.app), "CareLoopApp must not directly parse UI-test scenario arguments");

warn(!source.infoPlist.includes("http://localhost:3000"), "Info.plist still uses localhost API_BASE_URL; H4 must replace this with production configuration before release");
warn(source.storeKit.includes("careloop-local-storekit"), "Local StoreKit fixture exists; H3 archive inspection must prove it is not bundled into Release");

if (failures.length || warnings.length) {
  if (failures.length) {
    console.error("CareLoop iOS release hygiene check failed:");
    for (const failure of failures) console.error(`- ${failure}`);
  }
  if (warnings.length) {
    console.error("CareLoop iOS release hygiene warnings:");
    for (const warning of warnings) console.error(`- ${warning}`);
  }
}

if (failures.length) process.exit(1);
console.log("CareLoop iOS release hygiene check passed.");
