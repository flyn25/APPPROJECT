import Constants from "expo-constants";

const configuredUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;
const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
const API_URL = `${configuredUrl || envUrl || ""}/api`;

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
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
export const demoLogin = () => apiFetch<{ token: string; user: { name: string; email: string }; mode: string }>("/auth/demo", { method: "POST", body: "{}" });
export const getDashboard = () => apiFetch<Dashboard>("/dashboard?mode=demo");
export const getSchools = () => apiFetch<School[]>("/schools?mode=demo");
export const getClasses = (schoolId: string) => apiFetch<AumClass[]>(`/classes?school_id=${encodeURIComponent(schoolId)}&mode=demo`);
export const getRespondents = (classId?: string) => apiFetch<Respondent[]>(`/respondents?mode=demo${classId ? `&class_id=${encodeURIComponent(classId)}` : ""}`);
export const getAudit = () => apiFetch<{ id: string; action: string; details: { formula: string }; created_at: string }[]>("/audit?mode=demo");
export const getGroupScore = (formatId: string, classId: string) => apiFetch<GroupResult>("/scoring/group", { method: "POST", body: JSON.stringify({ format_id: formatId, class_id: classId }) });
export const saveRespondent = (payload: Record<string, unknown>) => apiFetch<{ respondent: Respondent; result_id: string; result: IndividualResult }>("/respondents", { method: "POST", body: JSON.stringify(payload) });