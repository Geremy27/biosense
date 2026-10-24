import type { MedicalHistoryDatedItem } from '~/db/models/patient-medical-histories';

export type DeidentifiedPatientSnapshot = {
  ageYears: number;
  sex: string | null;
  ethnicity: string | null;
  heightCm: string | null;
  weightKg: string | null;
  bmi: number | null;
  residencePlace: string | null;
  residenceRegion: string | null;
};

export type LocalFoodSnapshot = {
  name: string;
  role: string;
  nutrients: string[];
  notes: string | null;
};

export type LabSnapshot = {
  collectedAt: string | null;
  labName: string | null;
  panelName: string | null;
  analytes: Array<{
    name: string;
    value: string;
    unit: string | null;
    referenceRange: string | null;
    optimalRange: string | null;
    flag: string | null;
  }>;
};

export type MedicalHistorySnapshot = {
  title: string;
  recordedAt: string;
  chiefComplaint: string | null;
  personalHistory1: MedicalHistoryDatedItem[];
  personalHistory2: MedicalHistoryDatedItem[];
  surgicalHistory: MedicalHistoryDatedItem[];
  medications: MedicalHistoryDatedItem[];
  supplements: MedicalHistoryDatedItem[];
  diet: MedicalHistoryDatedItem[];
  infectiousHistory: string | null;
  traumaticHistory: string | null;
  toxicologicalHistory: MedicalHistoryDatedItem[];
  allergies: string | null;
  vaccines: string | null;
  habits: string | null;
  gynecoObstetricHistory: string | null;
  familyHistory: string | null;
  psychosocialHistory: string | null;
  notes: string | null;
};
