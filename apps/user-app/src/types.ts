export type Gender = "female" | "male" | "other";
export type ProfileStatus = "draft" | "active" | "hidden" | "blocked";
export type SwipeAction = "like" | "favorite" | "pass" | "block" | "report";

export interface User {
  id: string;
  phone: string;
  display_name: string;
  created_at: string;
}

export interface PublicProfile {
  headline: string;
  basic_summary: string;
  work_life: string;
  personality_interests: string;
  family_values: string;
  looking_for: string;
}

export interface ProfileInput {
  user_id: string;
  child_name: string;
  gender: Gender;
  birth_year: number;
  city: string;
  education: string;
  job_type: string;
  current_status: string;
  career: string;
  lifestyle: string;
  interests: string[];
  personality_tags: string[];
  family_atmosphere: string;
  preference_age_min: number;
  preference_age_max: number;
  preference_city: string;
  preference_education: string;
  accepts_long_distance: boolean;
  marriage_plan: string;
  dealbreakers: string[];
  parent_description: string;
  ai_answers: Record<string, string>;
  photos: string[];
}

export interface Profile extends ProfileInput {
  id: string;
  status: ProfileStatus;
  completeness: number;
  ai_questions: string[];
  ai_structured: Record<string, unknown>;
  public_page: PublicProfile;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  profile_id: string;
  candidate_profile_id: string;
  date: string;
  score: number;
  score_breakdown: Record<string, number>;
  reason: string;
  confirm_question: string;
  opener: string;
  created_at: string;
}

export interface RecommendationWithCandidate {
  recommendation: Recommendation;
  candidate: Profile;
}

export interface BrowseItem {
  candidate: Profile;
  score: number;
  score_breakdown: Record<string, number>;
  reason: string;
  confirm_question: string;
  opener: string;
}

export interface SwipeResult {
  event: {
    id: string;
    action: SwipeAction;
    actor_profile_id: string;
    target_profile_id: string;
  };
  match: null | {
    id: string;
    status: "mutual_like";
    profile_a_id: string;
    profile_b_id: string;
  };
}

export interface MatchWithProfile {
  match: {
    id: string;
    status: "pending" | "mutual_like" | "closed";
    created_at: string;
  };
  profile: Profile;
}

