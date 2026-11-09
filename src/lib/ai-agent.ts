// Demo stand-in for the Text-to-SQL agent. It answers the common questions by
// reading the local data and returns the same shape the FastAPI /api/query endpoint does.
import type { AppData } from "./types";
import { fmtDate, stayDays } from "./format";
import { maskAadhaar } from "./validation";

export interface AgentAnswer {
  sql: string;
  columns: string[];
  rows: (string | number)[][];
  explanation: string;
}

export const SUGGESTIONS = [
  { title: "Prescribed medicines", q: "What pills or medications are prescribed to patients?" },
  { title: "Insurance coverage", q: "Which patients have private or government health insurance?" },
  { title: "Ongoing treatments", q: "Show patients with ongoing treatment status and their evidence quotes" },
  { title: "Length of stay", q: "Show patient stay duration in days and admission status" },
  { title: "Admission reasons", q: "What were the reasons for hospital admissions?" },
  { title: "Monthly summary", q: "Show aggregated monthly statistics (total admitted patients, average stay duration)" },
];

export async function askAgent(question: string, d: AppData): Promise<AgentAnswer> {
  await new Promise((r) => setTimeout(r, 1600));
  const q = question.toLowerCase();
  const name = (id: number) => d.patients.find((p) => p.id === id)?.fullName ?? "—";

  if (/(pill|medic|drug|prescri)/.test(q)) {
    const rows = d.reports.flatMap((r) => r.medications.map((m) => [name(r.patientId), r.condition, m.name, m.dosage]));
    return {
      sql: `SELECT p.full_name, mh.condition_name, m.medicine_name, m.dosage\nFROM medications m\nJOIN medical_history mh ON mh.id = m.medical_history_id\nJOIN patients p ON p.id = mh.patient_id\nORDER BY p.full_name;`,
      columns: ["Patient", "Condition", "Medicine", "Dosage"],
      rows,
      explanation: `${rows.length} medicines are currently prescribed across ${new Set(rows.map((r) => r[0])).size} patients. The most common reason is ${d.reports[0]?.condition ?? "—"}.`,
    };
  }
  if (/(insur|policy|cover)/.test(q)) {
    const rows = d.patients.map((p) => [p.fullName, p.insurance?.type ?? "Self pay", p.insurance?.provider ?? "—", fmtDate(p.insurance?.validTill)]);
    const insured = d.patients.filter((p) => p.insurance).length;
    return {
      sql: `SELECT full_name, COALESCE(insurance_type,'Self pay'), insurance_provider, insurance_valid_till\nFROM patients\nORDER BY insurance_type;`,
      columns: ["Patient", "Type", "Provider", "Valid till"],
      rows,
      explanation: `${insured} of ${d.patients.length} patients have health insurance — ${d.patients.filter((p) => p.insurance?.type === "Government").length} government and ${d.patients.filter((p) => p.insurance?.type === "Private").length} private.`,
    };
  }
  if (/(ongoing|evidence|treatment status)/.test(q)) {
    const list = d.reports.filter((r) => r.treatmentStatus === "ongoing");
    return {
      sql: `SELECT p.full_name, mh.condition_name, mh.evidence_text\nFROM medical_history mh JOIN patients p ON p.id = mh.patient_id\nWHERE mh.treatment_status = 'ongoing';`,
      columns: ["Patient", "Condition", "Evidence from report"],
      rows: list.map((r) => [name(r.patientId), r.condition, `“${r.evidence}”`]),
      explanation: `${list.length} patients are under ongoing treatment. Each answer is backed by the exact sentence from their report.`,
    };
  }
  if (/(month|aggregate|statistic)/.test(q)) {
    const byMonth = new Map<string, { n: number; days: number[] }>();
    d.admissions.forEach((a) => {
      const k = a.admissionDate.slice(0, 7);
      const e = byMonth.get(k) ?? { n: 0, days: [] };
      e.n++;
      if (a.dischargeDate) e.days.push(stayDays(a.admissionDate, a.dischargeDate));
      byMonth.set(k, e);
    });
    const rows = [...byMonth.entries()].sort().map(([k, v]) => [fmtDate(k + "-01", "MMM yyyy"), v.n, v.days.length ? (v.days.reduce((a, b) => a + b, 0) / v.days.length).toFixed(1) : "In progress"]);
    return {
      sql: `SELECT strftime('%Y-%m', admission_date) AS month, COUNT(*), ROUND(AVG(days_stayed),1)\nFROM admissions GROUP BY month ORDER BY month;`,
      columns: ["Month", "Admissions", "Avg. stay (days)"],
      rows,
      explanation: `Admissions are spread across ${rows.length} months. Average stay is shown for completed (discharged) stays only.`,
    };
  }
  if (/(reason|why)/.test(q)) {
    return {
      sql: `SELECT p.full_name, a.reason, a.admission_date FROM admissions a\nJOIN patients p ON p.id = a.patient_id ORDER BY a.admission_date DESC;`,
      columns: ["Patient", "Reason", "Admitted on"],
      rows: [...d.admissions].reverse().map((a) => [name(a.patientId), a.reason, fmtDate(a.admissionDate)]),
      explanation: `There are ${d.admissions.length} admissions on record, covering diabetes, infections, eye and dental procedures.`,
    };
  }
  if (/(stay|days|duration|how long)/.test(q)) {
    const match = d.patients.find((p) => q.includes(p.fullName.toLowerCase()) || q.includes((p.fullName.split(" ")[0] ?? "").toLowerCase()));
    const list = d.admissions.filter((a) => !match || a.patientId === match.id);
    return {
      sql: `SELECT p.full_name, a.admission_date, a.discharge_date, a.days_stayed, a.status\nFROM admissions a JOIN patients p ON p.id = a.patient_id${match ? `\nWHERE p.full_name = '${match.fullName}'` : ""};`,
      columns: ["Patient", "Admitted", "Discharged", "Days", "Status"],
      rows: list.map((a) => [name(a.patientId), fmtDate(a.admissionDate), fmtDate(a.dischargeDate), stayDays(a.admissionDate, a.dischargeDate), a.dischargeDate ? "Discharged" : "Admitted"]),
      explanation: match
        ? `${match.fullName} stayed ${list.map((a) => stayDays(a.admissionDate, a.dischargeDate)).join(" and ")} days in hospital.`
        : `Showing stay duration for all ${list.length} admissions. ${list.filter((a) => !a.dischargeDate).length} patients are still admitted.`,
    };
  }
  if (/(condition|severity|keyword|diagnos)/.test(q)) {
    return {
      sql: `SELECT p.full_name, mh.condition_name, mh.severity_stage, mh.condition_keywords\nFROM medical_history mh JOIN patients p ON p.id = mh.patient_id WHERE mh.is_active = 1;`,
      columns: ["Patient", "Condition", "Severity", "Keywords"],
      rows: d.reports.map((r) => [name(r.patientId), r.condition, r.severity, r.keywords.join(", ")]),
      explanation: `${d.reports.length} active conditions found; ${d.reports.filter((r) => r.severity === "Severe").length} are marked severe.`,
    };
  }
  return {
    sql: `SELECT id, full_name, age, gender, aadhaar_number FROM patients ORDER BY id;`,
    columns: ["ID", "Patient", "Age", "Gender", "Aadhaar"],
    rows: d.patients.map((p) => [p.id, p.fullName, p.age ?? "—", p.gender, maskAadhaar(p.aadhaar)]),
    explanation: `I couldn't match that to a specific topic, so here is the full patient list (${d.patients.length} patients). Try asking about medicines, insurance, stays or conditions.`,
  };
}
