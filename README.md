# Codex Desktop Pet

一个以 Q 版角色为核心的桌面 Codex 助手原型。当前版本优先完成桌宠外壳和本地交互：透明窗口、桌面置顶、拖动与位置记忆、气泡、状态切换、聊天面板占位、设置面板、系统托盘和开机自启开关。

> 当前 V0.1 尚未连接真实 Codex / OpenAI 服务。接口层先保持隔离，避免在仓库中存放任何 API Key。

## V0.1 功能

- 透明、无边框 Electron 桌面窗口
- 桌宠始终置顶，可在设置中切换
- 拖动窗口并自动记忆上次位置
- 显示器布局变化后自动修正到可见区域
- 点击角色显示随机气泡
- 待机 / 专注 / 休息三种状态
- 简单聊天面板（当前为本地占位响应）
- 设置面板：始终置顶、开机自启
- 系统托盘：显示 / 隐藏 / 退出
- Q 版角色资源：`public/assets/pet.png`

## 技术栈

- Electron
- React
- TypeScript
- Vite

## 环境

建议使用 Node.js 20+ 与 npm 10+。第一目标平台为 Windows 10 / 11。

## 运行

```bash
npm install
npm run dev
```

Vite 启动后 Electron 会自动打开透明桌宠窗口。

## 构建前端

```bash
npm run build
```

当前仓库先以开发运行和功能验证为主，Windows 安装包会在后续阶段补充。

## 项目结构

```text
codex-desktop-pet/
├─ electron/
│  ├─ main.cjs
│  └─ preload.cjs
├─ public/assets/pet.png
├─ src/
│  ├─ lib/assistant.ts
│  ├─ App.tsx
│  ├─ App.css
│  ├─ global.d.ts
│  └─ main.tsx
├─ docs/ROADMAP.md
├─ AGENTS.md
├─ package.json
└─ vite.config.ts
```

## Codex 接入原则

1. 不把 API Key 写入 Renderer、Git 历史或 `localStorage`。
2. 网络调用放在 Electron 主进程或独立本地服务。
3. Renderer 只通过最小化、白名单化的 IPC API 调用模型能力。
4. shell、文件写入、Git 等高权限动作必须建立权限边界和明确确认。
5. 桌宠 UI 与 Agent / Provider 层解耦，以便后续替换模型。

## 后续方向

当前实施顺序见 [`docs/ROADMAP.md`](docs/ROADMAP.md)。下一阶段主要是 Codex Provider、安全凭据、流式对话、项目上下文以及桌宠动画。

## License

代码使用仓库中的 MIT License。角色图像属于独立项目素材；如需对外再分发或商用，请由仓库维护者单独确认相应权利。
