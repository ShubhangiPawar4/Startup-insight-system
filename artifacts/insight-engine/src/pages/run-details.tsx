import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetInsight,
  getGetInsightQueryKey,
  useConfirmInsightContext,
  useRefineInsightContext,
} from "@workspace/api-client-react";
import type { AgentNodeStatusNode, StartupContext } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  BrainCircuit, 
  CheckCircle2, 
  Circle, 
  Clock, 
  RefreshCcw,
  AlertTriangle,
  Send,
  TrendingUp,
  Target,
  Users,
  Printer,
  ShieldAlert,
  Zap,
  DollarSign,
  Package
} from "lucide-react";

const NODE_LABELS: Record<AgentNodeStatusNode, string> = {
  context_builder: "Context Extraction",
  market_insight: "Market Analysis",
  competitor_mapper: "Competitor Mapping",
  business_structurer: "Business Structuring",
  risk_analyzer: "Risk Analysis",
  pitch_writer: "Pitch Synthesis"
};

export default function RunDetails() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const { data: run, isLoading, isError, error } = useGetInsight(id, {
    query: {
      queryKey: getGetInsightQueryKey(id),
      refetchInterval: (q) => {
        const s = q.state.data?.status;
        return s === 'building_context' || s === 'analyzing' ? 2000 : false;
      }
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-pulse">
          <BrainCircuit className="w-12 h-12" />
          <span className="font-mono text-sm uppercase tracking-widest">Loading Analysis...</span>
        </div>
      </div>
    );
  }

  if (isError || !run) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl space-y-6">
        <Link href="/runs">
          <Button variant="ghost" size="sm" className="font-mono text-xs uppercase tracking-wider mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Runs
          </Button>
        </Link>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-12 flex flex-col items-center text-center gap-6">
            <AlertTriangle className="w-12 h-12 text-destructive" />
            <div className="space-y-2">
              <h2 className="font-serif text-2xl">Analysis Not Found</h2>
              <p className="text-muted-foreground font-mono text-sm">
                We couldn't load this insight run. It may have been deleted or an error occurred.
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()} className="font-mono uppercase text-xs">
              <RefreshCcw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-6xl">
      <div className="mb-8">
        <Link href="/runs">
          <Button variant="ghost" size="sm" className="font-mono text-xs uppercase tracking-wider hover:bg-transparent hover:text-accent -ml-3">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-12">
        {/* Left Sidebar: Timeline */}
        <aside className="space-y-8">
          <div className="space-y-4">
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Pipeline Status</h3>
            <div className="space-y-6">
              {Object.entries(NODE_LABELS).map(([nodeKey, label], idx) => {
                const nodeStatus = run.nodes.find(n => n.node === nodeKey);
                const status = nodeStatus?.status || 'pending';
                const isCurrent = run.currentNode === nodeKey || (status === 'running' || status === 'awaiting_input');
                
                return (
                  <div key={nodeKey} className="relative flex gap-4">
                    {/* Connection Line */}
                    {idx !== Object.keys(NODE_LABELS).length - 1 && (
                      <div className={`absolute left-[11px] top-8 bottom-[-24px] w-px ${status === 'complete' ? 'bg-secondary' : 'bg-border'}`} />
                    )}
                    
                    <div className="relative z-10 flex flex-col items-center mt-1">
                      {status === 'complete' ? (
                        <CheckCircle2 className="w-6 h-6 text-secondary bg-background rounded-full" />
                      ) : status === 'running' ? (
                        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin bg-background" />
                      ) : status === 'awaiting_input' ? (
                        <AlertTriangle className="w-6 h-6 text-accent bg-background rounded-full" />
                      ) : status === 'error' ? (
                        <AlertTriangle className="w-6 h-6 text-destructive bg-background rounded-full" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground/30 bg-background rounded-full" />
                      )}
                    </div>
                    
                    <div className={`flex flex-col pb-6 ${isCurrent ? 'opacity-100' : status === 'pending' ? 'opacity-40' : 'opacity-80'}`}>
                      <span className={`font-mono text-sm font-bold ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {label}
                      </span>
                      {nodeStatus?.message && (
                        <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {nodeStatus.message}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="min-w-0">
          <AnimatePresence mode="wait">
            {run.status === 'building_context' || run.status === 'analyzing' ? (
              <motion.div 
                key="running"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-32 text-center space-y-6 border border-border/50 rounded-3xl bg-card/30"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full animate-pulse" />
                  <BrainCircuit className="w-16 h-16 text-accent relative z-10 animate-bounce" />
                </div>
                <div className="space-y-2 max-w-md px-4">
                  <h2 className="font-serif text-3xl">Agents at work</h2>
                  <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                    The autonomous pipeline is currently running. This may take a minute or two as multiple LLMs coordinate to analyze your concept.
                  </p>
                </div>
              </motion.div>
            ) : run.status === 'awaiting_confirmation' && run.context ? (
              <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ContextConfirmationForm runId={id} context={run.context} />
              </motion.div>
            ) : run.status === 'needs_refinement' ? (
              <motion.div key="refine" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <RefinementForm runId={id} question={run.refinementQuestion} />
              </motion.div>
            ) : run.status === 'complete' ? (
              <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CompleteResults run={run as any} />
              </motion.div>
            ) : run.status === 'error' ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-destructive/20 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Pipeline Error
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-mono text-muted-foreground mb-6">
                      An error occurred during the analysis pipeline.
                    </p>
                    <Button onClick={() => window.location.reload()} variant="outline">
                      <RefreshCcw className="w-4 h-4 mr-2" /> Restart Analysis
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function ContextConfirmationForm({ runId, context }: { runId: string; context: StartupContext }) {
  const queryClient = useQueryClient();
  const confirmCtx = useConfirmInsightContext();
  
  const [formData, setFormData] = useState({
    name: context.name || '',
    targetUser: context.targetUser || '',
    problem: context.problem || '',
    solution: context.solution || '',
    category: context.category || '',
    keywords: context.keywords?.join(', ') || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confirmCtx.mutate(
      { 
        id: runId, 
        data: { 
          context: {
            ...formData,
            keywords: formData.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
          } 
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetInsightQueryKey(runId) });
        }
      }
    );
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="font-serif text-3xl">Confirm Context</h2>
        <p className="font-mono text-sm text-muted-foreground max-w-xl">
          The extraction agent has structured your initial idea. Please review and refine these core parameters before the main analysis begins.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-card/50 backdrop-blur border-border">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Project Name</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Industry Category</Label>
                <Input id="category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="bg-background" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetUser" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Target User</Label>
              <Input id="targetUser" value={formData.targetUser} onChange={e => setFormData({...formData, targetUser: e.target.value})} className="bg-background" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="problem" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Core Problem</Label>
              <Textarea id="problem" value={formData.problem} onChange={e => setFormData({...formData, problem: e.target.value})} className="bg-background min-h-[100px]" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solution" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Proposed Solution</Label>
              <Textarea id="solution" value={formData.solution} onChange={e => setFormData({...formData, solution: e.target.value})} className="bg-background min-h-[100px]" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Keywords (comma separated)</Label>
              <Input id="keywords" value={formData.keywords} onChange={e => setFormData({...formData, keywords: e.target.value})} className="bg-background font-mono text-sm" placeholder="SaaS, B2B, Marketplace..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={confirmCtx.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90 px-8">
            {confirmCtx.isPending ? "Confirming..." : "Confirm & Continue Pipeline"}
            <Send className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function RefinementForm({ runId, question }: { runId: string; question?: string }) {
  const queryClient = useQueryClient();
  const refineCtx = useRefineInsightContext();
  const [addendum, setAddendum] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addendum.trim()) return;
    refineCtx.mutate(
      { id: runId, data: { addendum } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetInsightQueryKey(runId) });
        }
      }
    );
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-2">
        <h2 className="font-serif text-3xl">Clarification Needed</h2>
        <p className="font-mono text-sm text-muted-foreground">
          The context builder needs more specific details before it can confidently proceed.
        </p>
      </div>

      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <BrainCircuit className="w-5 h-5 text-accent" />
            </div>
            <div className="space-y-2 pt-1">
              <p className="font-medium leading-relaxed">{question || "Could you provide more specific details about your target audience and core value proposition?"}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <Textarea 
              placeholder="Provide clarification..." 
              value={addendum}
              onChange={e => setAddendum(e.target.value)}
              className="min-h-[150px] bg-background border-border/50 focus-visible:ring-accent"
              required
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!addendum.trim() || refineCtx.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {refineCtx.isPending ? "Submitting..." : "Submit Clarification"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function CompleteResults({ run }: { run: any }) {
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end gap-4 border-b border-border pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-secondary mb-2 block">
            {run.context?.category || "Analysis Complete"}
          </span>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground">
            {run.context?.name || "Untitled Concept"}
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint} className="font-mono text-xs uppercase tracking-wider hidden md:flex">
          <Printer className="w-4 h-4 mr-2" /> Print Report
        </Button>
      </div>

      <Tabs defaultValue="insight" className="w-full">
        <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto rounded-none mb-8 gap-6">
          <TabsTrigger value="insight" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none px-0 pb-3 font-mono text-sm uppercase tracking-wider text-muted-foreground data-[state=active]:text-foreground">
            Insight Report
          </TabsTrigger>
          <TabsTrigger value="mvp" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none px-0 pb-3 font-mono text-sm uppercase tracking-wider text-muted-foreground data-[state=active]:text-foreground">
            MVP & Risks
          </TabsTrigger>
          <TabsTrigger value="pitch" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none px-0 pb-3 font-mono text-sm uppercase tracking-wider text-muted-foreground data-[state=active]:text-foreground">
            Pitch Draft
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insight" className="space-y-12 mt-0 focus-visible:outline-none focus-visible:ring-0">
          {/* Market Section */}
          {run.market && (
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <span className="bg-primary text-accent font-mono text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-widest">Market</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-card md:col-span-2">
                  <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Market Size</span>
                        <div className="font-serif text-3xl">{run.market.marketSize}</div>
                      </div>
                      <div>
                        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Growth Trend</span>
                        <div className="font-serif text-3xl text-secondary flex items-center gap-2">
                          <TrendingUp className="w-6 h-6" />
                          {run.market.growthTrend}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-6 border-t border-border">
                      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Key Trends</span>
                      <ul className="space-y-2">
                        {run.market.keyTrends?.map((trend: string, i: number) => (
                          <li key={i} className="flex gap-3 text-sm">
                            <span className="text-accent mt-0.5">•</span> {trend}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary text-primary-foreground border-primary-border relative overflow-hidden">
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-accent/20 rounded-full blur-3xl" />
                  <CardContent className="p-8 flex flex-col h-full justify-center text-center relative z-10">
                    <span className="font-mono text-xs uppercase tracking-wider text-accent mb-4">Opportunity Score</span>
                    <div className="font-serif text-7xl mb-6">
                      {run.market.opportunityScore}<span className="text-3xl text-primary-foreground/50">/100</span>
                    </div>
                    <p className="text-sm font-mono text-primary-foreground/70 leading-relaxed">
                      {run.market.opportunityRationale}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Target Segments</span>
                <div className="grid md:grid-cols-2 gap-4">
                  {run.market.targetSegments?.map((seg: any, i: number) => (
                    <div key={i} className="p-5 rounded-xl border border-border bg-background flex gap-4">
                      <Target className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold mb-1">{seg.name}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{seg.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Competitors Section */}
          {run.competitors && (
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <span className="bg-primary text-accent font-mono text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-widest">Competitors</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {run.competitors.competitors?.map((comp: any, i: number) => (
                  <Card key={i} className="bg-card">
                    <CardHeader className="pb-4 border-b border-border/50">
                      <CardTitle className="font-serif text-xl">{comp.name}</CardTitle>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{comp.category}</span>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div>
                        <span className="text-xs font-bold text-secondary flex items-center gap-1.5 mb-2">
                          <CheckCircle2 className="w-3 h-3" /> Strengths
                        </span>
                        <ul className="text-xs space-y-1.5 text-muted-foreground">
                          {comp.strengths?.map((s: string, j: number) => <li key={j}>• {s}</li>)}
                        </ul>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-destructive flex items-center gap-1.5 mb-2">
                          <ShieldAlert className="w-3 h-3" /> Weaknesses
                        </span>
                        <ul className="text-xs space-y-1.5 text-muted-foreground">
                          {comp.weaknesses?.map((w: string, j: number) => <li key={j}>• {w}</li>)}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-4">
                <div className="p-6 rounded-xl bg-accent/5 border border-accent/20">
                  <span className="font-mono text-xs uppercase tracking-wider text-accent mb-3 block">Differentiation</span>
                  <p className="text-sm leading-relaxed">{run.competitors.differentiation}</p>
                </div>
                <div className="p-6 rounded-xl bg-secondary/5 border border-secondary/20">
                  <span className="font-mono text-xs uppercase tracking-wider text-secondary mb-3 block">Positioning Strategy</span>
                  <p className="text-sm leading-relaxed">{run.competitors.positioning}</p>
                </div>
              </div>
            </section>
          )}
        </TabsContent>

        <TabsContent value="mvp" className="space-y-12 mt-0 focus-visible:outline-none focus-visible:ring-0">
          {run.business && (
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <span className="bg-primary text-accent font-mono text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-widest">Business Model</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              
              <div className="text-2xl md:text-3xl font-serif text-center max-w-3xl mx-auto py-8 text-foreground/90">
                "{run.business.valueProposition}"
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    <DollarSign className="w-4 h-4" /> Revenue & Pricing
                  </div>
                  <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                    <p className="text-sm font-medium">{run.business.pricingModel}</p>
                    <div className="space-y-2 pt-4 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">Streams:</span>
                      <ul className="text-sm space-y-1">
                        {run.business.revenueStreams?.map((r: string, i: number) => <li key={i}>• {r}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    <Users className="w-4 h-4" /> Channels
                  </div>
                  <div className="p-5 rounded-xl border border-border bg-card">
                    <ul className="text-sm space-y-2">
                      {run.business.keyChannels?.map((c: string, i: number) => <li key={i}>• {c}</li>)}
                    </ul>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    <Zap className="w-4 h-4" /> Key Resources
                  </div>
                  <div className="p-5 rounded-xl border border-border bg-card">
                    <ul className="text-sm space-y-2">
                      {run.business.keyResources?.map((r: string, i: number) => <li key={i}>• {r}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Package className="w-4 h-4" /> MVP Features
                </span>
                <div className="grid gap-4">
                  {run.business.mvpFeatures?.map((feat: any, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border bg-card items-start">
                      <span className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider shrink-0 mt-0.5
                        ${feat.priority === 'must' ? 'bg-destructive/10 text-destructive' : 
                          feat.priority === 'should' ? 'bg-accent/10 text-accent-foreground' : 
                          'bg-secondary/10 text-secondary'}`}>
                        {feat.priority}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm mb-1">{feat.feature}</h4>
                        <p className="text-sm text-muted-foreground">{feat.rationale}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {run.risks && (
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <span className="bg-primary text-accent font-mono text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-widest">Risk Analysis</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-center p-8 rounded-2xl bg-destructive/5 border border-destructive/20">
                <div className="text-center md:text-left shrink-0">
                  <span className="font-mono text-xs uppercase tracking-wider text-destructive mb-2 block">Overall Risk Score</span>
                  <div className="font-serif text-6xl text-destructive">{run.risks.overallRiskScore}<span className="text-2xl opacity-50">/100</span></div>
                </div>
                <p className="text-sm leading-relaxed max-w-2xl">{run.risks.summary}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {run.risks.risks?.map((risk: any, i: number) => (
                  <Card key={i} className="bg-card">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{risk.category}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider
                          ${risk.severity === 'high' ? 'bg-destructive text-destructive-foreground' : 
                            risk.severity === 'medium' ? 'bg-accent text-accent-foreground' : 
                            'bg-secondary text-secondary-foreground'}`}>
                          {risk.severity}
                        </span>
                      </div>
                      <CardTitle className="text-base leading-snug">{risk.description}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 rounded-lg bg-muted/50 border border-border mt-2">
                        <span className="text-xs font-bold mb-1.5 block">Mitigation</span>
                        <p className="text-sm text-muted-foreground leading-relaxed">{risk.mitigation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </TabsContent>

        <TabsContent value="pitch" className="space-y-12 mt-0 focus-visible:outline-none focus-visible:ring-0">
          {run.pitch && (
            <>
              <div className="text-center space-y-6 py-12 max-w-4xl mx-auto">
                <h2 className="font-serif text-4xl md:text-5xl leading-tight">
                  {run.pitch.oneLiner}
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {run.pitch.elevatorPitch}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-accent">The Problem</h3>
                  <p className="text-lg leading-relaxed">{run.pitch.problem}</p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-secondary">The Solution</h3>
                  <p className="text-lg leading-relaxed">{run.pitch.solution}</p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Market</h3>
                  <p className="text-lg leading-relaxed">{run.pitch.market}</p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Traction / Go-to-market</h3>
                  <p className="text-lg leading-relaxed">{run.pitch.traction}</p>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-accent text-accent-foreground text-center space-y-4 max-w-2xl mx-auto mt-12">
                <h3 className="font-mono text-xs uppercase tracking-wider opacity-80">The Ask</h3>
                <p className="font-serif text-2xl">{run.pitch.ask}</p>
              </div>

              {run.pitch.slides && run.pitch.slides.length > 0 && (
                <section className="space-y-8 pt-12 border-t border-border">
                  <div className="flex items-center gap-3">
                    <span className="bg-primary text-accent font-mono text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-widest">Deck Outline</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {run.pitch.slides.map((slide: any, i: number) => (
                      <div key={i} className="aspect-video bg-card border border-border p-6 flex flex-col justify-center text-center shadow-sm">
                        <span className="font-mono text-[10px] text-muted-foreground mb-4">Slide {i + 1}</span>
                        <h4 className="font-serif text-xl mb-3">{slide.title}</h4>
                        <p className="text-sm text-muted-foreground">{slide.body}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
