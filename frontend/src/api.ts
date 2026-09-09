import Constants from "expo-constants";

const configuredUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;
const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
export const API_URL = `${configuredUrl || envUrl || ""}/api`;
let authToken = "";
let activeMode: "demo" | "real" = "demo";

export function setAuthSession(token: string, mode: "demo" | "real") {
  authToken = token;
  activeMode = mode;
}

export const getActiveMode = () => activeMode;
export const getAuthHeaders = (): Record<string, string> => authToken ? { Authorization: `Bearer ${authToken}` } : {};

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}), ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || "Terjadi masalah saat menghubungi server.");
  return body as T;
}

export type Domain = { code: string; name: string; item_count: number };
export type AumFormat = { id: string; code: string; name: string; target: string; total_items: number; domains: Domain[] };
export type Respondent = { id: string; name: string; respondent_id: string; gender?: string; class_name?: string; class_id?: string; format_id: string; selected_problem_numbers: number[]; heavy_problem_numbers: number[]; institution?: string; created_at?: string };
export type Dashboard = { respondent_count: number; class_count: number; total_problems: number; total_heavy: number; average_problems: number; recent: Respondent[] };
export type School = { id: string; name: string; academic_year: string; levels: string[] };
export type AumClass = { id: string; name: string; level: string; format_id: string; school_id: string };
export type IndividualResult = { total_problems: number; overall_percentage: number; total_heavy_problems: number; rows: { domain_code: string; domain_name: string; count: number; percentage: number; heavy_problem_numbers: number[]; problem_numbers: number[] }[] };
export type GroupResult = { respondent_count: number; total_problems: number; average_problems: number; total_heavy_problems: number; average_heavy_problems: number; rows: { domain_code: string; domain_name: string; lowest: number; highest: number; total: number; percentage: number; average: number; heavy_total: number; heavy_average: number }[]; contributors: { id: string; name: string; total: number; heavy_total: number }[] };

export const getFormats = () => apiFetch<AumFormat[]>("/formats");
export type AuthResponse = { token: string; user: { name: string; email: string }; mode: "demo" | "real" };
export const login = (email: string, password: string) => apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const register = (name: string, email: string, password: string) => apiFetch<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
export const demoLogin = () => apiFetch<AuthResponse>("/auth/demo", { method: "POST", body: "{}" });
export const getDashboard = () => apiFetch<Dashboard>(`/dashboard`);
export const getSchools = () => apiFetch<School[]>(`/schools`);
export const getClasses = (schoolId: string) => apiFetch<AumClass[]>(`/classes?school_id=${encodeURIComponent(schoolId)}`);
export const getRespondents = (classId?: string) => apiFetch<Respondent[]>(`/respondents${classId ? `?class_id=${encodeURIComponent(classId)}` : ""}`);
export const getAudit = () => apiFetch<{ id: string; action: string; details: { formula: string }; created_at: string }[]>("/audit");
export const getGroupScore = (formatId: string, classId: string) => apiFetch<GroupResult>("/scoring/group", { method: "POST", body: JSON.stringify({ format_id: formatId, class_id: classId }) });
export const saveRespondent = (payload: Record<string, unknown>) => apiFetch<{ respondent: Respondent; result_id: string; result: IndividualResult }>("/respondents", { method: "POST", body: JSON.stringify(payload) });
export const getExportUrl = (scope: "individual" | "group", identifier: string, format: "xlsx" | "pdf") => `${API_URL}/export/${scope}/${encodeURIComponent(identifier)}?format=${format}`;
export const getImportTemplateUrl = () => `${API_URL}/import/template`;

export type SchoolInput = { name: string; academic_year?: string; levels?: string[] };
export const createSchool = (payload: SchoolInput) => apiFetch<School>("/schools", { method: "POST", body: JSON.stringify(payload) });
export type ClassInput = { school_id: string; name: string; level?: string; format_id: string };
export const createClass = (payload: ClassInput) => apiFetch<AumClass>("/classes", { method: "POST", body: JSON.stringify(payload) });
export type SchoolRekap = { school: School; respondent_count: number; class_count: number; total_problems: number; total_heavy_problems: number; average_problems: number; domain_rows: { code: string; name: string; total: number; heavy: number }[]; class_summary: { class_id: string; name: string; level: string; respondent_count: number; total_problems: number; total_heavy: number; average_problems: number }[] };
export const getSchoolRekap = (schoolId: string) => apiFetch<SchoolRekap>(`/rekap/school/${encodeURIComponent(schoolId)}`);
export type Comparison = { classes: { id: string; name: string; level: string; format_id: string }[]; domains: { code: string; name: string; cells: { class_id: string; class_name: string; count: number; respondents: number }[] }[] };
export const getClassComparison = (schoolId: string) => apiFetch<Comparison>(`/rekap/comparison?school_id=${encodeURIComponent(schoolId)}`);
export type AuditBreakdown = { respondent: Respondent; format_id: string; breakdown: { domain: string; problem_numbers: string[]; count: number; item_count: number; formula: string; percentage: number; heavy_numbers: string[] }[]; total_problems: number; total_heavy: number; overall_percentage: number };
export const getAuditIndividual = (respondentId: string) => apiFetch<AuditBreakdown>(`/audit/individual/${encodeURIComponent(respondentId)}`);

export async function uploadImport(formData: FormData): Promise<{ imported: number; rejected: number; transactional: boolean }> {
  const response = await fetch(`${API_URL}/import/excel`, { method: "POST", body: formData, headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof body.detail === "string" ? body.detail : body.detail?.message || "Import ditolak karena validasi gagal.");
  return body;
}