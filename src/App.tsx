import { CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePetAnimation } from "./hooks/usePetAnimation";
import { usePetExpression, type PetMode } from "./hooks/usePetExpression";
import { askAssistant } from "./lib/assistant";

type Mode = PetMode;
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
  const shellRef = useRef<HTMLElement>(null);
  const clickTimerRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [message, setMessage] = useState(texts.idle[0]);
  const [showBubble, setShowBubble] = useState(true);
  const [panel, setPanel] = useState<Panel>("none");
  const [controlsOpen, setControlsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: "assistant", text: "聊天接口已经预留，目前先使用本地占位响应。" },
  ]);
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [launchAtLogin, setLaunchAtLogin] = useState(false);
  const [launchAtLoginSupported, setLaunchAtLoginSupported] = useState(false);
  const { ambient, ambientDurationMs, reaction, triggerReaction } = usePetAnimation(thinking);
  const { pose, mood } = usePetExpression(mode, thinking, reaction);

  const modeLabel = useMemo(
    () => ({ idle: "待机中", focus: "专注中", rest: "休息中" })[mode],
    [mode],
  );

  const ambientStyle = useMemo(
    () => ({ "--pet-ambient-duration": `${ambientDurationMs}ms` }) as CSSProperties,
    [ambientDurationMs],
  );

  useEffect(() => {
    window.petAPI.getSettings().then((settings) => {
      setAlwaysOnTop(settings.alwaysOnTop);
      setLaunchAtLogin(settings.launchAtLogin);
      setLaunchAtLoginSupported(settings.launchAtLoginSupported);
    });
  }, []);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    let animationFrame = 0;

    const syncWindowHeight = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const height = Math.ceil(shell.getBoundingClientRect().height);
        if (height > 0) void window.petAPI.resizeContent(height);
      });
    };

    const observer = new ResizeObserver(syncWindowHeight);
    observer.observe(shell);
    syncWindowHeight();

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessage(pick(texts[mode]));
      if (panel === "none") setShowBubble(true);
    }, 12000);

    return () => window.clearInterval(timer);
  }, [mode, panel]);

  useEffect(
    () => () => {
      if (clickTimerRef.current !== null) window.clearTimeout(clickTimerRef.current);
    },
    [],
  );

  function runSinglePetClick() {
    triggerReaction("tap", 470);
    setMessage(pick(texts[mode]));
    setShowBubble(true);
    setPanel("none");
  }

  function handlePetClick() {
    if (clickTimerRef.current !== null) window.clearTimeout(clickTimerRef.current);
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      runSinglePetClick();
    }, 220);
  }

  function handlePetDoubleClick() {
    if (clickTimerRef.current !== null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    triggerReaction("happy", 820);
    setMessage("嘿嘿，今天也一起加油～");
    setShowBubble(true);
    setPanel("none");
  }

  function switchMode(next: Mode) {
    setMode(next);
    setMessage(pick(texts[next]));
    setShowBubble(true);
    setPanel("none");
    setControlsOpen(false);
  }

  function openPanel(next: Exclude<Panel, "none">) {
    setPanel((current) => (current === next ? "none" : next));
    setShowBubble(false);
    setControlsOpen(false);
  }

  async function submitChat(event: FormEvent) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || thinking) return;

    setInput("");
    setThinking(true);
    setChat((current) => [...current, { role: "user", text: prompt }]);

    let succeeded = false;

    try {
      const reply = await askAssistant(prompt);
      setChat((current) => [...current, { role: "assistant", text: reply.text }]);
      setMessage("任务完成啦。");
      succeeded = true;
    } finally {
      setThinking(false);
      if (succeeded) triggerReaction("success", 920);
    }
  }

  async function toggleAlwaysOnTop() {
    const applied = await window.petAPI.setAlwaysOnTop(!alwaysOnTop);
    setAlwaysOnTop(applied);
  }

  async function toggleLaunchAtLogin() {
    const result = await window.petAPI.setLaunchAtLogin(!launchAtLogin);
    setLaunchAtLogin(result.enabled);
    setLaunchAtLoginSupported(result.supported);
  }

  const reactionClass = thinking ? "reaction-thinking" : `reaction-${reaction}`;

  return (
    <main className="pet-shell" ref={shellRef}>
      <div className="drag-handle" title="拖动桌宠">⋮⋮</div>

      {showBubble && panel === "none" && (
        <button className="bubble no-drag" onClick={() => setShowBubble(false)}>
          <span className="bubble-title">Codex Pet · {modeLabel}</span>
          <span className="bubble-text">{message}</span>
        </button>
      )}

      {panel === "chat" && (
        <section className="panel chat-panel no-drag">
          <header>
            <div>
              <strong>聊天</strong>
              <span>Local placeholder</span>
            </div>
            <button className="panel-close" onClick={() => setPanel("none")} aria-label="关闭聊天">×</button>
          </header>
          <div className="chat-list">
            {chat.slice(-5).map((item, index) => (
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
            <div>
              <strong>设置</strong>
              <span>V0.3-C multipose</span>
            </div>
            <button className="panel-close" onClick={() => setPanel("none")} aria-label="关闭设置">×</button>
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
        <button
          className={`pet-button no-drag mode-${mode}`}
          onClick={handlePetClick}
          onDoubleClick={handlePetDoubleClick}
          aria-label="点击桌宠"
        >
          <span className={`pet-ambient ambient-${ambient}`} style={ambientStyle}>
            <span className={`pet-reaction ${reactionClass}`}>
              <span className="pet-hover-layer">
                <span className={`pet-pose-layer mood-${mood}`}>
                  <span
                    className={`pet-sprite pose-${pose}`}
                    key={pose}
                    aria-hidden="true"
                  />
                  {mood === "thinking" && <span className="pet-expression-fx fx-thinking">•••</span>}
                  {mood === "rest" && <span className="pet-expression-fx fx-sleep">Zzz</span>}
                  {mood === "focus" && <span className="pet-expression-fx fx-focus">⌁</span>}
                  {(mood === "happy" || mood === "success") && (
                    <span className="pet-expression-fx fx-sparkle">✦</span>
                  )}
                </span>
              </span>
            </span>
          </span>
        </button>
      </div>

      {controlsOpen && (
        <nav className="quick-menu no-drag" aria-label="桌宠控制">
          <button className={mode === "idle" ? "active" : ""} onClick={() => switchMode("idle")}>待机</button>
          <button className={mode === "focus" ? "active" : ""} onClick={() => switchMode("focus")}>专注</button>
          <button className={mode === "rest" ? "active" : ""} onClick={() => switchMode("rest")}>休息</button>
          <button onClick={() => openPanel("chat")}>聊天</button>
          <button onClick={() => openPanel("settings")}>设置</button>
          <button onClick={() => window.petAPI.hide()}>隐藏</button>
        </nav>
      )}

      <button
        className={`menu-toggle no-drag ${controlsOpen ? "active" : ""}`}
        onClick={() => setControlsOpen((current) => !current)}
        aria-label="打开桌宠菜单"
        title="桌宠菜单"
      >
        •••
      </button>
    </main>
  );
}
