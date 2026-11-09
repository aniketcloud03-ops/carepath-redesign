import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowRight,
  Bed,
  ChartBar,
  ClockCountdown,
  FileText,
  Lightning,
  Pulse,
  Robot,
  UserPlus,
  Users,
} from "@phosphor-icons/react/ssr";
import { useStore } from "@/lib/store";
import { fmtDate, greeting, relativeTime, stayDays } from "@/lib/format";
import { AnimatedNumber, Avatar, Chip, Rise, SectionTitle, Stagger } from "@/components/app/bits";
import { EcgLine } from "@/components/app/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — MediPulse" },
      { name: "description", content: "Today's patients, admissions, reports and quick actions at a glance." },
      { property: "og:title", content: "Overview — MediPulse" },
      { property: "og:description", content: "Today's patients, admissions, reports and quick actions at a glance." },
    ],
  }),
  component: Overview,
});

const ACTIONS = [
  { to: "/patients/new", icon: UserPlus, title: "Register a patient", text: "Scan Aadhaar or PAN card", tone: "bg-sunrise text-coral-foreground" },
  { to: "/admissions", icon: Bed, title: "Admit or discharge", text: "Track hospital stays", tone: "bg-meadow text-primary-foreground" },
  { to: "/reports", icon: FileText, title: "Upload a report", text: "AI summary in seconds", tone: "bg-amber-glow text-foreground" },
  { to: "/assistant", icon: Robot, title: "Ask the assistant", text: "Questions in plain English", tone: "bg-forest text-primary-foreground" },
] as const;

function Overview() {
  const { patients, admissions, reports, audit, patientById } = useStore();
  const active = admissions.filter((a) => !a.dischargeDate);
  const done = admissions.filter((a) => a.dischargeDate);
  const avgStay = done.length ? done.reduce((s, a) => s + stayDays(a.admissionDate, a.dischargeDate), 0) / done.length : 0;

  const byMonth = new Map<string, number>();
  admissions.forEach((a) => byMonth.set(a.admissionDate.slice(0, 7), (byMonth.get(a.admissionDate.slice(0, 7)) ?? 0) + 1));
  const trend = [...byMonth.entries()].sort().map(([k, v]) => ({ month: fmtDate(k + "-01", "MMM"), admissions: v }));

  const byDept = new Map<string, number>();
  reports.forEach((r) => byDept.set(r.department, (byDept.get(r.department) ?? 0) + 1));
  const depts = [...byDept.entries()].sort((a, b) => b[1] - a[1]);
  const maxDept = Math.max(1, ...depts.map((d) => d[1]));

  const stats = [
    { label: "Registered patients", value: patients.length, icon: Users, hint: "Verified with Aadhaar / PAN", to: "/patients" },
    { label: "Currently admitted", value: active.length, icon: Bed, hint: "Beds occupied right now", to: "/admissions" },
    { label: "Average stay", value: avgStay, decimals: 1, suffix: "days", icon: ClockCountdown, hint: "Discharged patients", to: "/admissions" },
    { label: "Reports analysed", value: reports.length, icon: FileText, hint: "Summarised by AI", to: "/reports" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative overflow-hidden rounded-[28px] bg-forest grain p-6 text-primary-foreground shadow-forest sm:p-10"
      >
        <div className="pointer-events-none absolute -right-24 -top-32 size-[460px] rounded-full bg-sunrise opacity-40 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 size-[360px] rounded-full bg-meadow opacity-30 blur-3xl" />
        <EcgLine className="pointer-events-none absolute right-6 top-8 hidden h-24 w-80 text-primary-foreground/25 md:block" delay={0.6} duration={2.2} />

        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/12 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Lightning weight="fill" className="size-3.5 text-sidebar-primary" /> {active.length} patients in care today
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }} className="mt-4 text-3xl font-semibold leading-tight text-primary-foreground sm:text-[2.6rem]">
              {greeting()}, Doctor.
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.7 }} className="mt-3 max-w-md text-[15px] leading-relaxed text-primary-foreground/80">
              Everything starts with a patient. Register them once — admissions, reports and answers all link back automatically.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="sunrise" size="lg">
                <Link to="/patients/new"><UserPlus weight="fill" /> Register new patient</Link>
              </Button>
              <Button asChild variant="glass" size="lg">
                <Link to="/assistant"><Robot weight="fill" /> Ask a question</Link>
              </Button>
            </motion.div>
          </div>

          <Stagger className="grid grid-cols-2 gap-3">
            {ACTIONS.map((a, i) => (
              <Rise key={a.to}>
                <Link to={a.to} className="group flex h-full flex-col justify-between gap-6 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.07] p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-primary-foreground/[0.14]">
                  <div className="flex items-start justify-between">
                    <span className={`grid size-10 place-items-center rounded-xl ${a.tone}`}><a.icon weight="fill" className="size-5" /></span>
                    <span className="font-display text-xs font-semibold text-primary-foreground/50">0{i + 1}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 font-semibold">
                      {a.title}
                      <ArrowRight weight="bold" className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </div>
                    <div className="text-xs text-primary-foreground/65">{a.text}</div>
                  </div>
                </Link>
              </Rise>
            ))}
          </Stagger>
        </div>
      </motion.section>

      {/* Stats */}
      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Rise key={s.label}>
            <Link to={s.to} className="surface surface-lift group block p-5">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <s.icon weight="fill" className="size-5" />
                </span>
                <ArrowRight weight="bold" className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <div className="mt-5 flex items-baseline gap-1.5">
                <AnimatedNumber value={s.value} decimals={s.decimals} className="font-display text-4xl font-semibold tracking-tight" />
                {s.suffix && <span className="text-sm font-semibold text-muted-foreground">{s.suffix}</span>}
              </div>
              <div className="mt-1 font-semibold">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.hint}</div>
            </Link>
          </Rise>
        ))}
      </Stagger>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Trend */}
        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="surface p-6">
          <SectionTitle icon={<Pulse weight="fill" className="size-5" />} title="Admissions by month" hint="How many patients were admitted each month" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="adm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--coral)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--coral)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 6" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid var(--border)", background: "var(--card)", boxShadow: "var(--shadow-soft)" }} />
                <Area type="monotone" dataKey="admissions" stroke="var(--coral)" strokeWidth={3} fill="url(#adm)" animationDuration={1600} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Departments */}
        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} className="surface p-6">
          <SectionTitle
            icon={<ChartBar weight="fill" className="size-5" />}
            title="Conditions by department"
            hint="From analysed reports"
            action={<Button asChild variant="ghost" size="sm"><Link to="/reports">View all</Link></Button>}
          />
          <div className="space-y-4">
            {depts.length === 0 && <p className="text-sm text-muted-foreground">No reports yet.</p>}
            {depts.map(([name, n], i) => (
              <div key={name}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-semibold">{name}</span>
                  <span className="text-muted-foreground">{n} {n === 1 ? "report" : "reports"}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={i % 2 ? "h-full rounded-full bg-meadow" : "h-full rounded-full bg-sunrise"}
                    initial={{ width: 0 }}
                    animate={{ width: `${(n / maxDept) * 100}%` }}
                    transition={{ delay: 0.6 + i * 0.12, duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="surface p-6">
          <SectionTitle
            icon={<Bed weight="fill" className="size-5" />}
            title="Patients in hospital now"
            hint="Days are counted automatically"
            action={<Button asChild variant="outline" size="sm"><Link to="/admissions">Manage</Link></Button>}
          />
          {active.length === 0 ? (
            <p className="rounded-2xl bg-muted/60 p-6 text-center text-sm text-muted-foreground">No one is admitted right now.</p>
          ) : (
            <ul className="divide-y">
              {active.map((a, i) => {
                const p = patientById(a.patientId);
                return (
                  <motion.li key={a.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }} className="flex items-center gap-4 py-3.5">
                    <Avatar name={p?.fullName ?? "?"} id={a.patientId} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{p?.fullName}</div>
                      <div className="truncate text-sm text-muted-foreground">{a.reason}</div>
                    </div>
                    <div className="text-right">
                      <Chip tone="coral" dot>Day {stayDays(a.admissionDate) + 1}</Chip>
                      <div className="mt-1 text-xs text-muted-foreground">since {fmtDate(a.admissionDate, "d MMM")}</div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="surface p-6">
          <SectionTitle icon={<Lightning weight="fill" className="size-5" />} title="Recent activity" hint="Latest changes, newest first" />
          <ol className="space-y-4">
            {audit.slice(0, 6).map((e, i) => (
              <motion.li key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.06 }} className="flex gap-3">
                <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${e.action === "Discharged" ? "bg-success" : e.action === "Admitted" ? "bg-coral" : "bg-primary"}`} />
                <div className="min-w-0">
                  <div className="text-sm"><span className="font-semibold">{e.action}</span> <span className="text-muted-foreground">· {relativeTime(e.at)}</span></div>
                  <div className="truncate text-sm text-muted-foreground">{e.detail}</div>
                </div>
              </motion.li>
            ))}
            {audit.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet.</p>}
          </ol>
        </section>
      </div>
    </div>
  );
}
