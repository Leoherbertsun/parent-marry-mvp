from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


Gender = Literal["female", "male", "other"]
ProfileStatus = Literal["draft", "active", "hidden", "blocked"]
SwipeAction = Literal["like", "favorite", "pass", "block", "report"]


def utc_now() -> datetime:
    return datetime.now(UTC)


class LoginRequest(BaseModel):
    phone: str
    display_name: str | None = None


class User(BaseModel):
    id: str
    phone: str
    display_name: str
    created_at: datetime = Field(default_factory=utc_now)


class PublicProfile(BaseModel):
    headline: str = ""
    basic_summary: str = ""
    work_life: str = ""
    personality_interests: str = ""
    family_values: str = ""
    looking_for: str = ""


class ProfileInput(BaseModel):
    user_id: str
    child_name: str = ""
    gender: Gender = "female"
    birth_year: int = 1994
    city: str = "上海"
    education: str = "本科"
    job_type: str = "互联网/产品"
    current_status: str = "认真了解"
    career: str = ""
    lifestyle: str = ""
    interests: list[str] = Field(default_factory=list)
    personality_tags: list[str] = Field(default_factory=list)
    family_atmosphere: str = ""
    preference_age_min: int = 28
    preference_age_max: int = 36
    preference_city: str = "上海、苏州、杭州"
    preference_education: str = "本科及以上"
    accepts_long_distance: bool = False
    marriage_plan: str = "1-2 年内考虑结婚"
    dealbreakers: list[str] = Field(default_factory=list)
    parent_description: str = ""
    ai_answers: dict[str, str] = Field(default_factory=dict)
    photos: list[str] = Field(default_factory=list)


class Profile(ProfileInput):
    id: str
    status: ProfileStatus = "draft"
    completeness: int = 0
    ai_questions: list[str] = Field(default_factory=list)
    ai_structured: dict[str, Any] = Field(default_factory=dict)
    public_page: PublicProfile = Field(default_factory=PublicProfile)
    photos: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class AIResult(BaseModel):
    profile_id: str
    structured: dict[str, Any]
    questions: list[str]
    public_page: PublicProfile


class AITask(BaseModel):
    id: str
    profile_id: str
    task_type: str
    input_snapshot: dict[str, Any]
    output_snapshot: dict[str, Any]
    created_at: datetime = Field(default_factory=utc_now)


class Recommendation(BaseModel):
    id: str
    profile_id: str
    candidate_profile_id: str
    date: str
    score: int
    score_breakdown: dict[str, int]
    reason: str
    confirm_question: str
    opener: str
    created_at: datetime = Field(default_factory=utc_now)


class RecommendationWithCandidate(BaseModel):
    recommendation: Recommendation
    candidate: Profile


class SwipeRequest(BaseModel):
    actor_profile_id: str
    target_profile_id: str
    action: SwipeAction
    note: str | None = None


class SwipeEvent(BaseModel):
    id: str
    actor_profile_id: str
    target_profile_id: str
    action: SwipeAction
    note: str | None = None
    created_at: datetime = Field(default_factory=utc_now)


class MatchRecord(BaseModel):
    id: str
    profile_a_id: str
    profile_b_id: str
    status: Literal["pending", "mutual_like", "closed"] = "mutual_like"
    created_at: datetime = Field(default_factory=utc_now)


class ReportRecord(BaseModel):
    id: str
    reporter_profile_id: str
    target_profile_id: str
    reason: str
    status: Literal["open", "reviewed", "closed"] = "open"
    created_at: datetime = Field(default_factory=utc_now)


class StatusUpdate(BaseModel):
    status: ProfileStatus
