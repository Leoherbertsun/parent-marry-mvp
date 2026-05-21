from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Any
from uuid import uuid4

from .ai_service import MockAIService
from .models import (
    AITask,
    LoginRequest,
    MatchRecord,
    Profile,
    ProfileInput,
    PublicProfile,
    Recommendation,
    ReportRecord,
    SwipeEvent,
    SwipeRequest,
    User,
)
from .mock_profiles import MOCK_PROFILES
from .recommender import score_candidate


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:10]}"


class InMemoryStore:
    def __init__(self) -> None:
        self.ai = MockAIService()
        self.users: dict[str, User] = {}
        self.profiles: dict[str, Profile] = {}
        self.ai_tasks: list[AITask] = []
        self.recommendations: list[Recommendation] = []
        self.swipe_events: list[SwipeEvent] = []
        self.matches: list[MatchRecord] = []
        self.reports: list[ReportRecord] = []
        self._seed()

    def login(self, payload: LoginRequest) -> User:
        existing = next((user for user in self.users.values() if user.phone == payload.phone), None)
        if existing:
            return existing
        user = User(
            id=new_id("user"),
            phone=payload.phone,
            display_name=payload.display_name or f"家长 {payload.phone[-4:]}",
        )
        self.users[user.id] = user
        return user

    def upsert_profile(self, payload: ProfileInput) -> Profile:
        existing = next((item for item in self.profiles.values() if item.user_id == payload.user_id), None)
        data = payload.model_dump()
        if existing:
            updated = existing.model_copy(update={**data, "updated_at": datetime.now(UTC)})
            updated.completeness = self._completeness(updated)
            self.profiles[updated.id] = updated
            return updated

        profile = Profile(id=new_id("profile"), **data)
        profile.completeness = self._completeness(profile)
        self.profiles[profile.id] = profile
        return profile

    def get_profile_for_user(self, user_id: str) -> Profile | None:
        return next((profile for profile in self.profiles.values() if profile.user_id == user_id), None)

    def normalize_profile(self, profile_id: str) -> Profile:
        profile = self.require_profile(profile_id)
        output = self.ai.normalize_profile(profile.model_dump())
        updated = profile.model_copy(
            update={
                "ai_structured": output["structured"],
                "ai_questions": output["questions"],
                "public_page": PublicProfile(**output["public_page"]),
                "completeness": max(profile.completeness, 86),
                "updated_at": datetime.now(UTC),
            }
        )
        self.profiles[profile_id] = updated
        self.ai_tasks.append(
            AITask(
                id=new_id("ai"),
                profile_id=profile_id,
                task_type="profile_normalization",
                input_snapshot=profile.model_dump(),
                output_snapshot=output,
            )
        )
        return updated

    def update_public_page(self, profile_id: str, public_page: dict[str, Any]) -> Profile:
        profile = self.require_profile(profile_id)
        updated = profile.model_copy(
            update={"public_page": PublicProfile(**public_page), "updated_at": datetime.now(UTC)}
        )
        self.profiles[profile_id] = updated
        return updated

    def publish_profile(self, profile_id: str) -> Profile:
        profile = self.require_profile(profile_id)
        updated = profile.model_copy(update={"status": "active", "completeness": 100, "updated_at": datetime.now(UTC)})
        self.profiles[profile_id] = updated
        self._ensure_demo_incoming_like(updated)
        return updated

    def today_recommendations(self, profile_id: str) -> list[dict[str, Any]]:
        profile = self.require_profile(profile_id)
        today = date.today().isoformat()
        cached = [
            rec for rec in self.recommendations
            if rec.profile_id == profile_id and rec.date == today
        ]
        if not cached:
            blocked_pairs = {
                (event.actor_profile_id, event.target_profile_id)
                for event in self.swipe_events
                if event.action in {"pass", "block", "report"}
            }
            scored: list[tuple[Profile, dict[str, Any]]] = []
            for candidate in self.profiles.values():
                score = score_candidate(profile.model_dump(), candidate.model_dump(), blocked_pairs)
                if score:
                    scored.append((candidate, score))

            for candidate, score in sorted(scored, key=lambda item: item[1]["score"], reverse=True)[:3]:
                explanation = self.ai.explain_recommendation(
                    profile.model_dump(),
                    candidate.model_dump(),
                    score["score_breakdown"],
                )
                rec = Recommendation(
                    id=new_id("rec"),
                    profile_id=profile_id,
                    candidate_profile_id=candidate.id,
                    date=today,
                    score=score["score"],
                    score_breakdown=score["score_breakdown"],
                    **explanation,
                )
                self.recommendations.append(rec)
                self.ai_tasks.append(
                    AITask(
                        id=new_id("ai"),
                        profile_id=profile_id,
                        task_type="recommendation_explanation",
                        input_snapshot={
                            "profile_id": profile_id,
                            "candidate_profile_id": candidate.id,
                            "score_breakdown": score["score_breakdown"],
                        },
                        output_snapshot=explanation,
                    )
                )
            cached = [rec for rec in self.recommendations if rec.profile_id == profile_id and rec.date == today]

        return [
            {"recommendation": rec, "candidate": self.profiles[rec.candidate_profile_id]}
            for rec in cached
        ]

    def browse_candidates(self, profile_id: str) -> list[dict[str, Any]]:
        profile = self.require_profile(profile_id)
        blocked_pairs = {
            (event.actor_profile_id, event.target_profile_id)
            for event in self.swipe_events
            if event.action in {"pass", "block", "report"}
        }
        scored: list[tuple[Profile, dict[str, Any]]] = []
        for candidate in self.profiles.values():
            score = score_candidate(profile.model_dump(), candidate.model_dump(), blocked_pairs)
            if score:
                scored.append((candidate, score))

        rows: list[dict[str, Any]] = []
        for candidate, score in sorted(scored, key=lambda item: item[1]["score"], reverse=True):
            explanation = self.ai.explain_recommendation(
                profile.model_dump(),
                candidate.model_dump(),
                score["score_breakdown"],
            )
            rows.append(
                {
                    "candidate": candidate,
                    "score": score["score"],
                    "score_breakdown": score["score_breakdown"],
                    **explanation,
                }
            )
        return rows

    def record_action(self, payload: SwipeRequest) -> dict[str, Any]:
        actor = self.require_profile(payload.actor_profile_id)
        target = self.require_profile(payload.target_profile_id)
        event = SwipeEvent(id=new_id("swipe"), **payload.model_dump())
        self.swipe_events.append(event)

        report: ReportRecord | None = None
        if payload.action == "report":
            report = ReportRecord(
                id=new_id("report"),
                reporter_profile_id=actor.id,
                target_profile_id=target.id,
                reason=payload.note or "用户举报",
            )
            self.reports.append(report)

        match = None
        if payload.action == "like":
            reciprocal = any(
                item.actor_profile_id == target.id
                and item.target_profile_id == actor.id
                and item.action == "like"
                for item in self.swipe_events
            )
            if reciprocal:
                match = self._get_or_create_match(actor.id, target.id)

        return {"event": event, "match": match, "report": report}

    def matches_for_profile(self, profile_id: str) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for match in self.matches:
            if profile_id not in {match.profile_a_id, match.profile_b_id}:
                continue
            other_id = match.profile_b_id if match.profile_a_id == profile_id else match.profile_a_id
            rows.append({"match": match, "profile": self.profiles[other_id]})
        return rows

    def admin_summary(self) -> dict[str, int]:
        return {
            "users": len(self.users),
            "profiles": len(self.profiles),
            "active_profiles": len([item for item in self.profiles.values() if item.status == "active"]),
            "recommendations": len(self.recommendations),
            "swipe_events": len(self.swipe_events),
            "matches": len(self.matches),
            "ai_tasks": len(self.ai_tasks),
            "reports": len(self.reports),
        }

    def set_profile_status(self, profile_id: str, status: str) -> Profile:
        profile = self.require_profile(profile_id)
        updated = profile.model_copy(update={"status": status, "updated_at": datetime.now(UTC)})
        self.profiles[profile_id] = updated
        return updated

    def require_profile(self, profile_id: str) -> Profile:
        if profile_id not in self.profiles:
            raise KeyError(profile_id)
        return self.profiles[profile_id]

    def _get_or_create_match(self, profile_a_id: str, profile_b_id: str) -> MatchRecord:
        pair = {profile_a_id, profile_b_id}
        existing = next(
            (item for item in self.matches if {item.profile_a_id, item.profile_b_id} == pair),
            None,
        )
        if existing:
            return existing
        match = MatchRecord(id=new_id("match"), profile_a_id=profile_a_id, profile_b_id=profile_b_id)
        self.matches.append(match)
        return match

    def _ensure_demo_incoming_like(self, profile: Profile) -> None:
        if any(event.target_profile_id == profile.id and event.action == "like" for event in self.swipe_events):
            return
        candidate = next(
            (
                item for item in self.profiles.values()
                if item.id != profile.id and item.status == "active" and item.gender != profile.gender
            ),
            None,
        )
        if candidate:
            self.swipe_events.append(
                SwipeEvent(
                    id=new_id("swipe"),
                    actor_profile_id=candidate.id,
                    target_profile_id=profile.id,
                    action="like",
                    note="demo incoming interest",
                )
            )

    def _completeness(self, profile: Profile) -> int:
        required = [
            profile.child_name,
            profile.gender,
            profile.birth_year,
            profile.city,
            profile.education,
            profile.job_type,
            profile.career,
            profile.lifestyle,
            profile.parent_description,
            profile.preference_city,
            profile.marriage_plan,
        ]
        filled = len([item for item in required if item])
        tag_bonus = min(2, len(profile.interests)) + min(2, len(profile.personality_tags))
        return min(100, int((filled + tag_bonus) / (len(required) + 4) * 100))

    def _seed(self) -> None:
        for row in MOCK_PROFILES:
            user = self.login(LoginRequest(phone=row["phone"], display_name=row["display_name"]))
            profile_data = dict(row["profile"])
            photos = profile_data.pop("photos", [])
            profile = self.upsert_profile(ProfileInput(user_id=user.id, **profile_data))
            if photos:
                profile = profile.model_copy(update={"photos": photos})
                self.profiles[profile.id] = profile
            normalized = self.normalize_profile(profile.id)
            self.profiles[profile.id] = normalized.model_copy(
                update={"status": "active", "completeness": 100, "photos": photos}
            )
