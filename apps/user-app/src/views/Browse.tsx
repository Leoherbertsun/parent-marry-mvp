import { useState } from "react";
import { Crown, Heart, Loader2, Lock, MapPin, MessageCircle, Send, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { publicAsset } from "../assets";
import { ageOf, initialFor, matchHighlights } from "../lib";
import type { BrowseItem } from "../types";

interface Filters {
  city: string;
  education: string;
  ageBand: string;
}

const AGE_BANDS = ["全部", "30 岁以下", "30-35 岁", "36 岁以上"];

const AGENT_INTRO = [
  "您好，我是您的牵线红娘小牵，已经了解了孩子的情况。",
  "今天按合拍度挑了几位，您慢慢看；觉得合适就点「感兴趣 · 加好友」，我来帮两边牵线。",
];

const CARD_NOTES = [
  "这位和孩子在同一城市，见面方便，挺值得了解。",
  "生活节奏和孩子接近，价值观也比较合。",
  "事业稳定、性格也好，家庭背景比较般配。",
  "学历相当，沟通方式也比较舒服。",
];

const QUICK_REPLIES = ["多看本地的", "年龄小一点", "事业更稳定", "性格更顾家"];

export function BrowseView({
  items,
  filters,
  setFilters,
  cityOptions,
  onOpen,
  onReload,
  loading,
  vip,
  friends,
  whoLikesMeCount,
  onOpenLikes,
  onUpgrade,
}: {
  items: BrowseItem[];
  filters: Filters;
  setFilters: (filters: Filters) => void;
  cityOptions: string[];
  onOpen: (item: BrowseItem) => void;
  onReload: () => void;
  loading: string | null;
  vip: boolean;
  friends: Set<string>;
  whoLikesMeCount: number;
  onOpenLikes: () => void;
  onUpgrade: () => void;
}) {
  const [convo, setConvo] = useState<{ from: "me" | "them"; text: string }[]>([]);
  const [draft, setDraft] = useState("");

  function send(text: string) {
    const value = text.trim();
    if (!value) return;
    setConvo((current) => [
      ...current,
      { from: "me", text: value },
      { from: "them", text: `好的，我再帮您多留意「${value}」方向的人选，有合适的会更新到这里。` },
    ]);
    setDraft("");
  }

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <span className="eyebrow">红娘推荐</span>
          <h1>看对象</h1>
        </div>
        <button className="head-pill" onClick={onOpenLikes} aria-label="心动">
          <Heart size={17} />
          心动
          {whoLikesMeCount > 0 && <span className="head-badge">{whoLikesMeCount}</span>}
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

      <div className="screen-body agent-feed">
        {loading === "加载候选" && items.length === 0 ? (
          <div className="loading-block"><Loader2 className="spin" size={22} /><span>红娘正在为孩子挑选合适的人…</span></div>
        ) : (
          <>
            {AGENT_INTRO.map((line, index) => (
              <AgentBubble key={`intro-${index}`} text={line} />
            ))}

            {items.length === 0 ? (
              <div className="empty-state">
                <span className="es-icon"><Sparkles size={26} /></span>
                <strong>当前条件下暂时没有更多人选</strong>
                <span>可以放宽上面的筛选，或让红娘换个方向再找</span>
                <button className="secondary-button" onClick={onReload}>重新加载</button>
              </div>
            ) : (
              items.map((item, index) => (
                <div key={item.candidate.id} className="feed-block">
                  {index % 2 === 0 && <AgentBubble text={CARD_NOTES[index % CARD_NOTES.length]} />}
                  <FeedCard item={item} isFriend={friends.has(item.candidate.id)} onOpen={onOpen} />
                </div>
              ))
            )}

            {convo.map((m, index) =>
              m.from === "me" ? (
                <div key={`c-${index}`} className="user-bubble">{m.text}</div>
              ) : (
                <AgentBubble key={`c-${index}`} text={m.text} />
              ),
            )}

            {items.length > 0 && (
              vip ? (
                <AgentBubble text="您是会员，今天的合适人选我都展示给您了；想扩大范围随时跟我说。" />
              ) : (
                <button className="paywall-card" onClick={onUpgrade}>
                  <span className="paywall-icon"><Crown size={20} /></span>
                  <div>
                    <strong>今日推荐已看完</strong>
                    <small>开通会员可解锁跨城候选，还能看谁喜欢了孩子</small>
                  </div>
                  <span className="paywall-cta"><Lock size={13} /> 解锁</span>
                </button>
              )
            )}

            <div className="feed-bottom-space" />
          </>
        )}
      </div>

      <div className="agent-input">
        <div className="quick-replies">
          {QUICK_REPLIES.map((q) => (
            <button key={q} className="quick-chip" onClick={() => send(q)}>{q}</button>
          ))}
        </div>
        <div className="agent-input-row">
          <input
            value={draft}
            placeholder="和红娘说说想找什么样的…"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") send(draft);
            }}
          />
          <button className="send-btn" onClick={() => send(draft)} aria-label="发送"><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
}

function AgentBubble({ text }: { text: string }) {
  return (
    <div className="agent-line">
      <span className="agent-avatar"><Sparkles size={15} /></span>
      <div className="agent-bubble">{text}</div>
    </div>
  );
}

function FeedCard({ item, isFriend, onOpen }: { item: BrowseItem; isFriend: boolean; onOpen: (item: BrowseItem) => void }) {
  const c = item.candidate;
  const highlights = matchHighlights(item.score_breakdown).slice(0, 2);
  return (
    <motion.button className="candidate-card feed-card" onClick={() => onOpen(item)} whileTap={{ scale: 0.985 }}>
      <div className="candidate-photo">
        {c.photos[0] ? (
          <img src={publicAsset(c.photos[0])} alt={c.child_name} loading="lazy" />
        ) : (
          <span className="photo-fallback">{initialFor(c.child_name)}</span>
        )}
      </div>
      <div className="candidate-info">
        <div className="candidate-name">
          <strong>{c.child_name}</strong>
          <small>{ageOf(c)} 岁</small>
          {isFriend && <span className="friend-flag"><MessageCircle size={11} /> 好友</span>}
        </div>
        <p className="candidate-meta"><MapPin size={13} /> {c.city} · {c.job_type}</p>
        <div className="chips">
          {highlights.map((tag) => (
            <span key={tag.label} className={`chip sem ${tag.sem}`}>{tag.label}</span>
          ))}
        </div>
        <span className="match-score">
          推荐度 {item.score}
          <span className="bar"><i style={{ width: `${Math.min(100, item.score)}%` }} /></span>
        </span>
      </div>
    </motion.button>
  );
}
