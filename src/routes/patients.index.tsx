import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { CaretRight, Eye, EyeSlash, MagnifyingGlass, ShieldCheck, UserPlus, Users } from "@phosphor-icons/react/ssr";
import { useStore } from "@/lib/store";
import { formatAadhaar, maskAadhaar } from "@/lib/validation";
import { stayDays } from "@/lib/format";
import { PageHeader } from "@/components/app/PageHeader";
import { Avatar, Chip, EmptyState } from "@/components/app/bits";
import { PatientSheet } from "@/components/app/PatientSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patients/")({
  head: () => ({
    meta: [
      { title: "Patients — MediPulse" },
      { name: "description", content: "Search and open every registered patient record." },
      { property: "og:title", content: "Patients — MediPulse" },
      { property: "og:description", content: "Search and open every registered patient record." },
    ],
  }),
  component: PatientsPage,
});

const FILTERS = ["All", "Admitted", "Insured", "Self pay"] as const;

function PatientsPage() {
  const { patients, admissions, reports } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [unmask, setUnmask] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return patients
      .map((p) => ({ p, stay: admissions.find((a) => a.patientId === p.id && !a.dischargeDate), nReports: reports.filter((r) => r.patientId === p.id).length }))
      .filter(({ p, stay }) => {
        if (filter === "Admitted" && !stay) return false;
        if (filter === "Insured" && !p.insurance) return false;
        if (filter === "Self pay" && p.insurance) return false;
        if (!s) return true;
        return [p.fullName, p.mobile, p.aadhaar, p.pan, String(p.id)].some((v) => v?.toLowerCase().includes(s));
      })
      .reverse();
  }, [patients, admissions, reports, q, filter]);

  return (
    <>
      <PageHeader
        eyebrow="Patient care"
        title="Patients"
        description="Every registered patient in one place. Click anyone to see their stays, conditions and medicines."
        actions={<Button asChild variant="sunrise" size="lg"><Link to="/patients/new"><UserPlus weight="fill" /> Register patient</Link></Button>}
      />

      <div className="surface mb-5 flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <MagnifyingGlass weight="bold" className="absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, mobile, Aadhaar or PAN…" className="h-12 rounded-xl border-0 bg-muted/60 pl-11 text-[15px] shadow-none focus-visible:ring-2" />
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-muted/60 p-1">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn("relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors", filter === f ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {filter === f && <motion.span layoutId="pfilter" className="absolute inset-0 rounded-lg bg-primary shadow-forest" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className="relative">{f}</span>
            </button>
          ))}
        </div>
        <Button variant="ghost" onClick={() => setUnmask((v) => !v)} className="h-11">
          {unmask ? <EyeSlash weight="fill" /> : <Eye weight="fill" />} {unmask ? "Hide IDs" : "Show IDs"}
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Users weight="fill" className="size-7" />}
          title={patients.length ? "No matching patients" : "No patients yet"}
          text={patients.length ? "Try a different name or clear the filter." : "Register your first patient to get started."}
          action={!patients.length && <Button asChild variant="sunrise"><Link to="/patients/new">Register patient</Link></Button>}
        />
      ) : (
        <div className="surface overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1fr)_40px] gap-4 border-b bg-muted/40 px-6 py-3 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground md:grid">
            <span>Patient</span><span>Identity</span><span>Coverage</span><span>Status</span><span />
          </div>
          <ul>
            <AnimatePresence initial={true}>
              {rows.map(({ p, stay, nReports }, i) => (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="border-b last:border-0"
                >
                  <button onClick={() => setOpenId(p.id)} className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-primary-soft/50 sm:px-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1fr)_40px]">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <Avatar name={p.fullName} id={p.id} />
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{p.fullName}</div>
                        <div className="truncate text-sm text-muted-foreground">#{p.id} · {p.age ?? "—"} yrs · {p.gender}{p.customFields["blood_group"] ? ` · ${p.customFields["blood_group"]}` : ""}</div>
                      </div>
                    </div>
                    <div className="hidden min-w-0 md:block">
                      <div className="font-mono text-sm">{unmask ? formatAadhaar(p.aadhaar ?? "") || "—" : maskAadhaar(p.aadhaar)}</div>
                      <div className="text-xs text-muted-foreground">{p.pan ? `PAN ${unmask ? p.pan : p.pan.slice(0, 2) + "•••••" + p.pan.slice(-2)}` : "Aadhaar verified"}</div>
                    </div>
                    <div className="hidden min-w-0 md:block">
                      {p.insurance ? (
                        <div className="flex items-center gap-2"><ShieldCheck weight="fill" className="size-4 shrink-0 text-success" /><span className="truncate text-sm font-medium">{p.insurance.provider}</span></div>
                      ) : <span className="text-sm text-muted-foreground">Self pay</span>}
                      <div className="text-xs text-muted-foreground">{nReports} {nReports === 1 ? "report" : "reports"}</div>
                    </div>
                    <div className="hidden md:block">
                      {stay ? <Chip tone="coral" dot>Admitted · day {stayDays(stay.admissionDate) + 1}</Chip> : <Chip tone="neutral">At home</Chip>}
                    </div>
                    <CaretRight weight="bold" className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}

      <PatientSheet patientId={openId} onOpenChange={(o) => !o && setOpenId(null)} />
    </>
  );
}
