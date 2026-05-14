# NEXUS Codebase Docs

This folder is the maintainer-facing map for how the NEXUS repo is structured.
Use it when you need to understand which module family already owns a concern,
which files are the public entry points, and which safety boundaries apply
before changing or extending the code.

## Who should use this

- contributors adding or changing NEXUS modules
- maintainers reviewing architecture drift
- coding agents that need to reuse existing modules safely
- operators reading checker and report outputs to find the right code surface

## Core references

- [Code Documentation Standard](CODE_DOCUMENTATION_STANDARD.md)
- [Module Registry](MODULE_REGISTRY.md)
- [Phase Module Index](PHASE_MODULE_INDEX.md)

## How future phases should update this folder

- Update the module registry whenever a new module family, folder, or major
  entry point is introduced.
- Update the phase module index whenever a phase adds or materially changes a
  module family.
- Update the documentation standard when the required module metadata contract
  changes.
- Keep links local, accurate, and public-safe.

## How these docs differ from other docs folders

- `docs/codebase`
  Explains repo structure, module ownership, reuse boundaries, and checker
  relationships.
- `docs/usage`
  Explains how an operator or contributor runs and uses NEXUS surfaces.
- `docs/architecture`
  Explains platform intent, roadmap direction, and higher-level system
  boundaries.
- `reports`
  Stores generated validation artifacts, QA snapshots, and status outputs.
