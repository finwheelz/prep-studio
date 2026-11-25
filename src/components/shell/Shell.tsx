"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { BookOpen, Boxes, Code2, Map as MapIcon, Flame, Layers, LayoutDashboard, Moon, PanelLeft, Search, Sun, Timer } from "lucide-react";
import { useStore, streakOf } from "@/lib/store";
import { useBootStore, useHotkey, useHydrated, useIsMac } from "@/lib/hooks";
import { cn, dayKey } from "@/lib/utils";
import { ICON, Kbd, Tip } from "@/components/ui/bits";
import { CommandPalette } from "./CommandPalette";
import { dailyFor } from "@/lib/daily";

const NAV = [
  { href: "/", label: "Home", short: "Home", icon: LayoutDashboard, match: (p: string) => p === "/" },
  { href: "/learn", label: "Learn", short: "Learn", icon: BookOpen, match: (p: string) => p.startsWith("/learn") || p.startsWith("/quiz") },
  { href: "/roadmap", label: "Roadmaps", short: "Roadmap", icon: MapIcon, match: (p: string) => p.startsWith("/roadmap") || p.startsWith("/mock") },
  { href: "/problems", label: "Practise", short: "Practise", icon: Code2, match: (p: string) => p.startsWith("/problems") || p.startsWith("/p/") },
  { href: "/revise", label: "Revise", short: "Revise", icon: Layers, match: (p: string) => p.startsWith("/revise") },
  { href: "/drill", label: "Drill & OA", short: "Drill", icon: Timer, match: (p: string) => p.startsWith("/drill") },
] as const;

function ThemeSync() {
  const theme = useStore((s) => s.theme);
  const hydrated = useHydrated();
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, hydrated]);
  return null;
}

function NavLinks({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-px p-1.5" aria-label="Primary">
      {NAV.map((n) => {
        const active = n.match(pathname);
        const Icon = n.icon;
        const link = (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 h-8 rounded px-2 text-sm text-muted hover:text-fg hover:bg-inset transition-colors",
              active && "bg-inset text-fg",
              collapsed && "justify-center px-0",
            )}
          >
            <Icon {...ICON} size={16} className="shrink-0" />
            {!collapsed && <span className="truncate">{n.label}</span>}
          </Link>
        );
        return collapsed ? (
          <Tip key={n.href} label={n.label} side="right">
            {link}
          </Tip>
        ) : (
          link
        );
      })}
    </nav>
  );
}

/** Phones get a bottom tab bar in place of the sidebar. */
function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden shrink-0 grid grid-cols-6 border-t border-line bg-panel pb-[env(safe-area-inset-bottom)]" aria-label="Primary">
      {NAV.map((n) => {
        const active = n.match(pathname);
        const Icon = n.icon;
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={cn("flex flex-col items-center justify-center gap-0.5 h-13 text-2xs transition-colors", active ? "text-fg" : "text-faint hover:text-fg")}
          >
            <Icon {...ICON} size={18} />
            {n.short}
          </Link>
        );
      })}
    </nav>
  );
}

function StreakIndicator({ collapsed }: { collapsed: boolean }) {
  const hydrated = useHydrated();
  const activity = useStore((s) => s.activity);
  const done = useStore((s) => s.dailyDone[dayKey()]);
  const { current } = hydrated ? streakOf(activity) : { current: 0 };
  const today = dayKey();
  const slots = Object.keys(dailyFor(today).slots) as ("sql" | "ml" | "case")[];
  const n = hydrated ? slots.filter((s) => done?.[s]).length : 0;
  const activeToday = hydrated && !!activity[today];
  return (
    <Tip side="right" label={`${current}-day streak · today's triad ${n}/3`}>
      <Link href="/drill" className={cn("flex items-center gap-2 h-9 px-3 border-t border-line text-xs hover:bg-inset", collapsed && "justify-center px-0")}>
        <Flame {...ICON} size={15} className={activeToday ? "text-accent" : "text-faint"} />
        {!collapsed && (
          <>
            <span className="num text-fg">{current}</span>
            <span className="text-muted">day streak</span>
            <span className="ml-auto flex gap-0.5" aria-label={`Triad ${n} of 3`}>
              {slots.map((s) => (
                <span key={s} className={cn("h-1.5 w-3 rounded-sm", hydrated && done?.[s] ? "bg-accent" : "bg-line-strong")} />
              ))}
            </span>
          </>
        )}
      </Link>
    </Tip>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  useBootStore();
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const theme = useStore((s) => s.theme);
  const setPalette = useStore((s) => s.setPalette);
  const hydrated = useHydrated();
  const mac = useIsMac();
  const pathname = usePathname();
  // The assessment room is full-bleed: no chrome, nothing to click away to.
  const bare = /^\/drill\/oa\/.+/.test(pathname);

  useHotkey("mod+k", (e) => {
    e.preventDefault();
    setPalette(true);
  });
  useHotkey("mod+b", (e) => {
    e.preventDefault();
    toggleSidebar();
  }, !bare);

  const isCollapsed = hydrated && collapsed;

  return (
    <TooltipPrimitive.Provider>
      <ThemeSync />
      {bare ? (
        <main className="h-dvh">{children}</main>
      ) : (
        <div className="h-dvh flex">
          <aside className={cn("shrink-0 border-r border-line bg-panel flex flex-col transition-[width] duration-150", isCollapsed ? "w-12" : "w-56", "max-md:hidden")}>
            <div className={cn("h-11 flex items-center border-b border-line px-3 gap-2", isCollapsed && "justify-center px-0")}>
              <Boxes {...ICON} size={16} className="text-fg shrink-0" />
              {!isCollapsed && <span className="text-sm font-semibold tracking-tight">Prep Studio</span>}
            </div>
            <Suspense fallback={null}>
              <NavLinks collapsed={isCollapsed} />
            </Suspense>
            <div className="mt-auto">
              <StreakIndicator collapsed={isCollapsed} />
            </div>
          </aside>

          <div className="flex-1 min-w-0 flex flex-col">
            <header className="h-11 shrink-0 border-b border-line bg-panel flex items-center gap-2 px-2">
              <Tip label={<span className="flex items-center gap-1.5">Toggle sidebar <Kbd>{mac ? "⌘" : "Ctrl"}</Kbd><Kbd>B</Kbd></span>}>
                <button className="btn-ghost w-7 px-0 max-md:hidden" onClick={toggleSidebar} aria-label="Toggle sidebar">
                  <PanelLeft {...ICON} size={15} />
                </button>
              </Tip>
              <Link href="/" className="md:hidden flex items-center gap-2 px-1 text-sm font-semibold whitespace-nowrap shrink-0">
                <Boxes {...ICON} size={16} /> Prep Studio
              </Link>
              <button
                onClick={() => setPalette(true)}
                className="ml-1 flex items-center gap-2 h-7 w-full min-w-0 max-w-sm rounded border border-line bg-bg px-2 text-xs text-faint hover:border-line-strong transition-colors"
              >
                <Search {...ICON} />
                <span className="truncate">Search notes, topics, problems…</span>
                <span className="ml-auto flex gap-1 shrink-0 max-sm:hidden">
                  <Kbd>{mac ? "⌘" : "Ctrl"}</Kbd>
                  <Kbd>K</Kbd>
                </span>
              </button>
              <div className="ml-auto flex items-center gap-1">
                <Tip label={theme === "dark" ? "Light theme" : "Dark theme"}>
                  <button className="btn-ghost w-7 px-0" onClick={toggleTheme} aria-label="Toggle theme">
                    {hydrated && theme === "light" ? <Moon {...ICON} size={15} /> : <Sun {...ICON} size={15} />}
                  </button>
                </Tip>
              </div>
            </header>
            <main className="flex-1 min-h-0 overflow-auto">{children}</main>
            <MobileNav />
          </div>
        </div>
      )}
      <CommandPalette />
    </TooltipPrimitive.Provider>
  );
}
