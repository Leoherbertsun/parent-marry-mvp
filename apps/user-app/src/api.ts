import type {
  BrowseItem,
  MatchWithProfile,
  Profile,
  ProfileInput,
  PublicProfile,
  RecommendationWithCandidate,
  SwipeAction,
  SwipeResult,
  User,
} from "./types";
import { staticApi } from "./staticApi";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const USE_STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === "true";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

const remoteApi = {
  login(phone: string, displayName?: string) {
    return request<User>("/auth/mock-login", {
      method: "POST",
      body: JSON.stringify({ phone, display_name: displayName }),
    });
  },
  currentProfile(userId: string) {
    return request<Profile | null>(`/profiles/current?user_id=${encodeURIComponent(userId)}`);
  },
  saveProfile(payload: ProfileInput) {
    return request<Profile>("/profiles", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  normalizeProfile(profileId: string) {
    return request<Profile>(`/profiles/${profileId}/ai/normalize`, { method: "POST" });
  },
  updatePublicPage(profileId: string, payload: PublicProfile) {
    return request<Profile>(`/profiles/${profileId}/public-page`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  publishProfile(profileId: string) {
    return request<Profile>(`/profiles/${profileId}/publish`, { method: "POST" });
  },
  todayRecommendations(profileId: string) {
    return request<RecommendationWithCandidate[]>(
      `/recommendations/today?profile_id=${encodeURIComponent(profileId)}`,
    );
  },
  browse(profileId: string) {
    return request<BrowseItem[]>(`/candidates?profile_id=${encodeURIComponent(profileId)}`);
  },
  act(actorProfileId: string, targetProfileId: string, action: SwipeAction, note?: string) {
    return request<SwipeResult>("/actions", {
      method: "POST",
      body: JSON.stringify({
        actor_profile_id: actorProfileId,
        target_profile_id: targetProfileId,
        action,
        note,
      }),
    });
  },
  matches(profileId: string) {
    return request<MatchWithProfile[]>(`/matches?profile_id=${encodeURIComponent(profileId)}`);
  },
};

export const api = USE_STATIC_DEMO ? staticApi : remoteApi;
