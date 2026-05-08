import process from "node:process";
import { getNexusMode } from "../private-mode/privateMode.js";
import { runMissionComposer, createMissionInput } from "../mission-composer/index.js";

const args = process.argv.slice(2);
const missionIdx = args.indexOf("--mission");
const missionText = missionIdx >= 0 ? args[missionIdx + 1] : null;

const defaultMission =
  "Build the private project through governed planning, validation, privacy review, and controlled implementation.";

async function main() {
  const mode = process.env.NEXUS_MODE || "demo";
  if (!["local-private", "test"].includes(mode)) {
    console.error(`NEXUS_MODE must be local-private or test. Got: ${mode}`);
    process.exit(1);
  }
  const input = createMissionInput({
    mode,
    projectId: "private-project-01",
    projectLabel: "Private Project",
    missionText: missionText || defaultMission,
    requestedBy: { userId: "local-operator", role: "founder", authType: "local" },
    constraints: {
      mutationAllowed: false,
      providerCallsAllowed: false,
      networkCallsAllowed: false,
      dbAccessAllowed: false,
      buildExecutionAllowed: false,
      testExecutionAllowed: false,
    },
  });
  const result = await runMissionComposer(input);

  console.log("NEXUS Mission Composer");
  console.log("======================");
  console.log("");
  console.log(`Mode: ${mode}`);
  console.log(`Project: ${input.projectLabel}`);
  console.log("Source: Command Center mission composer");
  console.log("Planner: SHEPHERD");
  console.log("");
  console.log("Mission:");
  console.log(input.missionText);
  console.log("");
  console.log("Generated:");
  console.log("- Mission contract");
  console.log("- Initial task plan");
  console.log("- Local task records");
  console.log("- Evidence");
  console.log("- Audit");
  console.log("- Runtime event");
  console.log("");
  console.log("Safety:");
  console.log("- Provider calls: disabled");
  console.log("- Network: disabled");
  console.log("- DB/API: disabled");
  console.log("- Project mutation: disabled");
  console.log("- Build/test execution: disabled");
  console.log("");
  console.log("Next recommended action:");
  console.log("Create governed project brief from mission composer");

  if (result.errors && result.errors.length) {
    console.error("Errors:", result.errors);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
