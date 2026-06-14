export type PersonaStatus = "PASS" | "WARN" | "FAIL";

export interface PersonaTask {
  id: string;
  label: string;
  legalRef: string;
  legalSummary: string;
  systemInstruction: string;
  articleDir: string;
}

export interface PersonaOutput {
  status: PersonaStatus;
  issue: string;
  suggestion: string;
  translatedLabel: string;
  translatedLegalRef: string;
  translatedLegalSummary: string;
}

export interface CheckItemResult {
  id: string;
  label: string;
  legalRef: string;
  legalSummary: string;
  status: PersonaStatus;
  issue: string | null;
  suggestion: string | null;
}

export interface ComplianceCheckResponse {
  isCompliant: boolean;
  results: CheckItemResult[];
  mock: boolean;
}
