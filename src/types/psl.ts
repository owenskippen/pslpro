export interface PSLResult {
  psl_score: number;
  percentile: string;
  tier_label: string;
  feature_ratings: {
    jawline: number;
    cheekbones: number;
    canthal_tilt: number;
    eye_area: number;
    nose: number;
    chin: number;
    symmetry: number;
    facial_thirds: number;
    skin_quality: number;
  };
  written_analysis: string;
  strengths: string[];
  weaknesses: string[];
  looksmaxxing_tips: string[];
}

export type NoFaceError = {
  error: "no_face_detected";
  message?: string;
};

export const SYSTEM_PROMPT = `You are a brutally honest PSL face analyst. You rate faces using the PSL scale which works as follows:
0 PSL: Bottom 0.01% of people. Reserved for severe deformities.
1 PSL: Bottom 0.5% of people. Very unfortunate looks, bad facial harmony, unattractive features.
2 PSL: Bottom 10% of people. Conventionally unattractive with poor facial structure.
3 PSL: Bottom 30% of people. Below average due to poor features, asymmetry, or high body fat.
4 PSL: 50th percentile. Dead average. No major flaws but nothing special either.
4.5 PSL: Slightly above average with at least one notable attractive trait.
5 PSL: Top 5% of people. Universally attractive, considered Chad or Stacy tier in real life.
5.5 PSL: Chadlite tier. Most attractive person in an average crowd or high school.
6 PSL: Top 0.1% of people. True Chad or Stacy. 1 in 1000 people.
6.5 PSL: Gigachad range. Most attractive people you will ever see in person.
7 PSL: Top 0.001% of people. Supermodel or Hollywood actor tier. Only a few thousand globally.
7.5 PSL: 1 in a few billion. The peak of human facial aesthetics.
8 PSL: Theoretical perfection. Does not exist in reality.
Rate this face with no sugarcoating. Be direct and harsh. Assess each feature individually: jawline, cheekbones, canthal tilt, eye area, nose, chin, symmetry, facial thirds, and skin quality. Each feature rated 1 to 10. Give a written analysis identifying every flaw clearly. List specific strengths and weaknesses. Provide actionable looksmaxxing tips based on the weaknesses.

If no clear human face is visible in the image, return ONLY this JSON shape with no other text: {"error":"no_face_detected","message":"brief reason"}

Otherwise return only a valid JSON object matching this structure with no extra text or markdown: { "psl_score", "percentile", "tier_label", "feature_ratings": { "jawline", "cheekbones", "canthal_tilt", "eye_area", "nose", "chin", "symmetry", "facial_thirds", "skin_quality" }, "written_analysis", "strengths", "weaknesses", "looksmaxxing_tips" }`;

function stripCodeFences(text: string): string {
  let t = text.trim();
  const fence = /^```(?:json)?\s*/i;
  if (fence.test(t)) {
    t = t.replace(fence, "");
    t = t.replace(/\s*```\s*$/i, "");
  }
  return t.trim();
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNoFaceError(obj: Record<string, unknown>): obj is NoFaceError {
  return obj.error === "no_face_detected";
}

function coerceStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === "string" ? x : String(x)));
}

export function parseGeminiJson(raw: string): PSLResult | NoFaceError {
  const cleaned = stripCodeFences(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Model returned invalid JSON. Try again.");
  }
  if (!isRecord(parsed)) {
    throw new Error("Unexpected response format.");
  }
  if (isNoFaceError(parsed)) {
    return {
      error: "no_face_detected",
      message: typeof parsed.message === "string" ? parsed.message : undefined,
    };
  }
  const fr = parsed.feature_ratings;
  if (!isRecord(fr)) {
    throw new Error("Missing feature_ratings in response.");
  }
  const nums = [
    "jawline",
    "cheekbones",
    "canthal_tilt",
    "eye_area",
    "nose",
    "chin",
    "symmetry",
    "facial_thirds",
    "skin_quality",
  ] as const;
  const feature_ratings = {} as PSLResult["feature_ratings"];
  for (const key of nums) {
    const n = fr[key];
    if (typeof n !== "number" || Number.isNaN(n)) {
      throw new Error(`Invalid or missing feature rating: ${key}`);
    }
    feature_ratings[key] = n;
  }
  const psl_score = parsed.psl_score;
  if (typeof psl_score !== "number" || Number.isNaN(psl_score)) {
    throw new Error("Invalid or missing psl_score.");
  }
  const percentile = parsed.percentile;
  const tier_label = parsed.tier_label;
  const written_analysis = parsed.written_analysis;
  if (typeof percentile !== "string" || typeof tier_label !== "string" || typeof written_analysis !== "string") {
    throw new Error("Missing text fields in response.");
  }
  const strengths = coerceStringArray(parsed.strengths);
  const weaknesses = coerceStringArray(parsed.weaknesses);
  const looksmaxxing_tips = coerceStringArray(parsed.looksmaxxing_tips);
  return {
    psl_score,
    percentile,
    tier_label,
    feature_ratings,
    written_analysis,
    strengths,
    weaknesses,
    looksmaxxing_tips,
  };
}
