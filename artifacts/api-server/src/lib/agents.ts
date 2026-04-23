import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { makeLLM } from "./llm.js";
import {
  startupContextSchema,
  vagueCheckSchema,
  marketInsightSchema,
  competitorMapSchema,
  businessStructureSchema,
  riskAnalysisSchema,
  pitchDraftSchema,
  type StartupContext,
  type MarketInsight,
  type CompetitorMap,
  type BusinessStructure,
  type RiskAnalysis,
  type PitchDraft,
} from "./schemas.js";

abstract class Agent<TInput, TOutput> {
  protected llm: ChatOpenAI;
  abstract systemPrompt: string;
  abstract schema: z.ZodType<TOutput>;
  abstract name: string;

  constructor(temperature = 0.7) {
    this.llm = makeLLM(temperature);
  }

  abstract buildUserMessage(input: TInput): string;

  async run(input: TInput): Promise<TOutput> {
    const structured = this.llm.withStructuredOutput(this.schema, { name: this.name });
    const result = await structured.invoke([
      { role: "system", content: this.systemPrompt },
      { role: "user", content: this.buildUserMessage(input) },
    ]);
    return result as TOutput;
  }
}

export class ContextBuilderAgent extends Agent<{ idea: string }, StartupContext> {
  name = "structure_context";
  schema = startupContextSchema;
  systemPrompt = `You are a startup analyst who turns rough founder ideas into structured product briefs.
Read the founder's raw idea and extract the most likely interpretation in concrete, opinionated terms.
- targetUser: be specific (a role + context), not "small businesses"
- problem: a concrete painful moment, not a category
- solution: one tight paragraph the founder could put on a website
- category: industry + sub-segment
- keywords: short tags useful for market research
If the idea is vague, make your best opinionated guess — the founder will confirm or correct.`;

  buildUserMessage({ idea }: { idea: string }) {
    return `Founder's raw idea:\n"""\n${idea}\n"""\n\nReturn a structured StartupContext.`;
  }
}

export class VagueCheckAgent extends Agent<{ context: StartupContext }, z.infer<typeof vagueCheckSchema>> {
  name = "vague_check";
  schema = vagueCheckSchema;
  systemPrompt = `You judge whether a startup brief is too vague to analyze rigorously.
Mark a field as missing if it is generic ("everyone", "make things easier"), tautological, or under 8 words of real specificity.
If isVague is true, write ONE clarifying question that would unlock the most value.
Be strict — vague briefs produce vague analysis.`;

  buildUserMessage({ context }: { context: StartupContext }) {
    return `Evaluate this brief:\n${JSON.stringify(context, null, 2)}`;
  }
}

export class MarketInsightAgent extends Agent<{ context: StartupContext }, MarketInsight> {
  name = "market_insight";
  schema = marketInsightSchema;
  systemPrompt = `You are a market analyst. Given a startup brief, produce a sharp market insight report.
Use real-world knowledge about industries, segments, and trends. Cite rough $ figures even if approximate.
Score opportunity 1-100 honestly — most ideas are 40-70. Reserve 80+ for genuinely large, accelerating markets.`;

  buildUserMessage({ context }: { context: StartupContext }) {
    return `Startup brief:\n${JSON.stringify(context, null, 2)}\n\nProduce the MarketInsight.`;
  }
}

export class CompetitorMapperAgent extends Agent<
  { context: StartupContext; market: MarketInsight },
  CompetitorMap
> {
  name = "competitor_map";
  schema = competitorMapSchema;
  systemPrompt = `You are a competitive intelligence analyst.
Identify 4-7 real competitors across direct, adjacent, incumbent, and DIY-alternative categories.
Use real company names you know about. Be honest about strengths and weaknesses.
End with a sharp differentiation statement and a single positioning sentence.`;

  buildUserMessage({ context, market }: { context: StartupContext; market: MarketInsight }) {
    return `Brief:\n${JSON.stringify(context, null, 2)}\n\nMarket:\n${JSON.stringify(market, null, 2)}\n\nMap the competitive landscape.`;
  }
}

export class BusinessStructurerAgent extends Agent<
  { context: StartupContext; market: MarketInsight; competitors: CompetitorMap },
  BusinessStructure
> {
  name = "business_structure";
  schema = businessStructureSchema;
  systemPrompt = `You are a product strategist who designs MVP plans and business models.
Define value prop, revenue streams, pricing, channels, and resources concretely.
For mvpFeatures, use MoSCoW (must/should/could) — 5-10 features total, with rationale tied to the problem.
Success metrics should be measurable and tied to the business model.`;

  buildUserMessage(input: { context: StartupContext; market: MarketInsight; competitors: CompetitorMap }) {
    return `Brief:\n${JSON.stringify(input.context, null, 2)}\n\nMarket:\n${JSON.stringify(input.market, null, 2)}\n\nCompetitors:\n${JSON.stringify(input.competitors, null, 2)}\n\nDesign the business structure and MVP plan.`;
  }
}

export class RiskAnalyzerAgent extends Agent<
  {
    context: StartupContext;
    market: MarketInsight;
    competitors: CompetitorMap;
    business: BusinessStructure;
  },
  RiskAnalysis
> {
  name = "risk_analysis";
  schema = riskAnalysisSchema;
  systemPrompt = `You are a risk analyst. Given the full picture, identify 5-8 concrete risks across categories.
Be specific — "users may not adopt" is not useful; "no clear distribution channel into mid-market sales teams" is.
Each risk needs a concrete mitigation. Score overall risk 1-100 honestly.`;

  buildUserMessage(input: {
    context: StartupContext;
    market: MarketInsight;
    competitors: CompetitorMap;
    business: BusinessStructure;
  }) {
    return `Full plan:\n${JSON.stringify(input, null, 2)}\n\nProduce the RiskAnalysis.`;
  }
}

export class PitchWriterAgent extends Agent<
  {
    context: StartupContext;
    market: MarketInsight;
    competitors: CompetitorMap;
    business: BusinessStructure;
    risks: RiskAnalysis;
  },
  PitchDraft
> {
  name = "pitch_draft";
  schema = pitchDraftSchema;
  systemPrompt = `You are a senior pitch writer. Synthesize the full analysis into a crisp investor pitch.
- oneLiner: a single confident sentence
- elevatorPitch: 2-3 short spoken paragraphs, no buzzword soup
- slides: 8-12 slides with concrete bodies (not bullet placeholders); follow the canonical YC-style deck order: Problem, Solution, Market, Product, Traction/Plan, Business Model, Competition, Team (placeholder), Ask
Write like a real founder, not a corporate brochure.`;

  buildUserMessage(input: {
    context: StartupContext;
    market: MarketInsight;
    competitors: CompetitorMap;
    business: BusinessStructure;
    risks: RiskAnalysis;
  }) {
    return `Full analysis:\n${JSON.stringify(input, null, 2)}\n\nWrite the PitchDraft.`;
  }
}
