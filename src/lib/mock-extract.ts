// Demo stand-ins for the Gemini extraction endpoints of the FastAPI backend.
// Swap these for real fetch() calls to /api/extract-identity and /api/analyze-report.
import type { Department, MedicalReport, Patient } from "./types";
import { formatAadhaar, makeAadhaar } from "./validation";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const PEOPLE = [
  { fullName: "Meera Kulkarni", gender: "Female", dob: "1984-05-21", address: "41, Prabhat Road, Pune, Maharashtra 411004" },
  { fullName: "Arjun Patil", gender: "Male", dob: "1979-12-08", address: "Plot 12, Sector 7, Navi Mumbai, Maharashtra 400703" },
  { fullName: "Kavya Reddy", gender: "Female", dob: "1996-02-14", address: "3-5-112, Himayat Nagar, Hyderabad, Telangana 500029" },
] as const;

export async function extractIdentity(docType: "aadhaar" | "pan") {
  await wait(2600);
  const p = PEOPLE[Math.floor(Math.random() * PEOPLE.length)];
  const base = String(2 + Math.floor(Math.random() * 7)) + String(Math.floor(Math.random() * 1e10)).padStart(10, "0");
  const age = new Date().getFullYear() - Number(p.dob.slice(0, 4));
  const panLetter = p.fullName.split(" ")[1][0];
  return {
    fullName: p.fullName,
    gender: p.gender as Patient["gender"],
    dob: p.dob,
    age,
    address: p.address,
    mobile: "98" + String(Math.floor(Math.random() * 1e8)).padStart(8, "0"),
    aadhaar: docType === "aadhaar" ? formatAadhaar(makeAadhaar(base)) : "",
    pan: docType === "pan" ? `ABC${"P"}${panLetter}${String(1000 + Math.floor(Math.random() * 8999))}K` : "",
  };
}

const TEMPLATES: Record<Department, Omit<MedicalReport, "id" | "patientId" | "fileName" | "pages" | "diagnosedDate">> = {
  "Eye Care": {
    department: "Eye Care",
    condition: "Diabetic macular edema",
    keywords: ["retina", "macular thickening"],
    severity: "Moderate",
    treatmentStatus: "ongoing",
    summary: "OCT shows central macular thickening in the left eye. Anti-VEGF therapy recommended with monthly review.",
    evidence: "Central subfield thickness of 412 µm noted in the left eye.",
    readings: [
      { name: "Macular thickness", value: "412", unit: "µm", abnormal: true },
      { name: "Intraocular pressure", value: "16", unit: "mmHg", abnormal: false },
    ],
    medications: [{ name: "Aflibercept injection", dosage: "2 mg intravitreal, monthly" }],
  },
  Dental: {
    department: "Dental",
    condition: "Chronic gingivitis",
    keywords: ["gum bleeding", "plaque"],
    severity: "Mild",
    treatmentStatus: "treated",
    summary: "Generalised gum inflammation with plaque deposits. Scaling completed; oral hygiene advised.",
    evidence: "Bleeding on probing observed in 38% of sites.",
    readings: [],
    medications: [{ name: "Chlorhexidine mouthwash", dosage: "10 ml twice daily for 2 weeks" }],
  },
  "Blood Sugar": {
    department: "Blood Sugar",
    condition: "Pre-diabetes",
    keywords: ["impaired fasting glucose"],
    severity: "Mild",
    treatmentStatus: "ongoing",
    summary: "Fasting glucose and HbA1c are in the pre-diabetic range. Lifestyle changes and repeat test in 3 months.",
    evidence: "HbA1c of 6.1% falls within the pre-diabetic range (5.7–6.4%).",
    readings: [
      { name: "HbA1c", value: "6.1", unit: "%", abnormal: true },
      { name: "Fasting glucose", value: "112", unit: "mg/dL", abnormal: true },
    ],
    medications: [{ name: "Metformin", dosage: "500 mg once daily" }],
  },
  Oncology: {
    department: "Oncology",
    condition: "Benign breast fibroadenoma",
    keywords: ["biopsy", "fibroadenoma"],
    severity: "Mild",
    treatmentStatus: "not_treated",
    summary: "Core biopsy confirms a benign fibroadenoma with no atypia. Observation with 6-monthly ultrasound advised.",
    evidence: "Histopathology shows a well-circumscribed fibroadenoma without atypia or malignancy.",
    readings: [{ name: "PAI score", value: "1.2", abnormal: false }],
    medications: [],
  },
  "General Medicine": {
    department: "General Medicine",
    condition: "Iron-deficiency anaemia",
    keywords: ["fatigue", "low hemoglobin"],
    severity: "Moderate",
    treatmentStatus: "ongoing",
    summary: "Low haemoglobin and ferritin indicate iron-deficiency anaemia. Oral iron started with a recheck in 6 weeks.",
    evidence: "Serum ferritin of 8 ng/mL is markedly below the reference range.",
    readings: [
      { name: "Hemoglobin", value: "9.6", unit: "g/dL", abnormal: true },
      { name: "Ferritin", value: "8", unit: "ng/mL", abnormal: true },
    ],
    medications: [{ name: "Ferrous sulphate", dosage: "200 mg twice daily" }],
  },
};

export function guessDepartment(fileName: string): Department {
  const f = fileName.toLowerCase();
  if (/(eye|retina|oct|vision)/.test(f)) return "Eye Care";
  if (/(dental|tooth|teeth|opg)/.test(f)) return "Dental";
  if (/(sugar|glucose|hba1c|diabet)/.test(f)) return "Blood Sugar";
  if (/(onco|biopsy|tumou?r|cancer)/.test(f)) return "Oncology";
  return "General Medicine";
}

export async function analyzeReport(fileName: string) {
  await wait(4200);
  const dept = guessDepartment(fileName);
  return { ...TEMPLATES[dept], pages: 1 + Math.floor(Math.random() * 4) };
}
