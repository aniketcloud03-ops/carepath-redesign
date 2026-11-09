import { useEffect, useState } from "react";
import { LogoMark } from "./Logo";

export const SPLASH_KEY = "medipulse-intro-seen";

/**
 * Short cinematic intro, once per browser session.
 * Pure CSS animation so it plays (and fades out) even before the app finishes loading.
 * An inline head script adds `no-splash` to <html> on repeat visits so it never shows.
 */
export function Splash() {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (window.sessionStorage.getItem(SPLASH_KEY)) {
      setMounted(false);
      return;
    }
    window.sessionStorage.setItem(SPLASH_KEY, "1");
    const t = setTimeout(() => setMounted(false), 2600);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  return (
    <div className="splash fixed inset-0 z-[100] grid place-items-center bg-canopy text-sidebar-foreground" aria-hidden>
      <div className="pointer-events-none absolute -top-40 right-0 size-[520px] rounded-full bg-sunrise opacity-25 blur-3xl" />
      <div className="flex flex-col items-center gap-5">
        <div className="splash-logo">
          <LogoMark className="size-16 rounded-3xl" />
        </div>
        <h1 className="splash-title font-display text-3xl font-semibold">MediPulse</h1>
        <svg viewBox="0 0 120 40" fill="none" className="h-10 w-56 text-sidebar-primary">
          <path
            className="splash-ecg"
            d="M0 22 H30 L36 22 L41 8 L48 34 L54 14 L58 22 H78 L82 18 L86 22 H120"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
          />
        </svg>
        <p className="splash-sub text-sm text-sidebar-muted">Patient records, simplified.</p>
      </div>
    </div>
  );
}
