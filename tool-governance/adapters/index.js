import * as gitAdapter from "./gitAdapter.js";
import * as testRunnerAdapter from "./testRunnerAdapter.js";
import * as filesystemBoundaryAdapter from "./filesystemBoundaryAdapter.js";
import * as playwrightAdapter from "./playwrightAdapter.js";

export const TOOL_ADAPTER_PREVIEWS = Object.freeze({
  git: gitAdapter,
  testRunner: testRunnerAdapter,
  filesystemBoundary: filesystemBoundaryAdapter,
  playwright: playwrightAdapter,
});

export function listToolAdapterPreviews() {
  return Object.values(TOOL_ADAPTER_PREVIEWS).map((adapter) => adapter.describeAdapter());
}
