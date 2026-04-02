import { parseGeminiJson, type PSLResult } from "../types/psl";

export type AnalyzeOutcome = { ok: true; data: PSLResult } | { ok: false; kind: "no_face"; message?: string };

const API_BASE = "";

export async function analyzeFace(
  mimeType: string,
  base64Data: string
): Promise<AnalyzeOutcome> {
  console.log("[v0] Calling /api/analyze with mimeType:", mimeType, "base64 length:", base64Data.length);
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mimeType,
      base64Data,
    }),
  });

  console.log("[v0] Response status:", response.status, response.statusText);
  
  if (!response.ok) {
    const text = await response.text();
    console.log("[v0] Error response body:", text);
    throw new Error(`API error: ${response.statusText}`);
  }

  const result = await response.json();
  console.log("[v0] Result:", result);
  return result;
}

export function getGeminiErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
