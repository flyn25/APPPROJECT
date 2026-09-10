import Constants from "expo-constants";

import { storage } from "@/src/utils/storage";

const configuredUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;
const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
export const API_URL = `${configuredUrl || envUrl || ""}/api`;
const TOKEN_KEY = "aum_bk_token";
let authToken = "";

export async function persistSession(token: string) {
  authToken = token;
  await storage.secureSet(TOKEN_KEY, token);
}

export async function restoreSession(): Promise<string> {
  const saved = await storage.secureGet(TOKEN_KEY, "");
  authToken = saved || "";
  return authToken;
}

export async function clearSession() {
  authToken = "";
  await storage.secureRemove(TOKEN_KEY);
}

export const getAuthHeaders = (): Record<string, string> => (authToken ? { Authorization: `Bearer ${authToken}` } : {});

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body.detail;
    if (detail && typeof detail === "object" && Array.isArray(detail.row_errors)) {
      const rows = detail.row_errors.map((r: { row: number; name?: string; message: string }) => `Baris ${r.row}${r.name ? ` (${r.name})` : ""}: ${r.message}`).join("\n");
      throw new Error(`${detail.message}\n${rows}`);
    }
    throw new Error(typeof detail === "string" ? detail : "Terjadi masalah saat menghubungi server.");
  }
  return body as T;
}

export type Domain = { code: string; name: string; item_count: number };
export type AumFormat = { id: string; code: string; name: string; target: string; total_items: number; domains: Domain[]; mapping_status: string };
export type ThirdStep = { complete?: string; other_problems?: string; want_discussion?: string; discussion_with?: string };
export type Respondent = { id: string; name: string; respondent_id: string; gender?: string; class_name?: string; class_id?: string; format_id: string; selected_problem_numbers: number[]; heavy_problem_numbers: number[]; institution?: string; academic_year?: string; filled_date?: string; third_step?: ThirdStep; konseling_status?: string; created_at?: string };
export type Dashboard = { respondent_count: number; class_count: number; total_problems: number; total_heavy: number; average_problems: number; recent: Respondent[] };
export type School = { id: string; name: string; academic_year: string; levels: string[] };
export type AumClass = { id: string; name: string; level: string; format_id: string; school_id: string };
export type IndividualRow = { domain_code: string; domain_name: string; item_count?: number; count: number; percentage: number; heavy_problem_numbers: number[]; problem_numbers: number[] };
export type IndividualResult = { total_problems: number; overall_percentage: number; total_heavy_problems: number; rows: IndividualRow[] };
export type GroupRow = { domain_code: string; domain_name: string; lowest: number; highest: number; total: number; percentage: number; average: number; heavy_total: number; heavy_average: number };
export type GroupResult = { respondent_count: number; total_problems: number; average_problems: number; total_heavy_problems: number; average_heavy_problems: number; rows: GroupRow[]; contributors: { id: string; name: string; total: number; heavy_total: number }[]; consultation: Record<string, number> };
export type AuthResponse = { token: string; user: { name: string; email: string } };
export type AuditLog = { id: string; action: string; details: { formula?: string }; created_at: string };
export type SchoolRekap = { school: School; respondent_count: number; class_count: number; total_problems: number; total_heavy_problems: number; average_problems: number; domain_rows: { code: string; name: string; total: number; heavy: number }[]; class_summary: { class_id: string; name: string; level: string; respondent_count: number; total_problems: number; total_heavy: number; average_problems: number }[] };
export type Comparison = { classes: { id: string; name: string; level: string; format_id: string }[]; domains: { code: string; name: string; cells: { class_id: string; class_name: string; count: number; respondents: number }[] }[] };
export type Trend = { years: { academic_year: string; respondent_count: number; total_problems: number; total_heavy: number; average_problems: number }[]; series: { code: string; name: string; points: { academic_year: string; total: number; heavy: number; average: number }[] }[] };
export type AuditBreakdown = { respondent: Respondent; format_id: string; breakdown: { domain: string; problem_numbers: string[]; count: number; item_count: number; formula: string; percentage: number; heavy_numbers: string[] }[]; total_problems: number; total_heavy: number; overall_percentage: number };
export type KonselingItem = { id: string; name: string; respondent_id: string; class_name: string; class_id: string; academic_year: string; total_problems: number; total_heavy: number; discussion_with: string; other_problems: string; status: string; note: string; created_at: string };
export type KonselingBoard = { items: KonselingItem[]; counts: Record<string, number> };
export type BulkItem = { name: string; respondent_id: string; gender: string; selected_problem_numbers: number[]; heavy_problem_numbers: number[]; third_step: ThirdStep };

export const login = (email: string, password: string) => apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const register = (name: string, email: string, password: string) => apiFetch<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
export const getMe = () => apiFetch<{ user: { name: string; email: string } }>("/auth/me");
export const getFormats = () => apiFetch<AumFormat[]>("/formats");
export const getDashboard = () => apiFetch<Dashboard>("/dashboard");
export const getSchools = () => apiFetch<School[]>("/schools");
export const getClasses = (schoolId: string) => apiFetch<AumClass[]>(`/classes?school_id=${encodeURIComponent(schoolId)}`);
export const getRespondents = (classId?: string) => apiFetch<Respondent[]>(`/respondents${classId ? `?class_id=${encodeURIComponent(classId)}` : ""}`);
export const getAudit = () => apiFetch<AuditLog[]>("/audit");
export const getGroupScore = (formatId: string, classId: string) => apiFetch<GroupResult>("/scoring/group", { method: "POST", body: JSON.stringify({ format_id: formatId, class_id: classId }) });
export const saveRespondent = (payload: Record<string, unknown>) => apiFetch<{ respondent: Respondent; result_id: string; result: IndividualResult }>("/respondents", { method: "POST", body: JSON.stringify(payload) });
export const saveBulk = (payload: { class_id: string; format_id: string; academic_year: string; items: BulkItem[] }) => apiFetch<{ saved: number; class_id: string }>("/respondents/bulk", { method: "POST", body: JSON.stringify(payload) });
export const getIndividualResult = (respondentId: string) => apiFetch<{ respondent: Respondent; result: IndividualResult }>(`/results/individual/${encodeURIComponent(respondentId)}`);
export const getExportUrl = (scope: "individual" | "group", identifier: string, format: "xlsx" | "pdf") => `${API_URL}/export/${scope}/${encodeURIComponent(identifier)}?format=${format}`;
export const getImportTemplateUrl = () => `${API_URL}/import/template`;

export type SchoolInput = { name: string; academic_year?: string; levels?: string[] };
export const createSchool = (payload: SchoolInput) => apiFetch<School>("/schools", { method: "POST", body: JSON.stringify(payload) });
export const updateSchool = (schoolId: string, payload: { name?: string; academic_year?: string }) => apiFetch<School>(`/schools/${encodeURIComponent(schoolId)}`, { method: "PATCH", body: JSON.stringify(payload) });
export const deleteSchool = (schoolId: string) => apiFetch<{ deleted_school: number }>(`/schools/${encodeURIComponent(schoolId)}`, { method: "DELETE" });
export type ClassInput = { school_id: string; name: string; level?: string; format_id: string };
export const createClass = (payload: ClassInput) => apiFetch<AumClass>("/classes", { method: "POST", body: JSON.stringify(payload) });
export const deleteClass = (classId: string) => apiFetch<{ deleted_class: number; deleted_respondents: number }>(`/classes/${encodeURIComponent(classId)}`, { method: "DELETE" });
export const deleteRespondent = (respondentId: string) => apiFetch<{ deleted: number }>(`/respondents/${encodeURIComponent(respondentId)}`, { method: "DELETE" });
export const getSchoolRekap = (schoolId: string) => apiFetch<SchoolRekap>(`/rekap/school/${encodeURIComponent(schoolId)}`);
export const getClassComparison = (schoolId: string) => apiFetch<Comparison>(`/rekap/comparison?school_id=${encodeURIComponent(schoolId)}`);
export const getTrend = (schoolId: string) => apiFetch<Trend>(`/rekap/trend?school_id=${encodeURIComponent(schoolId)}`);
export const getAuditIndividual = (respondentId: string) => apiFetch<AuditBreakdown>(`/audit/individual/${encodeURIComponent(respondentId)}`);
export const getKonseling = (schoolId?: string) => apiFetch<KonselingBoard>(`/konseling${schoolId ? `?school_id=${encodeURIComponent(schoolId)}` : ""}`);
export const updateKonseling = (respondentId: string, status: string, note: string) => apiFetch<{ id: string; status: string; note: string }>(`/respondents/${encodeURIComponent(respondentId)}/konseling`, { method: "PATCH", body: JSON.stringify({ status, note }) });

export type Analysis = { scope: string; title?: string; summary: string; highlights: string[]; priorities: { code: string; name: string; count: number; percentage: number; label: string; heavy: number[] | number }[]; recommendations: string[]; rules: string[]; ai_narrative: string };
export const getAnalysis = (scope: "individual" | "group" | "school", identifier: string) => apiFetch<Analysis>(`/analysis/${scope}/${encodeURIComponent(identifier)}`);
export const generateAiAnalysis = (scope: "individual" | "group" | "school", identifier: string) => apiFetch<{ narrative: string; cached: boolean }>(`/analysis/${scope}/${encodeURIComponent(identifier)}/ai`, { method: "POST", body: "{}" });

export async function uploadImport(formData: FormData): Promise<{ imported: number; rejected: number; transactional: boolean }> {
  const response = await fetch(`${API_URL}/import/excel`, { method: "POST", body: formData, headers: getAuthHeaders() });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof body.detail === "string" ? body.detail : body.detail?.message || "Import ditolak karena validasi gagal.");
  return body;
}
