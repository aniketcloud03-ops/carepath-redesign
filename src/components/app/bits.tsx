import { useEffect, useRef, type ReactNode } from "react";
import { animate, motion, useInView, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import type { Severity, TreatmentStatus } from "@/lib/types";

export function AnimatedNumber({
  value,
  decimals = 0,
  className,
}: {
  value: number;
  decimals?: number | undefined;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = v.toFixed(decimals);
      },
    });
    return () => controls.stop();
  }, [inView, value, decimals]);
  return (
    <span ref={ref} className={className}>
      {value.toFixed(decimals)}
    </span>
  );
}

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
export const rise: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] } },
};

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  );
}
export function Rise({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={rise} className={className}>
      {children}
    </motion.div>
  );
}

const TONES = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-destructive-soft text-destructive",
  primary: "bg-primary-soft text-primary",
  coral: "bg-coral-soft text-coral",
  neutral: "bg-muted text-muted-foreground",
} as const;
export type Tone = keyof typeof TONES;

export function Chip({
  tone = "neutral",
  children,
  className,
  dot,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export const TREATMENT: Record<TreatmentStatus, { label: string; tone: Tone }> = {
  ongoing: { label: "Ongoing treatment", tone: "warning" },
  treated: { label: "Treated", tone: "success" },
  not_treated: { label: "Not treated", tone: "danger" },
  unknown: { label: "Unknown", tone: "neutral" },
};
export const SEVERITY: Record<Severity, Tone> = {
  Mild: "success",
  Moderate: "warning",
  Severe: "danger",
};

const AVATAR_TONES = [
  "bg-sunrise text-coral-foreground",
  "bg-forest text-primary-foreground",
  "bg-meadow text-primary-foreground",
  "bg-amber-glow text-foreground",
];

export function Avatar({ name, id, className }: { name: string; id: number; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-2xl font-display text-sm font-semibold",
        AVATAR_TONES[id % AVATAR_TONES.length],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed bg-card/60 px-6 py-14 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionTitle({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{title}</h2>
          {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
