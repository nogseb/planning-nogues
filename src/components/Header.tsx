/*
 * Bento Box design: clean floating header with pill navigation (desktop)
 * Mobile: burger menu with full-screen overlay navigation
 */
import { Link, useLocation } from "wouter";
import { Calendar, List, Map, LayoutGrid, Sun, Moon, CalendarDays, BarChart3, Menu, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { path: "/", label: "Planning", icon: CalendarDays },
  { path: "/calendrier", label: "Calendrier", icon: Calendar },
  { path: "/agenda", label: "Activités", icon: LayoutGrid },
  { path: "/liste", label: "Liste", icon: List },
  { path: "/carte", label: "Carte", icon: Map },
  { path: "/stats", label: "Stats", icon: BarChart3 },
];

export default function Header() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  // Fermer le menu au changement de page
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // Bloquer le scroll quand le menu est ouvert
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 no-underline group">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/107695875/3qThhdLNSwZtCbMRAEQe6u/logo-v3-saute-3Q9asQwSoAsCdJi56v7R5v.webp"
              alt="Hélia & Noé"
              className="w-9 h-9 rounded-xl shadow-sm object-cover"
            />
            <div className="flex flex-col">
              <span className="font-heading font-bold text-sm leading-tight text-foreground">
                Hélia & Noé
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                Planning & autres réjouissances
              </span>
            </div>
          </Link>

          {/* Navigation desktop (md et plus) */}
          <nav className="hidden md:flex items-center gap-1 bg-muted/60 rounded-2xl p-1">
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
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Droite : theme toggle + burger mobile */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
              aria-label="Changer de thème"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Burger mobile uniquement */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Overlay menu mobile */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl md:hidden flex flex-col pt-20 px-6 pb-8">
          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const active = location === path;
              return (
                <Link
                  key={path}
                  href={path}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-lg font-medium transition-all duration-200 no-underline ${
                    active
                      ? "bg-muted text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-6 h-6 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
