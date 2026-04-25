# NEXUS — Reference

## Active Portfolio

| App       | Stage       | Gate | Score | Interviews | TAM    |
|-----------|-------------|------|-------|------------|--------|
| ShiftPay  | incubation  | G1   | 44/50 | 5/5 ✓      | $144M  |
| CareLoop  | incubation  | G1   | 44/50 | 5/5 ✓      | $479M  |
| HomeLog   | discovery   | —    | 41/50 | 0/5        | $599M  |

Combined TAM: **$1.2B+**

---

## Environment Variables

**Root `.env`** (for orchestrator and agents):
```
LOOP_INTERVAL=10
MAX_TOKENS=2048
AGENT_MODEL=llama3.2:3b
NEXUS_MODEL=llama3.2:3b
OLLAMA_HOST=http://localhost:11434
```

**`dashboard/.env`** (for the React dashboard):
```
VITE_OLLAMA_HOST=http://localhost:11434
VITE_NEXUS_MODEL=llama3.2:3b
```

---

## Token Cost Estimates

> Costs apply only if using Claude models. Local Ollama models are free.

| Operation                | Model      | Tokens (est.) | Cost (est.) |
|--------------------------|------------|----------------|-------------|
| Ask NEXUS (status)       | Sonnet 4.6 | ~2,000         | $0.006      |
| Run ATLAS (write PRD)    | Haiku 4.5  | ~3,000         | $0.002      |
| Run CORE (write schema)  | Haiku 4.5  | ~4,000         | $0.003      |
| Full portfolio scan      | Haiku 4.5  | ~5,000         | $0.004      |
| Dashboard chat message   | Sonnet 4.6 | ~1,500         | $0.005      |
