import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseGeminiJson, SYSTEM_PROMPT, type PSLResult } from "../types/psl";

export type AnalyzeOutcome = { ok: true; data: PSLResult } | { ok: false; kind: "no_face"; message?: string };

export async function analyzeFace(
  apiKey: string,
  mimeType: string,
  base64Data: string
): Promise<AnalyzeOutcome> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
  });
  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    },
    { text: "Analyze this image. Respond with JSON only as instructed." },
  ]);
  const text = result.response.text();
  const parsed = parseGeminiJson(text);
  if ("error" in parsed) {
    return { ok: false, kind: "no_face", message: parsed.message };
  }
  return { ok: true, data: parsed };
}

export function getGeminiErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
