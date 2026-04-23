import { StateGraph, Annotation, START, END, interrupt, MemorySaver, Command } from "@langchain/langgraph";
import {
  ContextBuilderAgent,
  VagueCheckAgent,
  MarketInsightAgent,
  CompetitorMapperAgent,
  BusinessStructurerAgent,
  RiskAnalyzerAgent,
  PitchWriterAgent,
} from "./agents.js";
import type {
  StartupContext,
  MarketInsight,
  CompetitorMap,
  BusinessStructure,
  RiskAnalysis,
  PitchDraft,
} from "./schemas.js";
import { logger } from "./logger.js";

export type NodeName =
  | "context_builder"
  | "market_insight"
  | "competitor_mapper"
  | "business_structurer"
  | "risk_analyzer"
  | "pitch_writer";

export interface AgentNodeStatus {
  node: NodeName;
  status: "pending" | "running" | "complete" | "error" | "awaiting_input";
  message?: string;
  startedAt?: string;
  completedAt?: string;
}

export const PipelineState = Annotation.Root({
  idea: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),
  addendum: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),
  context: Annotation<StartupContext | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  contextNeedsRefinement: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),
  refinementQuestion: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  market: Annotation<MarketInsight | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  competitors: Annotation<CompetitorMap | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  business: Annotation<BusinessStructure | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  risks: Annotation<RiskAnalysis | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  pitch: Annotation<PitchDraft | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  nodes: Annotation<AgentNodeStatus[]>({
    reducer: (current, next) => {
      const map = new Map(current.map((n) => [n.node, n]));
      for (const n of next) map.set(n.node, n);
      return Array.from(map.values());
    },
    default: () => [],
  }),
  awaitingConfirmation: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),
});

export type PipelineStateType = typeof PipelineState.State;

const contextBuilder = new ContextBuilderAgent();
const vagueCheck = new VagueCheckAgent();
const marketAgent = new MarketInsightAgent();
const competitorAgent = new CompetitorMapperAgent();
const businessAgent = new BusinessStructurerAgent();
const riskAgent = new RiskAnalyzerAgent();
const pitchAgent = new PitchWriterAgent();

function statusUpdate(node: NodeName, status: AgentNodeStatus["status"], message?: string): AgentNodeStatus[] {
  const ts = new Date().toISOString();
  return [{
    node,
    status,
    message,
    ...(status === "running" ? { startedAt: ts } : {}),
    ...(status === "complete" || status === "error" ? { completedAt: ts } : {}),
  }];
}

async function contextBuilderNode(state: PipelineStateType) {
  const fullIdea = state.addendum ? `${state.idea}\n\nAdditional detail from founder: ${state.addendum}` : state.idea;
  try {
    const context = await contextBuilder.run({ idea: fullIdea });
    const check = await vagueCheck.run({ context });
    if (check.isVague) {
      return {
        context,
        contextNeedsRefinement: true,
        refinementQuestion: check.clarifyingQuestion,
        nodes: statusUpdate("context_builder", "awaiting_input", check.clarifyingQuestion),
      };
    }
    return {
      context,
      contextNeedsRefinement: false,
      refinementQuestion: undefined,
      awaitingConfirmation: true,
      nodes: statusUpdate("context_builder", "complete"),
    };
  } catch (err) {
    logger.error({ err }, "context_builder failed");
    return { nodes: statusUpdate("context_builder", "error", String(err)) };
  }
}

async function humanReviewNode(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  // human-in-the-loop interrupt — resumed via Command({ resume: { context } })
  const payload = interrupt({
    type: "confirm_context",
    context: state.context,
  }) as { context: StartupContext };

  return {
    context: payload.context,
    awaitingConfirmation: false,
    nodes: statusUpdate("context_builder", "complete", "Confirmed by founder"),
  };
}

async function marketNode(state: PipelineStateType) {
  try {
    const market = await marketAgent.run({ context: state.context! });
    return { market, nodes: statusUpdate("market_insight", "complete") };
  } catch (err) {
    logger.error({ err }, "market_insight failed");
    return { nodes: statusUpdate("market_insight", "error", String(err)) };
  }
}

async function competitorNode(state: PipelineStateType) {
  try {
    const competitors = await competitorAgent.run({ context: state.context!, market: state.market! });
    return { competitors, nodes: statusUpdate("competitor_mapper", "complete") };
  } catch (err) {
    logger.error({ err }, "competitor_mapper failed");
    return { nodes: statusUpdate("competitor_mapper", "error", String(err)) };
  }
}

async function businessNode(state: PipelineStateType) {
  try {
    const business = await businessAgent.run({
      context: state.context!,
      market: state.market!,
      competitors: state.competitors!,
    });
    return { business, nodes: statusUpdate("business_structurer", "complete") };
  } catch (err) {
    logger.error({ err }, "business_structurer failed");
    return { nodes: statusUpdate("business_structurer", "error", String(err)) };
  }
}

async function riskNode(state: PipelineStateType) {
  try {
    const risks = await riskAgent.run({
      context: state.context!,
      market: state.market!,
      competitors: state.competitors!,
      business: state.business!,
    });
    return { risks, nodes: statusUpdate("risk_analyzer", "complete") };
  } catch (err) {
    logger.error({ err }, "risk_analyzer failed");
    return { nodes: statusUpdate("risk_analyzer", "error", String(err)) };
  }
}

async function pitchNode(state: PipelineStateType) {
  try {
    const pitch = await pitchAgent.run({
      context: state.context!,
      market: state.market!,
      competitors: state.competitors!,
      business: state.business!,
      risks: state.risks!,
    });
    return { pitch, nodes: statusUpdate("pitch_writer", "complete") };
  } catch (err) {
    logger.error({ err }, "pitch_writer failed");
    return { nodes: statusUpdate("pitch_writer", "error", String(err)) };
  }
}

function routeAfterContext(state: PipelineStateType): "human_review" | "__end__" {
  if (state.contextNeedsRefinement) return "__end__"; // pause; user calls refine to loop back
  if (state.awaitingConfirmation) return "human_review";
  return "__end__";
}

const checkpointer = new MemorySaver();

export const insightGraph = new StateGraph(PipelineState)
  .addNode("context_builder", contextBuilderNode)
  .addNode("human_review", humanReviewNode)
  .addNode("market_insight", marketNode)
  .addNode("competitor_mapper", competitorNode)
  .addNode("business_structurer", businessNode)
  .addNode("risk_analyzer", riskNode)
  .addNode("pitch_writer", pitchNode)
  .addEdge(START, "context_builder")
  .addConditionalEdges("context_builder", routeAfterContext, {
    human_review: "human_review",
    __end__: END,
  })
  .addEdge("human_review", "market_insight")
  .addEdge("market_insight", "competitor_mapper")
  .addEdge("competitor_mapper", "business_structurer")
  .addEdge("business_structurer", "risk_analyzer")
  .addEdge("risk_analyzer", "pitch_writer")
  .addEdge("pitch_writer", END)
  .compile({ checkpointer });

export { Command };
