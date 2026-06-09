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

export function normalizeTranslationText(value) {
  if (typeof value !== "string") return null;
  let text = value.trim();
  if (!text) return null;

  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) text = fenced[1].trim();

  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      const candidates = Array.isArray(parsed)
        ? parsed
        : [
            parsed.chineseDescription,
            parsed.zhDescription,
            parsed.description,
            parsed.translation,
            parsed.translatedText,
            parsed.text,
          ];
      text = candidates.find((item) => typeof item === "string")?.trim() ?? "";
    } catch {
      return null;
    }
  }

  if (!text || !/[\u3400-\u9fff]/u.test(text)) return null;
  return text;
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
    "Translate Codex plugin descriptions into one concise Simplified Chinese paragraph for Chinese developers. Keep plugin names and technical terms in English. Do not add claims not present in the source. Return only the translated paragraph as plain text. Do not return JSON, Markdown, labels, field names, or the input prompt.";
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
  return normalizeTranslationText(text);
}
