/*
 * Bento Box design: clean floating header with pill navigation
 */
import { Link, useLocation } from "wouter";
import { Calendar, List, Map, LayoutGrid, Sun, Moon, CalendarDays } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const NAV_ITEMS = [
  { path: "/", label: "Planning", icon: CalendarDays },
  { path: "/calendrier", label: "Calendrier", icon: Calendar },
  { path: "/agenda", label: "Activités", icon: LayoutGrid },
  { path: "/liste", label: "Liste", icon: List },
  { path: "/carte", label: "Carte", icon: Map },
];

export default function Header() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline group">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm">
            HN
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-sm leading-tight text-foreground">
              Hélia & Noé
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              Toulouse
            </span>
          </div>
        </Link>

        {/* Navigation pills */}
        <nav className="flex items-center gap-1 bg-muted/60 rounded-2xl p-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = location === path;
            return (
              <Link
                key={path}
                href={path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 no-underline ${
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
          aria-label="Changer de thème"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
}
