const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AdminData {
  summary: Record<string, number>;
  users: AdminUser[];
  profiles: AdminProfile[];
  recommendations: AdminRecommendation[];
  swipeEvents: AdminSwipeEvent[];
  matches: AdminMatch[];
  aiTasks: AdminAITask[];
  reports: AdminReport[];
}

export interface AdminUser {
  id: string;
  phone: string;
  display_name: string;
}

export interface AdminProfile {
  id: string;
  child_name: string;
  gender: string;
  birth_year: number;
  city: string;
  education: string;
  job_type: string;
  status: "draft" | "active" | "hidden" | "blocked";
  completeness: number;
  public_page: {
    headline: string;
    basic_summary: string;
  };
}

export interface AdminRecommendation {
  id: string;
  profile_id: string;
  candidate_profile_id: string;
  score: number;
  score_breakdown: Record<string, number>;
  reason: string;
  date: string;
}

export interface AdminSwipeEvent {
  id: string;
  actor_profile_id: string;
  target_profile_id: string;
  action: string;
  created_at: string;
}

export interface AdminMatch {
  id: string;
  profile_a_id: string;
  profile_b_id: string;
  status: string;
}

export interface AdminAITask {
  id: string;
  profile_id: string;
  task_type: string;
  input_snapshot: Record<string, unknown>;
  output_snapshot: Record<string, unknown>;
  created_at: string;
}

export interface AdminReport {
  id: string;
  reporter_profile_id: string;
  target_profile_id: string;
  reason: string;
  status: string;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function loadAdminData(): Promise<AdminData> {
  const [
    summary,
    users,
    profiles,
    recommendations,
    swipeEvents,
    matches,
    aiTasks,
    reports,
  ] = await Promise.all([
    getJson<Record<string, number>>("/admin/summary"),
    getJson<AdminUser[]>("/admin/users"),
    getJson<AdminProfile[]>("/admin/profiles"),
    getJson<AdminRecommendation[]>("/admin/recommendations"),
    getJson<AdminSwipeEvent[]>("/admin/swipe-events"),
    getJson<AdminMatch[]>("/admin/matches"),
    getJson<AdminAITask[]>("/admin/ai-tasks"),
    getJson<AdminReport[]>("/admin/reports"),
  ]);

  return {
    summary,
    users,
    profiles,
    recommendations,
    swipeEvents,
    matches,
    aiTasks,
    reports,
  };
}

export async function updateProfileStatus(profileId: string, status: AdminProfile["status"]) {
  const response = await fetch(`${API_BASE}/admin/profiles/${profileId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error("Failed to update profile status");
  }
  return response.json() as Promise<AdminProfile>;
}

