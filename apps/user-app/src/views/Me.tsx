import {
  Ban,
  BadgeCheck,
  Bell,
  Check,
  ChevronRight,
  Crown,
  Eye,
  FileText,
  HelpCircle,
  Heart,
  Info,
  Lock,
  LogOut,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  Trash2,
  UserRound,
} from "lucide-react";
import { publicAsset } from "../assets";
import { ageOf, initialFor } from "../lib";
import type { Profile, User } from "../types";

type Row = { icon: typeof Bell; title: string; desc?: string; action: () => void; tint?: string };

export function MeView({
  profile,
  user,
  vip,
  likedCount,
  friendCount,
  whoLikesMeCount,
  onOpenProfile,
  onEdit,
  onLogout,
  onUpgrade,
  onOpenLikes,
  setToast,
}: {
  profile: Profile;
  user: User;
  vip: boolean;
  likedCount: number;
  friendCount: number;
  whoLikesMeCount: number;
  onOpenProfile: () => void;
  onEdit: () => void;
  onLogout: () => void;
  onUpgrade: () => void;
  onOpenLikes: () => void;
  setToast: (message: string | null) => void;
}) {
  const page = profile.public_page;

  const groups: { title: string; rows: Row[] }[] = [
    {
      title: "会员专区",
      rows: [
        { icon: Crown, title: "我的会员", desc: vip ? "会员有效中 · 享全部权益" : "未开通 · 点击了解权益", action: onUpgrade, tint: "gold" },
        { icon: Heart, title: "看谁喜欢了孩子", desc: whoLikesMeCount > 0 ? `已有 ${whoLikesMeCount} 人，${vip ? "点击查看" : "开通可见"}` : "暂无", action: onOpenLikes, tint: "coral" },
        { icon: Ticket, title: "我的订单与优惠券", desc: "查看开通记录、可用优惠", action: () => setToast("订单与优惠券稍后接入") },
      ],
    },
    {
      title: "常用功能",
      rows: [
        { icon: FileText, title: "编辑孩子资料", desc: "补充职业、家庭、择偶偏好", action: onEdit },
        { icon: Eye, title: "查看公开档案", desc: "对外展示的完整资料页", action: onOpenProfile },
        { icon: Sparkles, title: "生成介绍话术", desc: "给亲友或红娘看的简短版本", action: () => setToast("分享预览稍后接入") },
        { icon: Heart, title: "我喜欢 / 收藏的人", desc: `已关注 ${likedCount} 人`, action: onOpenLikes },
      ],
    },
    {
      title: "推荐与展示",
      rows: [
        { icon: SlidersHorizontal, title: "筛选偏好", desc: `${profile.preference_city} · ${profile.preference_education}`, action: onEdit },
        { icon: Bell, title: "推荐与消息提醒", desc: "每天少量推荐，避免信息过载", action: () => setToast("提醒设置稍后接入") },
        { icon: Eye, title: "资料展示范围", desc: "控制谁能看到孩子资料", action: () => setToast("展示范围稍后接入") },
      ],
    },
    {
      title: "安全与隐私",
      rows: [
        { icon: BadgeCheck, title: "实名与资料认证", desc: "认证后更易获得信任", action: () => setToast("实名认证稍后接入") },
        { icon: Lock, title: "隐私与联系方式", desc: "联系方式默认不公开", action: () => setToast("隐私设置稍后接入") },
        { icon: Ban, title: "黑名单管理", desc: "不再接收某些人的推荐", action: () => setToast("黑名单稍后接入") },
        { icon: Shield, title: "账号与安全", desc: "登录设备、注销账号", action: () => setToast("账号安全稍后接入") },
      ],
    },
    {
      title: "通用",
      rows: [
        { icon: Trash2, title: "清除缓存", desc: "释放本地占用空间", action: () => setToast("已清除本地缓存") },
        { icon: HelpCircle, title: "帮助与反馈", desc: "记录使用问题和优化建议", action: () => setToast("反馈入口稍后接入") },
        { icon: Info, title: "关于爸妈牵线", desc: "版本 0.2 · 演示原型", action: () => setToast("当前为本地演示原型") },
      ],
    },
  ];

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <span className="eyebrow">我的</span>
          <h1>个人中心</h1>
        </div>
      </header>
      <div className="screen-body">
        <button className="me-card me-hero-tint tappable-card" onClick={onOpenProfile}>
          {profile.photos[0] ? (
            <img className="me-photo" src={publicAsset(profile.photos[0])} alt={profile.child_name} />
          ) : (
            <div className="me-photo placeholder">{initialFor(profile.child_name)}</div>
          )}
          <div className="me-meta">
            <strong>
              {profile.child_name}
              {vip && <span className="vip-tag"><Crown size={11} /> 会员</span>}
            </strong>
            <small>{ageOf(profile)} 岁 · {profile.city} · {profile.job_type}</small>
            <span className="status-chip"><Check size={13} /> 资料已发布</span>
          </div>
          <ChevronRight className="row-arrow" size={18} />
        </button>

        <button className={vip ? "vip-banner active" : "vip-banner"} onClick={onUpgrade}>
          <span className="vip-banner-ico"><Crown size={22} /></span>
          <div className="vip-banner-main">
            <strong>{vip ? "牵线会员 · 生效中" : "开通牵线会员"}</strong>
            <small>{vip ? "全部权益已解锁，祝早日牵手" : "无限推荐 · 看谁喜欢孩子 · 优先展示"}</small>
          </div>
          <span className="vip-banner-cta">{vip ? "管理" : "¥38 起"}</span>
        </button>

        <section className="metric-strip">
          <span><strong>{profile.completeness}%</strong><small>资料完整度</small></span>
          <span><strong>{friendCount}</strong><small>已加好友</small></span>
          <span><strong>{whoLikesMeCount}</strong><small>谁喜欢孩子</small></span>
        </section>

        {groups.map((group) => (
          <section className="settings-group" key={group.title}>
            <div className="group-title">{group.title}</div>
            <div className="settings-list">
              {group.rows.map((row) => {
                const Icon = row.icon;
                return (
                  <button className="settings-row" key={row.title} onClick={row.action}>
                    <span className={row.tint ? `row-ico tint-${row.tint}` : "row-ico"}><Icon size={17} /></span>
                    <span className="row-text">
                      <strong>{row.title}</strong>
                      {row.desc && <small>{row.desc}</small>}
                    </span>
                    <ChevronRight className="row-arrow" size={17} />
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        <section className="settings-group">
          <div className="group-title">账号</div>
          <div className="settings-list">
            <div className="settings-row static-row">
              <span className="row-ico"><UserRound size={17} /></span>
              <span className="row-text">
                <strong>{user.display_name}</strong>
                <small>{user.phone}</small>
              </span>
            </div>
          </div>
        </section>

        {page.headline && <p className="me-footnote">{page.headline}</p>}

        <button className="logout-row" onClick={onLogout}>
          <LogOut size={17} />
          退出体验
        </button>
      </div>
    </div>
  );
}
