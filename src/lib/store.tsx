import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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

  const dataRef = useRef(data);
  dataRef.current = data;
  const commit = useCallback((next: AppData) => {
    dataRef.current = next;
    setData(next);
  }, []);

  const log = (d: AppData, action: string, detail: string): AppData["audit"] =>
    [{ id: nextId(d.audit), action, detail, at: new Date().toISOString() }, ...d.audit].slice(
      0,
      40,
    );
  const nameOf = (d: AppData, id?: number) =>
    d.patients.find((p) => p.id === id)?.fullName ?? "Patient";

  const addPatient = useCallback<Store["addPatient"]>(
    (p) => {
      const d = dataRef.current;
      const created: Patient = {
        ...p,
        id: nextId(d.patients),
        createdAt: new Date().toISOString(),
      };
      commit({
        ...d,
        patients: [...d.patients, created],
        audit: log(d, "Patient registered", created.fullName),
      });
      return created;
    },
    [commit],
  );

  const addAdmission = useCallback<Store["addAdmission"]>(
    (a) => {
      const d = dataRef.current;
      const created: Admission = { ...a, id: nextId(d.admissions) };
      commit({
        ...d,
        admissions: [...d.admissions, created],
        audit: log(d, "Admitted", `${nameOf(d, a.patientId)} — ${a.reason}`),
      });
      return created;
    },
    [commit],
  );

  const discharge = useCallback<Store["discharge"]>(
    (admissionId, date) => {
      const d = dataRef.current;
      const adm = d.admissions.find((a) => a.id === admissionId);
      commit({
        ...d,
        admissions: d.admissions.map((a) =>
          a.id === admissionId ? { ...a, dischargeDate: date ?? todayISO() } : a,
        ),
        audit: log(d, "Discharged", nameOf(d, adm?.patientId)),
      });
    },
    [commit],
  );

  const addReport = useCallback<Store["addReport"]>(
    (r) => {
      const d = dataRef.current;
      const created: MedicalReport = { ...r, id: nextId(d.reports) };
      commit({
        ...d,
        reports: [created, ...d.reports],
        audit: log(d, "Report analysed", `${nameOf(d, r.patientId)} — ${r.fileName}`),
      });
      return created;
    },
    [commit],
  );

  const addField = useCallback(
    (f: FieldDefinition) => {
      const d = dataRef.current;
      if (!d.fields.some((x) => x.key === f.key)) commit({ ...d, fields: [...d.fields, f] });
    },
    [commit],
  );
  const removeField = useCallback(
    (key: string) => {
      const d = dataRef.current;
      commit({ ...d, fields: d.fields.filter((f) => f.key !== key) });
    },
    [commit],
  );
  const setApiKey = useCallback((k: string) => commit({ ...dataRef.current, apiKey: k }), [commit]);
  const resetSample = useCallback(() => commit(createSampleData()), [commit]);
  const clearAll = useCallback(() => {
    const d = dataRef.current;
    commit({
      patients: [],
      admissions: [],
      reports: [],
      audit: [],
      fields: d.fields,
      apiKey: d.apiKey,
    });
  }, [commit]);

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
    [
      data,
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
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
