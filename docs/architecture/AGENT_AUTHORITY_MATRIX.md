# Agent Authority Matrix

## Core Rule

No agent has standing approval authority in Phase 14. Approval remains a
human-owned boundary by default.

`yes` means the action is part of the agent’s defined role.  
`scoped` means only within a contract, capability, policy, and file boundary.  
`no` means the action is outside authority.

| Agent | Primary domain | Plane | May decide | May plan | May execute | May verify | May approve | May release | May modify source | May request verification | May use batch | May use provider | May access sensitive data | Requires approval for | Forbidden actions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `nexus` | control, release_control | control | yes | no | no | no | no | yes | no | yes | no | yes | no | release approval if configured, high-cost override | implement code, self-certify gates, bypass evidence |
| `shepherd` | orchestration, reliability | control | yes | yes | no | no | no | no | no | yes | no | yes | no | high-risk dispatch exceptions, risky recovery actions | implement work, pass gates, release GO |
| `auditor` | code_quality | verification | no | no | no | yes | no | no | no | no | no | no | no | failed-gate waiver only through humans | implement fixes, pass QA/compliance gates, release |
| `sentinel` | qa | verification | no | no | no | yes | no | no | no | no | no | no | yes | device/runtime approvals, deploy-linked reruns | implement fixes, pass code/compliance gates, release |
| `warden` | compliance_privacy, security | verification | yes | no | no | yes | no | no | no | no | no | yes | yes | production-data review, policy waiver, security escalation | implement fixes, pass code/QA gates, release |
| `atlas` | product_definition | execution | yes | no | yes | no | no | no | no | yes | no | no | no | release-scoped scope change | implement code, pass gates, release |
| `prism` | design | execution | yes | no | yes | no | no | no | no | yes | no | no | no | regulated-claim or accessibility exceptions | silently override scope, pass gates, release |
| `core` | backend | execution | no | no | yes | no | no | no | yes | yes | no | no | no | destructive data access, deploy-coupled change | self-complete, pass gates, modify out-of-scope files |
| `swift` | ios | execution | no | no | yes | no | no | no | yes | yes | no | no | no | signing, device, runtime, deploy-coupled change | claim Xcode pass without evidence, pass gates |
| `pixel` | web_dashboard | execution | no | no | yes | no | no | no | yes | yes | no | no | no | risky runtime or approval-linked UI path | pass gates, modify out-of-scope files |
| `canvas` | static_content, demo_showcase | execution | no | no | yes | no | no | no | yes | yes | yes | no | no | public claims, packaging, compliance-sensitive copy | pass gates, publish unreviewed regulated content |
| `forge` | deployment | execution | yes | no | yes | no | no | no | yes | yes | no | no | yes | deploy, infra, secrets, CI/CD, rollback | expose raw secrets, release GO, bypass approval |
| `stream` | data_pipeline | execution | yes | no | yes | no | no | no | yes | yes | yes | no | yes | production data, export, destructive pipeline action | expose raw rows, bypass classification or approval |
| `synapse` | ai_integration | execution | yes | no | yes | no | no | no | yes | yes | yes | yes | yes | new provider, new MCP, restricted payload path | change routing outside scope, bypass provider policy |
| `radar` | market_strategy | execution | yes | no | yes | no | no | no | no | no | yes | yes | no | new paid source or external upload | fabricate sources, decide pricing, release |
| `meridian` | business_strategy | execution | yes | no | yes | no | no | no | no | no | yes | yes | no | regulated financial claim or high-cost analysis | fabricate financial claims, release |
| `relay` | observability | observability | yes | no | yes | no | no | no | no | yes | yes | yes | yes | sensitive feedback export or raw issue dump | fix issues directly, expose unredacted feedback |
| `beacon` | marketing | execution | yes | no | yes | no | no | no | no | yes | yes | yes | no | public launch claim, regulated copy | fabricate traction or customer quotes |
| `compass` | aso_seo | execution | yes | no | yes | no | no | no | no | yes | yes | yes | no | store metadata or policy-sensitive claims | fabricate rankings, bypass WARDEN review |
| `oracle` | analytics | execution | yes | no | yes | no | no | no | no | yes | yes | yes | yes | user-data analytics, production access, export | fabricate analytics outcomes, bypass privacy review |

## Notes

- `nexus` is the only agent that may recommend release.
- `shepherd` is the planning owner and the default handoff escalation owner.
- `auditor`, `sentinel`, and `warden` are the only verification owners.
- `core`, `swift`, `pixel`, `canvas`, `forge`, `stream`, and `synapse` are the
  only agents that may modify source, and only when the contract and file scope
  allow it.
- strategy, growth, and observability agents may produce artifacts, but they do
  not modify source and they do not pass gates.
