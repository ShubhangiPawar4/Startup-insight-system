import { Link, useLocation } from "wouter";
import { useGetInsightStats, useStartInsight } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { BrainCircuit, Play, ArrowRight, BarChart3, Clock, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [, setLocation] = useLocation();
  const [idea, setIdea] = useState("");
  const startInsight = useStartInsight();
  const { data: stats, isLoading: statsLoading } = useGetInsightStats();

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || idea.length < 5) return;

    startInsight.mutate({ data: { idea } }, {
      onSuccess: (data) => {
        setLocation(`/run/${data.id}`);
      }
    });
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-6xl space-y-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 md:p-12 border border-primary-border shadow-xl">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[400px] h-[400px] rounded-full border-[1px] border-accent/20" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[300px] h-[300px] rounded-full border-[1px] border-secondary/20" />
        
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-secondary before:w-6 before:h-px before:bg-secondary">
              Strategic Copilot
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-white">
              Evaluate your idea with <em className="text-accent italic">precision</em>.
            </h1>
            <p className="text-lg text-primary-foreground/70 max-w-md font-mono text-sm">
              Type a rough startup concept. Watch an autonomous agent pipeline analyze the market, map competitors, and surface critical risks before you build.
            </p>
          </div>

          <div className="bg-background/5 backdrop-blur-sm border border-background/10 rounded-2xl p-6 md:p-8 shadow-2xl">
            <form onSubmit={handleStart} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="idea" className="font-mono text-xs uppercase tracking-wider text-accent flex justify-between">
                  <span>New Analysis</span>
                  <span className="text-primary-foreground/40">Minimum 5 chars</span>
                </label>
                <Textarea 
                  id="idea"
                  placeholder="Describe your startup idea... (e.g. 'A marketplace for independent coffee roasters to sell directly to specialty cafes, managing logistics and payments in one platform')"
                  className="min-h-[160px] bg-background/10 border-background/20 text-white placeholder:text-white/30 focus-visible:ring-accent resize-none text-base"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  disabled={startInsight.isPending}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base font-semibold"
                disabled={!idea.trim() || idea.length < 5 || startInsight.isPending}
              >
                {startInsight.isPending ? (
                  <span className="flex items-center gap-2">Initializing Agents <BrainCircuit className="w-4 h-4 animate-pulse" /></span>
                ) : (
                  <span className="flex items-center gap-2">Run Analysis Pipeline <Play className="w-4 h-4" /></span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Stats Dashboard */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="bg-primary text-accent font-mono text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-widest">Dashboard</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Analyses" value={stats.total} icon={<BarChart3 className="w-4 h-4 text-muted-foreground" />} />
            <StatCard title="Completed" value={stats.completed} icon={<CheckCircle2 className="w-4 h-4 text-secondary" />} />
            <StatCard title="Avg. Opportunity" value={`${stats.avgOpportunity.toFixed(1)}/10`} icon={<TrendingUp className="w-4 h-4 text-accent" />} />
            <StatCard title="Avg. Risk" value={`${stats.avgRisk.toFixed(1)}/10`} icon={<AlertTriangle className="w-4 h-4 text-destructive" />} />
          </div>
        ) : null}
      </section>

      {/* How it works / Pipeline Preview */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="bg-primary text-accent font-mono text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-widest">The Process</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <ProcessStep 
            number="01" 
            title="Context Extraction" 
            desc="The system structures your unstructured idea, prompting you for crucial missing details like target audience."
          />
          <ProcessStep 
            number="02" 
            title="Market & Competitors" 
            desc="Agents pull macro trends and map direct competitors to find viable positioning gaps."
          />
          <ProcessStep 
            number="03" 
            title="Risks & Pitch" 
            desc="Identifies your biggest existential threats and synthesizes everything into a tight, compelling pitch."
          />
        </div>
      </section>
      
      {/* Recent Runs */}
      {stats?.recentRuns && stats.recentRuns.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="bg-primary text-accent font-mono text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-widest">Recent Runs</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentRuns.slice(0, 3).map((run) => (
              <Link key={run.id} href={`/run/${run.id}`}>
                <Card className="hover-elevate cursor-pointer transition-all hover:border-accent/50 h-full">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {new Date(run.createdAt).toLocaleDateString()}
                      </span>
                      <StatusBadge status={run.status} />
                    </div>
                    <CardTitle className="text-lg line-clamp-1">{run.contextName || "Untitled Idea"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{run.idea}</p>
                    {(run.opportunityScore || run.riskScore) && (
                      <div className="mt-4 flex gap-4 text-xs font-mono">
                        {run.opportunityScore && (
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground">Opp Score</span>
                            <span className="font-bold text-accent">{run.opportunityScore}/10</span>
                          </div>
                        )}
                        {run.riskScore && (
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground">Risk Score</span>
                            <span className="font-bold text-destructive">{run.riskScore}/10</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          <div className="flex justify-center mt-6">
            <Link href="/runs">
              <Button variant="outline" className="font-mono uppercase text-xs tracking-wider">
                View All Analyses
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <Card className="bg-card">
      <CardContent className="p-6 flex flex-col justify-between h-full gap-4">
        <div className="flex justify-between items-center">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{title}</span>
          {icon}
        </div>
        <span className="text-3xl font-serif text-foreground">{value}</span>
      </CardContent>
    </Card>
  );
}

function ProcessStep({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card relative overflow-hidden group">
      <div className="absolute top-[-20px] right-[-10px] text-8xl font-serif text-muted/30 group-hover:text-muted/50 transition-colors pointer-events-none">
        {number}
      </div>
      <div className="relative z-10 space-y-3">
        <div className="w-8 h-8 rounded bg-primary text-accent flex items-center justify-center font-mono text-sm font-bold mb-4">
          {number}
        </div>
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = () => {
    switch (status) {
      case "complete": return { color: "bg-secondary/10 text-secondary border-secondary/20", label: "Complete" };
      case "error": return { color: "bg-destructive/10 text-destructive border-destructive/20", label: "Error" };
      case "awaiting_confirmation": 
      case "needs_refinement": return { color: "bg-accent/10 text-accent-foreground border-accent/20", label: "Needs Input" };
      default: return { color: "bg-primary/5 text-primary border-primary/10", label: "In Progress" };
    }
  };
  
  const config = getStatusConfig();
  
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-wider ${config.color}`}>
      {config.label}
    </span>
  );
}
