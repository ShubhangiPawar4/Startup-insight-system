import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListInsights } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ArrowLeft, Clock, TrendingUp, AlertTriangle, Play, Sparkles } from "lucide-react";

export default function Runs() {
  const [, setLocation] = useLocation();
  const { data: runs, isLoading, isError } = useListInsights();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-6xl space-y-8">
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-48 bg-muted rounded"></div>
          <div className="h-10 w-full max-w-sm bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-6xl flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="text-destructive">
          <AlertTriangle className="h-12 w-12 mx-auto" />
        </div>
        <h2 className="font-serif text-2xl text-foreground">Failed to load analyses</h2>
        <Button onClick={() => window.location.reload()} variant="outline" className="font-mono text-xs uppercase tracking-wider">
          Retry
        </Button>
      </div>
    );
  }

  const filteredRuns = runs?.filter(run => {
    if (statusFilter === "all") return true;
    if (statusFilter === "in-progress") return !["complete", "error"].includes(run.status);
    return run.status === statusFilter;
  }) || [];

  const sortedRuns = [...filteredRuns].sort((a, b) => {
    if (sortBy === "opportunityScore") {
      return (b.opportunityScore || 0) - (a.opportunityScore || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-6xl space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground before:w-6 before:h-px before:bg-border">
            Library
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground">
            Analysis <em className="text-accent italic">History</em>
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-background/50 backdrop-blur-sm border-border font-mono text-xs uppercase tracking-wider">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur-sm border-border font-mono text-xs uppercase tracking-wider">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Newest First</SelectItem>
              <SelectItem value="opportunityScore">Highest Opportunity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {sortedRuns.length === 0 ? (
        <div className="text-center py-24 space-y-6 border border-dashed border-border rounded-3xl bg-card/30">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
          <div className="space-y-2">
            <h3 className="font-serif text-2xl">No analyses found</h3>
            <p className="text-muted-foreground font-mono text-sm max-w-md mx-auto">
              You haven't run any startup analyses yet, or none match your current filters.
            </p>
          </div>
          <Link href="/">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 px-8 font-semibold">
              <span className="flex items-center gap-2">Start New Analysis <Play className="w-4 h-4" /></span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedRuns.map((run) => (
            <Link key={run.id} href={`/run/${run.id}`}>
              <Card className="hover-elevate cursor-pointer transition-all hover:border-accent/50 h-full bg-card group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(run.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <StatusBadge status={run.status} />
                  </div>
                  <CardTitle className="text-xl font-serif line-clamp-1 group-hover:text-accent transition-colors">
                    {run.contextName || "Untitled Concept"}
                  </CardTitle>
                  {run.category && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-secondary">
                      {run.category}
                    </span>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6 leading-relaxed">
                    {run.idea}
                  </p>
                  
                  <div className="flex gap-6 mt-auto pt-4 border-t border-border/50">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Opp
                      </span>
                      <span className="font-bold text-lg text-foreground">
                        {run.opportunityScore ? `${run.opportunityScore}/10` : '-'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Risk
                      </span>
                      <span className="font-bold text-lg text-foreground">
                        {run.riskScore ? `${run.riskScore}/10` : '-'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
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
      default: return { color: "bg-primary/5 text-primary border-primary/10 animate-pulse", label: "In Progress" };
    }
  };
  
  const config = getStatusConfig();
  
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-wider ${config.color}`}>
      {config.label}
    </span>
  );
}
