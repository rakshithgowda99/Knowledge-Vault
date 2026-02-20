import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Star, Tag, Plus, Library, Menu, X, LogIn, LogOut, User, Mail, CalendarDays } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useUser, useLogout } from "@/hooks/use-auth";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { data: user } = useUser();
  const logoutMutation = useLogout();

  const navItems = [
    { icon: Library, label: "All Articles", href: "/", requiresAuth: false },
    { icon: Star, label: "Favorites", href: "/favorites", requiresAuth: true },
    { icon: Tag, label: "Tags", href: "/tags", requiresAuth: false },
  ];

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    onNavigate?.();
  };

  return (
    <>
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <BookOpen className="w-5 h-5" />
        </div>
        <h1 className="font-display font-bold text-xl tracking-tight text-primary">WikiBase</h1>
      </div>

      {user && (
        <div className="space-y-2">
          <Link href="/new" onClick={onNavigate}>
            <Button className="w-full justify-start gap-2 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all font-medium">
              <Plus className="w-4 h-4" />
              New Article
            </Button>
          </Link>
        </div>
      )}

      <nav className="flex-1 space-y-1">
        {navItems
          .filter(item => !item.requiresAuth || user)
          .map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={onNavigate} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-white text-primary shadow-sm border border-border/50" 
                  : "text-muted-foreground hover:bg-black/5 hover:text-foreground"
              )}>
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
      </nav>

      {/* User section */}
      <div className="space-y-3">
        {user ? (
          <div className="p-4 bg-card rounded-xl border border-border/50 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{user.username}</p>
              </div>
            </div>
            <div className="space-y-1.5 pt-1 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Link href="/auth" onClick={onNavigate}>
            <Button variant="outline" className="w-full justify-start gap-2">
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: user } = useUser();

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>

        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-lg text-primary">WikiBase</span>
        </Link>

        {user ? (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
            {user.username.charAt(0).toUpperCase()}
          </div>
        ) : (
          <Link href="/auth">
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </Button>
          </Link>
        )}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 h-full bg-secondary/95 backdrop-blur-sm flex flex-col p-6 gap-8 shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-md hover:bg-black/10 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="w-64 border-r border-border h-screen sticky top-0 bg-secondary/20 hidden md:flex flex-col p-6 gap-8">
        <SidebarContent />
      </aside>
    </>
  );
}
