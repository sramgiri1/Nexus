# NEXUS Command Center PRD

## Product
NEXUS Command Center

## Purpose
NEXUS Command Center is the founder-facing and investor-facing operating surface for the NEXUS venture studio.

It is not a generic admin panel. It is a live operating system that:
- shows the current state of the agent network
- lets the founder interrogate NEXUS directly
- visualizes how specialized agents coordinate across teams
- exposes execution tools and skill runs
- turns portfolio progress into a clear investor narrative

The product goal is to make a small, agent-driven studio look disciplined, legible, and high-output.

## Primary Users
- Founder
- Investor
- Advisor or operator reviewing execution quality

## Product Thesis
Most internal dashboards are passive status walls. This one should feel like a live intelligence surface.

The system should communicate:
- there is a real operating model
- work is being routed intentionally
- blockers, recoveries, and decisions are visible
- the founder has leverage because agents are specialized and coordinated

The design target is “Jarvis-grade mission control,” not startup boilerplate.

## Design Principles
- Dark, high-contrast HUD aesthetic across every route
- One shared visual language across Home, AI Verse, Skills, and Traction
- Minimal filler copy; every panel should justify its space
- Live data first; decorative visuals second
- Clear hierarchy for founder use and quick investor scanning
- Motion and voice should support meaning, not become gimmicks

## Information Architecture

### 1. Home (`/`)
Purpose: live operating console for the founder.

The home route must contain:
- left rail: full live network list of agents with status, role, current task context, and progress
- center surface: NEXUS command deck and chat console
- example commands for founder prompting
- mission and execution panels below the main console

Requirements:
- the rightmost shell rail is removed on Home
- the agent rail must show all current agents in page flow
- the chat surface must be the dominant content block
- the page must support voice input for commands to NEXUS
- the visual tone must match the rest of the dashboard

Home support modules:
- Mission Signal
- Founder Queue
- Execution Ledger

### 2. AI Verse (`/constellation`)
Purpose: show the structure of the agent operating system.

The AI Verse route must contain:
- centered constellation stage
- NEXUS as the command sun
- six team planes around the sun
- agents visually attached to their team planes
- clean connector lines from NEXUS to each team

Interaction requirements:
- clicking a team or agent opens its explanation in a dedicated dock below the constellation
- the explanation dock must never cover the constellation stage
- clicking away closes the dock
- the selected item speaks its explanation aloud
- speech must stop immediately when selection clears or changes

Voice behavior:
- voice must be role-aware
- some roles should use a calming male voice
- some roles should use a calming female voice
- the implementation should pick the best available browser system voice matching the role profile

### 3. Skills (`/skills`)
Purpose: execution console for skills and skill bundles.

The route must show:
- skill cards
- grouped stacks or bundles
- ability to run skills from the dashboard
- recent session ledger

Requirements:
- skills are visibly distinct from the founder chat route
- execution state should be legible without opening dev tools

### 4. Traction (`/traction`)
Purpose: investor room and business-model surface.

The route must show:
- traction score
- portfolio signal
- editable business assumptions or model framing
- progress context for the currently active venture

Requirements:
- must read credibly to an external investor
- should feel calmer and more analytical than the other routes

## Live Data Sources
The dashboard is memory-backed and must render live state from:
- `memory/portfolio.json`
- `memory/agent-status.json`
- `memory/founder-actions.json`
- `memory/task-queue.json`

The Home route also uses:
- NEXUS chat API for the console

The Skills route also uses:
- `/api/skill`

The voice layer may use:
- browser speech recognition for Home voice commands
- browser speech synthesis for AI Verse node narration

## Core Functional Requirements

### Agent Network
- Show all agents currently in studio memory
- Show agent name, role, current task, status, and progress
- Status ordering should prioritize blocked and active work over done or idle work

### NEXUS Console
- Founder can type directly to NEXUS
- Founder can use voice input
- Example prompts must be visible
- Responses must scroll naturally in the thread

### AI Verse Interaction
- The stage must remain readable at common laptop and desktop sizes
- Team and agent nodes must not overlap
- The explanation panel must be outside the stage
- Node speech must not restart in an infinite loop on rerender

### Cross-Route Consistency
- All four routes must share the same font system
- All four routes must share one palette and surface language
- Route-specific layouts may differ, but they must feel like one product

## Non-Functional Requirements
- Routes must build cleanly in Vite production mode
- Route-level smoke tests must exist for:
  - Home
  - AI Verse
  - Skills
  - Traction
- AI Verse layout tests must cover:
  - no team-sun overlap
  - no agent-team overlap
  - no agent-agent overlap
  - popup/dock positioning rules

## Acceptance Criteria

### Home
- founder sees all live agents without a nested left-rail scroller
- NEXUS command deck is the visual focal point
- voice command button is present and functional where supported

### AI Verse
- stage remains unobstructed when a node is selected
- selected node explains itself in text and speech
- speech cancels on deselect
- different roles can use different soothing male/female voices

### Skills
- at least one skill stack and one individual skill are visible and actionable

### Traction
- traction score and investor-facing model context are clearly visible

## Current Implementation Notes
The current dashboard implementation includes:
- rebuilt Home route with live network + NEXUS command deck
- browser voice input on Home
- rebuilt AI Verse route with bottom explanation dock
- role-aware speech synthesis on AI Verse
- page-level route smoke tests
- AI Verse geometry regression tests
- unified dark HUD theme across all four routes

## Roadmap

### Phase 1
- stabilize all current route interactions
- keep visual consistency and route coverage green

### Phase 2
- richer live command suggestions based on current studio state
- streaming response treatment in NEXUS console
- more animated but restrained signal behavior in AI Verse

### Phase 3
- investor presentation mode
- filtered team views in AI Verse
- live execution replay / event timeline

