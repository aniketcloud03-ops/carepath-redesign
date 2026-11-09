import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Bed,
  Eye,
  EyeSlash,
  FileText,
  FirstAidKit,
  IdentificationCard,
  MapPin,
  Phone,
  Pill,
  ShieldCheck,
} from "@phosphor-icons/react/ssr";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { fmtDate, stayDays } from "@/lib/format";
import { formatAadhaar, maskAadhaar } from "@/lib/validation";
import { Avatar, Chip, SEVERITY, TREATMENT } from "./bits";

export function PatientSheet({
  patientId,
  onOpenChange,
}: {
  patientId: number | null;
  onOpenChange: (o: boolean) => void;
}) {
  const { patientById, admissions, reports, fields } = useStore();
  const [unmask, setUnmask] = useState(false);
  const p = patientId != null ? patientById(patientId) : undefined;
  const stays = admissions
    .filter((a) => a.patientId === patientId)
    .sort((a, b) => b.admissionDate.localeCompare(a.admissionDate));
  const conds = reports.filter((r) => r.patientId === patientId);
  const current = stays.find((s) => !s.dischargeDate);

  return (
    <Sheet
      open={patientId != null}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setUnmask(false);
      }}
    >
      <SheetContent className="w-full overflow-y-auto border-l-0 p-0 sm:max-w-xl">
        {p && (
          <>
            <div className="relative overflow-hidden bg-forest grain px-6 pb-6 pt-8 text-primary-foreground">
              <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-sunrise opacity-30 blur-3xl" />
              <SheetHeader className="relative space-y-0 text-left">
                <div className="flex items-center gap-4">
                  <Avatar name={p.fullName} id={p.id} className="size-16 rounded-3xl text-lg" />
                  <div className="min-w-0">
                    <SheetTitle className="truncate text-2xl text-primary-foreground">
                      {p.fullName}
                    </SheetTitle>
                    <SheetDescription className="text-primary-foreground/75">
                      Patient #{p.id} · {p.age ?? "—"} yrs · {p.gender}
                    </SheetDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-4">
                  {current ? (
                    <Chip tone="coral" dot>
                      Admitted · day {stayDays(current.admissionDate) + 1}
                    </Chip>
                  ) : (
                    <Chip className="bg-primary-foreground/15 text-primary-foreground">
                      Not admitted
                    </Chip>
                  )}
                  {p.insurance && (
                    <Chip className="bg-primary-foreground/15 text-primary-foreground">
                      <ShieldCheck weight="fill" /> {p.insurance.provider}
                    </Chip>
                  )}
                </div>
              </SheetHeader>
            </div>

            <div className="space-y-6 p-6">
              <section className="grid gap-3 sm:grid-cols-2">
                <Info icon={<IdentificationCard weight="fill" />} label="Aadhaar">
                  <span className="font-mono text-sm">
                    {unmask ? formatAadhaar(p.aadhaar ?? "") : maskAadhaar(p.aadhaar)}
                  </span>
                  {p.aadhaar && (
                    <button
                      onClick={() => setUnmask((v) => !v)}
                      className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
                      aria-label="Toggle Aadhaar visibility"
                    >
                      {unmask ? <EyeSlash weight="fill" /> : <Eye weight="fill" />}{" "}
                      {unmask ? "Hide" : "Show"}
                    </button>
                  )}
                </Info>
                <Info icon={<IdentificationCard weight="fill" />} label="PAN">
                  <span className="font-mono text-sm">{p.pan ?? "—"}</span>
                </Info>
                <Info icon={<Phone weight="fill" />} label="Mobile">
                  {p.mobile ?? "—"}
                </Info>
                <Info icon={<FirstAidKit weight="fill" />} label="Date of birth">
                  {fmtDate(p.dob)}
                </Info>
                <Info icon={<MapPin weight="fill" />} label="Address" className="sm:col-span-2">
                  {p.address ?? "—"}
                </Info>
              </section>

              {fields.some(
                (f) => p.customFields[f.key] !== undefined && p.customFields[f.key] !== "",
              ) && (
                <section>
                  <h3 className="eyebrow mb-3">Additional details</h3>
                  <div className="flex flex-wrap gap-2">
                    {fields
                      .filter(
                        (f) => p.customFields[f.key] !== undefined && p.customFields[f.key] !== "",
                      )
                      .map((f) => (
                        <span
                          key={f.key}
                          className="rounded-xl border bg-muted/50 px-3 py-2 text-sm"
                        >
                          <span className="text-muted-foreground">{f.label}: </span>
                          <span className="font-semibold">
                            {String(
                              p.customFields[f.key] === true
                                ? "Yes"
                                : p.customFields[f.key] === false
                                  ? "No"
                                  : p.customFields[f.key],
                            )}
                          </span>
                        </span>
                      ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="eyebrow mb-3">Hospital stays</h3>
                {stays.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No admissions yet.</p>
                ) : (
                  <ol className="relative space-y-3 border-l-2 border-dashed border-border pl-5">
                    {stays.map((s, i) => (
                      <motion.li
                        key={s.id}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.07 }}
                        className="relative"
                      >
                        <span
                          className={`absolute -left-[27px] top-3 size-3 rounded-full ring-4 ring-card ${s.dischargeDate ? "bg-success" : "bg-coral"}`}
                        />
                        <div className="rounded-2xl border bg-card p-3.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">{s.reason}</span>
                            <span className="shrink-0 font-display text-sm font-semibold text-primary">
                              {stayDays(s.admissionDate, s.dischargeDate)} days
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {fmtDate(s.admissionDate)} →{" "}
                            {s.dischargeDate ? fmtDate(s.dischargeDate) : "still admitted"}
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </ol>
                )}
              </section>

              <section>
                <h3 className="eyebrow mb-3">Conditions & medicines</h3>
                {conds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reports analysed yet.</p>
                ) : (
                  <div className="space-y-3">
                    {conds.map((r) => (
                      <div key={r.id} className="rounded-2xl border bg-card p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{r.condition}</span>
                          <Chip tone={SEVERITY[r.severity]}>{r.severity}</Chip>
                          <Chip tone={TREATMENT[r.treatmentStatus].tone}>
                            {TREATMENT[r.treatmentStatus].label}
                          </Chip>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{r.summary}</p>
                        {r.medications.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {r.medications.map((m) => (
                              <span
                                key={m.name}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-coral-soft px-2.5 py-1 text-xs font-semibold text-coral"
                              >
                                <Pill weight="fill" /> {m.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="flex flex-wrap gap-2 border-t pt-5">
                <Button asChild variant="outline">
                  <Link to="/admissions">
                    <Bed weight="fill" /> Admit / discharge
                  </Link>
                </Button>
                <Button asChild variant="soft">
                  <Link to="/reports">
                    <FileText weight="fill" /> Add report
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Info({
  icon,
  label,
  children,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex gap-3 rounded-2xl border bg-muted/40 p-3.5 ${className ?? ""}`}>
      <span className="mt-0.5 text-primary [&_svg]:size-[18px]">{icon}</span>
      <div className="min-w-0">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}
