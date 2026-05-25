import type { Profile, SwipeAction } from "./types";

export type Tab = "browse" | "messages" | "discover" | "me";

export interface Highlight {
  label: string;
  sem: "sem-city" | "sem-interest" | "sem-life" | "sem-edu";
}

export interface ChatMessage {
  id: string;
  from: "me" | "them" | "system";
  text: string;
  time: string;
}

export interface Thread {
  /** profile id of the other party, or "assistant" for the AI 红娘 */
  key: string;
  profile: Profile | null;
  title: string;
  messages: ChatMessage[];
  pinned?: boolean;
  unread?: number;
}

export interface PlanTier {
  id: string;
  name: string;
  price: number;
  unit: string;
  per: string;
  tag?: string;
  best?: boolean;
}

export const AGE_BANDS = ["全部", "30 岁以下", "30-35 岁", "36 岁以上"];

/** Free accounts can open this many full profiles per day. */
export const DAILY_FREE_LIMIT = 3;

export const MEMBERSHIP_TIERS: PlanTier[] = [
  { id: "month", name: "月卡会员", price: 38, unit: "月", per: "约 1.3 元/天" },
  { id: "quarter", name: "季卡会员", price: 98, unit: "季", per: "约 1.1 元/天", tag: "最受欢迎", best: true },
  { id: "year", name: "年卡会员", price: 298, unit: "年", per: "约 0.8 元/天", tag: "最划算" },
];

export const VIP_BENEFITS: { title: string; desc: string }[] = [
  { title: "无限查看推荐", desc: "不再受每日名额限制" },
  { title: "看谁喜欢了孩子", desc: "解锁所有对孩子感兴趣的人" },
  { title: "资料优先展示", desc: "让更多合适家庭先看到" },
  { title: "主动联系不限次", desc: "每天主动表达感兴趣无上限" },
  { title: "专属红娘协助", desc: "AI 红娘 + 人工初筛建议" },
  { title: "高级精准筛选", desc: "按房产、属相、家庭结构精筛" },
];

export function ageOf(profile: Profile) {
  return new Date().getFullYear() - profile.birth_year;
}

export function inAgeBand(age: number, band: string) {
  if (band === "30 岁以下") return age < 30;
  if (band === "30-35 岁") return age >= 30 && age <= 35;
  if (band === "36 岁以上") return age > 35;
  return true;
}

export function matchHighlights(breakdown: Record<string, number>): Highlight[] {
  const out: Highlight[] = [];
  const city = breakdown["城市"] ?? 0;
  if (city >= 25) out.push({ label: "同城", sem: "sem-city" });
  else if (city >= 14) out.push({ label: "城市相近", sem: "sem-city" });
  if ((breakdown["兴趣"] ?? 0) >= 9) out.push({ label: "兴趣相投", sem: "sem-interest" });
  if ((breakdown["生活方式"] ?? 0) >= 8) out.push({ label: "生活方式接近", sem: "sem-life" });
  if ((breakdown["婚恋节奏"] ?? 0) >= 12) out.push({ label: "节奏一致", sem: "sem-life" });
  if ((breakdown["学历"] ?? 0) >= 12) out.push({ label: "学历相当", sem: "sem-edu" });
  if ((breakdown["职业稳定"] ?? 0) >= 10) out.push({ label: "职业稳定", sem: "sem-edu" });
  return out;
}

export function actionLabel(action: SwipeAction) {
  const map: Record<SwipeAction, string> = {
    like: "已表示感兴趣",
    favorite: "已收藏",
    pass: "已跳过",
    block: "已屏蔽",
    report: "已提交反馈",
  };
  return map[action];
}

export function initialFor(name: string) {
  return name.slice(0, 1) || "牵";
}

/** Scripted opening line the matched friend "sends" first. */
export function openingMessage(other: Profile): string {
  const interest = other.interests?.[0];
  return `您好，看到孩子${interest ? `也喜欢${interest}` : "情况挺合适"}，很高兴认识。方便的话我们多聊聊两个孩子的近况～`;
}

/** Very small scripted reply generator for the demo chat. */
export function autoReply(other: Profile, _userText: string): string {
  const pool = [
    "好的，谢谢您愿意了解。孩子周末一般有空，约着一起见见也可以。",
    `我们家孩子在${other.city}，平时工作稳定，性格${other.personality_tags?.[0] || "温和"}，您放心。`,
    "都是为孩子好，咱们慢慢来，先让两个孩子加个联系方式聊聊？",
    "您说得在理，门当户对、孩子合得来最重要。",
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}
