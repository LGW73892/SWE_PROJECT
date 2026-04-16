export type InterviewType = "software" | "product" | "behavioral" | "general";
export type Timeframe = "1week" | "2weeks" | "1month" | "2months";

export interface User {
  id: string;
  email: string;
  fullName: string;
  targetCompanies: string[];
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
  category: string;
  difficulty: "easy" | "medium" | "hard";
  tips: string[];
}

export interface PlanData {
  id: string;
  interviewType: InterviewType;
  timeframe: Timeframe;
  targetCompanies: string[];
  phases: PlanPhase[];
  schedule: DaySchedule[];
  questions: PracticeQuestion[];
  completedPhases: string[];
  completedTaskIds: string[];
  answeredQuestionIds: string[];
  updatedAt: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

const API_BASE = "/api";
const TOKEN_KEY = "authToken";

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
    clearToken();
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
) {
  return request<User>("/profile/me", {
    method: "PUT",
    body: JSON.stringify({ fullName, targetCompanies }),
  });
}

export async function generatePlan(input: {
  interviewType: InterviewType;
  timeframe: Timeframe;
  targetCompanies: string[];
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
