# Domain Ownership Policy

## Core Principle

Teams own domains.  
Agents own tasks.  
Skills own procedures.  
Hooks own enforcement.  
Contracts own handoffs.  
State machines own truth.  
Capabilities own authority.  
Evidence owns proof.  
NEXUS owns final decision authority.

## Why This Exists

Without domain ownership, NEXUS becomes agentic soup.

Domain ownership prevents:

- agents doing work outside authority
- duplicate ownership
- unclear handoffs
- fake completion
- gate bypass
- release decisions without evidence
- platform, security, and privacy work being handled by the wrong agents
- private data flowing to the wrong providers or tools

## Ownership Types

### 1. Decision ownership

Who can decide direction or release recommendation.

### 2. Planning ownership

Who can break goals into tasks and contracts.

### 3. Execution ownership

Who can create or modify artifacts within a scoped contract.

### 4. Verification ownership

Who can certify a gate with evidence.

### 5. Approval ownership

Who can approve risky actions.

In Phase 14, approval ownership remains human-only by default. Agents may
request approval but do not hold standing approval authority.

### 6. Policy ownership

Who defines constraints, denials, and blocks.

### 7. Evidence ownership

Who produces and links proof.

### 8. Escalation ownership

Who resolves ambiguity or conflict.

## Domain Map

| Domain | Owner agent | Supporting agents | Verifier agents | Required contracts | Allowed capabilities | Approval triggers | Evidence required | Escalation owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `control` | `nexus` | `shepherd` | none | task, release | `control.read_system_state`, `control.decide_release` | release approval if configured | `system_state_snapshot`, `release_decision_result`, `release_contract` | `nexus` |
| `orchestration` | `shepherd` | `nexus`, `atlas` | none | task, handoff | `orchestration.plan_flow`, `orchestration.dispatch_task`, `approval.request` | high-risk dispatch exceptions | `plan_result`, `task_contracts`, `handoff_contracts`, `dispatch_result` | `shepherd` |
| `product_definition` | `atlas` | `shepherd`, `prism`, `core`, `swift`, `pixel` | `auditor`, `warden` | task, handoff | `orchestration.plan_flow` until a dedicated product capability exists | release-scoped scope change | `acceptance_criteria`, `scope_notes`, `handoff_contracts` | `shepherd` |
| `design` | `prism` | `atlas`, `pixel`, `swift`, `canvas` | `warden` when regulated copy or claims exist | task, handoff | `orchestration.plan_flow` until a dedicated design capability exists | accessibility or regulated-claim changes | `design_spec`, `ui_state_notes`, `handoff_contracts` | `atlas` |
| `backend` | `core` | `atlas`, `forge` | `auditor`, `sentinel`, `warden` | task, handoff, verification | `implementation.backend_code` | destructive data access, deploy-coupled changes | `changed_files_summary`, `verification_requests` | `shepherd` |
| `ios` | `swift` | `atlas`, `prism`, `forge` | `sentinel`, `warden` | task, handoff, verification | `implementation.ios_code` | device, signing, or runtime approval needs | `changed_files_summary`, `runtime_needs`, `verification_requests`, `xcresult` when available | `shepherd` |
| `web_dashboard` | `pixel` | `atlas`, `prism`, `canvas` | `auditor`, `warden` | task, handoff, verification | `implementation.web_dashboard` | risky runtime or approval-linked UI changes | `changed_files_summary`, `ui_state_notes`, `verification_requests` | `shepherd` |
| `static_content` | `canvas` | `prism`, `beacon`, `pixel` | `warden` when claims, privacy, or store copy are involved | task, handoff | `implementation.static_content` | public claims, compliance copy, or deployment packaging | `content_artifact_summary`, `warden_review_request` | `atlas` |
| `deployment` | `forge` | `shepherd`, `core`, `swift`, `pixel` | `warden` for secret or compliance impact | task, handoff, approval | `platform.deploy_plan`, `platform.secrets_change_request`, `approval.request` | deploy, infra, CI/CD, secrets, rollback | `deployment_readiness_report`, `rollback_plan`, `approval_result` | `forge` |
| `data_pipeline` | `stream` | `forge`, `oracle`, `warden` | `warden` | task, handoff, approval | `platform.data_pipeline`, `data.safe_db_summary` | confidential, restricted, production, or export actions | `data_classification_note`, `pipeline_summary`, `audit_event` | `stream` |
| `ai_integration` | `synapse` | `forge`, `warden`, `nexus` | `warden` for data class or provider policy issues | task, handoff, approval | `platform.ai_integration`, `approval.request` | new provider, new MCP, new tool, restricted payload path | `provider_policy_note`, `data_classification_note`, `verification_requests` | `synapse` |
| `code_quality` | `auditor` | `core`, `swift`, `pixel` as remediation owners | `auditor` | verification | `verification.code_quality_gate` | none for normal verification; approval only for failed-gate waiver later | `lint_result`, `static_analysis_result`, `test_coverage_result`, `diff_review_result` | `auditor` |
| `qa` | `sentinel` | `forge`, `swift`, `core`, `relay` as remediation inputs | `sentinel` | verification | `verification.qa_gate` | runtime access, device farm, or deploy-linked reruns | `test_result`, `simulator_result`, `log_analysis_result`, `security_scan_result` | `sentinel` |
| `compliance_privacy` | `warden` | `forge`, `stream`, `synapse`, `canvas`, `compass`, `oracle` | `warden` | verification, approval when needed | `verification.compliance_gate`, `security.secret_scan`, `data.safe_db_summary` | production data, privacy-sensitive review, policy waivers | `privacy_check_result`, `permissions_validation_result`, `appstore_policy_result`, `secret_scan_result` | `warden` |
| `observability` | `relay` | `nexus`, `shepherd`, `oracle` | `warden` for sensitive feedback handling | task, handoff | `observability.feedback_triage` | sensitive feedback or export actions | `redaction_note`, `feedback_summary` | `relay` |
| `market_strategy` | `radar` | `nexus`, `meridian`, `beacon` | none | task, handoff | `strategy.market_research` | new paid data source or risky external upload | `source_summary`, `data_classification_note` | `nexus` |
| `business_strategy` | `meridian` | `nexus`, `radar`, `oracle` | none | task, handoff | `strategy.business_model` | high-cost research or regulated financial claims | `assumptions`, `source_summary` | `nexus` |
| `marketing` | `beacon` | `canvas`, `compass`, `warden` | `warden` when regulated claims exist | task, handoff | `growth.marketing_copy` | public claims, launch approval, or regulated copy | `claim_checklist`, `required_review` | `beacon` |
| `aso_seo` | `compass` | `beacon`, `canvas`, `warden` | `warden` for store or policy-sensitive metadata | task, handoff | `growth.aso_seo_keywords` | store metadata or policy-sensitive claims | `source_notes`, `required_review` | `compass` |
| `analytics` | `oracle` | `stream`, `relay`, `warden` | `warden` for user-data implications | task, handoff, approval | `growth.analytics_schema`, `data.safe_db_summary` | user-data analytics, production access, export | `data_classification_note`, `privacy_review_request` | `oracle` |
| `security` | `warden` | `forge`, `auditor`, `sentinel`, `synapse` | `warden` | verification, approval | `security.secret_scan`, `verification.compliance_gate`, `approval.request` | secret exposure, security incident, production hardening changes | `secret_scan_result`, `privacy_check_result`, `approval_result` | `warden` |
| `reliability` | `shepherd` | `forge`, `relay`, `nexus` | `auditor`, `sentinel`, `warden` as evidence contributors | task, handoff, approval when risky | `orchestration.dispatch_task`, `approval.request` | rollback, recovery, deploy retry, incident-triggered actions | `dispatch_result`, `incident_record`, `recovery_note` | `shepherd` |
| `capabilities` | `nexus` | `shepherd`, `warden`, `synapse` | `warden` for security fit | task, handoff | `control.read_system_state` plus registry review artifacts | new high-risk capability enablement | `capability_review_note`, `policy_links`, `audit_event` | `nexus` |
| `demo_showcase` | `canvas` | `pixel`, `beacon`, `nexus`, `shepherd` | `warden`, `auditor`, `sentinel` as public-safety and evidence reviewers | task, handoff, release | `implementation.static_content`, `demo.replay_scenario` | public publication, evidence claim, or external showcase packaging | `content_artifact_summary`, `claim_checklist`, `showcase_summary` | `shepherd` |
| `release_control` | `nexus` | `shepherd`, `auditor`, `sentinel`, `warden`, `forge` | `auditor`, `sentinel`, `warden` | release, verification, approval when configured | `control.decide_release`, `approval.request` | release approval if configured, failed-gate waiver, rollback from final state | `gate_evidence`, `release_contract`, `release_decision_result`, `approval_result` | `nexus` |

## Ownership Rules

- every scoped task must name an owner agent
- every handoff must identify a target owner and escalation owner
- verification authority belongs to `auditor`, `sentinel`, and `warden` only
- approval authority belongs to humans by default, not to agents
- NEXUS may recommend release, but only evidence can support that recommendation
- a capability cannot grant authority outside a domain owner’s contract scope
- support agents may assist, but they do not silently inherit ownership

## Non-goals

This phase does not implement runtime enforcement. It defines domain ownership,
authority boundaries, escalation expectations, and validation checks only.
