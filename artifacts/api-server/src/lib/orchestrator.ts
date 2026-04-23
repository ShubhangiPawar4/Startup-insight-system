import { insightGraph, Command, type AgentNodeStatus } from "./graph.js";
import { getRun, updateRun, mergeNodes } from "./runStore.js";
import { logger } from "./logger.js";

const inflight = new Set<string>();

function runStatusFromState(state: any): string {
  if (state.pitch) return "complete";
  if (state.contextNeedsRefinement) return "needs_refinement";
  if (state.awaitingConfirmation) return "awaiting_confirmation";
  if (state.context && !state.market) return "awaiting_confirmation";
  if (state.market && !state.pitch) return "analyzing";
  return "building_context";
}

function currentNodeFromState(state: any): string | undefined {
  if (state.pitch) return undefined;
  if (state.risks) return "pitch_writer";
  if (state.business) return "risk_analyzer";
  if (state.competitors) return "business_structurer";
  if (state.market) return "competitor_mapper";
  if (state.awaitingConfirmation || state.contextNeedsRefinement) return "context_builder";
  return "context_builder";
}

async function persistFromState(id: string, state: any) {
  const row = await getRun(id);
  if (!row) return;
  const merged = mergeNodes((row.nodes as AgentNodeStatus[]) ?? [], (state.nodes as AgentNodeStatus[]) ?? []);
  await updateRun(id, {
    status: runStatusFromState(state),
    currentNode: currentNodeFromState(state) ?? null,
    contextNeedsRefinement: state.contextNeedsRefinement ? "true" : "false",
    refinementQuestion: state.refinementQuestion ?? null,
    nodes: merged as any,
    context: state.context ?? null,
    market: state.market ?? null,
    competitors: state.competitors ?? null,
    business: state.business ?? null,
    risks: state.risks ?? null,
    pitch: state.pitch ?? null,
  });
}

async function setRunningStatus(id: string, node: AgentNodeStatus["node"]) {
  const row = await getRun(id);
  if (!row) return;
  const updated = mergeNodes((row.nodes as AgentNodeStatus[]) ?? [], [
    { node, status: "running", startedAt: new Date().toISOString() },
  ]);
  await updateRun(id, { nodes: updated as any, currentNode: node });
}

export async function startPipeline(id: string, idea: string) {
  if (inflight.has(id)) return;
  inflight.add(id);
  try {
    await setRunningStatus(id, "context_builder");
    await updateRun(id, { status: "building_context" });
    const config = { configurable: { thread_id: id } };
    const finalState = await insightGraph.invoke({ idea }, config);
    await persistFromState(id, finalState);
  } catch (err) {
    logger.error({ err, id }, "Pipeline error during start");
    await updateRun(id, { status: "error" });
  } finally {
    inflight.delete(id);
  }
}

export async function refinePipeline(id: string, addendum: string) {
  if (inflight.has(id)) return;
  inflight.add(id);
  try {
    await setRunningStatus(id, "context_builder");
    await updateRun(id, { status: "building_context", contextNeedsRefinement: "false" });
    const config = { configurable: { thread_id: id } };
    // Update the state with addendum then invoke from the start by re-running with combined idea
    const row = await getRun(id);
    if (!row) return;
    const finalState = await insightGraph.invoke({ idea: row.idea, addendum }, config);
    await persistFromState(id, finalState);
  } catch (err) {
    logger.error({ err, id }, "Pipeline error during refine");
    await updateRun(id, { status: "error" });
  } finally {
    inflight.delete(id);
  }
}

export async function confirmAndContinue(id: string, context: any) {
  if (inflight.has(id)) return;
  inflight.add(id);
  try {
    await updateRun(id, { status: "analyzing", currentNode: "market_insight" });
    const config = { configurable: { thread_id: id } };
    const finalState = await insightGraph.invoke(new Command({ resume: { context } }) as any, config);
    await persistFromState(id, finalState);
  } catch (err) {
    logger.error({ err, id }, "Pipeline error during confirm");
    await updateRun(id, { status: "error" });
  } finally {
    inflight.delete(id);
  }
}
