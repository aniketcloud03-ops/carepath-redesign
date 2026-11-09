import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Bed,
  CheckCircle,
  FileText,
  Gear,
  IdentificationBadge,
  IdentificationCard,
  Lightbulb,
  ShieldCheck,
  UserCircle,
  Warning,
} from "@phosphor-icons/react/ssr";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { extractIdentity } from "@/lib/mock-extract";
import { digitsOnly, formatAadhaar, validateAadhaar, validatePan } from "@/lib/validation";
import { fmtDate, todayISO } from "@/lib/format";
import type { Gender, InsuranceType, Patient } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Dropzone } from "@/components/app/Dropzone";
import { ManageFieldsDialog } from "@/components/app/ManageFieldsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patients/new")({
  head: () => ({
    meta: [
      { title: "Register patient — MediPulse" },
      { name: "description", content: "Register a new patient in four guided steps — scan Aadhaar or PAN to fill details automatically." },
      { property: "og:title", content: "Register patient — MediPulse" },
      { property: "og:description", content: "Four guided steps to register a patient from an Aadhaar or PAN card." },
    ],
  }),
  component: RegisterPage,
});

const STEPS = [
  { title: "Identity card", text: "Scan Aadhaar or PAN", icon: IdentificationCard },
  { title: "Personal details", text: "Name, age, contact", icon: UserCircle },
  { title: "Insurance & extras", text: "Coverage, blood group", icon: ShieldCheck },
  { title: "Admit & confirm", text: "Consent and review", icon: CheckCircle },
];

const TIPS = [
  "Upload a clear photo of the card — we'll read the name, number, date of birth and address for you.",
  "Everything extracted from the card can be edited. Double-check the spelling of the name.",
  "Ayushman Bharat and CGHS count as government cover. Skip this step if the patient pays themselves.",
  "Turn on “Admit now” if the patient is staying today — their stay length will be counted automatically.",
];

const empty = {
  docType: "aadhaar" as "aadhaar" | "pan",
  aadhaar: "",
  pan: "",
  fullName: "",
  dob: "",
  age: "",
  gender: "Male" as Gender,
  mobile: "",
  address: "",
  hasInsurance: false,
  insType: "Government" as InsuranceType,
  insProvider: "",
  insPolicy: "",
  insValid: "",
  custom: {} as Record<string, string | boolean>,
  admitNow: false,
  admitDate: todayISO(),
  admitReason: "",
  consent: false,
};

function RegisterPage() {
  const { fields, addPatient, addAdmission } = useStore();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [f, setF] = useState(empty);
  const [scan, setScan] = useState<{ busy: boolean; done: boolean; name?: string }>({ busy: false, done: false });
  const [created, setCreated] = useState<Patient | null>(null);
  const set = <K extends keyof typeof empty>(k: K, v: (typeof empty)[K]) => setF((s) => ({ ...s, [k]: v }));

  const aad = validateAadhaar(f.aadhaar);
  const pan = validatePan(f.pan);

  const canNext = [
    aad.valid || pan.valid,
    f.fullName.trim().length > 1,
    !f.hasInsurance || f.insProvider.trim().length > 0,
    f.consent && (!f.admitNow || f.admitReason.trim().length > 0),
  ][step];
  const blockers = [
    "Enter a valid Aadhaar or PAN number (or scan a card) to continue.",
    "Enter the patient's full name to continue.",
    "Enter the insurance provider, or turn insurance off.",
    f.admitNow && !f.admitReason.trim() ? "Add the reason for admission." : "Tick the consent box to finish.",
  ][step];

  const go = (n: number) => { setDir(n > step ? 1 : -1); setStep(n); };

  const onScan = async (file: File) => {
    setScan({ busy: true, done: false, name: file.name });
    const r = await extractIdentity(f.docType);
    setF((s) => ({ ...s, fullName: r.fullName, gender: r.gender, dob: r.dob, age: String(r.age), address: r.address, mobile: r.mobile, aadhaar: r.aadhaar || s.aadhaar, pan: r.pan || s.pan }));
    setScan({ busy: false, done: true, name: file.name });
    toast.success("Card read successfully", { description: `${r.fullName} — please review the details.` });
  };

  const submit = () => {
    const p = addPatient({
      fullName: f.fullName.trim(),
      aadhaar: digitsOnly(f.aadhaar) || undefined,
      pan: f.pan.trim().toUpperCase() || undefined,
      dob: f.dob || undefined,
      age: f.age ? Number(f.age) : undefined,
      gender: f.gender,
      mobile: f.mobile || undefined,
      address: f.address || undefined,
      insurance: f.hasInsurance ? { type: f.insType, provider: f.insProvider, policyNo: f.insPolicy, validTill: f.insValid || undefined } : undefined,
      customFields: f.custom,
      consentAt: new Date().toISOString(),
    });
    if (f.admitNow) addAdmission({ patientId: p.id, admissionDate: f.admitDate, reason: f.admitReason.trim() });
    setCreated(p);
  };

  if (created) return <Success patient={created} admitted={f.admitNow} onAnother={() => { setCreated(null); setF(empty); setScan({ busy: false, done: false }); setStep(0); }} />;

  return (
    <>
      <PageHeader eyebrow="Patient care" title="Register a new patient" description="Four short steps. Scanning the patient's ID card fills most of the form for you." />

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Stepper */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="surface p-3">
            <div className="px-3 pb-3 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground"><span>Progress</span><span>{step + 1} of 4</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div className="h-full rounded-full bg-sunrise" animate={{ width: `${((step + 1) / 4) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
              </div>
            </div>
            <ol className="space-y-1">
              {STEPS.map((s, i) => {
                const state = i < step ? "done" : i === step ? "current" : "todo";
                return (
                  <li key={s.title}>
                    <button
                      disabled={i > step}
                      onClick={() => go(i)}
                      className={cn("relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors", state === "current" ? "bg-primary-soft" : "hover:bg-muted disabled:hover:bg-transparent", i > step && "cursor-not-allowed opacity-60")}
                    >
                      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl transition-all duration-500", state === "done" ? "bg-success text-primary-foreground" : state === "current" ? "bg-primary text-primary-foreground shadow-forest" : "bg-muted text-muted-foreground")}>
                        {state === "done" ? <CheckCircle weight="fill" className="size-5" /> : <s.icon weight="fill" className="size-5" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{s.title}</span>
                        <span className="block text-xs text-muted-foreground">{s.text}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="hidden rounded-3xl border border-warning/30 bg-warning-soft/60 p-4 text-sm lg:block">
              <div className="mb-1 flex items-center gap-2 font-semibold text-foreground"><Lightbulb weight="fill" className="size-4 text-warning" /> Tip</div>
              <p className="text-muted-foreground">{TIPS[step]}</p>
            </motion.div>
          </AnimatePresence>
        </aside>

        {/* Step body */}
        <section className="surface overflow-hidden">
          <div className="border-b px-6 py-5 sm:px-8">
            <div className="eyebrow text-coral">Step {step + 1}</div>
            <h2 className="mt-1 text-xl font-semibold">{STEPS[step].title}</h2>
          </div>

          <div className="relative min-h-[460px] overflow-hidden px-6 py-6 sm:px-8">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                initial={{ opacity: 0, x: dir * 40, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: dir * -40, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                className="space-y-6"
              >
                {step === 0 && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {([["aadhaar", "Aadhaar card", "12-digit UIDAI number", IdentificationCard], ["pan", "PAN card", "10-character tax ID", IdentificationBadge]] as const).map(([v, t, d, Icon]) => (
                        <button key={v} onClick={() => set("docType", v)} className={cn("relative flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all", f.docType === v ? "border-primary bg-primary-soft/60 shadow-soft" : "border-border hover:border-primary/30")}>
                          <span className={cn("grid size-11 place-items-center rounded-xl", f.docType === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}><Icon weight="fill" className="size-5" /></span>
                          <span><span className="block font-semibold">{t}</span><span className="block text-xs text-muted-foreground">{d}</span></span>
                          {f.docType === v && <motion.span layoutId="doc-check" className="absolute right-3 top-3 text-primary"><CheckCircle weight="fill" className="size-5" /></motion.span>}
                        </button>
                      ))}
                    </div>
                    <Dropzone
                      onFile={onScan}
                      busy={scan.busy}
                      done={scan.done}
                      fileName={scan.name}
                      title={`Upload the ${f.docType === "aadhaar" ? "Aadhaar" : "PAN"} card`}
                      hint="We'll read the name, ID number, date of birth, gender, mobile and address automatically."
                      busyLabel="Reading the card with AI…"
                    />
                    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"><span className="h-px flex-1 bg-border" />or type the number<span className="h-px flex-1 bg-border" /></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Aadhaar number" status={aad}>
                        <Input inputMode="numeric" value={f.aadhaar} onChange={(e) => set("aadhaar", formatAadhaar(e.target.value))} placeholder="2345 6789 0123" className="h-12 rounded-xl font-mono text-[15px] tracking-wider" />
                      </Field>
                      <Field label="PAN number" status={pan}>
                        <Input value={f.pan} maxLength={10} onChange={(e) => set("pan", e.target.value.toUpperCase())} placeholder="ABCPE1234F" className="h-12 rounded-xl font-mono text-[15px] tracking-wider" />
                      </Field>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <div className="grid gap-5 sm:grid-cols-6">
                    <Field label="Full name" required className="sm:col-span-6">
                      <Input value={f.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="As printed on the ID card" className="h-12 rounded-xl text-[15px]" autoFocus />
                    </Field>
                    <Field label="Date of birth" className="sm:col-span-3">
                      <Input type="date" value={f.dob} onChange={(e) => { const v = e.target.value; setF((s) => ({ ...s, dob: v, age: v ? String(new Date().getFullYear() - Number(v.slice(0, 4))) : s.age })); }} className="h-12 rounded-xl" />
                    </Field>
                    <Field label="Age (years)" className="sm:col-span-3" hint={f.dob ? "Calculated from date of birth" : undefined}>
                      <Input type="number" min={0} max={130} value={f.age} onChange={(e) => set("age", e.target.value)} placeholder="e.g. 45" className="h-12 rounded-xl" />
                    </Field>
                    <Field label="Gender" className="sm:col-span-6">
                      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-muted/60 p-1.5">
                        {(["Male", "Female", "Other"] as Gender[]).map((g) => (
                          <button key={g} onClick={() => set("gender", g)} className={cn("relative rounded-xl py-2.5 text-sm font-semibold transition-colors", f.gender === g ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                            {f.gender === g && <motion.span layoutId="gender" className="absolute inset-0 rounded-xl bg-primary shadow-forest" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                            <span className="relative">{g}</span>
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Mobile number" className="sm:col-span-6" hint="10 digits, no country code">
                      <Input inputMode="tel" value={f.mobile} maxLength={10} onChange={(e) => set("mobile", digitsOnly(e.target.value))} placeholder="98XXXXXXXX" className="h-12 rounded-xl" />
                    </Field>
                    <Field label="Residential address" className="sm:col-span-6">
                      <Textarea value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="House, street, city, state, PIN" className="min-h-24 rounded-xl" />
                    </Field>
                  </div>
                )}

                {step === 2 && (
                  <>
                    <ToggleCard icon={<ShieldCheck weight="fill" />} title="Patient has health insurance" text="Government (PM-JAY, CGHS) or private cover" checked={f.hasInsurance} onChange={(v) => set("hasInsurance", v)}>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Type" className="sm:col-span-2">
                          <div className="grid grid-cols-2 gap-2">
                            {(["Government", "Private"] as InsuranceType[]).map((t) => (
                              <button key={t} onClick={() => set("insType", t)} className={cn("rounded-xl border-2 py-2.5 text-sm font-semibold transition-all", f.insType === t ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground")}>{t}</button>
                            ))}
                          </div>
                        </Field>
                        <Field label="Provider" required>
                          <Input list="providers" value={f.insProvider} onChange={(e) => set("insProvider", e.target.value)} placeholder={f.insType === "Government" ? "Ayushman Bharat PM-JAY" : "Star Health"} className="h-11 rounded-xl" />
                          <datalist id="providers">
                            {(f.insType === "Government" ? ["Ayushman Bharat PM-JAY", "CGHS", "ESIC"] : ["Star Health Insurance", "HDFC ERGO", "Niva Bupa", "ICICI Lombard"]).map((o) => <option key={o} value={o} />)}
                          </datalist>
                        </Field>
                        <Field label="Policy number"><Input value={f.insPolicy} onChange={(e) => set("insPolicy", e.target.value)} className="h-11 rounded-xl" /></Field>
                        <Field label="Valid till"><Input type="date" value={f.insValid} onChange={(e) => set("insValid", e.target.value)} className="h-11 rounded-xl" /></Field>
                      </div>
                    </ToggleCard>

                    <div className="rounded-3xl border p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">Additional details</div>
                          <div className="text-sm text-muted-foreground">Optional — fill what you know.</div>
                        </div>
                        <ManageFieldsDialog>
                          <Button variant="outline" size="sm"><Gear weight="fill" /> Manage fields</Button>
                        </ManageFieldsDialog>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {fields.map((fd) => (
                          <Field key={fd.key} label={fd.label}>
                            {fd.type === "select" ? (
                              <Select value={(f.custom[fd.key] as string) ?? ""} onValueChange={(v) => set("custom", { ...f.custom, [fd.key]: v })}>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Choose…" /></SelectTrigger>
                                <SelectContent>{fd.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                              </Select>
                            ) : fd.type === "boolean" ? (
                              <div className="flex h-11 items-center gap-3 rounded-xl border px-3"><Switch checked={!!f.custom[fd.key]} onCheckedChange={(v) => set("custom", { ...f.custom, [fd.key]: v })} /><span className="text-sm">{f.custom[fd.key] ? "Yes" : "No"}</span></div>
                            ) : (
                              <Input type={fd.type} value={(f.custom[fd.key] as string) ?? ""} onChange={(e) => set("custom", { ...f.custom, [fd.key]: e.target.value })} className="h-11 rounded-xl" />
                            )}
                          </Field>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <ToggleCard icon={<Bed weight="fill" />} title="Admit this patient now" text="Starts the stay counter from the date below" checked={f.admitNow} onChange={(v) => set("admitNow", v)}>
                      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                        <Field label="Admission date"><Input type="date" value={f.admitDate} onChange={(e) => set("admitDate", e.target.value)} className="h-11 rounded-xl" /></Field>
                        <Field label="Reason for admission" required><Input value={f.admitReason} onChange={(e) => set("admitReason", e.target.value)} placeholder="e.g. Eye surgery, root canal" className="h-11 rounded-xl" /></Field>
                      </div>
                    </ToggleCard>

                    <div className="rounded-3xl border bg-muted/40 p-5">
                      <div className="mb-3 font-semibold">Review</div>
                      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                        <Row k="Name" v={f.fullName} />
                        <Row k="Aadhaar" v={f.aadhaar ? `XXXX XXXX ${digitsOnly(f.aadhaar).slice(-4)}` : "—"} />
                        <Row k="Age / gender" v={`${f.age || "—"} / ${f.gender}`} />
                        <Row k="Date of birth" v={fmtDate(f.dob)} />
                        <Row k="Mobile" v={f.mobile || "—"} />
                        <Row k="Insurance" v={f.hasInsurance ? `${f.insProvider} (${f.insType})` : "Self pay"} />
                      </dl>
                      <button onClick={() => go(1)} className="mt-3 text-xs font-semibold text-primary hover:underline">Edit details</button>
                    </div>

                    <label className={cn("flex cursor-pointer gap-4 rounded-3xl border-2 p-5 transition-colors", f.consent ? "border-success/50 bg-success-soft/50" : "border-coral/40 bg-coral-soft/40")}>
                      <Checkbox checked={f.consent} onCheckedChange={(v) => set("consent", v === true)} className="mt-0.5 size-5 rounded-md" />
                      <span className="text-sm">
                        <span className="block font-semibold">Patient consent (DPDP Act)</span>
                        <span className="text-muted-foreground">The patient agrees to digital extraction, secure storage and processing of their health data under India's Digital Personal Data Protection Act.</span>
                      </span>
                    </label>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t bg-muted/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}><ArrowLeft weight="bold" /> Back</Button>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              {!canNext && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Warning weight="fill" className="size-4 text-warning" /> {blockers}</span>}
              {step < 3 ? (
                <Button size="lg" disabled={!canNext} onClick={() => go(step + 1)}>Continue <ArrowRight weight="bold" /></Button>
              ) : (
                <Button size="lg" variant="sunrise" disabled={!canNext} onClick={submit}><CheckCircle weight="fill" /> Register patient</Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function Field({ label, children, required, hint, status, className }: { label: string; children: ReactNode; required?: boolean; hint?: string; status?: { valid: boolean; message: string }; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-semibold">{label}{required && <span className="text-coral"> *</span>}</Label>
      {children}
      <AnimatePresence>
        {status?.message ? (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn("flex items-center gap-1.5 text-xs font-semibold", status.valid ? "text-success" : "text-warning")}>
            {status.valid ? <CheckCircle weight="fill" className="size-4" /> : <Warning weight="fill" className="size-4" />} {status.message}
          </motion.p>
        ) : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </AnimatePresence>
    </div>
  );
}

function ToggleCard({ icon, title, text, checked, onChange, children }: { icon: ReactNode; title: string; text: string; checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <div className={cn("overflow-hidden rounded-3xl border-2 transition-colors", checked ? "border-primary/40 bg-primary-soft/30" : "border-border")}>
      <label className="flex cursor-pointer items-center gap-4 p-5">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl transition-colors [&_svg]:size-5", checked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{icon}</span>
        <span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span><span className="block text-sm text-muted-foreground">{text}</span></span>
        <Switch checked={checked} onCheckedChange={onChange} />
      </label>
      <AnimatePresence initial={false}>
        {checked && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}>
            <div className="border-t border-primary/15 p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-dashed pb-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="truncate text-right font-semibold">{v || "—"}</dd>
    </div>
  );
}

function Success({ patient, admitted, onAnother }: { patient: Patient; admitted: boolean; onAnother: () => void }) {
  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }} className="relative mx-auto grid size-28 place-items-center">
        <span className="absolute inset-0 rounded-full bg-success/20 animate-pulse-ring" />
        <span className="relative grid size-24 place-items-center rounded-full bg-meadow text-primary-foreground shadow-forest">
          <svg viewBox="0 0 24 24" className="size-12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.6 }} />
          </svg>
        </span>
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-8 text-3xl font-semibold">{patient.fullName} is registered</motion.h1>
      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-2 text-muted-foreground">
        Patient #{patient.id}{admitted ? " · admitted today" : ""}. What would you like to do next?
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link to="/reports" className="surface surface-lift flex items-center gap-3 p-4 text-left">
          <span className="grid size-11 place-items-center rounded-xl bg-amber-glow"><FileText weight="fill" className="size-5" /></span>
          <span><span className="block font-semibold">Upload a report</span><span className="text-xs text-muted-foreground">Get an AI summary</span></span>
        </Link>
        <Link to="/patients" className="surface surface-lift flex items-center gap-3 p-4 text-left">
          <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><UserCircle weight="fill" className="size-5" /></span>
          <span><span className="block font-semibold">View all patients</span><span className="text-xs text-muted-foreground">Open the directory</span></span>
        </Link>
      </motion.div>
      <Button variant="ghost" className="mt-6" onClick={onAnother}>Register another patient</Button>
    </div>
  );
}
