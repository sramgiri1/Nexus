import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";
import {
  createAgentDefinitionProposal,
  validateAgentDefinitionProposal,
} from "./agentDefinitionProposal.js";

const DEFAULT_STORE_PATH = "reports/agent-definition-proposals.json";

function fullPath(path, root = process.cwd()) {
  return join(root, path || DEFAULT_STORE_PATH);
}

export function readProposalStore(options = {}) {
  const path = fullPath(options.storePath, options.root);
  if (!existsSync(path)) {
    return {
      storeVersion: "1.0",
      mutationAllowed: false,
      proposals: [],
    };
  }

  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeProposalStore(store = {}, options = {}) {
  const path = fullPath(options.storePath, options.root);
  mkdirSync(dirname(path), { recursive: true });
  const safeStore = {
    storeVersion: store.storeVersion || "1.0",
    mutationAllowed: false,
    proposals: Array.isArray(store.proposals) ? store.proposals : [],
    updatedAt: options.updatedAt || new Date().toISOString(),
  };
  writeFileSync(path, `${JSON.stringify(safeStore, null, 2)}\n`, "utf8");
  return safeStore;
}

export function addProposalToStore(input = {}, options = {}) {
  const store = readProposalStore(options);
  const proposal = input.proposalId ? input : createAgentDefinitionProposal(input, options);
  const validation = validateAgentDefinitionProposal(proposal);
  if (!validation.ok && options.strict !== false) {
    return { ok: false, proposal, validation, store };
  }
  const nextStore = {
    ...store,
    proposals: [...(store.proposals || []).filter((item) => item.proposalId !== proposal.proposalId), proposal],
  };
  if (options.write !== false) writeProposalStore(nextStore, options);
  return { ok: validation.ok, proposal, validation, store: nextStore };
}

export function listProposals(options = {}) {
  return readProposalStore(options).proposals || [];
}
