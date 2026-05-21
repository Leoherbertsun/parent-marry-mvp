from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import LoginRequest, ProfileInput, PublicProfile, StatusUpdate, SwipeRequest
from .store import InMemoryStore


app = FastAPI(title="ParentMarry MVP API", version="0.1.0")
store = InMemoryStore()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/mock-login")
def mock_login(payload: LoginRequest):
    return store.login(payload)


@app.get("/profiles/current")
def current_profile(user_id: str):
    return store.get_profile_for_user(user_id)


@app.post("/profiles")
def upsert_profile(payload: ProfileInput):
    return store.upsert_profile(payload)


@app.get("/profiles/{profile_id}")
def get_profile(profile_id: str):
    try:
        return store.require_profile(profile_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="profile_not_found") from exc


@app.post("/profiles/{profile_id}/ai/normalize")
def normalize_profile(profile_id: str):
    try:
        return store.normalize_profile(profile_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="profile_not_found") from exc


@app.patch("/profiles/{profile_id}/public-page")
def update_public_page(profile_id: str, payload: PublicProfile):
    try:
        return store.update_public_page(profile_id, payload.model_dump())
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="profile_not_found") from exc


@app.post("/profiles/{profile_id}/publish")
def publish_profile(profile_id: str):
    try:
        return store.publish_profile(profile_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="profile_not_found") from exc


@app.get("/recommendations/today")
def today_recommendations(profile_id: str):
    try:
        return store.today_recommendations(profile_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="profile_not_found") from exc


@app.get("/candidates")
def candidates(profile_id: str):
    try:
        return store.browse_candidates(profile_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="profile_not_found") from exc


@app.post("/actions")
def record_action(payload: SwipeRequest):
    try:
        return store.record_action(payload)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="profile_not_found") from exc


@app.get("/matches")
def matches(profile_id: str):
    try:
        store.require_profile(profile_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="profile_not_found") from exc
    return store.matches_for_profile(profile_id)


@app.post("/upload/mock")
def mock_upload():
    return {
        "url": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
        "status": "pending_review",
    }


@app.get("/admin/summary")
def admin_summary():
    return store.admin_summary()


@app.get("/admin/users")
def admin_users():
    return list(store.users.values())


@app.get("/admin/profiles")
def admin_profiles():
    return list(store.profiles.values())


@app.get("/admin/recommendations")
def admin_recommendations():
    return store.recommendations


@app.get("/admin/swipe-events")
def admin_swipe_events():
    return store.swipe_events


@app.get("/admin/matches")
def admin_matches():
    return store.matches


@app.get("/admin/ai-tasks")
def admin_ai_tasks():
    return store.ai_tasks


@app.get("/admin/reports")
def admin_reports():
    return store.reports


@app.patch("/admin/profiles/{profile_id}/status")
def admin_update_profile_status(profile_id: str, payload: StatusUpdate):
    try:
        return store.set_profile_status(profile_id, payload.status)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="profile_not_found") from exc
