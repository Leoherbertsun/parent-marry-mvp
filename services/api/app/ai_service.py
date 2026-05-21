from __future__ import annotations

from typing import Any

from .models import PublicProfile


class MockAIService:
    """Swappable AI boundary for profile cleanup and recommendation explanation."""

    def normalize_profile(self, profile: dict[str, Any]) -> dict[str, Any]:
        interests = profile.get("interests") or []
        personality = profile.get("personality_tags") or []
        description = profile.get("parent_description") or ""
        lifestyle = profile.get("lifestyle") or ""
        city = profile.get("city") or "同城"
        job_type = profile.get("job_type") or "稳定职业"

        inferred_tags = self._infer_tags(description + " " + lifestyle)
        personality_tags = list(dict.fromkeys([*personality, *inferred_tags["personality"]]))[:6]
        lifestyle_tags = list(dict.fromkeys(inferred_tags["lifestyle"] or ["作息规律"]))[:5]
        interest_tags = list(dict.fromkeys([*interests, *inferred_tags["interests"]]))[:6]

        structured = {
            "personality_tags": personality_tags,
            "lifestyle_tags": lifestyle_tags,
            "interest_tags": interest_tags,
            "family_values": profile.get("family_atmosphere") or "家庭沟通直接，重视稳定关系",
            "relationship_pace": profile.get("marriage_plan") or "认真了解，节奏稳定",
            "partner_preferences": {
                "age_range": [profile.get("preference_age_min"), profile.get("preference_age_max")],
                "city": profile.get("preference_city"),
                "education": profile.get("preference_education"),
                "accepts_long_distance": profile.get("accepts_long_distance"),
            },
            "dealbreakers": profile.get("dealbreakers") or [],
        }

        questions = [
            "孩子平时最放松的生活状态是什么样？",
            "你们最看重对方家庭或相处方式中的哪一点？",
            "如果双方感觉合适，你们期待多久进入更认真了解？",
        ]

        public_page = PublicProfile(
            headline=f"{city}，{job_type}，希望认真认识合适的人",
            basic_summary=(
                f"{profile.get('child_name') or '这位候选人'}出生于 {profile.get('birth_year')} 年，"
                f"目前在{city}，学历为{profile.get('education')}，状态是{profile.get('current_status')}。"
            ),
            work_life=(
                f"职业方向偏{job_type}。{profile.get('career') or '工作节奏比较稳定，重视长期成长。'} "
                f"{lifestyle or '生活习惯规律，周末愿意留出时间认识新朋友。'}"
            ),
            personality_interests=(
                f"性格关键词：{'、'.join(personality_tags or ['真诚', '稳定'])}。"
                f"兴趣包括：{'、'.join(interest_tags or ['散步', '看展', '电影'])}。"
            ),
            family_values=structured["family_values"],
            looking_for=(
                f"希望认识 {profile.get('preference_city') or city}，"
                f"{profile.get('preference_education') or '教育背景相近'}，"
                f"{profile.get('marriage_plan') or '对关系认真'}的人。"
            ),
        )

        return {
            "structured": structured,
            "questions": questions,
            "public_page": public_page.model_dump(),
        }

    def explain_recommendation(
        self,
        profile: dict[str, Any],
        candidate: dict[str, Any],
        score_breakdown: dict[str, int],
    ) -> dict[str, str]:
        shared_city = profile.get("city") == candidate.get("city")
        top_score = max(score_breakdown, key=score_breakdown.get) if score_breakdown else "整体匹配"
        city_phrase = "双方在同一城市，后续见面成本较低" if shared_city else "城市不完全相同，但对异地或周边城市有一定接受度"

        return {
            "reason": (
                f"{city_phrase}；双方在{top_score}上匹配度较高，生活节奏和婚恋预期也比较接近。"
            ),
            "confirm_question": "可以进一步确认双方未来 1-2 年是否倾向留在当前城市。",
            "opener": f"可以从{candidate.get('interests', ['周末安排'])[0]}和近期生活节奏聊起。",
        }

    def _infer_tags(self, text: str) -> dict[str, list[str]]:
        rules = {
            "personality": {
                "慢热": ["慢热", "稳重"],
                "外向": ["外向", "表达直接"],
                "温和": ["温和"],
                "独立": ["独立"],
                "靠谱": ["靠谱"],
            },
            "lifestyle": {
                "运动": ["规律运动"],
                "健身": ["规律运动"],
                "做饭": ["会照顾生活"],
                "旅行": ["愿意探索"],
                "加班": ["工作投入"],
                "规律": ["作息规律"],
            },
            "interests": {
                "电影": ["电影"],
                "展": ["看展"],
                "书": ["阅读"],
                "咖啡": ["咖啡"],
                "徒步": ["徒步"],
                "羽毛球": ["羽毛球"],
            },
        }

        inferred: dict[str, list[str]] = {"personality": [], "lifestyle": [], "interests": []}
        for group, group_rules in rules.items():
            for keyword, tags in group_rules.items():
                if keyword in text:
                    inferred[group].extend(tags)
        return inferred
