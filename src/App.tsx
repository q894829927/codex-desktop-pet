import { FormEvent, useEffect, useMemo, useState } from "react";
import { askAssistant } from "./lib/assistant";

type Mode = "idle" | "focus" | "rest";
type Panel = "none" | "chat" | "settings";
type ChatMessage = { role: "user" | "assistant"; text: string };

const texts: Record<Mode, string[]> = {
  idle: [
    "你好呀，我是你的 Codex 桌宠。",
    "今天准备写点什么？",
    "点我一下，我会陪你说两句。",
    "我会安静待在桌面上。",
  ],
  focus: ["进入专注模式。", "开始写代码吧。", "先把当前这一小步做完。"],
  rest: ["休息一下也很重要。", "喝口水，活动一下。", "眼睛也需要离开屏幕一会儿。"],
};

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export default function App() {
  const [mode, setMode] = useState<Mode>("idle");
  const [message, setMessage] = useState(texts.idle[0]);
  const [showBubble, setShowBubble] = useState(true);
  const [panel, setPanel] = useState<Panel>("none");
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: "assistant", text: "V0.1 的聊天外壳已经准备好了，目前使用本地占位响应。" },
  ]);
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [launchAtLogin, setLaunchAtLogin] = useState(false);
  const [launchAtLoginSupported, setLaunchAtLoginSupported] = useState(false);

  const modeLabel = useMemo(
    () => ({ idle: "待机中", focus: "专注中", rest: "休息中" })[mode],
    [mode],
  );

  useEffect(() => {
    window.petAPI.getSettings().then((settings) => {
      setAlwaysOnTop(settings.alwaysOnTop);
      setLaunchAtLogin(settings.launchAtLogin);
      setLaunchAtLoginSupported(settings.launchAtLoginSupported);
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessage(pick(texts[mode]));
      setShowBubble(true);
    }, 12000);

    return () => window.clearInterval(timer);
  }, [mode]);

  function petClick() {
    setMessage(pick(texts[mode]));
    setShowBubble(true);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setMessage(pick(texts[next]));
    setShowBubble(true);
  }

  async function submitChat(event: FormEvent) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || thinking) return;

    setInput("");
    setThinking(true);
    setChat((current) => [...current, { role: "user", text: prompt }]);

    try {
      const reply = await askAssistant(prompt);
      setChat((current) => [...current, { role: "assistant", text: reply.text }]);
      setMessage("我已经回你啦。");
      setShowBubble(true);
    } finally {
      setThinking(false);
    }
  }

  async function toggleAlwaysOnTop() {
    const next = !alwaysOnTop;
    const applied = await window.petAPI.setAlwaysOnTop(next);
    setAlwaysOnTop(applied);
  }

  async function toggleLaunchAtLogin() {
    const result = await window.petAPI.setLaunchAtLogin(!launchAtLogin);
    setLaunchAtLogin(result.enabled);
    setLaunchAtLoginSupported(result.supported);
  }

  return (
    <main className="pet-shell">
      <div className="drag-handle" title="拖动桌宠">⋮⋮ 拖动</div>

      {showBubble && (
        <button className="bubble no-drag" onClick={() => setShowBubble(false)}>
          <span className="bubble-title">Codex Pet · {modeLabel}</span>
          <span className="bubble-text">{message}</span>
        </button>
      )}

      {panel === "chat" && (
        <section className="panel chat-panel no-drag">
          <header>
            <strong>聊天</strong>
            <span>Local placeholder</span>
          </header>
          <div className="chat-list">
            {chat.slice(-4).map((item, index) => (
              <div className={`chat-row ${item.role}`} key={`${item.role}-${index}`}>
                {item.text}
              </div>
            ))}
            {thinking && <div className="chat-row assistant">思考中…</div>}
          </div>
          <form onSubmit={submitChat}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="问点开发问题…"
              aria-label="聊天输入"
            />
            <button type="submit" disabled={thinking}>发送</button>
          </form>
        </section>
      )}

      {panel === "settings" && (
        <section className="panel settings-panel no-drag">
          <header>
            <strong>设置</strong>
            <span>V0.1</span>
          </header>
          <button className="setting-row" onClick={toggleAlwaysOnTop}>
            <span>始终置顶</span>
            <b>{alwaysOnTop ? "开" : "关"}</b>
          </button>
          <button
            className="setting-row"
            onClick={toggleLaunchAtLogin}
            disabled={!launchAtLoginSupported}
            title={launchAtLoginSupported ? "" : "安装包版本启用此功能"}
          >
            <span>开机自启</span>
            <b>{launchAtLoginSupported ? (launchAtLogin ? "开" : "关") : "打包后可用"}</b>
          </button>
        </section>
      )}

      <div className="pet-stage">
        <button className="pet-button no-drag" onClick={petClick} aria-label="点击桌宠">
          <img className={`pet-image mode-${mode}`} src="./assets/pet.png" alt="Q 版 Codex 桌宠" />
        </button>
      </div>

      <nav className="toolbar no-drag" aria-label="桌宠控制">
        <button className={mode === "idle" ? "active" : ""} onClick={() => switchMode("idle")}>待机</button>
        <button className={mode === "focus" ? "active" : ""} onClick={() => switchMode("focus")}>专注</button>
        <button className={mode === "rest" ? "active" : ""} onClick={() => switchMode("rest")}>休息</button>
        <button className={panel === "chat" ? "active" : ""} onClick={() => setPanel(panel === "chat" ? "none" : "chat")}>聊天</button>
        <button className={panel === "settings" ? "active" : ""} onClick={() => setPanel(panel === "settings" ? "none" : "settings")}>设置</button>
        <button onClick={() => window.petAPI.hide()}>隐藏</button>
      </nav>
    </main>
  );
}
