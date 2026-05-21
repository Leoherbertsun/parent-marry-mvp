from __future__ import annotations

from datetime import UTC, datetime
from typing import Any


def age_from_birth_year(birth_year: int) -> int:
    return datetime.now(UTC).year - birth_year


def score_candidate(profile: dict[str, Any], candidate: dict[str, Any], blocked_pairs: set[tuple[str, str]]) -> dict[str, Any] | None:
    if candidate["id"] == profile["id"]:
        return None
    if candidate["status"] != "active":
        return None
    if (profile["id"], candidate["id"]) in blocked_pairs:
        return None
    if profile.get("gender") in {"female", "male"} and candidate.get("gender") == profile.get("gender"):
        return None

    candidate_age = age_from_birth_year(candidate.get("birth_year", 1994))
    age_min = profile.get("preference_age_min") or 24
    age_max = profile.get("preference_age_max") or 40
    if candidate_age < age_min or candidate_age > age_max:
        return None

    pref_city = profile.get("preference_city") or ""
    same_city = profile.get("city") == candidate.get("city")
    city_match = same_city or candidate.get("city", "") in pref_city or bool(profile.get("accepts_long_distance"))
    if not city_match:
        return None

    profile_interests = set(profile.get("interests") or [])
    candidate_interests = set(candidate.get("interests") or [])
    profile_tags = set(profile.get("personality_tags") or [])
    candidate_tags = set(candidate.get("personality_tags") or [])

    breakdown = {
        "城市": 25 if same_city else 14,
        "年龄": 20 if age_min <= candidate_age <= age_max else 0,
        "学历": 12 if "本科" in candidate.get("education", "") or "硕士" in candidate.get("education", "") else 6,
        "职业稳定": 10 if any(word in candidate.get("job_type", "") for word in ["公务", "教师", "医生", "金融", "产品", "工程"]) else 6,
        "婚恋节奏": 12 if candidate.get("marriage_plan") == profile.get("marriage_plan") else 7,
        "生活方式": min(12, 4 + len(profile_tags & candidate_tags) * 4),
        "兴趣": min(14, 4 + len(profile_interests & candidate_interests) * 5),
    }
    score = min(100, sum(breakdown.values()))
    return {"score": score, "score_breakdown": breakdown}
