import test from "node:test";
import assert from "node:assert/strict";

import {
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
