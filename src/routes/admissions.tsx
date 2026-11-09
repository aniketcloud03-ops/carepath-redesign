import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Bed,
  CalendarBlank,
  CheckCircle,
  ClockCountdown,
  SignOut,
  Trophy,
  UserPlus,
} from "@phosphor-icons/react/ssr";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { fmtDate, stayDays, todayISO } from "@/lib/format";
import { PageHeader } from "@/components/app/PageHeader";
import { PatientSelect } from "@/components/app/PatientSelect";
import { AnimatedNumber, Avatar, Chip, EmptyState, Rise, Stagger } from "@/components/app/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions — MediPulse" },
      {
        name: "description",
        content: "Admit and discharge patients. Length of stay is calculated automatically.",
      },
      { property: "og:title", content: "Admissions — MediPulse" },
      {
        property: "og:description",
        content: "Admit and discharge patients with automatic stay tracking.",
      },
    ],
  }),
  component: AdmissionsPage,
});

const REASONS = ["Eye surgery", "Root canal", "Blood sugar control", "Fever & infection", "Biopsy"];

function AdmissionsPage() {
  const { admissions, patients, patientById, addAdmission, discharge } = useStore();
  const [tab, setTab] = useState<"now" | "history">("now");
  const [pid, setPid] = useState("");
  const [date, setDate] = useState(todayISO());
  const [reason, setReason] = useState("");

  const active = admissions.filter((a) => !a.dischargeDate);
  const done = admissions
    .filter((a) => a.dischargeDate)
    .sort((a, b) => (b.dischargeDate ?? "").localeCompare(a.dischargeDate ?? ""));
  const durations = done.map((a) => stayDays(a.admissionDate, a.dischargeDate));
  const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const longest = durations.length ? Math.max(...durations) : 0;

  const admit = () => {
    if (!pid || !reason.trim()) return;
    addAdmission({ patientId: Number(pid), admissionDate: date, reason: reason.trim() });
    toast.success(`${patientById(Number(pid))?.fullName} admitted`, {
      description: `Stay counter started from ${fmtDate(date)}.`,
    });
    setPid("");
    setReason("");
    setTab("now");
  };

  const stats = [
    {
      label: "In hospital now",
      value: active.length,
      icon: Bed,
      tone: "bg-sunrise text-coral-foreground",
    },
    {
      label: "Discharged",
      value: done.length,
      icon: CheckCircle,
      tone: "bg-meadow text-primary-foreground",
    },
    {
      label: "Average stay",
      value: avg,
      decimals: 1,
      suffix: "days",
      icon: ClockCountdown,
      tone: "bg-amber-glow text-foreground",
    },
    {
      label: "Longest stay",
      value: longest,
      suffix: "days",
      icon: Trophy,
      tone: "bg-forest text-primary-foreground",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Patient care"
        title="Admissions"
        description="Admit a patient when they arrive and discharge them when they leave. The number of days is worked out for you."
      />

      <Stagger className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <Rise key={s.label} className="surface flex items-center gap-4 p-4 sm:p-5">
            <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${s.tone}`}>
              <s.icon weight="fill" className="size-6" />
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <AnimatedNumber
                  value={s.value}
                  decimals={s.decimals}
                  className="font-display text-2xl font-semibold"
                />
                {s.suffix && (
                  <span className="text-xs font-semibold text-muted-foreground">{s.suffix}</span>
                )}
              </div>
              <div className="truncate text-sm text-muted-foreground">{s.label}</div>
            </div>
          </Rise>
        ))}
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Admit form */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="surface h-fit overflow-hidden lg:sticky lg:top-24"
        >
          <div className="relative overflow-hidden bg-forest grain px-6 py-5 text-primary-foreground">
            <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-sunrise opacity-40 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-primary-foreground/15">
                <Bed weight="fill" className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-primary-foreground">Admit a patient</h2>
                <p className="text-sm text-primary-foreground/75">Three quick fields</p>
              </div>
            </div>
          </div>
          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <Label className="font-semibold">1. Patient</Label>
              <PatientSelect
                value={pid}
                onChange={setPid}
                exclude={active.map((a) => a.patientId)}
              />
              <Link
                to="/patients/new"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <UserPlus weight="fill" /> Not registered yet? Register first
              </Link>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">2. Admission date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">3. Reason</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Eye surgery"
                className="h-12 rounded-xl"
              />
              <div className="flex flex-wrap gap-1.5">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      reason === r
                        ? "border-primary bg-primary-soft text-primary"
                        : "hover:border-primary/30 hover:bg-muted",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <Button
              size="lg"
              variant="sunrise"
              className="w-full"
              disabled={!pid || !reason.trim()}
              onClick={admit}
            >
              <Bed weight="fill" /> Admit patient
            </Button>
          </div>
        </motion.section>

        {/* Lists */}
        <section className="min-w-0">
          <div className="mb-4 inline-flex rounded-2xl bg-card p-1 shadow-soft">
            {(
              [
                ["now", `In hospital now · ${active.length}`],
                ["history", `Discharged · ${done.length}`],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={cn(
                  "relative rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  tab === k
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab === k && (
                  <motion.span
                    layoutId="adm-tab"
                    className="absolute inset-0 rounded-xl bg-primary shadow-forest"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{l}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "now" ? (
              <motion.div
                key="now"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                {active.length === 0 ? (
                  <EmptyState
                    icon={<Bed weight="fill" className="size-7" />}
                    title="No one is admitted"
                    text={
                      patients.length
                        ? "Use the form to admit a patient."
                        : "Register a patient first, then admit them here."
                    }
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <AnimatePresence>
                      {active.map((a, i) => {
                        const p = patientById(a.patientId);
                        const days = stayDays(a.admissionDate);
                        return (
                          <motion.article
                            key={a.id}
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.96 }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              scale: 1,
                              transition: { delay: i * 0.06 },
                            }}
                            exit={{ opacity: 0, scale: 0.9, x: 40 }}
                            className="surface surface-lift relative overflow-hidden p-5"
                          >
                            <div className="absolute inset-x-0 top-0 h-1 bg-sunrise" />
                            <div className="flex items-start gap-3">
                              <Avatar name={p?.fullName ?? "?"} id={a.patientId} />
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-semibold">{p?.fullName}</div>
                                <div className="truncate text-sm text-muted-foreground">
                                  {a.reason}
                                </div>
                              </div>
                              <Chip tone="coral" dot>
                                Admitted
                              </Chip>
                            </div>
                            <div className="mt-5 flex items-end justify-between gap-3">
                              <div>
                                <div className="flex items-baseline gap-1">
                                  <span className="font-display text-4xl font-semibold text-coral">
                                    {days}
                                  </span>
                                  <span className="text-sm font-semibold text-muted-foreground">
                                    {days === 1 ? "day so far" : "days so far"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <CalendarBlank weight="fill" /> since {fmtDate(a.admissionDate)}
                                </div>
                              </div>
                              <DischargeButton
                                min={a.admissionDate}
                                onConfirm={(d) => {
                                  discharge(a.id, d);
                                  toast.success(`${p?.fullName} discharged`, {
                                    description: `Total stay: ${stayDays(a.admissionDate, d)} days`,
                                  });
                                }}
                              />
                            </div>
                          </motion.article>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="surface overflow-hidden"
              >
                {done.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">
                    No discharges yet.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {done.map((a, i) => {
                      const p = patientById(a.patientId);
                      const days = stayDays(a.admissionDate, a.dischargeDate);
                      return (
                        <motion.li
                          key={a.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1.4fr)_auto]"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar
                              name={p?.fullName ?? "?"}
                              id={a.patientId}
                              className="size-10 rounded-xl"
                            />
                            <div className="min-w-0">
                              <div className="truncate font-semibold">{p?.fullName}</div>
                              <div className="truncate text-sm text-muted-foreground">
                                {a.reason}
                              </div>
                            </div>
                          </div>
                          <div className="hidden text-sm sm:block">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {fmtDate(a.admissionDate, "d MMM")}
                              </span>
                              <span className="h-px w-6 bg-border" />
                              <span className="font-medium">
                                {fmtDate(a.dischargeDate, "d MMM yyyy")}
                              </span>
                            </div>
                            <div className="mt-1.5 h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-muted">
                              <motion.div
                                className="h-full rounded-full bg-meadow"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.min(100, (days / Math.max(longest, 1)) * 100)}%`,
                                }}
                                transition={{ delay: 0.2 + i * 0.05, duration: 0.9 }}
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-display text-xl font-semibold text-primary">
                              {days}
                              <span className="ml-1 text-xs text-muted-foreground">days</span>
                            </div>
                            <Chip tone="success">Discharged</Chip>
                          </div>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </>
  );
}

function DischargeButton({ min, onConfirm }: { min: string; onConfirm: (d: string) => void }) {
  const [d, setD] = useState(todayISO());
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <SignOut weight="fill" /> Discharge
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 rounded-2xl p-4">
        <div className="font-semibold">Discharge date</div>
        <p className="mb-3 text-xs text-muted-foreground">
          Stay length is calculated from this date.
        </p>
        <Input
          type="date"
          min={min}
          value={d}
          onChange={(e) => setD(e.target.value)}
          className="h-11 rounded-xl"
        />
        <Button
          className="mt-3 w-full"
          onClick={() => {
            onConfirm(d);
            setOpen(false);
          }}
        >
          <CheckCircle weight="fill" /> Confirm discharge
        </Button>
      </PopoverContent>
    </Popover>
  );
}
