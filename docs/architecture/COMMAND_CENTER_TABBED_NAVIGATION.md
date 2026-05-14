# Command Center Tabbed Navigation

## Purpose

P41.7.3A starts the tabbed UX foundation for Command Center. Mission Control has become dense enough that a single long cockpit page is no longer the right default once NEXUS tracks missions, tasks, agents, gates, evidence, risk, cost, projects, and OS status.

This phase introduces reusable tab components and a scope shell without changing backend behavior.

## Overview and Drilldown Tabs

The Mission Control `Overview` tab keeps the current cockpit summary, next action, system status, KPIs, execution pipeline, and activity stream.

Drilldown tabs expose focused surfaces for:
- Workflows
- Tasks
- Agents
- Gates
- Evidence
- Risks / Approvals
- Cost

Some drilldowns use existing panels now. Others show honest empty or planned states until P41.7.3B refines the content.

## Scope Switcher Model

The scope shell prepares Command Center for three scopes:
- Portfolio: planned for Project Registry in P42.
- Project: current local-private project context.
- NEXUS OS: platform roadmap and OS status context.

The shell is UI-only in P41.7.3A. It does not implement Project Registry, project switching, backend writes, or runtime execution.

## Project Switcher Shell

The project switcher shows:
- Active Project: Private Project in local-private mode.
- Scope: Project, Portfolio, or NEXUS OS.
- Mode: local-private.

Multiple live projects are not fabricated. Portfolio mode shows a Project Registry planned placeholder.

## DemoApp Boundary

DemoApp may appear only in demo route or demo mode fixtures. Local-private Command Center primary pages must show `Private Project`, not DemoApp.

## Accessibility Requirements

Tabs use button elements with `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, and `role="tabpanel"`. Disabled tabs must expose a clear disabled reason. Keyboard focus and arrow navigation must remain visible.

## Theme Requirements

The tab system uses existing Command Center CSS variables and must render in System, Dark, and Light themes. No tab state should rely on hardcoded colors.

## Future Rollout

P41.7.3B refines Mission Control tab content. Later P41.7.3C and P41.7.3D phases roll tabs across Workspace, Task Queue, Agent Workbench, Implementation, Live API, Durable State, Evidence, Safety, Projects, and OS Roadmap.
