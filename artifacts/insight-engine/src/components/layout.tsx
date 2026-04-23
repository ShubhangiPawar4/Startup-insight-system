import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Layers, List, Plus, Sparkles } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center mx-auto px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2 mr-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-serif text-lg font-bold text-primary dark:text-foreground">Startup Insight</span>
          </Link>

          <nav className="flex items-center gap-6 text-sm font-mono">
            <NavLink href="/" icon={<Plus className="h-4 w-4" />}>New Analysis</NavLink>
            <NavLink href="/runs" icon={<List className="h-4 w-4" />}>All Runs</NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="py-6 md:py-8 border-t border-border mt-auto">
        <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-mono">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>AI-Assisted Startup Planning System</span>
          </div>
          <div className="flex gap-4">
            <span>v1.0.0</span>
            <span>LangGraph Powered</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ href, children, icon }: { href: string; children: React.ReactNode; icon?: React.ReactNode }) {
  const [location] = useLocation();
  const isActive = location === href || (href !== "/" && location.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 transition-colors hover:text-foreground/80",
        isActive ? "text-foreground font-medium" : "text-muted-foreground"
      )}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
