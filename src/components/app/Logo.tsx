import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function EcgLine({
  className,
  delay = 0,
  duration = 1.6,
}: {
  className?: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <svg viewBox="0 0 120 40" fill="none" className={className} aria-hidden>
      <motion.path
        d="M0 22 H30 L36 22 L41 8 L48 34 L54 14 L58 22 H78 L82 18 L86 22 H120"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration, delay, ease: [0.65, 0, 0.35, 1] }}
      />
    </svg>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative grid size-10 shrink-0 place-items-center rounded-2xl bg-sunrise text-coral-foreground shadow-coral",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[60%]" fill="currentColor" aria-hidden>
        <path
          d="M12 21.6c-.3 0-.6-.1-.8-.3C5.6 16.6 2 13.3 2 9.2 2 6 4.5 3.5 7.6 3.5c1.8 0 3.4.8 4.4 2.1 1-1.3 2.6-2.1 4.4-2.1C19.5 3.5 22 6 22 9.2c0 4.1-3.6 7.4-9.2 12.1-.2.2-.5.3-.8.3Z"
          opacity=".35"
        />
        <path
          d="M4 12.2h3.6l1.5-3.4 2.4 6.6 2-4.6 1.1 1.4H20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
