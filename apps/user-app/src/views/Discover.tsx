import { useState } from "react";
import { CalendarHeart, ChevronRight, Flame, Heart, MapPin, Search, Sparkles } from "lucide-react";
import { publicAsset } from "../assets";

const CATEGORIES = ["推荐", "红娘说", "成功案例", "同城活动", "相亲知识"];

interface Post {
  id: string;
  cat: string;
  title: string;
  excerpt: string;
  image: string;
  meta: string;
}

const POSTS: Post[] = [
  {
    id: "p1",
    cat: "成功案例",
    title: "两位在上海的孩子，从「都爱看建筑展」聊起",
    excerpt: "同城、节奏接近，父母先沟通好底线，三个月后两个孩子自己定了关系。",
    image: "/mock-assets/profiles/liang-chen-hobby.png",
    meta: "成功案例 · 1.2 万阅读",
  },
  {
    id: "p2",
    cat: "红娘说",
    title: "给孩子相亲，父母最该把关的三件事",
    excerpt: "不是条件越高越好，价值观、生活节奏、家庭边界，比房车更决定长久。",
    image: "/mock-assets/profiles/tang-xi-hobby.png",
    meta: "红娘说 · 收藏 3268",
  },
  {
    id: "p3",
    cat: "同城活动",
    title: "本周六 · 上海徐汇「父母相亲交流会」",
    excerpt: "限 30 组家庭，按孩子年龄与职业分桌，现场有红娘协助初筛。",
    image: "/mock-assets/profiles/he-qing-hobby.png",
    meta: "同城活动 · 余 8 席",
  },
  {
    id: "p4",
    cat: "相亲知识",
    title: "第一次见面，帮孩子准备这 5 个话题就够了",
    excerpt: "从兴趣、生活节奏聊起，避开收入与买房，第一面更轻松。",
    image: "/mock-assets/profiles/gu-yuan-hobby.png",
    meta: "相亲知识 · 8 分钟读完",
  },
];

export function DiscoverView({ setToast }: { setToast: (message: string | null) => void }) {
  const [cat, setCat] = useState("推荐");
  const [query, setQuery] = useState("");
  const posts = POSTS.filter((post) => (cat === "推荐" ? true : post.cat === cat))
    .filter((post) => post.title.includes(query.trim()));

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <span className="eyebrow">逛一逛</span>
          <h1>发现</h1>
        </div>
        <button className="head-pill" onClick={() => setToast("同城活动报名稍后接入")} aria-label="活动">
          <CalendarHeart size={17} /> 活动
        </button>
      </header>

      <div className="search-wrap">
        <Search size={16} />
        <input value={query} placeholder="搜索话题、活动、相亲知识" onChange={(event) => setQuery(event.target.value)} />
      </div>

      <div className="filter-bar chip-row">
        {CATEGORIES.map((c) => (
          <button key={c} className={c === cat ? "pill-tab on" : "pill-tab"} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="screen-body">
        <button className="discover-feature" onClick={() => setToast("红娘公开课稍后接入")}>
          <img src={publicAsset("/mock-assets/profiles/jiang-nan-hobby.png")} alt="本周精选" />
          <div className="discover-feature-overlay">
            <span className="feature-tag"><Flame size={12} /> 本周精选</span>
            <strong>《父母如何不越界地帮孩子相亲》红娘公开课</strong>
            <small>已有 5,820 位家长在看</small>
          </div>
        </button>

        <div className="discover-quick">
          <button className="quick-tile" onClick={() => setToast("每日缘分稍后接入")}>
            <span className="quick-ico ico-coral"><Heart size={18} /></span>
            <span>每日缘分</span>
          </button>
          <button className="quick-tile" onClick={() => setToast("同城活动稍后接入")}>
            <span className="quick-ico ico-gold"><MapPin size={18} /></span>
            <span>同城活动</span>
          </button>
          <button className="quick-tile" onClick={() => setToast("红娘问答稍后接入")}>
            <span className="quick-ico ico-green"><Sparkles size={18} /></span>
            <span>红娘问答</span>
          </button>
        </div>

        <div className="group-title">{cat === "推荐" ? "为你精选" : cat}</div>
        <div className="post-list">
          {posts.map((post) => (
            <button key={post.id} className="post-card" onClick={() => setToast("内容详情稍后接入")}>
              <img src={publicAsset(post.image)} alt={post.title} loading="lazy" />
              <div className="post-main">
                <span className="post-cat">{post.cat}</span>
                <strong>{post.title}</strong>
                <p>{post.excerpt}</p>
                <span className="post-meta">{post.meta} <ChevronRight size={13} /></span>
              </div>
            </button>
          ))}
          {posts.length === 0 && (
            <div className="empty-state">
              <span className="es-icon"><Search size={26} /></span>
              <strong>没有找到相关内容</strong>
              <span>换个关键词，或看看其他分类</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
