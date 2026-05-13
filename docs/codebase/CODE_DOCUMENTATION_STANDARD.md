# Code Documentation Standard

Every new module or major script should document the following:

## Purpose

What the module is for and what boundary it belongs to.

## Public Exports

List the functions, classes, or values intended for reuse.

## Input / Output Shape

Document the most important inputs and outputs, especially for scripts, bridges, adapters, and state helpers.

## Safety Boundary

Explain what the module must not do:

- provider calls
- DB writes
- project mutation
- private-project leakage

## Related Modules

Link directly to adjacent modules or the main architecture note.

## Tests / Checkers

List the test or checker that validates the module.

## Usage Example

If practical, provide a short usage example or command.

## Known Limitations

Call out disabled features, local-only constraints, or follow-on phases.
