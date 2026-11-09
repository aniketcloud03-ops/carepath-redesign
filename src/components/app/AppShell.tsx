import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Gear, List, Question, X } from "@phosphor-icons/react/ssr";
import { NAV } from "./nav";
import { LogoMark } from "./Logo";
import { SettingsDialog } from "./SettingsDialog";
import { HelpDialog } from "./HelpDialog";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function isActive(path: string, to: string) {
  if (to === "/") return path === "/";
  if (to === "/patients") return path === "/patients" || path === "/patients/";
  return path.startsWith(to);
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { apiKey } = useStore();

  return (
    <div className="flex h-full flex-col">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-3 px-5 pb-6 pt-6">
        <LogoMark />
        <div className="min-w-0">
          <div className="font-display text-lg font-semibold leading-tight">MediPulse</div>
          <div className="text-xs text-sidebar-muted">Patient data management</div>
        </div>
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3">
        {NAV.map((g, gi) => (
          <div key={g.group}>
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-sidebar-muted/80">
              {g.group}
            </div>
            <ul className="space-y-1">
              {g.items.map((item, i) => {
                const active = isActive(path, item.to);
                return (
                  <motion.li
                    key={item.to}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + (gi * 3 + i) * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors",
                        active
                          ? "text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-accent",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-2xl bg-sunrise shadow-coral"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                      <span
                        className={cn(
                          "relative grid size-9 shrink-0 place-items-center rounded-xl transition-colors",
                          active
                            ? "bg-sidebar-primary-foreground/10"
                            : "bg-sidebar-accent group-hover:bg-sidebar-border",
                        )}
                      >
                        <item.icon weight="fill" className="size-[18px]" />
                      </span>
                      <span className="relative min-w-0">
                        <span className="block text-sm font-semibold leading-tight">
                          {item.label}
                        </span>
                        <span
                          className={cn(
                            "block truncate text-xs",
                            active ? "text-sidebar-primary-foreground/70" : "text-sidebar-muted",
                          )}
                        >
                          {item.hint}
                        </span>
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-3 p-4">
        <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-3.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inset-0 rounded-full bg-success animate-pulse-ring" />
              <span className="relative size-2.5 rounded-full bg-success" />
            </span>
            <span className="font-semibold">Database online</span>
          </div>
          <div className="mt-1.5 pl-[18px] text-sidebar-muted">
            AI: {apiKey ? "Gemini connected" : "Demo mode — add key in Settings"}
          </div>
        </div>
        <SettingsDialog>
          <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent">
            <Gear weight="fill" className="size-5" /> Settings
          </button>
        </SettingsDialog>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen lg:pl-[288px]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[288px] bg-canopy text-sidebar-foreground lg:block">
        <div className="pointer-events-none absolute -right-24 top-1/3 size-64 rounded-full bg-sunrise opacity-[0.12] blur-3xl" />
        <SidebarBody />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[288px] bg-canopy text-sidebar-foreground lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              <button
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-6 grid size-9 place-items-center rounded-xl bg-sidebar-accent"
              >
                <X weight="bold" className="size-4" />
              </button>
              <SidebarBody onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-8">
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <List weight="bold" />
          </Button>
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <LogoMark className="size-8 rounded-xl" />
            <span className="font-display font-semibold">MediPulse</span>
          </div>
          <div className="hidden text-sm text-muted-foreground lg:block">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <HelpDialog>
              <Button variant="ghost" size="sm" className="h-10 gap-2 rounded-xl px-3">
                <Question weight="fill" className="text-coral" />{" "}
                <span className="hidden sm:inline">How it works</span>
              </Button>
            </HelpDialog>
            <div className="grid size-10 place-items-center rounded-full bg-primary-soft font-display text-sm font-semibold text-primary">
              DR
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 pb-20 pt-6 sm:px-8 sm:pt-8">
        <motion.div
          key={path}
          initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
