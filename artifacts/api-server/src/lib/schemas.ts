import { z } from "zod";

export const startupContextSchema = z.object({
  name: z.string().describe("A short, memorable working name for the startup"),
  targetUser: z.string().describe("The specific person/segment who will use this product"),
  problem: z.string().describe("The painful, concrete problem they have today"),
  solution: z.string().describe("The product/approach in one tight paragraph"),
  category: z.string().describe("Industry/category, e.g. 'B2B SaaS — sales ops'"),
  keywords: z.array(z.string()).describe("3-8 short keywords/tags"),
});

export const vagueCheckSchema = z.object({
  isVague: z.boolean().describe("True if any of targetUser, problem, or solution are missing or generic"),
  missingFields: z.array(z.enum(["targetUser", "problem", "solution"])),
  clarifyingQuestion: z.string().describe("If vague, a single specific question to ask the founder"),
});

export const marketInsightSchema = z.object({
  marketSize: z.string().describe("TAM/SAM/SOM estimate in plain language with rough $ figures"),
  growthTrend: z.string().describe("Direction and rate of market growth, in 1-2 sentences"),
  keyTrends: z.array(z.string()).describe("4-6 macro/industry trends supporting or threatening the idea"),
  targetSegments: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).describe("3-4 distinct target segments with crisp descriptions"),
  opportunityScore: z.number().int().min(1).max(100).describe("Overall market opportunity, 1-100"),
  opportunityRationale: z.string().describe("Why that score, in 2-3 sentences"),
});

export const competitorMapSchema = z.object({
  competitors: z.array(z.object({
    name: z.string(),
    category: z.string().describe("e.g. 'direct', 'adjacent', 'incumbent', 'DIY alternative'"),
    strengths: z.array(z.string()).min(2).max(4),
    weaknesses: z.array(z.string()).min(2).max(4),
  })).min(4).max(7),
  differentiation: z.string().describe("How this startup wins vs the field, in 2-3 sentences"),
  positioning: z.string().describe("A single sharp positioning statement"),
});

export const businessStructureSchema = z.object({
  valueProposition: z.string(),
  revenueStreams: z.array(z.string()).min(1),
  pricingModel: z.string(),
  keyChannels: z.array(z.string()).min(2),
  keyResources: z.array(z.string()).min(2),
  mvpFeatures: z.array(z.object({
    feature: z.string(),
    priority: z.enum(["must", "should", "could"]),
    rationale: z.string(),
  })).min(5).max(10),
  successMetrics: z.array(z.string()).min(3).max(6),
});

export const riskAnalysisSchema = z.object({
  risks: z.array(z.object({
    category: z.enum(["market", "technical", "regulatory", "financial", "execution", "competitive"]),
    description: z.string(),
    severity: z.enum(["low", "medium", "high"]),
    mitigation: z.string(),
  })).min(5).max(8),
  overallRiskScore: z.number().int().min(1).max(100),
  summary: z.string(),
});

export const pitchDraftSchema = z.object({
  oneLiner: z.string().describe("A single sentence describing the startup"),
  elevatorPitch: z.string().describe("A 60-second spoken pitch, 2-3 short paragraphs"),
  problem: z.string(),
  solution: z.string(),
  market: z.string(),
  traction: z.string().describe("If no real traction, write a credible plan for first traction"),
  ask: z.string().describe("What the founder is asking for from investors"),
  slides: z.array(z.object({
    title: z.string(),
    body: z.string(),
  })).min(8).max(12),
});

export type StartupContext = z.infer<typeof startupContextSchema>;
export type MarketInsight = z.infer<typeof marketInsightSchema>;
export type CompetitorMap = z.infer<typeof competitorMapSchema>;
export type BusinessStructure = z.infer<typeof businessStructureSchema>;
export type RiskAnalysis = z.infer<typeof riskAnalysisSchema>;
export type PitchDraft = z.infer<typeof pitchDraftSchema>;
