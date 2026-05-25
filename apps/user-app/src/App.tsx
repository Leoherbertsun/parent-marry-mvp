import { Compass, Loader2, MessageCircle, Newspaper, Shield, UserRound, X } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { api } from "./api";
import { publicAsset } from "./assets";
import { Onboarding } from "./Onboarding";
import { BrowseView } from "./views/Browse";
import { MessagesView, Conversation } from "./views/Messages";
import { DiscoverView } from "./views/Discover";
import { MeView } from "./views/Me";
import { Membership } from "./views/Membership";
import { LikesOverlay } from "./views/Likes";
import { CandidateDetail, OwnProfileDetail } from "./views/Detail";
import {
  actionLabel,
  autoReply,
  DAILY_FREE_LIMIT,
  inAgeBand,
  initialFor,
  MEMBERSHIP_TIERS,
  openingMessage,
} from "./lib";
import type { Tab, Thread, ChatMessage } from "./lib";
import type {
  BrowseItem,
  MatchWithProfile,
  Profile,
  ProfileInput,
  SwipeAction,
  User,
} from "./types";

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
  { key: "messages", label: "消息", icon: MessageCircle },
  { key: "discover", label: "发现", icon: Newspaper },
  { key: "me", label: "我的", icon: UserRound },
] as const;

const DEFAULT_ASSISTANT: ChatMessage[] = [
  { id: "asst-1", from: "them", text: "我是牵线红娘小牵，会在这里同步推荐进展。", time: "上午 9:30" },
  { id: "asst-2", from: "them", text: "今天给孩子挑了几位合适的，去「看对象」看看，合适就加好友，我来牵线。", time: "上午 9:30" },
];

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2, 8)}`;
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
  const [ownProfileOpen, setOwnProfileOpen] = useState(false);
  const [phone, setPhone] = useState(import.meta.env.VITE_STATIC_DEMO === "true" ? "13900000005" : "13812345678");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<BrowseItem[]>([]);
  const [selected, setSelected] = useState<BrowseItem | null>(null);
  const [actions, setActions] = useState<Record<string, SwipeAction>>({});
  const [actedItems, setActedItems] = useState<Record<string, BrowseItem>>({});
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [filters, setFilters] = useState<Filters>({ city: "全部", education: "全部", ageBand: "全部" });
  const [vip, setVip] = useState(false);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const [activeChatKey, setActiveChatKey] = useState<string | null>(null);
  const [membershipOpen, setMembershipOpen] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [friendAdded, setFriendAdded] = useState<Profile | null>(null);

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

  async function bootstrap(loggedIn: User) {
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

  async function handleLogin() {
    const normalizedPhone = phone.trim();
    if (!/^1\d{10}$/.test(normalizedPhone)) {
      setToast("请输入 11 位手机号");
      return;
    }
    const loggedIn = await runTask("登录中", () => api.login(normalizedPhone, "体验家长"));
    await bootstrap(loggedIn);
  }

  function quickLogin() {
    setPhone("13900000005");
    void (async () => {
      const loggedIn = await runTask("登录中", () => api.login("13900000005", "体验家长"));
      await bootstrap(loggedIn);
    })();
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

  function ensureThread(other: Profile) {
    setChats((current) => {
      if (current[other.id]) return current;
      return {
        ...current,
        [other.id]: [{ id: newId("m"), from: "them", text: openingMessage(other), time: "刚刚" }],
      };
    });
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
      ensureThread(item.candidate);
      await loadMatches(profile.id);
      setFriendAdded(item.candidate);
    } else {
      setToast(actionLabel(action));
    }
  }

  function openChat(other: Profile) {
    ensureThread(other);
    setActiveChatKey(other.id);
    setFriendAdded(null);
    setSelected(null);
    setTab("messages");
  }

  function sendMessage(key: string, text: string) {
    const mine: ChatMessage = { id: newId("m"), from: "me", text, time: "刚刚" };
    setChats((current) => ({ ...current, [key]: [...(current[key] || []), mine] }));
    const other = matches.find((row) => row.profile.id === key)?.profile;
    const replyText = key === "assistant"
      ? "收到，我继续帮孩子留意合适的人，有进展第一时间告诉您。"
      : other
        ? autoReply(other, text)
        : "好的～";
    window.setTimeout(() => {
      setChats((current) => ({
        ...current,
        [key]: [...(current[key] || []), { id: newId("m"), from: "them", text: replyText, time: "刚刚" }],
      }));
    }, 800);
  }

  function subscribe(tierId: string) {
    const tier = MEMBERSHIP_TIERS.find((item) => item.id === tierId);
    setVip(true);
    setMembershipOpen(false);
    setToast(`已开通${tier?.name || "会员"}，权益已解锁`);
  }

  function logout() {
    setUser(null);
    setProfile(null);
    setCandidates([]);
    setMatches([]);
    setSelected(null);
    setActions({});
    setActedItems({});
    setChats({});
    setActiveChatKey(null);
    setVip(false);
    setMembershipOpen(false);
    setLikesOpen(false);
    setOwnProfileOpen(false);
    setFriendAdded(null);
    setTab("browse");
  }

  const visibleCandidates = useMemo(() => {
    return candidates.filter((item) => {
      const c = item.candidate;
      if (filters.city !== "全部" && c.city !== filters.city) return false;
      if (filters.education !== "全部" && !c.education.includes(filters.education)) return false;
      if (!inAgeBand(new Date().getFullYear() - c.birth_year, filters.ageBand)) return false;
      return true;
    });
  }, [candidates, filters]);

  const cityOptions = useMemo(
    () => ["全部", ...Array.from(new Set(candidates.map((item) => item.candidate.city)))],
    [candidates],
  );

  const friends = useMemo(() => new Set(matches.map((row) => row.profile.id)), [matches]);

  const browseItems = vip ? visibleCandidates : visibleCandidates.slice(0, DAILY_FREE_LIMIT);

  const likedList = useMemo(
    () => Object.values(actedItems).filter((item) => actions[item.candidate.id] === "like"),
    [actedItems, actions],
  );
  const favoriteList = useMemo(
    () => Object.values(actedItems).filter((item) => actions[item.candidate.id] === "favorite"),
    [actedItems, actions],
  );
  const whoLikesMe = useMemo(() => candidates.slice(0, 3).map((item) => item.candidate), [candidates]);

  const threads = useMemo<Thread[]>(() => {
    const assistant: Thread = {
      key: "assistant",
      profile: null,
      title: "牵线红娘 小牵",
      messages: chats["assistant"] || DEFAULT_ASSISTANT,
      pinned: true,
      unread: chats["assistant"] ? 0 : 2,
    };
    const friendThreads: Thread[] = matches.map((row) => ({
      key: row.profile.id,
      profile: row.profile,
      title: row.profile.child_name,
      messages: chats[row.profile.id] || [
        { id: `seed-${row.profile.id}`, from: "them", text: openingMessage(row.profile), time: "刚刚" },
      ],
    }));
    return [assistant, ...friendThreads];
  }, [chats, matches]);

  const messagesUnread = threads.reduce((sum, thread) => sum + (thread.unread || 0), 0);
  const activeThread = threads.find((thread) => thread.key === activeChatKey) || null;

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
            <span><strong>03</strong><small>加好友沟通</small></span>
          </div>
          <label className="field login-field">
            <span>手机号</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" />
          </label>
          <button className="primary-button full" onClick={handleLogin} disabled={Boolean(loading)}>
            {loading ? <Loader2 className="spin" size={16} /> : <Shield size={16} />}
            进入体验
          </button>
          <button className="text-button" onClick={quickLogin} disabled={Boolean(loading)}>
            使用示例账号快速进入
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
            items={browseItems}
            filters={filters}
            setFilters={setFilters}
            cityOptions={cityOptions}
            onOpen={setSelected}
            onReload={() => loadCandidates()}
            loading={loading}
            vip={vip}
            friends={friends}
            whoLikesMeCount={whoLikesMe.length}
            onOpenLikes={() => setLikesOpen(true)}
            onUpgrade={() => setMembershipOpen(true)}
          />
        )}
        {tab === "messages" && (
          <MessagesView threads={threads} onOpenThread={(thread) => setActiveChatKey(thread.key)} setToast={setToast} />
        )}
        {tab === "discover" && <DiscoverView setToast={setToast} />}
        {tab === "me" && (
          <MeView
            profile={profile}
            user={user}
            vip={vip}
            likedCount={likedList.length + favoriteList.length}
            friendCount={matches.length}
            whoLikesMeCount={whoLikesMe.length}
            onOpenProfile={() => setOwnProfileOpen(true)}
            onEdit={() => setEditing(true)}
            onLogout={logout}
            onUpgrade={() => setMembershipOpen(true)}
            onOpenLikes={() => setLikesOpen(true)}
            setToast={setToast}
          />
        )}

        {toast && (
          <button className="toast floating" onClick={() => setToast(null)}>
            {toast}
          </button>
        )}

        {friendAdded && (
          <div className="friend-snack">
            {friendAdded.photos[0] ? (
              <img src={publicAsset(friendAdded.photos[0])} alt={friendAdded.child_name} />
            ) : (
              <span className="friend-snack-ph">{initialFor(friendAdded.child_name)}</span>
            )}
            <div>
              <strong>已和 {friendAdded.child_name} 互加好友</strong>
              <small>双方都表示了感兴趣，可以聊聊了</small>
            </div>
            <button className="friend-snack-go" onClick={() => openChat(friendAdded)}>去聊天</button>
            <button className="friend-snack-x" onClick={() => setFriendAdded(null)} aria-label="关闭"><X size={16} /></button>
          </div>
        )}

        <nav className="bottom-nav" aria-label="主导航">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} className={tab === item.key ? "active" : ""} onClick={() => setTab(item.key)}>
                <span className="nav-ico-wrap">
                  <Icon size={19} />
                  {item.key === "messages" && messagesUnread > 0 && <span className="nav-badge">{messagesUnread}</span>}
                </span>
                <span>{item.label}</span>
                <span className="nav-dot" />
              </button>
            );
          })}
        </nav>
      </section>

      {selected && (
        <CandidateDetail
          item={selected}
          action={actions[selected.candidate.id]}
          isFriend={friends.has(selected.candidate.id)}
          onClose={() => setSelected(null)}
          onAction={act}
          onChat={openChat}
          loading={loading}
        />
      )}

      {ownProfileOpen && (
        <OwnProfileDetail
          profile={profile}
          onClose={() => setOwnProfileOpen(false)}
          onEdit={() => {
            setOwnProfileOpen(false);
            setEditing(true);
          }}
        />
      )}

      {likesOpen && (
        <LikesOverlay
          vip={vip}
          whoLikesMe={whoLikesMe}
          liked={likedList}
          favorites={favoriteList}
          onClose={() => setLikesOpen(false)}
          onOpen={(item) => {
            setLikesOpen(false);
            setSelected(item);
          }}
          onUpgrade={() => setMembershipOpen(true)}
        />
      )}

      {activeThread && (
        <Conversation
          thread={activeThread}
          onBack={() => setActiveChatKey(null)}
          onSend={(text) => sendMessage(activeThread.key, text)}
          onViewProfile={() => {
            if (activeThread.profile) {
              const match = candidates.find((item) => item.candidate.id === activeThread.key);
              if (match) {
                setActiveChatKey(null);
                setSelected(match);
              } else {
                setToast("暂时无法打开资料");
              }
            }
          }}
        />
      )}

      {membershipOpen && (
        <Membership vip={vip} onClose={() => setMembershipOpen(false)} onSubscribe={subscribe} />
      )}
    </main>
  );
}
