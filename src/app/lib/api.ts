import { toast } from "sonner";

export type InterviewType = "software" | "product" | "behavioral" | "general";
export type Timeframe = "1week" | "2weeks" | "1month" | "2months";

export interface JobApplication {
  company: string;
  role: string;
  status: string;
  notes: string;
}

export interface LeetCodeEntry {
  title: string;
  difficulty: string;
  status: string;
  notes: string;
}

export interface CompanyQuestionBankSearchResult {
  company: string;
  total: number;
  categories: Record<
    string,
    Array<{
      question: string;
      difficulty: string;
      tips: string[];
    }>
  >;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  targetCompanies: string[];
  topicPreferences: Record<string, "strength" | "neutral" | "weakness">;
  strengths: string[];
  weaknesses: string[];
  neutralTopics: string[];
  applications: JobApplication[];
  leetCodeEntries: LeetCodeEntry[];
  profileNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanPhase {
  id: string;
  title: string;
  description: string;
  duration: string;
  topics: string[];
}

export interface ScheduleTask {
  id: string;
  title: string;
  duration: string;
  type: "study" | "practice" | "review" | "mock";
}

export interface DaySchedule {
  day: number;
  date: string;
  tasks: ScheduleTask[];
}

export interface PracticeQuestion {
  id: string;
  question: string;
  phaseId: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  tips: string[];
}

export interface PlanData {
  id: string;
  interviewType: InterviewType;
  timeframe: Timeframe;
  targetCompanies: string[];
  strengths: string[];
  weaknesses: string[];
  neutralTopics: string[];
  phases: PlanPhase[];
  schedule: DaySchedule[];
  questions: PracticeQuestion[];
  completedPhases: string[];
  completedTaskIds: string[];
  answeredQuestionIds: string[];
  usedQuestionKeys?: string[];
  updatedAt: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const TOKEN_KEY = "authToken";
let lastSessionToastAt = 0;

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

function handleUnauthorizedResponse() {
  clearToken();
  const now = Date.now();
  if (now - lastSessionToastAt > 10000) {
    toast.error("Your session expired. Please log in again.");
    lastSessionToastAt = now;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    handleUnauthorizedResponse();
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload as T;
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
) {
  return request<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, fullName }),
  });
}

export async function login(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMyProfile() {
  return request<User>("/profile/me");
}

export async function updateMyProfile(
  fullName: string,
  targetCompanies: string[],
  topicPreferences?: Record<string, "strength" | "neutral" | "weakness">,
  applications?: JobApplication[],
  leetCodeEntries?: LeetCodeEntry[],
  profileNotes?: string,
) {
  return request<User>("/profile/me", {
    method: "PUT",
    body: JSON.stringify({
      fullName,
      targetCompanies,
      topicPreferences,
      applications,
      leetCodeEntries,
      profileNotes,
    }),
  });
}

export async function updateMyApplications(applications: JobApplication[]) {
  return request<User>("/profile/me/applications", {
    method: "PATCH",
    body: JSON.stringify({ applications }),
  });
}

export async function updateMyLeetCodeEntries(leetCodeEntries: LeetCodeEntry[]) {
  return request<User>("/profile/me/leetcode", {
    method: "PATCH",
    body: JSON.stringify({ leetCodeEntries }),
  });
}

export async function generatePlan(input: {
  interviewType: InterviewType;
  timeframe: Timeframe;
  targetCompanies: string[];
  strengths: string[];
  weaknesses: string[];
  neutralTopics: string[];
}) {
  return request<PlanData>("/plans/generate", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getCurrentPlan() {
  return request<PlanData>("/plans/current");
}

export async function setPhaseCompleted(phaseId: string, completed: boolean) {
  return request<PlanData>(`/plans/phases/${phaseId}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
}

export async function setTaskCompleted(taskId: string, completed: boolean) {
  return request<PlanData>(`/plans/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
}

export async function setQuestionAnswered(
  questionId: string,
  completed: boolean,
) {
  return request<PlanData>(`/plans/questions/${questionId}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
}

export async function searchQuestionBankCompanies(query: string) {
  return request<{ companies: string[]; count: number }>(
    `/question-bank/companies?query=${encodeURIComponent(query)}`,
  );
}

export async function getQuestionBankForCompany(company: string) {
  return request<CompanyQuestionBankSearchResult>(
    `/question-bank/search?company=${encodeURIComponent(company)}`,
  );
}
