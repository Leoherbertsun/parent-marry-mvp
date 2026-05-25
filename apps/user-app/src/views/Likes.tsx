import { useState } from "react";
import { Bookmark, ChevronLeft, Crown, Heart, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { publicAsset } from "../assets";
import { ageOf, initialFor } from "../lib";
import type { BrowseItem, Profile } from "../types";

type LikesTab = "incoming" | "liked" | "favorites";

export function LikesOverlay({
  vip,
  whoLikesMe,
  liked,
  favorites,
  onClose,
  onOpen,
  onUpgrade,
}: {
  vip: boolean;
  whoLikesMe: Profile[];
  liked: BrowseItem[];
  favorites: BrowseItem[];
  onClose: () => void;
  onOpen: (item: BrowseItem) => void;
  onUpgrade: () => void;
}) {
  const [tab, setTab] = useState<LikesTab>("incoming");

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
        <strong>心动</strong>
        <span style={{ width: 44 }} />
      </header>

      <div className="filter-bar chip-row likes-tabs">
        <button className={tab === "incoming" ? "pill-tab on" : "pill-tab"} onClick={() => setTab("incoming")}>
          谁喜欢孩子 {whoLikesMe.length > 0 && `(${whoLikesMe.length})`}
        </button>
        <button className={tab === "liked" ? "pill-tab on" : "pill-tab"} onClick={() => setTab("liked")}>
          我喜欢的 {liked.length > 0 && `(${liked.length})`}
        </button>
        <button className={tab === "favorites" ? "pill-tab on" : "pill-tab"} onClick={() => setTab("favorites")}>
          我收藏的 {favorites.length > 0 && `(${favorites.length})`}
        </button>
      </div>

      <div className="profile-overlay-body">
        {tab === "incoming" && (
          whoLikesMe.length === 0 ? (
            <EmptyLikes text="还没有人对孩子表示感兴趣，先完善资料更容易被看到" />
          ) : vip ? (
            <div className="like-grid">
              {whoLikesMe.map((p) => (
                <div key={p.id} className="like-cell">
                  {p.photos[0] ? <img src={publicAsset(p.photos[0])} alt={p.child_name} /> : <span className="like-fallback">{initialFor(p.child_name)}</span>}
                  <div className="like-cell-meta">
                    <strong>{p.child_name}</strong>
                    <small>{ageOf(p)} 岁 · {p.city}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="locked-block">
              <div className="like-grid blurred">
                {whoLikesMe.map((p) => (
                  <div key={p.id} className="like-cell">
                    {p.photos[0] ? <img src={publicAsset(p.photos[0])} alt="" /> : <span className="like-fallback">·</span>}
                  </div>
                ))}
              </div>
              <button className="locked-cta" onClick={onUpgrade}>
                <span className="locked-ico"><Lock size={20} /></span>
                <strong>{whoLikesMe.length} 人对孩子感兴趣</strong>
                <small>开通会员，查看是谁并主动联系</small>
                <span className="locked-btn"><Crown size={14} /> 开通会员查看</span>
              </button>
            </div>
          )
        )}

        {tab === "liked" && (
          liked.length === 0 ? (
            <EmptyLikes text="还没有喜欢的人，去「看对象」点感兴趣吧" />
          ) : (
            <PersonRows items={liked} onOpen={onOpen} tagText="感兴趣" />
          )
        )}

        {tab === "favorites" && (
          favorites.length === 0 ? (
            <EmptyLikes text="还没有收藏，详情页点收藏先存起来慢慢看" icon="bookmark" />
          ) : (
            <PersonRows items={favorites} onOpen={onOpen} tagText="已收藏" />
          )
        )}
      </div>
    </motion.div>
  );
}

function PersonRows({ items, onOpen, tagText }: { items: BrowseItem[]; onOpen: (item: BrowseItem) => void; tagText: string }) {
  return (
    <div className="row-list">
      {items.map((item) => (
        <button key={item.candidate.id} className="person-row tappable" onClick={() => onOpen(item)}>
          {item.candidate.photos[0] ? (
            <img className="avatar-img" src={publicAsset(item.candidate.photos[0])} alt={item.candidate.child_name} />
          ) : (
            <span className="avatar-img placeholder">{initialFor(item.candidate.child_name)}</span>
          )}
          <div>
            <strong>{item.candidate.child_name}</strong>
            <p>{ageOf(item.candidate)} 岁 · {item.candidate.city} · {item.candidate.job_type}</p>
          </div>
          <span className="row-tag">{tagText}</span>
        </button>
      ))}
    </div>
  );
}

function EmptyLikes({ text, icon }: { text: string; icon?: "bookmark" }) {
  return (
    <div className="empty-state">
      <span className="es-icon">{icon === "bookmark" ? <Bookmark size={26} /> : <Heart size={26} />}</span>
      <strong>这里还空着</strong>
      <span>{text}</span>
    </div>
  );
}
