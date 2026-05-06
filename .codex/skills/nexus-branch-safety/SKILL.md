# nexus-branch-safety

## Name

NEXUS Branch Safety

## Description

Protect the repository from edits on `main`, dirty-tree work, and unsafe branch handling before any implementation begins.

## When to Use

Use at the start of any NEXUS phase, bug fix, review, or documentation pass before reading or editing scoped files.

## Steps

1. Run `git fetch origin`.
2. Run `git branch --show-current`.
3. Run `git status --short`.
4. Run `git rev-parse --short HEAD`.
5. Stop immediately if the current branch is `main`.
6. Stop immediately if the working tree is dirty.
7. Create or verify the intended feature branch for the phase.
8. Show the current commit so the user can see the starting point.

## Safety Checks

- Confirm branch is not `main`.
- Confirm `git status --short` is empty before any edits.
- Confirm the branch name matches the phase or requested scope.
- Confirm no files are edited before these checks complete.

## Allowed Outputs

- Current branch
- Current short commit hash
- Clean/dirty tree status
- Stop message when safety preconditions fail
- Branch creation or branch verification confirmation

## Forbidden Actions

- Editing files before branch and status checks
- Committing from `main`
- Pushing to `main`
- Continuing with a dirty working tree
