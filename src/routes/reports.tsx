import { useMemo, useState, type ComponentType } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  CheckCircle,
  CircleNotch,
  Drop,
  Eye,
  FileText,
  Flask,
  MagnifyingGlass,
  Pill,
  Quotes,
  Sparkle,
  Stethoscope,
  Tooth,
  WarningCircle,
} from "@phosphor-icons/react/ssr";
import type { IconProps } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { analyzeReport } from "@/lib/mock-extract";
import { fmtDate } from "@/lib/format";
import type { Department, MedicalReport, TreatmentStatus } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { PatientSelect } from "@/components/app/PatientSelect";
import { Dropzone } from "@/components/app/Dropzone";
import { Avatar, Chip, EmptyState, SEVERITY, TREATMENT } from "@/components/app/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Medical reports — MediPulse" },
      {
        name: "description",
        content:
          "Upload test reports and get a short summary, lab values, medicines and the exact evidence sentence.",
      },
      { property: "og:title", content: "Medical reports — MediPulse" },
      {
        property: "og:description",
        content: "AI summaries of medical test reports with verifiable evidence.",
      },
    ],
  }),
  component: ReportsPage,
});

const DEPT: Record<Department, { icon: ComponentType<IconProps>; tone: string }> = {
  "Eye Care": { icon: Eye, tone: "bg-meadow text-primary-foreground" },
  Dental: { icon: Tooth, tone: "bg-amber-glow text-foreground" },
  "Blood Sugar": { icon: Drop, tone: "bg-sunrise text-coral-foreground" },
  Oncology: { icon: Flask, tone: "bg-forest text-primary-foreground" },
  "General Medicine": { icon: Stethoscope, tone: "bg-primary-soft text-primary" },
};

const STAGES = [
  "Reading every page",
  "Finding the diagnosis",
  "Extracting lab values",
  "Matching evidence sentence",
];

function ReportsPage() {
  const { reports, patients, patientById, addReport } = useStore();
  const [pid, setPid] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [fresh, setFresh] = useState<number | null>(null);
  const [dept, setDept] = useState<Department | "All">("All");
  const [status, setStatus] = useState<TreatmentStatus | "all">("all");
  const [q, setQ] = useState("");

  const run = async () => {
    if (!pid || !file) return;
    setBusy(true);
    setStage(0);
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1000);
    const r = await analyzeReport(file.name);
    clearInterval(timer);
    const created = addReport({
      ...r,
      patientId: Number(pid),
      fileName: file.name,
      diagnosedDate: new Date().toISOString().slice(0, 10),
    });
    setBusy(false);
    setFresh(created.id);
    setFile(null);
    setDept("All");
    setStatus("all");
    setQ("");
    toast.success("Report analysed", {
      description: `${created.condition} — added to ${patientById(Number(pid))?.fullName}'s history.`,
    });
  };

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return reports.filter(
      (r) =>
        (dept === "All" || r.department === dept) &&
        (status === "all" || r.treatmentStatus === status) &&
        (!s ||
          [r.condition, patientById(r.patientId)?.fullName, ...r.keywords].some((v) =>
            v?.toLowerCase().includes(s),
          )),
    );
  }, [reports, dept, status, q, patientById]);

  const step = !pid ? 0 : !file ? 1 : 2;

  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Medical reports"
        description="Upload a test report (PDF or photo). The AI writes a short summary, pulls out lab values and medicines, and quotes the exact sentence it relied on."
      />

      {/* Analyse panel */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="surface mb-8 overflow-hidden"
      >
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div className="space-y-6 border-b p-6 lg:border-b-0 lg:border-r sm:p-8">
            <div>
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Sparkle weight="fill" className="size-5 text-coral" /> Analyse a new report
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Takes about 5 seconds.</p>
            </div>
            <ol className="space-y-5">
              <StepRow n={1} active={step === 0} done={step > 0} title="Choose the patient">
                {patients.length ? (
                  <PatientSelect value={pid} onChange={setPid} />
                ) : (
                  <Link
                    to="/patients/new"
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Register a patient first →
                  </Link>
                )}
              </StepRow>
              <StepRow
                n={2}
                active={step === 1}
                done={step > 1}
                title="Upload the report"
                hint={file ? file.name : "Use the box on the right"}
              />
              <StepRow n={3} active={step === 2} done={false} title="Start the analysis">
                <Button
                  size="lg"
                  variant="sunrise"
                  className="w-full"
                  disabled={step < 2 || busy}
                  onClick={run}
                >
                  {busy ? (
                    <CircleNotch weight="bold" className="animate-spin" />
                  ) : (
                    <Sparkle weight="fill" />
                  )}{" "}
                  {busy ? "Analysing…" : "Analyse report"}
                </Button>
              </StepRow>
            </ol>
          </div>
          <div className="p-6 sm:p-8">
            {busy ? (
              <div className="flex min-h-[260px] flex-col justify-center gap-5">
                <div className="flex items-center gap-3">
                  <FileText weight="fill" className="size-6 text-coral" />
                  <span className="truncate font-semibold">{file?.name}</span>
                </div>
                <ul className="space-y-3">
                  {STAGES.map((s, i) => (
                    <motion.li
                      key={s}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: i <= stage ? 1 : 0.4, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <span
                        className={cn(
                          "grid size-8 place-items-center rounded-full transition-colors",
                          i < stage
                            ? "bg-success text-primary-foreground"
                            : i === stage
                              ? "bg-coral-soft text-coral"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {i < stage ? (
                          <CheckCircle weight="fill" className="size-4" />
                        ) : i === stage ? (
                          <CircleNotch weight="bold" className="size-4 animate-spin" />
                        ) : (
                          <span className="text-xs font-bold">{i + 1}</span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          i === stage && "text-foreground",
                          i > stage && "text-muted-foreground",
                        )}
                      >
                        {s}
                      </span>
                    </motion.li>
                  ))}
                </ul>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-sunrise"
                    initial={{ width: "4%" }}
                    animate={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            ) : (
              <Dropzone
                onFile={setFile}
                done={!!file}
                fileName={file?.name}
                title="Drop the medical report here"
                hint="Blood tests, eye scans, dental X-rays, biopsies — single or multi-page."
              />
            )}
          </div>
        </div>
      </motion.section>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <h2 className="text-xl font-semibold">
          Report history <span className="text-muted-foreground">· {list.length}</span>
        </h2>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative">
            <MagnifyingGlass
              weight="bold"
              className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search condition or patient"
              className="h-10 w-full rounded-xl bg-card pl-10 md:w-64"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["All", ...Object.keys(DEPT)] as (Department | "All")[]).map((d) => (
              <button
                key={d}
                onClick={() => setDept(d)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                  dept === d
                    ? "border-primary bg-primary text-primary-foreground shadow-forest"
                    : "bg-card hover:border-primary/30",
                )}
              >
                {d}
              </button>
            ))}
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TreatmentStatus | "all")}
            className="h-10 rounded-xl border bg-card px-3 text-sm font-medium"
          >
            <option value="all">All statuses</option>
            <option value="ongoing">Ongoing</option>
            <option value="treated">Treated</option>
            <option value="not_treated">Not treated</option>
          </select>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<FileText weight="fill" className="size-7" />}
          title="No reports match"
          text="Upload a report above or change the filters."
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {list.map((r, i) => (
              <ReportCard
                key={r.id}
                r={r}
                i={i}
                fresh={fresh === r.id}
                name={patientById(r.patientId)?.fullName ?? "—"}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}

function StepRow({
  n,
  title,
  hint,
  active,
  done,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  active: boolean;
  done: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full font-display text-sm font-semibold transition-all duration-500",
          done
            ? "bg-success text-primary-foreground"
            : active
              ? "bg-primary text-primary-foreground shadow-forest scale-110"
              : "bg-muted text-muted-foreground",
        )}
      >
        {done ? <CheckCircle weight="fill" className="size-5" /> : n}
      </span>
      <div className="min-w-0 flex-1 space-y-2 pt-1.5">
        <div className={cn("text-sm font-semibold", !active && !done && "text-muted-foreground")}>
          {title}
        </div>
        {hint && <div className="truncate text-xs text-muted-foreground">{hint}</div>}
        {children}
      </div>
    </li>
  );
}

function ReportCard({
  r,
  i,
  fresh,
  name,
}: {
  r: MedicalReport;
  i: number;
  fresh: boolean;
  name: string;
}) {
  const D = DEPT[r.department];
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { delay: Math.min(i, 6) * 0.06, duration: 0.5 },
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "surface surface-lift flex flex-col overflow-hidden",
        fresh && "ring-2 ring-coral ring-offset-2 ring-offset-background",
      )}
    >
      <header className="flex items-start gap-4 p-5 pb-4">
        <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${D.tone}`}>
          <D.icon weight="fill" className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span>{r.department}</span>
            <span>·</span>
            <span>{fmtDate(r.diagnosedDate)}</span>
            {fresh && (
              <Chip tone="coral" className="py-0.5">
                New
              </Chip>
            )}
          </div>
          <h3 className="mt-0.5 text-lg font-semibold leading-snug">{r.condition}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip tone={SEVERITY[r.severity]}>{r.severity}</Chip>
            <Chip tone={TREATMENT[r.treatmentStatus].tone} dot>
              {TREATMENT[r.treatmentStatus].label}
            </Chip>
            {r.keywords.map((k) => (
              <Chip key={k} tone="neutral">
                #{k}
              </Chip>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-4 px-5">
        <div className="flex items-center gap-2.5 rounded-2xl bg-muted/50 px-3 py-2">
          <Avatar name={name} id={r.patientId} className="size-7 rounded-lg text-[10px]" />
          <span className="text-sm font-semibold">{name}</span>
        </div>
        <p className="text-[15px] leading-relaxed">{r.summary}</p>
        <blockquote className="relative rounded-2xl border-l-4 border-coral bg-coral-soft/60 p-4 pl-5">
          <Quotes weight="fill" className="absolute right-3 top-3 size-5 text-coral/40" />
          <div className="eyebrow mb-1 text-coral">Evidence from report</div>
          <p className="text-sm italic text-foreground/85">“{r.evidence}”</p>
        </blockquote>

        {r.readings.length > 0 && (
          <div>
            <div className="eyebrow mb-2">Lab values</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {r.readings.map((l) => (
                <div
                  key={l.name}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3 py-2",
                    l.abnormal ? "border-destructive/25 bg-destructive-soft/50" : "bg-card",
                  )}
                >
                  <span className="text-sm text-muted-foreground">{l.name}</span>
                  <span
                    className={cn(
                      "flex items-center gap-1 font-display text-sm font-semibold",
                      l.abnormal && "text-destructive",
                    )}
                  >
                    {l.abnormal && <WarningCircle weight="fill" className="size-4" />}
                    {l.value}
                    {l.unit && (
                      <span className="text-xs font-medium text-muted-foreground"> {l.unit}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {r.medications.length > 0 && (
          <div>
            <div className="eyebrow mb-2">Prescribed medicines</div>
            <ul className="space-y-2">
              {r.medications.map((m) => (
                <li
                  key={m.name}
                  className="flex items-center gap-3 rounded-xl bg-primary-soft/50 px-3 py-2"
                >
                  <Pill weight="fill" className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 text-sm">
                    <span className="font-semibold">{m.name}</span>{" "}
                    <span className="text-muted-foreground">— {m.dosage}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <footer className="mt-5 flex items-center justify-between gap-3 border-t bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1.5">
          <FileText weight="fill" className="size-4 shrink-0" />
          <span className="truncate">{r.fileName}</span> · {r.pages}{" "}
          {r.pages === 1 ? "page" : "pages"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() =>
            toast("Source document", {
              description: `${r.fileName} would open from the uploads folder.`,
            })
          }
        >
          View source
        </Button>
      </footer>
    </motion.article>
  );
}
