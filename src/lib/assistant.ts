export type AssistantReply = {
  text: string;
  source: "local-placeholder";
};

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function askAssistant(prompt: string): Promise<AssistantReply> {
  await delay(420);

  const normalized = prompt.trim().toLowerCase();

  if (normalized.includes("git")) {
    return {
      text: "我现在还是本地占位模式。下一阶段接入 Codex 后，我可以在获得授权后读取仓库状态、解释 diff，并辅助生成提交信息。",
      source: "local-placeholder",
    };
  }

  if (normalized.includes("报错") || normalized.includes("error")) {
    return {
      text: "把报错贴给我吧。当前版本会保留聊天交互外壳；真正的 Codex 分析能力会从独立 Provider 接入。",
      source: "local-placeholder",
    };
  }

  return {
    text: "收到。V0.1 先把桌宠交互跑通；下一阶段接入 Codex Provider 后，这里会变成真实的开发助手对话。",
    source: "local-placeholder",
  };
}
