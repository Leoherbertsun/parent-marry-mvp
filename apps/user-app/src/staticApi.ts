import dataset from "./mockProfiles.generated.json";
import type {
  BrowseItem,
  MatchWithProfile,
  Profile,
  ProfileInput,
  PublicProfile,
  SwipeAction,
  SwipeResult,
  User,
} from "./types";

type StaticDataset = {
  users: User[];
  profiles: Profile[];
};

type SwipeEvent = {
  id: string;
  action: SwipeAction;
  actor_profile_id: string;
  target_profile_id: string;
};

type MatchRecord = {
  id: string;
  status: "mutual_like";
  profile_a_id: string;
  profile_b_id: string;
  created_at: string;
};

const seed = dataset as unknown as StaticDataset;
const now = () => new Date().toISOString();
const users = new Map(seed.users.map((user) => [user.id, clone(user)]));
const profiles = new Map(seed.profiles.map((profile) => [profile.id, clone(profile)]));
const swipeEvents: SwipeEvent[] = [];
const matches: MatchRecord[] = [];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2, 10)}`;
}

function requireProfile(profileId: string) {
  const profile = profiles.get(profileId);
  if (!profile) throw new Error("profile_not_found");
  return profile;
}

function ageOf(profile: Profile) {
  return new Date().getFullYear() - profile.birth_year;
}

function completeness(profile: ProfileInput) {
  const required = [
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
  ];
  const filled = required.filter(Boolean).length;
  const tagBonus = Math.min(2, profile.interests.length) + Math.min(2, profile.personality_tags.length);
  return Math.min(100, Math.round(((filled + tagBonus) / (required.length + 4)) * 100));
}

function inferTags(text: string) {
  const inferred = {
    personality: [] as string[],
    lifestyle: [] as string[],
    interests: [] as string[],
  };
  const rules = [
    ["慢热", "personality", ["慢热", "稳重"]],
    ["外向", "personality", ["外向", "表达直接"]],
    ["温和", "personality", ["温和"]],
    ["独立", "personality", ["独立"]],
    ["靠谱", "personality", ["靠谱"]],
    ["运动", "lifestyle", ["规律运动"]],
    ["健身", "lifestyle", ["规律运动"]],
    ["做饭", "lifestyle", ["会照顾生活"]],
    ["旅行", "lifestyle", ["愿意探索"]],
    ["规律", "lifestyle", ["作息规律"]],
    ["电影", "interests", ["电影"]],
    ["展", "interests", ["看展"]],
    ["书", "interests", ["阅读"]],
    ["咖啡", "interests", ["咖啡"]],
    ["徒步", "interests", ["徒步"]],
  ] as const;

  for (const [keyword, group, tags] of rules) {
    if (text.includes(keyword)) inferred[group].push(...tags);
  }
  return inferred;
}

function unique(items: string[]) {
  return Array.from(new Set(items));
}

function normalizeProfile(profile: Profile) {
  const inferred = inferTags(`${profile.parent_description} ${profile.lifestyle}`);
  const personalityTags = unique([...profile.personality_tags, ...inferred.personality]).slice(0, 6);
  const lifestyleTags = unique(inferred.lifestyle.length ? inferred.lifestyle : ["作息规律"]).slice(0, 5);
  const interestTags = unique([...profile.interests, ...inferred.interests]).slice(0, 6);
  const city = profile.city || "同城";
  const jobType = profile.job_type || "稳定职业";

  const publicPage: PublicProfile = {
    headline: `${city}，${jobType}，希望认真认识合适的人`,
    basic_summary: `${profile.child_name || "这位候选人"}出生于 ${profile.birth_year} 年，目前在${city}，学历为${profile.education}，状态是${profile.current_status}。`,
    work_life: `职业方向偏${jobType}。${profile.career || "工作节奏比较稳定，重视长期成长。"} ${profile.lifestyle || "生活习惯规律，周末愿意留出时间认识新朋友。"}`,
    personality_interests: `性格关键词：${(personalityTags.length ? personalityTags : ["真诚", "稳定"]).join("、")}。兴趣包括：${(interestTags.length ? interestTags : ["散步", "看展", "电影"]).join("、")}。`,
    family_values: profile.family_atmosphere || "家庭沟通直接，重视稳定关系",
    looking_for: `希望认识 ${profile.preference_city || city}，${profile.preference_education || "教育背景相近"}，${profile.marriage_plan || "对关系认真"}的人。`,
  };

  return {
    ai_questions: [
      "孩子平时最放松的生活状态是什么样？",
      "你们最看重对方家庭或相处方式中的哪一点？",
      "如果双方感觉合适，你们期待多久进入更认真了解？",
    ],
    ai_structured: {
      personality_tags: personalityTags,
      lifestyle_tags: lifestyleTags,
      interest_tags: interestTags,
      family_values: publicPage.family_values,
      relationship_pace: profile.marriage_plan || "认真了解，节奏稳定",
      partner_preferences: {
        age_range: [profile.preference_age_min, profile.preference_age_max],
        city: profile.preference_city,
        education: profile.preference_education,
        accepts_long_distance: profile.accepts_long_distance,
      },
      dealbreakers: profile.dealbreakers,
    },
    public_page: publicPage,
  };
}

function scoreCandidate(profile: Profile, candidate: Profile, blockedPairs: Set<string>) {
  if (candidate.id === profile.id) return null;
  if (candidate.status !== "active") return null;
  if (blockedPairs.has(`${profile.id}:${candidate.id}`)) return null;
  if (profile.gender !== "other" && candidate.gender === profile.gender) return null;

  const candidateAge = ageOf(candidate);
  if (candidateAge < profile.preference_age_min || candidateAge > profile.preference_age_max) return null;

  const sameCity = profile.city === candidate.city;
  const cityMatch =
    sameCity || profile.preference_city.includes(candidate.city) || Boolean(profile.accepts_long_distance);
  if (!cityMatch) return null;

  const profileInterests = new Set(profile.interests);
  const candidateInterests = new Set(candidate.interests);
  const profileTags = new Set(profile.personality_tags);
  const candidateTags = new Set(candidate.personality_tags);
  const overlap = <T>(a: Set<T>, b: Set<T>) => Array.from(a).filter((item) => b.has(item)).length;

  const score_breakdown = {
    城市: sameCity ? 25 : 14,
    年龄: 20,
    学历: candidate.education.includes("本科") || candidate.education.includes("硕士") ? 12 : 6,
    职业稳定: /公务|教师|医生|金融|产品|工程|投研|设计/.test(candidate.job_type) ? 10 : 6,
    婚恋节奏: candidate.marriage_plan === profile.marriage_plan ? 12 : 7,
    生活方式: Math.min(12, 4 + overlap(profileTags, candidateTags) * 4),
    兴趣: Math.min(14, 4 + overlap(profileInterests, candidateInterests) * 5),
  };

  return {
    score: Math.min(100, Object.values(score_breakdown).reduce((sum, item) => sum + item, 0)),
    score_breakdown,
  };
}

function explanation(profile: Profile, candidate: Profile, scoreBreakdown: Record<string, number>) {
  const sameCity = profile.city === candidate.city;
  const topScore = Object.entries(scoreBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || "整体匹配";
  return {
    reason: `${sameCity ? "双方在同一城市，后续见面成本较低" : "城市不完全相同，但对异地或周边城市有一定接受度"}；双方在${topScore}上匹配度较高，生活节奏和婚恋预期也比较接近。`,
    confirm_question: "可以进一步确认双方未来 1-2 年是否倾向留在当前城市。",
    opener: `可以从${candidate.interests[0] || "周末安排"}和近期生活节奏聊起。`,
  };
}

function getOrCreateMatch(actorProfileId: string, targetProfileId: string) {
  const existing = matches.find(
    (match) =>
      new Set([match.profile_a_id, match.profile_b_id]).has(actorProfileId) &&
      new Set([match.profile_a_id, match.profile_b_id]).has(targetProfileId),
  );
  if (existing) return existing;
  const match: MatchRecord = {
    id: newId("match"),
    status: "mutual_like",
    profile_a_id: actorProfileId,
    profile_b_id: targetProfileId,
    created_at: now(),
  };
  matches.push(match);
  return match;
}

export const staticApi = {
  async login(phone: string, displayName?: string) {
    const existing = Array.from(users.values()).find((user) => user.phone === phone);
    if (existing) return clone(existing);
    const user: User = {
      id: newId("user"),
      phone,
      display_name: displayName || `家长 ${phone.slice(-4)}`,
      created_at: now(),
    };
    users.set(user.id, user);
    return clone(user);
  },

  async currentProfile(userId: string) {
    const profile = Array.from(profiles.values()).find((item) => item.user_id === userId) || null;
    return clone(profile);
  },

  async saveProfile(payload: ProfileInput) {
    const existing = Array.from(profiles.values()).find((item) => item.user_id === payload.user_id);
    const profile: Profile = {
      ...(existing || {
        id: newId("profile"),
        status: "draft" as const,
        ai_questions: [],
        ai_structured: {},
        public_page: {
          headline: "",
          basic_summary: "",
          work_life: "",
          personality_interests: "",
          family_values: "",
          looking_for: "",
        },
        created_at: now(),
      }),
      ...payload,
      completeness: completeness(payload),
      updated_at: now(),
    };
    profiles.set(profile.id, profile);
    return clone(profile);
  },

  async normalizeProfile(profileId: string) {
    const profile = requireProfile(profileId);
    const output = normalizeProfile(profile);
    const updated = {
      ...profile,
      ...output,
      completeness: Math.max(profile.completeness, 86),
      updated_at: now(),
    };
    profiles.set(profileId, updated);
    return clone(updated);
  },

  async updatePublicPage(profileId: string, payload: PublicProfile) {
    const profile = requireProfile(profileId);
    const updated = { ...profile, public_page: payload, updated_at: now() };
    profiles.set(profileId, updated);
    return clone(updated);
  },

  async publishProfile(profileId: string) {
    const profile = requireProfile(profileId);
    const updated = { ...profile, status: "active" as const, completeness: 100, updated_at: now() };
    profiles.set(profileId, updated);
    return clone(updated);
  },

  async todayRecommendations(profileId: string) {
    const rows = await this.browse(profileId);
    return rows.slice(0, 3).map((row, index) => ({
      recommendation: {
        id: `rec_${index + 1}`,
        profile_id: profileId,
        candidate_profile_id: row.candidate.id,
        date: new Date().toISOString().slice(0, 10),
        score: row.score,
        score_breakdown: row.score_breakdown,
        reason: row.reason,
        confirm_question: row.confirm_question,
        opener: row.opener,
        created_at: now(),
      },
      candidate: row.candidate,
    }));
  },

  async browse(profileId: string) {
    const profile = requireProfile(profileId);
    const blockedPairs = new Set(
      swipeEvents
        .filter((event) => ["pass", "block", "report"].includes(event.action))
        .map((event) => `${event.actor_profile_id}:${event.target_profile_id}`),
    );
    const rows: BrowseItem[] = [];
    for (const candidate of profiles.values()) {
      const score = scoreCandidate(profile, candidate, blockedPairs);
      if (!score) continue;
      rows.push({
        candidate: clone(candidate),
        score: score.score,
        score_breakdown: score.score_breakdown,
        ...explanation(profile, candidate, score.score_breakdown),
      });
    }
    return rows.sort((a, b) => b.score - a.score);
  },

  async act(actorProfileId: string, targetProfileId: string, action: SwipeAction) {
    const event: SwipeEvent = {
      id: newId("swipe"),
      actor_profile_id: actorProfileId,
      target_profile_id: targetProfileId,
      action,
    };
    swipeEvents.push(event);
    const match = action === "like" ? getOrCreateMatch(actorProfileId, targetProfileId) : null;
    return clone({ event, match }) as SwipeResult;
  },

  async matches(profileId: string) {
    requireProfile(profileId);
    return matches
      .filter((match) => match.profile_a_id === profileId || match.profile_b_id === profileId)
      .map((match) => {
        const otherId = match.profile_a_id === profileId ? match.profile_b_id : match.profile_a_id;
        return { match, profile: clone(requireProfile(otherId)) };
      }) as MatchWithProfile[];
  },
};
