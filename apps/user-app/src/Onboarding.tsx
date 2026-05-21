import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ImagePlus,
  Loader2,
  Sparkles,
} from "lucide-react";
import { api } from "./api";
import { publicAsset } from "./assets";
import type { Gender, Profile, ProfileInput, PublicProfile } from "./types";

const PERSONALITY = [
  "温和", "独立", "靠谱", "幽默", "顾家", "上进", "稳重",
  "细心", "开朗", "理性", "有耐心", "真诚", "审美好", "情绪稳定",
];
const INTERESTS = [
  "电影", "咖啡", "健身", "旅行", "读书", "美食", "音乐",
  "摄影", "徒步", "看展", "宠物", "烹饪", "骑行", "瑜伽",
];
const DEALBREAKERS = [
  "长期不沟通", "情绪不稳定", "没有边界感", "作息混乱",
  "消费严重超前", "不尊重家人", "冷暴力", "过度应酬",
];
const MARRIAGE = ["一年内结婚", "1-2 年内结婚", "2-3 年内", "先认真了解"];
const EDUCATION_SELF = ["大专", "本科", "硕士", "博士"];
const EDUCATION_PREF = ["不限", "大专及以上", "本科及以上", "硕士及以上"];
const CITIES = ["上海", "杭州", "苏州", "南京", "深圳", "广州", "北京", "成都", "武汉", "其他"];

const SAMPLE_PHOTOS: Record<"female" | "male", string[]> = {
  female: [
    "/mock-assets/profiles/lin-wan-portrait.png",
    "/mock-assets/profiles/tang-xi-portrait.png",
    "/mock-assets/profiles/he-qing-portrait.png",
    "/mock-assets/profiles/jiang-nan-portrait.png",
  ],
  male: [
    "/mock-assets/profiles/liang-chen-portrait.png",
    "/mock-assets/profiles/gu-yuan-portrait.png",
    "/mock-assets/profiles/xu-zimo-portrait.png",
    "/mock-assets/profiles/chen-yu-portrait.png",
  ],
};

const STEP_COUNT = 7;
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 22 }, (_, i) => currentYear - 22 - i);

function textToTags(value: string) {
  return value.split(/[、,\n]/).map((item) => item.trim()).filter(Boolean);
}

export function Onboarding({
  userId,
  initialDraft,
  editing,
  onComplete,
  onCancel,
  setToast,
}: {
  userId: string;
  initialDraft: ProfileInput;
  editing: boolean;
  onComplete: (profile: Profile) => void;
  onCancel: () => void;
  setToast: (message: string | null) => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ProfileInput>({ ...initialDraft, user_id: userId });
  const [busy, setBusy] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Profile | null>(null);
  const [publicPage, setPublicPage] = useState<PublicProfile | null>(null);

  function update<Key extends keyof ProfileInput>(key: Key, value: ProfileInput[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const samplePhotos = SAMPLE_PHOTOS[draft.gender === "male" ? "male" : "female"];

  async function handleGenerate() {
    if (!draft.child_name.trim()) {
      setToast("先填一下孩子的称呼");
      setStep(0);
      return;
    }
    setBusy("正在生成介绍…");
    try {
      const saved = await api.saveProfile({ ...draft, user_id: userId });
      const normalized = await api.normalizeProfile(saved.id);
      setGenerated(normalized);
      setPublicPage(normalized.public_page);
      setStep(STEP_COUNT);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "生成失败");
    } finally {
      setBusy(null);
    }
  }

  async function handleConfirm() {
    if (!generated || !publicPage) return;
    setBusy("正在确认…");
    try {
      await api.updatePublicPage(generated.id, publicPage);
      const published = await api.publishProfile(generated.id);
      onComplete(published);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "确认失败");
    } finally {
      setBusy(null);
    }
  }

  const onPreview = step >= STEP_COUNT;

  return (
    <main className="ob-shell">
      <header className="ob-header">
        <button
          className="ob-back"
          onClick={() => {
            if (onPreview) {
              setStep(STEP_COUNT - 1);
            } else if (step === 0) {
              onCancel();
            } else {
              setStep(step - 1);
            }
          }}
          aria-label="返回"
        >
          <ChevronLeft size={22} />
        </button>
        {!onPreview && (
          <div className="ob-progress" aria-label={`第 ${step + 1} / ${STEP_COUNT} 步`}>
            {Array.from({ length: STEP_COUNT }).map((_, index) => (
              <i key={index} className={index <= step ? "on" : ""} />
            ))}
          </div>
        )}
        {editing && <span className="ob-skip" onClick={onCancel}>退出</span>}
      </header>

      <AnimatePresence mode="wait">
        <motion.section
          key={step}
          className="ob-body"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {step === 0 && (
            <Step title="先为孩子建一张资料卡" subtitle="选择性别，填写称呼，挑一张照片">
              <Segmented
                value={draft.gender}
                onChange={(value) => update("gender", value as Gender)}
                options={[
                  { value: "female", label: "女儿" },
                  { value: "male", label: "儿子" },
                ]}
              />
              <label className="field ob-field">
                <span>孩子的称呼</span>
                <input
                  value={draft.child_name}
                  placeholder="例如：安然 / 小宇"
                  onChange={(event) => update("child_name", event.target.value)}
                />
              </label>
              <div className="photo-picker">
                {samplePhotos.map((url) => (
                  <button
                    key={url}
                    className={draft.photos[0] === url ? "photo-opt on" : "photo-opt"}
                    onClick={() => update("photos", [url])}
                  >
                    <img src={publicAsset(url)} alt="示例照片" />
                    {draft.photos[0] === url && (
                      <span className="photo-check"><Check size={16} /></span>
                    )}
                  </button>
                ))}
                <button
                  className={draft.photos.length === 0 ? "photo-opt empty on" : "photo-opt empty"}
                  onClick={() => update("photos", [])}
                >
                  <ImagePlus size={22} />
                  <small>稍后再传</small>
                </button>
              </div>
            </Step>
          )}

          {step === 1 && (
            <Step title="孩子的基本情况" subtitle="出生年份、城市、学历和工作">
              <div className="ob-fields">
                <label className="field ob-field">
                  <span>出生年份</span>
                  <select value={draft.birth_year} onChange={(event) => update("birth_year", Number(event.target.value))}>
                    {YEARS.map((year) => (
                      <option key={year} value={year}>{year} 年（{currentYear - year} 岁）</option>
                    ))}
                  </select>
                </label>
                <label className="field ob-field">
                  <span>所在城市</span>
                  <select value={CITIES.includes(draft.city) ? draft.city : "其他"} onChange={(event) => update("city", event.target.value)}>
                    {CITIES.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </label>
                <label className="field ob-field">
                  <span>学历</span>
                  <select value={EDUCATION_SELF.includes(draft.education) ? draft.education : "本科"} onChange={(event) => update("education", event.target.value)}>
                    {EDUCATION_SELF.map((edu) => (
                      <option key={edu} value={edu}>{edu}</option>
                    ))}
                  </select>
                </label>
                <label className="field ob-field">
                  <span>工作 / 行业</span>
                  <input value={draft.job_type} placeholder="例如：互联网产品 / 医生 / 教师" onChange={(event) => update("job_type", event.target.value)} />
                </label>
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step title="孩子是怎样的人？" subtitle="选几个最像 TA 的词，也可以自己加">
              <ChipSelect
                options={PERSONALITY}
                value={draft.personality_tags}
                onChange={(value) => update("personality_tags", value)}
              />
            </Step>
          )}

          {step === 3 && (
            <Step title="平时喜欢做什么？" subtitle="兴趣爱好和生活状态">
              <ChipSelect
                options={INTERESTS}
                value={draft.interests}
                onChange={(value) => update("interests", value)}
              />
              <label className="field ob-field">
                <span>生活状态（一句话）</span>
                <textarea
                  rows={3}
                  value={draft.lifestyle}
                  placeholder="例如：作息规律，喜欢周末短途旅行和健身"
                  onChange={(event) => update("lifestyle", event.target.value)}
                />
              </label>
            </Step>
          )}

          {step === 4 && (
            <Step title="工作与家庭" subtitle="简单说说，AI 会帮你整理成自然的介绍">
              <label className="field ob-field">
                <span>职业方向（一句话）</span>
                <textarea
                  rows={3}
                  value={draft.career}
                  placeholder="例如：在消费品牌做用户运营，节奏稳定，重视长期成长"
                  onChange={(event) => update("career", event.target.value)}
                />
              </label>
              <label className="field ob-field">
                <span>家庭氛围（一句话）</span>
                <textarea
                  rows={3}
                  value={draft.family_atmosphere}
                  placeholder="例如：家庭沟通平等，父母尊重孩子的节奏"
                  onChange={(event) => update("family_atmosphere", event.target.value)}
                />
              </label>
            </Step>
          )}

          {step === 5 && (
            <Step title="希望认识什么样的人？" subtitle="这些会用来帮你筛选合适的对象">
              <div className="range-block">
                <span className="range-label">期望年龄</span>
                <strong className="range-value">{draft.preference_age_min} – {draft.preference_age_max} 岁</strong>
                <div className="range-row">
                  <input
                    type="range" min={22} max={45} value={draft.preference_age_min}
                    onChange={(event) => update("preference_age_min", Math.min(Number(event.target.value), draft.preference_age_max))}
                  />
                  <input
                    type="range" min={22} max={45} value={draft.preference_age_max}
                    onChange={(event) => update("preference_age_max", Math.max(Number(event.target.value), draft.preference_age_min))}
                  />
                </div>
              </div>
              <label className="field ob-field">
                <span>希望对方学历</span>
                <select value={EDUCATION_PREF.includes(draft.preference_education) ? draft.preference_education : "本科及以上"} onChange={(event) => update("preference_education", event.target.value)}>
                  {EDUCATION_PREF.map((edu) => (
                    <option key={edu} value={edu}>{edu}</option>
                  ))}
                </select>
              </label>
              <label className="field ob-field">
                <span>希望对方城市</span>
                <input value={draft.preference_city} placeholder="例如：上海、杭州、苏州" onChange={(event) => update("preference_city", event.target.value)} />
              </label>
              <label className="switch-row ob-switch">
                <span>可以接受周边异地</span>
                <input type="checkbox" checked={draft.accepts_long_distance} onChange={(event) => update("accepts_long_distance", event.target.checked)} />
              </label>
              <div className="ob-sub">婚育节奏</div>
              <ChipSelect
                options={MARRIAGE}
                value={draft.marriage_plan ? [draft.marriage_plan] : []}
                onChange={(value) => update("marriage_plan", value[value.length - 1] || "")}
                single
                allowCustom={false}
              />
              <div className="ob-sub">不太能接受</div>
              <ChipSelect
                options={DEALBREAKERS}
                value={draft.dealbreakers}
                onChange={(value) => update("dealbreakers", value)}
              />
            </Step>
          )}

          {step === 6 && (
            <Step title="父母想补充的话" subtitle="可选。写给可能的对方家庭看，也会帮助 AI 理解">
              <label className="field ob-field">
                <textarea
                  rows={6}
                  value={draft.parent_description}
                  placeholder="例如：孩子性格温和但有主见，希望认识真诚稳定、沟通舒服的人。"
                  onChange={(event) => update("parent_description", event.target.value)}
                />
              </label>
            </Step>
          )}

          {onPreview && generated && publicPage && (
            <div className="ob-preview">
              <div className="ob-preview-head">
                <Sparkles size={18} />
                <span>资料卡已生成，确认后即可开始看对象</span>
              </div>
              <article className="preview-card">
                {draft.photos[0] ? (
                  <img className="preview-photo" src={publicAsset(draft.photos[0])} alt="孩子照片" />
                ) : (
                  <div className="preview-photo placeholder">{draft.child_name.slice(0, 1) || "牵"}</div>
                )}
                <div className="preview-meta">
                  <strong>{draft.child_name}</strong>
                  <small>{currentYear - draft.birth_year} 岁 · {draft.city} · {draft.job_type}</small>
                </div>
              </article>
              <label className="field ob-field">
                <span>一句话介绍</span>
                <textarea rows={2} value={publicPage.headline} onChange={(event) => setPublicPage({ ...publicPage, headline: event.target.value })} />
              </label>
              <label className="field ob-field">
                <span>基本情况</span>
                <textarea rows={4} value={publicPage.basic_summary} onChange={(event) => setPublicPage({ ...publicPage, basic_summary: event.target.value })} />
              </label>
              {generated.ai_structured && (
                <div className="chips preview-tags">
                  {[
                    ...((generated.ai_structured.personality_tags as string[] | undefined) || []),
                    ...((generated.ai_structured.interest_tags as string[] | undefined) || []),
                  ].slice(0, 8).map((tag) => (
                    <span key={tag} className="chip static">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.section>
      </AnimatePresence>

      <footer className="ob-footer">
        {!onPreview && step < STEP_COUNT - 1 && (
          <button className="primary-button full" onClick={() => setStep(step + 1)}>
            下一步 <ArrowRight size={18} />
          </button>
        )}
        {!onPreview && step === STEP_COUNT - 1 && (
          <button className="primary-button full" onClick={handleGenerate} disabled={Boolean(busy)}>
            {busy ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
            {busy || "生成资料卡"}
          </button>
        )}
        {onPreview && (
          <button className="primary-button full" onClick={handleConfirm} disabled={Boolean(busy)}>
            {busy ? <Loader2 className="spin" size={18} /> : <Check size={18} />}
            {busy || (editing ? "保存并返回" : "确认，开始看对象")}
          </button>
        )}
      </footer>
    </main>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="ob-step">
      <h1 className="ob-title">{title}</h1>
      <p className="ob-subtitle">{subtitle}</p>
      <div className="ob-content">{children}</div>
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="seg">
      {options.map((option) => (
        <button key={option.value} className={value === option.value ? "active" : ""} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ChipSelect({
  options,
  value,
  onChange,
  single = false,
  allowCustom = true,
}: {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  single?: boolean;
  allowCustom?: boolean;
}) {
  const [custom, setCustom] = useState("");
  const all = useMemo(() => {
    const extras = value.filter((item) => !options.includes(item));
    return [...options, ...extras];
  }, [options, value]);

  function toggle(tag: string) {
    if (single) {
      onChange([tag]);
      return;
    }
    onChange(value.includes(tag) ? value.filter((item) => item !== tag) : [...value, tag]);
  }

  function addCustom() {
    const tags = textToTags(custom);
    if (tags.length) {
      const merged = single ? [tags[0]] : Array.from(new Set([...value, ...tags]));
      onChange(merged);
    }
    setCustom("");
  }

  return (
    <div className="chip-select">
      <div className="chips">
        {all.map((tag) => (
          <button key={tag} className={value.includes(tag) ? "chip on" : "chip"} onClick={() => toggle(tag)}>
            {tag}
          </button>
        ))}
      </div>
      {allowCustom && (
        <input
          className="chip-add"
          value={custom}
          placeholder="其他，输入后回车添加"
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustom();
            }
          }}
          onBlur={addCustom}
        />
      )}
    </div>
  );
}
