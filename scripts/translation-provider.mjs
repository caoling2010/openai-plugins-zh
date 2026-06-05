import { PROTECTED_TERMS } from "./plugin-data.mjs";

export function selectTranslationProvider(env = process.env) {
  if (env.DEEPSEEK_API_KEY) {
    return {
      id: "deepseek",
      endpoint: "https://api.deepseek.com/chat/completions",
      model: env.DEEPSEEK_TRANSLATION_MODEL ?? "deepseek-chat",
      apiKey: env.DEEPSEEK_API_KEY,
    };
  }

  if (env.OPENAI_API_KEY) {
    return {
      id: "openai",
      endpoint: "https://api.openai.com/v1/responses",
      model: env.OPENAI_TRANSLATION_MODEL ?? "gpt-5-mini",
      apiKey: env.OPENAI_API_KEY,
    };
  }

  return null;
}

function buildTranslationPrompt(manifest, englishDescription) {
  const iface = manifest.interface ?? {};
  return JSON.stringify(
    {
      pluginName: iface.displayName ?? manifest.name,
      category: iface.category ?? "",
      protectedTerms: PROTECTED_TERMS,
      englishDescription,
    },
    null,
    2,
  );
}

function getOpenAIText(json) {
  return (
    json.output_text ??
    json.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n")
  );
}

function getChatCompletionText(json) {
  return json.choices?.[0]?.message?.content;
}

export async function translateWithProvider({
  manifest,
  englishDescription,
  env = process.env,
  fetchImpl = fetch,
}) {
  const provider = selectTranslationProvider(env);
  if (!provider) return null;

  const systemPrompt =
    "Translate Codex plugin descriptions into concise Simplified Chinese for Chinese developers. Keep plugin names and technical terms in English. Do not add claims not present in the source.";
  const userPrompt = buildTranslationPrompt(manifest, englishDescription);
  const response = await fetchImpl(provider.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body:
      provider.id === "deepseek"
        ? JSON.stringify({
            model: provider.model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            stream: false,
          })
        : JSON.stringify({
            model: provider.model,
            input: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
  });

  if (!response.ok) {
    throw new Error(`${provider.id} translation failed: ${response.status}`);
  }

  const json = await response.json();
  const text =
    provider.id === "deepseek" ? getChatCompletionText(json) : getOpenAIText(json);
  return text?.trim() || null;
}
