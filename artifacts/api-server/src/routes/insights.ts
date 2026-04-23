import { Router, type IRouter } from "express";
import { z } from "zod";
import {
  StartInsightBody,
  ConfirmInsightContextBody,
  RefineInsightContextBody,
} from "@workspace/api-zod";
import {
  createRun,
  getRun,
  deleteRun,
  listRuns,
  rowToRun,
} from "../lib/runStore.js";
import {
  startPipeline,
  refinePipeline,
  confirmAndContinue,
} from "../lib/orchestrator.js";

const router: IRouter = Router();

// Stats first to avoid /:id matching
router.get("/insights/stats", async (_req, res) => {
  const rows = await listRuns();
  const runs = rows.map(rowToRun);
  const total = runs.length;
  const completed = runs.filter((r) => r.status === "complete").length;
  const inProgress = runs.filter((r) =>
    ["building_context", "awaiting_confirmation", "needs_refinement", "analyzing"].includes(r.status),
  ).length;
  const oppScores = runs.map((r) => r.market?.opportunityScore).filter((n): n is number => typeof n === "number");
  const riskScores = runs.map((r) => r.risks?.overallRiskScore).filter((n): n is number => typeof n === "number");
  const avgOpportunity = oppScores.length ? oppScores.reduce((a, b) => a + b, 0) / oppScores.length : 0;
  const avgRisk = riskScores.length ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length : 0;
  const cats: Record<string, number> = {};
  for (const r of runs) {
    const c = r.context?.category;
    if (c) cats[c] = (cats[c] ?? 0) + 1;
  }
  const topCategories = Object.entries(cats)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const recentRuns = runs.slice(0, 6).map((r) => ({
    id: r.id,
    idea: r.idea,
    status: r.status,
    contextName: r.context?.name,
    category: r.context?.category,
    opportunityScore: r.market?.opportunityScore,
    riskScore: r.risks?.overallRiskScore,
    createdAt: r.createdAt,
  }));
  res.json({ total, completed, inProgress, avgOpportunity, avgRisk, topCategories, recentRuns });
});

router.get("/insights", async (_req, res) => {
  const rows = await listRuns();
  const runs = rows.map(rowToRun);
  res.json(
    runs.map((r) => ({
      id: r.id,
      idea: r.idea,
      status: r.status,
      contextName: r.context?.name,
      category: r.context?.category,
      opportunityScore: r.market?.opportunityScore,
      riskScore: r.risks?.overallRiskScore,
      createdAt: r.createdAt,
    })),
  );
});

router.post("/insights", async (req, res) => {
  const parsed = StartInsightBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
    return;
  }
  const row = await createRun(parsed.data.idea);
  // fire-and-forget pipeline; client polls
  startPipeline(row.id, parsed.data.idea).catch((e) => req.log.error({ err: e }, "startPipeline error"));
  res.status(201).json(rowToRun(row));
});

router.get("/insights/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }
  const row = await getRun(id);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(rowToRun(row));
});

router.delete("/insights/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }
  await deleteRun(id);
  res.status(204).end();
});

router.post("/insights/:id/confirm", async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }
  const parsed = ConfirmInsightContextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
    return;
  }
  const row = await getRun(id);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  confirmAndContinue(id, parsed.data.context).catch((e) =>
    req.log.error({ err: e }, "confirmAndContinue error"),
  );
  const updated = await getRun(id);
  res.json(updated ? rowToRun(updated) : rowToRun(row));
});

router.post("/insights/:id/refine", async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }
  const parsed = RefineInsightContextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
    return;
  }
  const row = await getRun(id);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  refinePipeline(id, parsed.data.addendum).catch((e) =>
    req.log.error({ err: e }, "refinePipeline error"),
  );
  const updated = await getRun(id);
  res.json(updated ? rowToRun(updated) : rowToRun(row));
});

export default router;
