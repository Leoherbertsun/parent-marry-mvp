"use client";

import {
  Activity,
  BadgeCheck,
  Bot,
  ClipboardList,
  HeartHandshake,
  RefreshCcw,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  type AdminData,
  type AdminProfile,
  loadAdminData,
  updateProfileStatus,
} from "../lib/api";

const statLabels: Record<string, string> = {
  users: "用户",
  profiles: "资料",
  active_profiles: "推荐池",
  recommendations: "推荐",
  swipe_events: "行为",
  matches: "匹配",
  ai_tasks: "AI任务",
  reports: "举报",
};

const statusOptions: AdminProfile["status"][] = ["draft", "active", "hidden", "blocked"];

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const next = await loadAdminData();
      setData(next);
      setSelectedProfileId((current) => current || next.profiles[0]?.id || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "后台数据读取失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const selectedProfile = useMemo(
    () => data?.profiles.find((profile) => profile.id === selectedProfileId) || data?.profiles[0],
    [data, selectedProfileId],
  );

  async function changeStatus(profileId: string, status: AdminProfile["status"]) {
    await updateProfileStatus(profileId, status);
    await refresh();
  }

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>PM</span>
          <div>
            <strong>ParentMarry Admin</strong>
            <small>AI Profile · Rules · Actions</small>
          </div>
        </div>
        <nav>
          <a href="#overview"><Activity size={18} />总览</a>
          <a href="#profiles"><ClipboardList size={18} />资料</a>
          <a href="#recommendations"><HeartHandshake size={18} />推荐</a>
          <a href="#ai"><Bot size={18} />AI</a>
          <a href="#reports"><ShieldAlert size={18} />异常</a>
        </nav>
      </aside>

      <section className="main">
        <header className="topbar">
          <div>
            <p>Internal dashboard</p>
            <h1>ParentMarry 后台</h1>
          </div>
          <button onClick={refresh} disabled={loading}>
            <RefreshCcw size={18} />
            刷新
          </button>
        </header>

        {error && <div className="error">{error}</div>}
        {loading && !data && <div className="loading">读取后端数据中...</div>}

        {data && (
          <div className="dashboard">
            <section id="overview" className="stats-grid">
              {Object.entries(data.summary).map(([key, value]) => (
                <article key={key}>
                  <span>{statLabels[key] || key}</span>
                  <strong>{value}</strong>
                </article>
              ))}
            </section>

            <section id="profiles" className="two-column">
              <div className="panel">
                <PanelTitle icon={Users} title="用户与资料" count={data.profiles.length} />
                <div className="profile-list">
                  {data.profiles.map((profile) => (
                    <button
                      key={profile.id}
                      className={selectedProfile?.id === profile.id ? "selected" : ""}
                      onClick={() => setSelectedProfileId(profile.id)}
                    >
                      <span className="avatar">{profile.child_name.slice(0, 1)}</span>
                      <span>
                        <strong>{profile.child_name}</strong>
                        <small>{profile.city} · {profile.education} · {profile.status}</small>
                      </span>
                      <i>{profile.completeness}%</i>
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel">
                <PanelTitle icon={BadgeCheck} title="资料详情" count={selectedProfile ? 1 : 0} />
                {selectedProfile && (
                  <div className="detail">
                    <h2>{selectedProfile.public_page?.headline || selectedProfile.child_name}</h2>
                    <p>{selectedProfile.public_page?.basic_summary || "暂无公开资料"}</p>
                    <div className="detail-grid">
                      <span>城市<strong>{selectedProfile.city}</strong></span>
                      <span>学历<strong>{selectedProfile.education}</strong></span>
                      <span>职业<strong>{selectedProfile.job_type}</strong></span>
                      <span>完整度<strong>{selectedProfile.completeness}%</strong></span>
                    </div>
                    <label className="status-select">
                      <span>状态</span>
                      <select
                        value={selectedProfile.status}
                        onChange={(event) => changeStatus(selectedProfile.id, event.target.value as AdminProfile["status"])}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </div>
            </section>

            <section id="recommendations" className="panel">
              <PanelTitle icon={HeartHandshake} title="推荐结果" count={data.recommendations.length} />
              <div className="table">
                <div className="thead">
                  <span>日期</span>
                  <span>资料</span>
                  <span>候选人</span>
                  <span>分数</span>
                  <span>解释</span>
                </div>
                {data.recommendations.map((item) => (
                  <div className="tr" key={item.id}>
                    <span>{item.date}</span>
                    <span>{shortId(item.profile_id)}</span>
                    <span>{shortId(item.candidate_profile_id)}</span>
                    <strong>{item.score}</strong>
                    <p>{item.reason}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="two-column">
              <div className="panel">
                <PanelTitle icon={Activity} title="用户行为" count={data.swipeEvents.length} />
                <div className="event-list">
                  {data.swipeEvents.map((event) => (
                    <article key={event.id}>
                      <strong>{event.action}</strong>
                      <span>{shortId(event.actor_profile_id)} {"->"} {shortId(event.target_profile_id)}</span>
                    </article>
                  ))}
                </div>
              </div>

              <div className="panel">
                <PanelTitle icon={HeartHandshake} title="匹配记录" count={data.matches.length} />
                <div className="event-list">
                  {data.matches.map((match) => (
                    <article key={match.id}>
                      <strong>{match.status}</strong>
                      <span>{shortId(match.profile_a_id)} + {shortId(match.profile_b_id)}</span>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section id="ai" className="panel">
              <PanelTitle icon={Bot} title="AI 调用记录" count={data.aiTasks.length} />
              <div className="ai-list">
                {data.aiTasks.slice(0, 8).map((task) => (
                  <details key={task.id}>
                    <summary>
                      <strong>{task.task_type}</strong>
                      <span>{shortId(task.profile_id)}</span>
                    </summary>
                    <pre>{JSON.stringify(task.output_snapshot, null, 2)}</pre>
                  </details>
                ))}
              </div>
            </section>

            <section id="reports" className="panel">
              <PanelTitle icon={ShieldAlert} title="举报与异常" count={data.reports.length} />
              {data.reports.length === 0 ? (
                <div className="empty">暂无举报</div>
              ) : (
                <div className="event-list">
                  {data.reports.map((report) => (
                    <article key={report.id}>
                      <strong>{report.status}</strong>
                      <span>{report.reason}</span>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function PanelTitle({
  icon: Icon,
  title,
  count,
}: {
  icon: typeof Users;
  title: string;
  count: number;
}) {
  return (
    <div className="panel-title">
      <span><Icon size={18} /></span>
      <strong>{title}</strong>
      <i>{count}</i>
    </div>
  );
}

function shortId(id: string) {
  return id.replace(/^([a-z]+_)/, "").slice(0, 7);
}
