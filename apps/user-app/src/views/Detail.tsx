import {
  Bookmark,
  Briefcase,
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  GraduationCap,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Pencil,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { publicAsset } from "../assets";
import { ageOf, initialFor, matchHighlights } from "../lib";
import type { BrowseItem, Profile, SwipeAction } from "../types";

export function CandidateDetail({
  item,
  action,
  isFriend,
  onClose,
  onAction,
  onChat,
  loading,
}: {
  item: BrowseItem;
  action?: SwipeAction;
  isFriend: boolean;
  onClose: () => void;
  onAction: (item: BrowseItem, action: SwipeAction) => void;
  onChat: (profile: Profile) => void;
  loading: string | null;
}) {
  const c = item.candidate;
  const page = c.public_page;
  const highlights = matchHighlights(item.score_breakdown);
  const facts = [
    { k: "年龄", v: `${ageOf(c)} 岁`, icon: Calendar },
    { k: "城市", v: c.city, icon: MapPin },
    { k: "学历", v: c.education, icon: GraduationCap },
    { k: "职业", v: c.job_type, icon: Briefcase },
    { k: "婚育节奏", v: c.marriage_plan, icon: Clock },
    { k: "异地", v: c.accepts_long_distance ? "可接受周边" : "倾向本地", icon: Home },
  ].filter((fact) => fact.v);
  const sections = [
    { label: "基本情况", value: page.basic_summary, icon: UserRound },
    { label: "工作与生活", value: page.work_life, icon: Briefcase },
    { label: "性格与兴趣", value: page.personality_interests, icon: Sparkles },
    { label: "家庭氛围", value: page.family_values, icon: Home },
    { label: "希望认识的人", value: page.looking_for, icon: Heart },
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
            <div className="detail-hero-fallback">{initialFor(c.child_name)}</div>
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
                <span key={tag.label} className={`chip sem ${tag.sem}`}>{tag.label}</span>
              ))}
            </div>
          )}

          <section className="reason-card">
            <div className="reason-title"><Sparkles size={16} /> 红娘为什么推荐 TA</div>
            <p>{item.reason}</p>
          </section>

          <div>
            <div className="detail-section-title">关键信息</div>
            <div className="fact-grid">
              {facts.map((fact) => {
                const Icon = fact.icon;
                return (
                  <div key={fact.k} className="fact-cell">
                    <Icon size={17} />
                    <div>
                      <span className="k">{fact.k}</span>
                      <span className="v">{fact.v}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {c.photos.length > 1 && (
            <div className="photo-gallery">
              {c.photos.slice(1).map((photo, index) => (
                <img key={photo} src={publicAsset(photo)} alt={`${c.child_name} ${index + 2}`} loading="lazy" />
              ))}
            </div>
          )}

          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.label} className="detail-section">
                <h3><Icon size={15} /> {section.label}</h3>
                <p>{section.value}</p>
              </section>
            );
          })}

          <div className="detail-spacer" />
        </div>
      </div>

      <div className="detail-actions">
        {isFriend ? (
          <>
            <button className="act-btn pass" onClick={() => onAction(item, "pass")} disabled={Boolean(loading)} aria-label="跳过">
              <X size={20} />
              <small>跳过</small>
            </button>
            <button className="act-btn chat-cta" onClick={() => onChat(c)} aria-label="去聊天">
              <MessageCircle size={20} />
              <small>已是好友 · 去聊天</small>
            </button>
          </>
        ) : (
          <>
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
              aria-label="加为好友"
            >
              <Heart size={22} />
              <small>感兴趣 · 加好友</small>
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

export function OwnProfileDetail({
  profile,
  onClose,
  onEdit,
}: {
  profile: Profile;
  onClose: () => void;
  onEdit: () => void;
}) {
  const page = profile.public_page;
  const tags = [
    ...((profile.ai_structured?.personality_tags as string[] | undefined) || profile.personality_tags || []),
    ...((profile.ai_structured?.interest_tags as string[] | undefined) || profile.interests || []),
  ].slice(0, 8);
  const sections = [
    { label: "基本情况", value: page.basic_summary, icon: UserRound },
    { label: "工作与生活", value: page.work_life, icon: Briefcase },
    { label: "性格与兴趣", value: page.personality_interests, icon: Sparkles },
    { label: "家庭氛围", value: page.family_values, icon: Home },
    { label: "希望认识的人", value: page.looking_for, icon: Heart },
  ].filter((section) => section.value);

  return (
    <motion.div
      className="profile-overlay"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <header className="profile-overlay-head">
        <button onClick={onClose} aria-label="返回"><ChevronLeft size={20} /></button>
        <strong>公开档案</strong>
        <button onClick={onEdit} aria-label="编辑"><Pencil size={17} /></button>
      </header>
      <div className="profile-overlay-body">
        <article className="me-card me-hero-tint profile-card-large">
          {profile.photos[0] ? (
            <img className="me-photo" src={publicAsset(profile.photos[0])} alt={profile.child_name} />
          ) : (
            <div className="me-photo placeholder">{initialFor(profile.child_name)}</div>
          )}
          <div className="me-meta">
            <strong>{profile.child_name}</strong>
            <small>{ageOf(profile)} 岁 · {profile.city} · {profile.job_type}</small>
            <span className="status-chip"><Check size={13} /> 正在展示</span>
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

        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.label} className="detail-section">
              <h3><Icon size={15} /> {section.label}</h3>
              <p>{section.value}</p>
            </section>
          );
        })}
      </div>
    </motion.div>
  );
}
