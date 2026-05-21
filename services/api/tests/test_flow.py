from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_full_matchmaking_flow():
    user = client.post(
        "/auth/mock-login",
        json={"phone": "13812345678", "display_name": "测试家长"},
    ).json()

    profile = client.post(
        "/profiles",
        json={
            "user_id": user["id"],
            "child_name": "测试候选人",
            "gender": "female",
            "birth_year": 1994,
            "city": "上海",
            "education": "本科",
            "job_type": "品牌运营",
            "current_status": "认真了解",
            "career": "在消费品牌做运营，工作稳定。",
            "lifestyle": "喜欢电影、咖啡和规律运动。",
            "interests": ["电影", "咖啡", "健身"],
            "personality_tags": ["温和", "靠谱"],
            "family_atmosphere": "家庭沟通平等，尊重孩子节奏。",
            "preference_age_min": 28,
            "preference_age_max": 36,
            "preference_city": "上海、杭州、苏州",
            "preference_education": "本科及以上",
            "accepts_long_distance": True,
            "marriage_plan": "1-2 年内考虑结婚",
            "dealbreakers": ["长期不沟通"],
            "parent_description": "孩子温和靠谱，喜欢电影和咖啡，希望找认真稳定的人。",
        },
    ).json()

    normalized = client.post(f"/profiles/{profile['id']}/ai/normalize").json()
    assert normalized["public_page"]["headline"]
    assert normalized["ai_questions"]

    published = client.post(f"/profiles/{profile['id']}/publish").json()
    assert published["status"] == "active"

    recommendations = client.get(
        "/recommendations/today",
        params={"profile_id": profile["id"]},
    ).json()
    assert len(recommendations) > 0

    target_id = recommendations[0]["candidate"]["id"]
    action_result = client.post(
        "/actions",
        json={
            "actor_profile_id": profile["id"],
            "target_profile_id": target_id,
            "action": "like",
        },
    ).json()
    assert action_result["event"]["action"] == "like"

    matches = client.get("/matches", params={"profile_id": profile["id"]}).json()
    assert len(matches) >= 1

