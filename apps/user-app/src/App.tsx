import {
  Bookmark,
  Check,
  ChevronLeft,
  Compass,
  Heart,
  Loader2,
  MapPin,
  Pencil,
  Search,
  Shield,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { api } from "./api";
import { publicAsset } from "./assets";
import { Onboarding } from "./Onboarding";
import type {
  BrowseItem,
  MatchWithProfile,
  Profile,
  ProfileInput,
  SwipeAction,
  User,
} from "./types";

type Tab = "browse" | "likes" | "me";

interface Filters {
  city: string;
  education: string;
  ageBand: string;
}

const baseDraft: ProfileInput = {
  user_id: "",
  child_name: "",
  gender: "female",
  birth_year: 1994,
  city: "上海",
  education: "本科",
  job_type: "",
  current_status: "认真了解",
  career: "",
  lifestyle: "",
  interests: [],
  personality_tags: [],
  family_atmosphere: "",
  preference_age_min: 28,
  preference_age_max: 36,
  preference_city: "上海、杭州、苏州",
  preference_education: "本科及以上",
  accepts_long_distance: true,
  marriage_plan: "1-2 年内结婚",
  dealbreakers: [],
  parent_description: "",
  ai_answers: {},
  photos: [],
};

const tabs = [
  { key: "browse", label: "看对象", icon: Compass },
  { key: "likes", label: "心动", icon: Heart },
  { key: "me", label: "我的", icon: UserRound },
] as const;

const AGE_BANDS = ["全部", "30 岁以下", "30-35 岁", "36 岁以上"];

function ageOf(profile: Profile) {
  return new Date().getFullYear() - profile.birth_year;
}

function inAgeBand(age: number, band: string) {
  if (band === "30 岁以下") return age < 30;
  if (band === "30-35 岁") return age >= 30 && age <= 35;
  if (band === "36 岁以上") return age > 35;
  return true;
}

function matchHighlights(breakdown: Record<string, number>): string[] {
  const out: string[] = [];
  const city = breakdown["城市"] ?? 0;
  if (city >= 25) out.push("同城");
  else if (city >= 14) out.push("城市相近");
  if ((breakdown["兴趣"] ?? 0) >= 9) out.push("兴趣相投");
  if ((breakdown["生活方式"] ?? 0) >= 8) out.push("生活方式接近");
  if ((breakdown["婚恋节奏"] ?? 0) >= 12) out.push("节奏一致");
  if ((breakdown["学历"] ?? 0) >= 12) out.push("学历相当");
  if ((breakdown["职业稳定"] ?? 0) >= 10) out.push("职业稳定");
  return out;
}

function actionLabel(action: SwipeAction) {
  const map: Record<SwipeAction, string> = {
    like: "已表示感兴趣",
    favorite: "已收藏",
    pass: "已跳过",
    block: "已屏蔽",
    report: "已提交反馈",
  };
  return map[action];
}

function profileToDraft(profile: Profile): ProfileInput {
  return {
    user_id: profile.user_id,
    child_name: profile.child_name,
    gender: profile.gender,
    birth_year: profile.birth_year,
    city: profile.city,
    education: profile.education,
    job_type: profile.job_type,
    current_status: profile.current_status,
    career: profile.career,
    lifestyle: profile.lifestyle,
    interests: profile.interests,
    personality_tags: profile.personality_tags,
    family_atmosphere: profile.family_atmosphere,
    preference_age_min: profile.preference_age_min,
    preference_age_max: profile.preference_age_max,
    preference_city: profile.preference_city,
    preference_education: profile.preference_education,
    accepts_long_distance: profile.accepts_long_distance,
    marriage_plan: profile.marriage_plan,
    dealbreakers: profile.dealbreakers,
    parent_description: profile.parent_description,
    ai_answers: profile.ai_answers,
    photos: profile.photos,
  };
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<Tab>("browse");
  const [phone, setPhone] = useState(import.meta.env.VITE_STATIC_DEMO === "true" ? "13900000005" : "13812345678");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<BrowseItem[]>([]);
  const [selected, setSelected] = useState<BrowseItem | null>(null);
  const [actions, setActions] = useState<Record<string, SwipeAction>>({});
  const [actedItems, setActedItems] = useState<Record<string, BrowseItem>>({});
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [filters, setFilters] = useState<Filters>({ city: "全部", education: "全部", ageBand: "全部" });

  async function runTask<T>(label: string, task: () => Promise<T>) {
    try {
      setLoading(label);
      return await task();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "操作失败");
      throw error;
    } finally {
      setLoading(null);
    }
  }

  async function handleLogin() {
    const loggedIn = await runTask("登录中", () => api.login(phone, "体验家长"));
    setUser(loggedIn);
    const current = await api.currentProfile(loggedIn.id);
    if (current) {
      setProfile(current);
      if (current.status === "active") {
        await loadCandidates(current.id);
        await loadMatches(current.id);
      }
    }
  }

  async function loadCandidates(profileId?: string) {
    const id = profileId ?? profile?.id;
    if (!id) return;
    const rows = await runTask("加载候选", () => api.browse(id));
    setCandidates(rows);
  }

  async function loadMatches(profileId?: string) {
    const id = profileId ?? profile?.id;
    if (!id) return;
    const rows = await api.matches(id);
    setMatches(rows);
  }

  function handleOnboardingComplete(saved: Profile) {
    setProfile(saved);
    setEditing(false);
    setTab("browse");
    void loadCandidates(saved.id);
    void loadMatches(saved.id);
    setToast("资料已确认，开始看对象");
  }

  async function act(item: BrowseItem, action: SwipeAction) {
    if (!profile) return;
    const result = await runTask("记录中", () =>
      api.act(profile.id, item.candidate.id, action, action === "report" ? "资料异常" : undefined),
    );
    setActions((current) => ({ ...current, [item.candidate.id]: action }));
    setActedItems((current) => ({ ...current, [item.candidate.id]: item }));
    setSelected(null);
    if (result.match) {
      setToast("双方都感兴趣，已加入心动");
      await loadMatches(profile.id);
    } else {
      setToast(actionLabel(action));
    }
  }

  const visibleCandidates = useMemo(() => {
    return candidates.filter((item) => {
      if (actedItems[item.candidate.id]) return false;
      const c = item.candidate;
      if (filters.city !== "全部" && c.city !== filters.city) return false;
      if (filters.education !== "全部" && !c.education.includes(filters.education)) return false;
      if (!inAgeBand(ageOf(c), filters.ageBand)) return false;
      return true;
    });
  }, [candidates, actedItems, filters]);

  const cityOptions = useMemo(() => {
    return ["全部", ...Array.from(new Set(candidates.map((item) => item.candidate.city)))];
  }, [candidates]);

  const matchedIds = useMemo(() => new Set(matches.map((row) => row.profile.id)), [matches]);

  const likedItems = useMemo(
    () =>
      Object.values(actedItems).filter(
        (item) =>
          (actions[item.candidate.id] === "like" || actions[item.candidate.id] === "favorite") &&
          !matchedIds.has(item.candidate.id),
      ),
    [actedItems, actions, matchedIds],
  );

  // --- Login ---
  if (!user) {
    return (
      <main className="login-shell">
        <motion.section
          className="login-panel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="brand-row">
            <span className="brand-mark">牵</span>
            <span>
              <strong>爸妈牵线</strong>
              <small>为父母准备的相亲助手</small>
            </span>
          </div>
          <div className="login-copy">
            <h1>帮孩子认识合适的人，从一份用心的资料开始</h1>
            <p>跟着引导把孩子的情况填好，AI 自动整理成得体的介绍，之后慢慢挑选心仪的对象。</p>
          </div>
          <div className="login-insight">
            <span><strong>01</strong><small>引导建档</small></span>
            <span><strong>02</strong><small>挑选对象</small></span>
            <span><strong>03</strong><small>双向确认</small></span>
          </div>
          <label className="field login-field">
            <span>手机号</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" />
          </label>
          <button className="primary-button full" onClick={handleLogin} disabled={Boolean(loading)}>
            {loading ? <Loader2 className="spin" size={18} /> : <Shield size={18} />}
            进入体验
          </button>
        </motion.section>
      </main>
    );
  }

  // --- Onboarding ---
  if (!profile || profile.status !== "active" || editing) {
    return (
      <Onboarding
        userId={user.id}
        initialDraft={profile ? profileToDraft(profile) : baseDraft}
        editing={editing && Boolean(profile)}
        onComplete={handleOnboardingComplete}
        onCancel={() => {
          if (profile && profile.status === "active") setEditing(false);
        }}
        setToast={setToast}
      />
    );
  }

  // --- Main app ---
  return (
    <main className="app-shell">
      <section className="phone-stage">
        {tab === "browse" && (
          <BrowseView
            items={visibleCandidates}
            filters={filters}
            setFilters={setFilters}
            cityOptions={cityOptions}
            onOpen={setSelected}
            onReload={() => loadCandidates()}
            loading={loading}
          />
        )}
        {tab === "likes" && (
          <LikesView matches={matches} liked={likedItems} actions={actions} onOpen={setSelected} />
        )}
        {tab === "me" && <MeView profile={profile} onEdit={() => setEditing(true)} />}

        {toast && (
          <button className="toast floating" onClick={() => setToast(null)}>
            {toast}
          </button>
        )}

        <nav className="bottom-nav" aria-label="主导航">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} className={tab === item.key ? "active" : ""} onClick={() => setTab(item.key)}>
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </section>

      <AnimatePresence>
        {selected && (
          <CandidateDetail
            item={selected}
            action={actions[selected.candidate.id]}
            onClose={() => setSelected(null)}
            onAction={act}
            loading={loading}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function BrowseView({
  items,
  filters,
  setFilters,
  cityOptions,
  onOpen,
  onReload,
  loading,
}: {
  items: BrowseItem[];
  filters: Filters;
  setFilters: (filters: Filters) => void;
  cityOptions: string[];
  onOpen: (item: BrowseItem) => void;
  onReload: () => void;
  loading: string | null;
}) {
  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <span className="eyebrow">为孩子挑选</span>
          <h1>看对象</h1>
        </div>
        <button className="ghost-pill" disabled aria-label="AI 搜索（即将上线）">
          <Search size={16} /> AI 搜索
        </button>
      </header>

      <div className="filter-bar">
        <select value={filters.city} onChange={(event) => setFilters({ ...filters, city: event.target.value })}>
          {cityOptions.map((city) => (
            <option key={city} value={city}>{city === "全部" ? "城市 · 全部" : city}</option>
          ))}
        </select>
        <select value={filters.ageBand} onChange={(event) => setFilters({ ...filters, ageBand: event.target.value })}>
          {AGE_BANDS.map((band) => (
            <option key={band} value={band}>{band === "全部" ? "年龄 · 全部" : band}</option>
          ))}
        </select>
        <select value={filters.education} onChange={(event) => setFilters({ ...filters, education: event.target.value })}>
          {["全部", "本科", "硕士"].map((edu) => (
            <option key={edu} value={edu}>{edu === "全部" ? "学历 · 全部" : edu}</option>
          ))}
        </select>
      </div>

      <div className="screen-body">
        {loading === "加载候选" && items.length === 0 ? (
          <div className="loading-block"><Loader2 className="spin" size={22} /><span>正在挑选合适的人…</span></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <Compass size={28} />
            <strong>暂时没有更多合适的人了</strong>
            <span>可以放宽筛选条件，或稍后再来看看</span>
            <button className="secondary-button" onClick={onReload}>重新加载</button>
          </div>
        ) : (
          <div className="candidate-grid">
            {items.map((item) => {
              const c = item.candidate;
              const highlights = matchHighlights(item.score_breakdown).slice(0, 2);
              return (
                <motion.button
                  key={c.id}
                  className="candidate-card"
                  onClick={() => onOpen(item)}
                  whileTap={{ scale: 0.985 }}
                >
                  <div className="candidate-photo">
                    {c.photos[0] ? (
                      <img src={publicAsset(c.photos[0])} alt={c.child_name} loading="lazy" />
                    ) : (
                      <span className="photo-fallback">{c.child_name.slice(0, 1)}</span>
                    )}
                  </div>
                  <div className="candidate-info">
                    <div className="candidate-name">
                      <strong>{c.child_name}</strong>
                      <small>{ageOf(c)} 岁</small>
                    </div>
                    <p className="candidate-meta"><MapPin size={13} /> {c.city} · {c.job_type}</p>
                    <div className="chips">
                      {highlights.map((tag) => (
                        <span key={tag} className="chip static accent">{tag}</span>
                      ))}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CandidateDetail({
  item,
  action,
  onClose,
  onAction,
  loading,
}: {
  item: BrowseItem;
  action?: SwipeAction;
  onClose: () => void;
  onAction: (item: BrowseItem, action: SwipeAction) => void;
  loading: string | null;
}) {
  const c = item.candidate;
  const page = c.public_page;
  const highlights = matchHighlights(item.score_breakdown);
  const sections = [
    { label: "基本情况", value: page.basic_summary },
    { label: "工作与生活", value: page.work_life },
    { label: "性格与兴趣", value: page.personality_interests },
    { label: "家庭氛围", value: page.family_values },
    { label: "希望认识的人", value: page.looking_for },
  ].filter((section) => section.value);

  return (
    <motion.div
      className="detail-overlay"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="detail-scroll">
        <div className="detail-hero">
          {c.photos[0] ? (
            <img src={publicAsset(c.photos[0])} alt={c.child_name} />
          ) : (
            <div className="detail-hero-fallback">{c.child_name.slice(0, 1)}</div>
          )}
          <button className="detail-back" onClick={onClose} aria-label="返回"><ChevronLeft size={22} /></button>
          <div className="detail-hero-meta">
            <strong>{c.child_name}</strong>
            <span>{ageOf(c)} 岁 · {c.city} · {c.job_type}</span>
          </div>
        </div>

        <div className="detail-body">
          {highlights.length > 0 && (
            <div className="chips">
              {highlights.map((tag) => (
                <span key={tag} className="chip static accent">{tag}</span>
              ))}
            </div>
          )}

          {c.photos.length > 1 && (
            <div className="photo-gallery">
              {c.photos.slice(1).map((photo, index) => (
                <img key={photo} src={publicAsset(photo)} alt={`${c.child_name} ${index + 2}`} loading="lazy" />
              ))}
            </div>
          )}

          <section className="reason-card">
            <div className="reason-title"><Sparkles size={16} /> 为什么推荐 TA</div>
            <p>{item.reason}</p>
          </section>

          {sections.map((section) => (
            <section key={section.label} className="detail-section">
              <h3>{section.label}</h3>
              <p>{section.value}</p>
            </section>
          ))}

          <div className="detail-spacer" />
        </div>
      </div>

      <div className="detail-actions">
        <button className="act-btn pass" onClick={() => onAction(item, "pass")} disabled={Boolean(loading)} aria-label="跳过">
          <X size={22} />
          <small>跳过</small>
        </button>
        <button
          className={action === "favorite" ? "act-btn fav on" : "act-btn fav"}
          onClick={() => onAction(item, "favorite")}
          disabled={Boolean(loading)}
          aria-label="收藏"
        >
          <Bookmark size={20} />
          <small>收藏</small>
        </button>
        <button
          className={action === "like" ? "act-btn like on" : "act-btn like"}
          onClick={() => onAction(item, "like")}
          disabled={Boolean(loading)}
          aria-label="感兴趣"
        >
          <Heart size={22} />
          <small>感兴趣</small>
        </button>
      </div>
    </motion.div>
  );
}

function LikesView({
  matches,
  liked,
  actions,
  onOpen,
}: {
  matches: MatchWithProfile[];
  liked: BrowseItem[];
  actions: Record<string, SwipeAction>;
  onOpen: (item: BrowseItem) => void;
}) {
  const empty = matches.length === 0 && liked.length === 0;
  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <span className="eyebrow">沟通进展</span>
          <h1>心动</h1>
        </div>
      </header>
      <div className="screen-body">
        {empty && (
          <div className="empty-state">
            <Heart size={28} />
            <strong>还没有心动记录</strong>
            <span>在「看对象」里收藏或表示感兴趣，会出现在这里</span>
          </div>
        )}

        {matches.length > 0 && (
          <section className="group">
            <div className="group-title">互相感兴趣</div>
            <div className="row-list">
              {matches.map((row) => (
                <article key={row.match.id} className="person-row">
                  <Avatar profile={row.profile} />
                  <div>
                    <strong>{row.profile.child_name}</strong>
                    <p>{row.profile.public_page.headline}</p>
                  </div>
                  <span className="row-tag green">双向</span>
                </article>
              ))}
            </div>
          </section>
        )}

        {liked.length > 0 && (
          <section className="group">
            <div className="group-title">我关注的</div>
            <div className="row-list">
              {liked.map((item) => (
                <button key={item.candidate.id} className="person-row tappable" onClick={() => onOpen(item)}>
                  <Avatar profile={item.candidate} />
                  <div>
                    <strong>{item.candidate.child_name}</strong>
                    <p>{ageOf(item.candidate)} 岁 · {item.candidate.city}</p>
                  </div>
                  <span className="row-tag">{actions[item.candidate.id] === "like" ? "感兴趣" : "已收藏"}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function MeView({ profile, onEdit }: { profile: Profile; onEdit: () => void }) {
  const page = profile.public_page;
  const tags = [
    ...((profile.ai_structured?.personality_tags as string[] | undefined) || profile.personality_tags || []),
    ...((profile.ai_structured?.interest_tags as string[] | undefined) || profile.interests || []),
  ].slice(0, 8);
  const sections = [
    { label: "基本情况", value: page.basic_summary },
    { label: "工作与生活", value: page.work_life },
    { label: "性格与兴趣", value: page.personality_interests },
    { label: "家庭氛围", value: page.family_values },
    { label: "希望认识的人", value: page.looking_for },
  ].filter((section) => section.value);

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <span className="eyebrow">我的</span>
          <h1>孩子的资料</h1>
        </div>
        <button className="ghost-pill" onClick={onEdit}><Pencil size={15} /> 编辑</button>
      </header>
      <div className="screen-body">
        <article className="me-card">
          {profile.photos[0] ? (
            <img className="me-photo" src={publicAsset(profile.photos[0])} alt={profile.child_name} />
          ) : (
            <div className="me-photo placeholder">{profile.child_name.slice(0, 1) || "牵"}</div>
          )}
          <div className="me-meta">
            <strong>{profile.child_name}</strong>
            <small>{ageOf(profile)} 岁 · {profile.city} · {profile.job_type}</small>
            <span className="status-chip"><Check size={13} /> 资料已发布</span>
          </div>
        </article>

        {page.headline && <p className="me-headline">{page.headline}</p>}

        {tags.length > 0 && (
          <div className="chips">
            {tags.map((tag) => (
              <span key={tag} className="chip static">{tag}</span>
            ))}
          </div>
        )}

        {sections.map((section) => (
          <section key={section.label} className="detail-section">
            <h3>{section.label}</h3>
            <p>{section.value}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

function Avatar({ profile }: { profile: Profile }) {
  if (profile.photos[0]) {
    return <img className="avatar-img" src={publicAsset(profile.photos[0])} alt={profile.child_name} loading="lazy" />;
  }
  return <span className="avatar-img placeholder">{profile.child_name.slice(0, 1)}</span>;
}
