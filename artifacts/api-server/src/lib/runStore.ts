import { db, insightRunsTable, type InsightRunRow } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import type { AgentNodeStatus, NodeName } from "./graph.js";

const PIPELINE_NODES: NodeName[] = [
  "context_builder",
  "market_insight",
  "competitor_mapper",
  "business_structurer",
  "risk_analyzer",
  "pitch_writer",
];

export function emptyNodes(): AgentNodeStatus[] {
  return PIPELINE_NODES.map((node) => ({ node, status: "pending" as const }));
}

export function mergeNodes(current: AgentNodeStatus[], updates: AgentNodeStatus[]): AgentNodeStatus[] {
  const map = new Map<string, AgentNodeStatus>();
  for (const n of current) map.set(n.node, n);
  for (const n of updates) map.set(n.node, n);
  return PIPELINE_NODES.map((name) => map.get(name) ?? { node: name, status: "pending" });
}

export function rowToRun(row: InsightRunRow) {
  return {
    id: row.id,
    idea: row.idea,
    status: row.status as
      | "building_context"
      | "awaiting_confirmation"
      | "needs_refinement"
      | "analyzing"
      | "complete"
      | "error",
    currentNode: row.currentNode ?? undefined,
    contextNeedsRefinement: row.contextNeedsRefinement === "true",
    refinementQuestion: row.refinementQuestion ?? undefined,
    nodes: (row.nodes as AgentNodeStatus[]) ?? emptyNodes(),
    context: (row.context as any) ?? undefined,
    market: (row.market as any) ?? undefined,
    competitors: (row.competitors as any) ?? undefined,
    business: (row.business as any) ?? undefined,
    risks: (row.risks as any) ?? undefined,
    pitch: (row.pitch as any) ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type InsightRunDTO = ReturnType<typeof rowToRun>;

export async function createRun(idea: string) {
  const [row] = await db
    .insert(insightRunsTable)
    .values({
      idea,
      status: "building_context",
      currentNode: "context_builder",
      nodes: emptyNodes() as any,
    })
    .returning();
  return row;
}

export async function getRun(id: string) {
  const [row] = await db.select().from(insightRunsTable).where(eq(insightRunsTable.id, id));
  return row;
}

export async function updateRun(id: string, patch: Partial<InsightRunRow>) {
  const [row] = await db
    .update(insightRunsTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(insightRunsTable.id, id))
    .returning();
  return row;
}

export async function deleteRun(id: string) {
  await db.delete(insightRunsTable).where(eq(insightRunsTable.id, id));
}

export async function listRuns() {
  return db.select().from(insightRunsTable).orderBy(desc(insightRunsTable.createdAt));
}
