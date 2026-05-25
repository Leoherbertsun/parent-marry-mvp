import { useEffect, useRef, useState } from "react";
import { ChevronLeft, MessageCircle, Plus, Search, Send, Sparkles, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { publicAsset } from "../assets";
import { initialFor } from "../lib";
import type { Thread } from "../lib";

export function MessagesView({
  threads,
  onOpenThread,
  setToast,
}: {
  threads: Thread[];
  onOpenThread: (thread: Thread) => void;
  setToast: (message: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const list = threads.filter((thread) => thread.title.includes(query.trim()));
  const friendCount = threads.filter((thread) => thread.key !== "assistant").length;

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <span className="eyebrow">已加好友 {friendCount}</span>
          <h1>消息</h1>
        </div>
        <button className="head-pill" onClick={() => setToast("发起群聊功能稍后接入")} aria-label="发起">
          <Plus size={17} /> 发起
        </button>
      </header>

      <div className="search-wrap">
        <Search size={16} />
        <input value={query} placeholder="搜索聊天 / 联系人" onChange={(event) => setQuery(event.target.value)} />
      </div>

      <div className="screen-body">
        {list.length === 0 ? (
          <div className="empty-state">
            <span className="es-icon"><MessageCircle size={28} /></span>
            <strong>还没有可以聊天的人</strong>
            <span>在「看对象」里点「感兴趣 · 加好友」，互相感兴趣后就能在这里聊天</span>
          </div>
        ) : (
          <div className="conv-list">
            {list.map((thread) => {
              const last = thread.messages[thread.messages.length - 1];
              return (
                <button key={thread.key} className="conv-row" onClick={() => onOpenThread(thread)}>
                  <ConvAvatar thread={thread} />
                  <div className="conv-main">
                    <div className="conv-top">
                      <strong>{thread.title}</strong>
                      <span className="conv-time">{last?.time}</span>
                    </div>
                    <p className="conv-preview">{last?.text}</p>
                  </div>
                  {Boolean(thread.unread) && <span className="conv-unread">{thread.unread}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ConvAvatar({ thread }: { thread: Thread }) {
  if (thread.key === "assistant") {
    return <span className="conv-avatar assistant"><Sparkles size={20} /></span>;
  }
  if (thread.profile?.photos[0]) {
    return <img className="conv-avatar" src={publicAsset(thread.profile.photos[0])} alt={thread.title} />;
  }
  return <span className="conv-avatar placeholder">{initialFor(thread.title)}</span>;
}

export function Conversation({
  thread,
  onBack,
  onSend,
  onViewProfile,
}: {
  thread: Thread;
  onBack: () => void;
  onSend: (text: string) => void;
  onViewProfile: () => void;
}) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.messages.length]);

  function submit() {
    const value = draft.trim();
    if (!value) return;
    onSend(value);
    setDraft("");
  }

  const isAssistant = thread.key === "assistant";

  return (
    <motion.div
      className="chat-overlay"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <header className="chat-head">
        <button onClick={onBack} aria-label="返回"><ChevronLeft size={22} /></button>
        <strong>{thread.title}</strong>
        <button onClick={onViewProfile} aria-label="查看资料" disabled={isAssistant}>
          <UserRound size={19} />
        </button>
      </header>

      <div className="chat-scroll">
        {!isAssistant && (
          <div className="chat-tip">你们已互相感兴趣并加为好友，可以放心沟通孩子的情况。</div>
        )}
        {thread.messages.map((m) => {
          if (m.from === "system") {
            return <div key={m.id} className="chat-system">{m.text}</div>;
          }
          return (
            <div key={m.id} className={m.from === "me" ? "msg-row me" : "msg-row them"}>
              {m.from === "them" && <ConvAvatar thread={thread} />}
              <div className="msg-bubble">{m.text}</div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="chat-input">
        <button className="chat-plus" onClick={() => onSend("[发送了联系方式]")} aria-label="更多"><Plus size={20} /></button>
        <input
          value={draft}
          placeholder="发消息…"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
          }}
        />
        <button className="send-btn" onClick={submit} aria-label="发送"><Send size={18} /></button>
      </div>
    </motion.div>
  );
}
