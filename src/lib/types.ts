export type Gender = "Male" | "Female" | "Other";
export type InsuranceType = "Government" | "Private";
export type TreatmentStatus = "ongoing" | "treated" | "not_treated" | "unknown";
export type Department = "Eye Care" | "Dental" | "Blood Sugar" | "Oncology" | "General Medicine";
export type Severity = "Mild" | "Moderate" | "Severe";
export type FieldType = "text" | "number" | "date" | "select" | "boolean";

export interface Patient {
  id: number;
  fullName: string;
  aadhaar?: string | undefined;
  pan?: string | undefined;
  dob?: string | undefined;
  age?: number | undefined;
  gender: Gender;
  mobile?: string | undefined;
  address?: string | undefined;
  insurance?:
    | {
        type: InsuranceType;
        provider: string;
        policyNo: string;
        validTill?: string | undefined;
      }
    | undefined;
  customFields: Record<string, string | number | boolean>;
  consentAt: string;
  createdAt: string;
}

export interface Admission {
  id: number;
  patientId: number;
  admissionDate: string;
  dischargeDate?: string | undefined;
  reason: string;
}

export interface LabReading {
  name: string;
  value: string;
  unit?: string | undefined;
  abnormal: boolean;
}

export interface Medication {
  name: string;
  dosage: string;
}

export interface MedicalReport {
  id: number;
  patientId: number;
  fileName: string;
  pages: number;
  department: Department;
  condition: string;
  keywords: string[];
  severity: Severity;
  treatmentStatus: TreatmentStatus;
  summary: string;
  evidence: string;
  readings: LabReading[];
  medications: Medication[];
  diagnosedDate: string;
}

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  options?: string[] | undefined;
  required?: boolean | undefined;
}

export interface AuditEntry {
  id: number;
  action: string;
  detail: string;
  at: string;
}

export interface AppData {
  patients: Patient[];
  admissions: Admission[];
  reports: MedicalReport[];
  fields: FieldDefinition[];
  audit: AuditEntry[];
  apiKey?: string | undefined;
}
