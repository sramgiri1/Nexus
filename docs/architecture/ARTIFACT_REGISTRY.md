# Artifact Registry

**Version:** 1.0  
**Date:** 2026-05-06

---

## Purpose

Artifacts are external proof objects referenced by NEXUS.

Examples:

- logs
- reports
- screenshots
- crash logs
- `xcresult`
- test output
- coverage output
- diff reports
- release evidence
- approval records
- eval reports

---

## Artifact Shape

```json
{
  "artifactId": "",
  "type": "",
  "projectId": "",
  "taskId": "",
  "agentId": "",
  "runtime": "",
  "path": "",
  "hash": "",
  "sizeBytes": 0,
  "mimeType": "",
  "dataClassification": "public|internal|confidential|restricted|secret|unknown",
  "redacted": true,
  "retentionPolicy": "",
  "createdAt": "",
  "linkedEvidenceIds": []
}
```

---

## Artifact Types

- `report`
- `log`
- `screenshot`
- `crash_log`
- `xcresult`
- `test_output`
- `coverage_output`
- `diff_report`
- `release_contract`
- `approval_result`
- `eval_report`
- `model_output`
- `batch_output`

---

## Rules

- DB stores artifact metadata, not large blobs
- large artifacts live in filesystem or object storage later
- large artifacts by reference should be preferred over embedding content
- artifacts require hashes where possible
- artifacts require data classification
- restricted or secret artifacts are not sent to LLM, batch, or OpenRouter
- redacted artifacts can be linked to evidence
- artifacts should have retention policy
- artifact deletion must not erase audit history
- release decisions reference artifact and evidence IDs

---

## Registry Role

The artifact registry is a metadata surface, not a blob store.

It exists so the OS can later answer:

- which artifact was produced
- which task and agent produced it
- which runtime created it
- which evidence references it
- whether it was redacted
- whether it can be shown in UI or linked into a report

Artifacts are proof surfaces and must remain safe to reference even when the
underlying output is large or sensitive.
