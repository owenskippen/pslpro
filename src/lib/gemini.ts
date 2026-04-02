import { type PSLResult } from "../types/psl";

export type AnalyzeOutcome = { ok: true; data: PSLResult } | { ok: false; kind: "no_face"; message?: string };

const API_BASE = import.meta.env.DEV ? "http://localhost:3000" : window.location.origin;

export async function analyzeFace(
  mimeType: string,
  base64Data: string
): Promise<AnalyzeOutcome> {
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

  if (!response.ok) {
    let errorMessage = `API error: ${response.status}`; 
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage += ` - ${errorData.error}`;
      } else if (errorData.message) {
        errorMessage += ` - ${errorData.message}`;
      }
    } catch {
      errorMessage += ` ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  return result;
}

export function getGeminiErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
