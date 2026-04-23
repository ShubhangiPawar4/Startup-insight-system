# Startup Insight Engine

Full-stack AI-assisted startup analysis tool. A user submits a rough idea; six LangGraph agents (context_builder → market_insight → competitor_mapper → business_structurer → risk_analyzer → pitch_writer) collaborate to produce an Insight Report, MVP Plan, and Pitch Draft. Includes a human-in-the-loop confirmation step after context extraction and a vague-idea refinement loop.

## Stack
- pnpm monorepo, TypeScript everywhere
- Backend: Express + LangGraph.js + ChatOpenAI (gpt-5-mini via Replit AI proxy) + Drizzle/Postgres
- Frontend: React + Vite + wouter + shadcn/ui + framer-motion + react-query (orval-generated hooks)
- Visual: dark navy + gold + mint, DM Serif Display / Syne / DM Mono

## Artifacts
- `artifacts/api-server` — REST API + agent pipeline
- `artifacts/insight-engine` — web UI (mounted at `/`)
- `artifacts/mockup-sandbox` — design playground

## Key files
- `artifacts/api-server/src/lib/{graph,agents,schemas,runStore,orchestrator,llm}.ts`
- `artifacts/api-server/src/routes/insights.ts`
- `lib/db/src/schema/insightRuns.ts`
- `lib/api-spec/openapi.yaml` (regen via `pnpm --filter @workspace/api-spec run codegen`)
- `artifacts/insight-engine/src/pages/{home,runs,run-details}.tsx`

## Pipeline state
LangGraph StateGraph with MemorySaver checkpointer; `interrupt()` after context_builder; resume via `Command({ resume: { context } })` keyed on run id as `thread_id`.
