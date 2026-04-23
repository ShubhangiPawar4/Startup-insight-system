import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";

export const insightRunsTable = pgTable("insight_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  idea: text("idea").notNull(),
  status: text("status").notNull().default("building_context"),
  currentNode: text("current_node"),
  contextNeedsRefinement: text("context_needs_refinement"),
  refinementQuestion: text("refinement_question"),
  nodes: jsonb("nodes").notNull().default([]),
  context: jsonb("context"),
  market: jsonb("market"),
  competitors: jsonb("competitors"),
  business: jsonb("business"),
  risks: jsonb("risks"),
  pitch: jsonb("pitch"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type InsightRunRow = typeof insightRunsTable.$inferSelect;
export type InsertInsightRun = typeof insightRunsTable.$inferInsert;
