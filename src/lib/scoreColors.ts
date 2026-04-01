/** 1–10 feature scores */
export function featureTone(score: number): string {
  if (score < 4) return "text-red-400 border-red-500/35 bg-red-950/25";
  if (score < 7) return "text-amber-400 border-amber-500/35 bg-amber-950/25";
  return "text-emerald-400 border-emerald-500/35 bg-emerald-950/25";
}

/** PSL score ~0–8 */
export function pslTone(score: number): string {
  if (score < 4) return "text-red-400";
  if (score < 6) return "text-amber-400";
  return "text-emerald-400";
}

export const FEATURE_LABELS: Record<string, string> = {
  jawline: "Jawline",
  cheekbones: "Cheekbones",
  canthal_tilt: "Canthal tilt",
  eye_area: "Eye area",
  nose: "Nose",
  chin: "Chin",
  symmetry: "Symmetry",
  facial_thirds: "Facial thirds",
  skin_quality: "Skin quality",
};
