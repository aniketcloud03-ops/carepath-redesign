import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createSampleData } from "./seed";
import type { Admission, AppData, FieldDefinition, MedicalReport, Patient } from "./types";
import { todayISO } from "./format";

const STORAGE_KEY = "medipulse-data-v2";

interface Store extends AppData {
  ready: boolean;
  addPatient: (p: Omit<Patient, "id" | "createdAt">) => Patient;
  addAdmission: (a: Omit<Admission, "id">) => Admission;
  discharge: (admissionId: number, date?: string) => void;
  addReport: (r: Omit<MedicalReport, "id">) => MedicalReport;
  addField: (f: FieldDefinition) => void;
  removeField: (key: string) => void;
  setApiKey: (k: string) => void;
  resetSample: () => void;
  clearAll: () => void;
  patientById: (id: number) => Patient | undefined;
}

const Ctx = createContext<Store | null>(null);

const nextId = (rows: { id: number }[]) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => createSampleData());
  const [ready, setReady] = useState(false);

  // Read saved data after hydration so server and client first render match.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, ready]);

  const log = (d: AppData, action: string, detail: string): AppData["audit"] => [
    { id: nextId(d.audit), action, detail, at: new Date().toISOString() },
    ...d.audit,
  ].slice(0, 40);

  const addPatient = useCallback<Store["addPatient"]>((p) => {
    let created!: Patient;
    setData((d) => {
      created = { ...p, id: nextId(d.patients), createdAt: new Date().toISOString() };
      return { ...d, patients: [...d.patients, created], audit: log(d, "Patient registered", created.fullName) };
    });
    return created;
  }, []);

  const addAdmission = useCallback<Store["addAdmission"]>((a) => {
    let created!: Admission;
    setData((d) => {
      created = { ...a, id: nextId(d.admissions) };
      const name = d.patients.find((p) => p.id === a.patientId)?.fullName ?? "Patient";
      return { ...d, admissions: [...d.admissions, created], audit: log(d, "Admitted", `${name} — ${a.reason}`) };
    });
    return created;
  }, []);

  const discharge = useCallback<Store["discharge"]>((admissionId, date) => {
    setData((d) => {
      const adm = d.admissions.find((a) => a.id === admissionId);
      const name = d.patients.find((p) => p.id === adm?.patientId)?.fullName ?? "Patient";
      return {
        ...d,
        admissions: d.admissions.map((a) =>
          a.id === admissionId ? { ...a, dischargeDate: date ?? todayISO() } : a,
        ),
        audit: log(d, "Discharged", name),
      };
    });
  }, []);

  const addReport = useCallback<Store["addReport"]>((r) => {
    let created!: MedicalReport;
    setData((d) => {
      created = { ...r, id: nextId(d.reports) };
      const name = d.patients.find((p) => p.id === r.patientId)?.fullName ?? "Patient";
      return { ...d, reports: [created, ...d.reports], audit: log(d, "Report analysed", `${name} — ${r.fileName}`) };
    });
    return created;
  }, []);

  const addField = useCallback((f: FieldDefinition) => {
    setData((d) => (d.fields.some((x) => x.key === f.key) ? d : { ...d, fields: [...d.fields, f] }));
  }, []);
  const removeField = useCallback((key: string) => {
    setData((d) => ({ ...d, fields: d.fields.filter((f) => f.key !== key) }));
  }, []);
  const setApiKey = useCallback((k: string) => setData((d) => ({ ...d, apiKey: k })), []);
  const resetSample = useCallback(() => setData(createSampleData()), []);
  const clearAll = useCallback(
    () => setData((d) => ({ patients: [], admissions: [], reports: [], audit: [], fields: d.fields, apiKey: d.apiKey })),
    [],
  );

  const value = useMemo<Store>(
    () => ({
      ...data,
      ready,
      addPatient,
      addAdmission,
      discharge,
      addReport,
      addField,
      removeField,
      setApiKey,
      resetSample,
      clearAll,
      patientById: (id) => data.patients.find((p) => p.id === id),
    }),
    [data, ready, addPatient, addAdmission, discharge, addReport, addField, removeField, setApiKey, resetSample, clearAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
