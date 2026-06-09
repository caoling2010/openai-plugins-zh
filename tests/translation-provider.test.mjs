import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeTranslationText,
  selectTranslationProvider,
  translateWithProvider,
} from "../scripts/translation-provider.mjs";

const manifest = {
  name: "figma",
  interface: {
    displayName: "Figma",
    category: "Design",
  },
};

test("selects DeepSeek before OpenAI when both keys exist", () => {
  assert.deepEqual(
    selectTranslationProvider({
      DEEPSEEK_API_KEY: "deepseek-key",
      OPENAI_API_KEY: "openai-key",
    }),
    {
      id: "deepseek",
      endpoint: "https://api.deepseek.com/chat/completions",
      model: "deepseek-chat",
      apiKey: "deepseek-key",
    },
  );
});

test("falls back to OpenAI when only OPENAI_API_KEY exists", () => {
  assert.equal(
    selectTranslationProvider({ OPENAI_API_KEY: "openai-key" }).id,
    "openai",
  );
});

test("returns null when no translation provider key exists", () => {
  assert.equal(selectTranslationProvider({}), null);
});

test("translates through DeepSeek chat completions response", async () => {
  const requests = [];
  const text = await translateWithProvider({
    manifest,
    englishDescription: "Figma workflows for implementing designs in code.",
    env: { DEEPSEEK_API_KEY: "deepseek-key" },
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "用于把 Figma 设计实现成代码的工作流。",
              },
            },
          ],
        }),
      };
    },
  });

  assert.equal(text, "用于把 Figma 设计实现成代码的工作流。");
  assert.equal(
    requests[0].url,
    "https://api.deepseek.com/chat/completions",
  );
  assert.equal(
    JSON.parse(requests[0].init.body).model,
    "deepseek-chat",
  );
});

test("extracts Chinese descriptions from structured model responses", () => {
  assert.equal(
    normalizeTranslationText(`{
      "pluginName": "BrightHire",
      "description": "在 Codex 中使用 BrightHire 获取面试上下文。"
    }`),
    "在 Codex 中使用 BrightHire 获取面试上下文。",
  );
  assert.equal(
    normalizeTranslationText(`{
      "pluginName": "Catalyst by Zoho",
      "protectedTerms": ["MCP", "CLI"],
      "chineseDescription": "通过 MCP 管理 Catalyst 项目。"
    }`),
    "通过 MCP 管理 Catalyst 项目。",
  );
});

test("rejects echoed prompts without a Chinese translation", () => {
  assert.equal(
    normalizeTranslationText(`{
      "pluginName": "Example",
      "protectedTerms": ["MCP"],
      "englishDescription": "Example plugin"
    }`),
    null,
  );
});
