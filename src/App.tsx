import { useCallback, useEffect, useRef, useState } from "react";
import { analyzeFace, getGeminiErrorMessage } from "./lib/gemini";
import { FEATURE_LABELS, featureTone, pslTone } from "./lib/scoreColors";
import type { PSLResult } from "./types/psl";
import { LoadingSpinner } from "./components/LoadingSpinner";

function dataUrlToParts(dataUrl: string): { mimeType: string; base64: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  return { mimeType: m[1], base64: m[2] };
}

export default function App() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PSLResult | null>(null);
  const [camOn, setCamOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setCamOn(true);
    } catch {
      setError("Could not access the camera. Check permissions or try uploading an image.");
    }
  };

  useEffect(() => {
    if (!camOn) return;
    const v = videoRef.current;
    const stream = streamRef.current;
    if (v && stream) {
      v.srcObject = stream;
      void v.play().catch(() => {
        setError("Could not play the camera preview.");
      });
    }
  }, [camOn]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setImageDataUrl(dataUrl);
    setResult(null);
    stopCamera();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      if (typeof url === "string") {
        setImageDataUrl(url);
        setResult(null);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const runAnalysis = async () => {
    if (!imageDataUrl) {
      setError("Add a photo first (upload or camera).");
      return;
    }
    const parts = dataUrlToParts(imageDataUrl);
    if (!parts) {
      setError("Invalid image data.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const outcome = await analyzeFace(parts.mimeType, parts.base64);
      if (!outcome.ok) {
        setError(
          outcome.message?.trim()
            ? `No face detected: ${outcome.message}`
            : "No clear human face was detected in this image. Use a well-lit, front-facing photo."
        );
        return;
      }
      setResult(outcome.data);
    } catch (err) {
      setError(getGeminiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const featureEntries = result
    ? (Object.entries(result.feature_ratings) as [keyof PSLResult["feature_ratings"], number][])
    : [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-10 border-b border-zinc-800 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">pslpro</h1>
          <p className="mt-1 text-sm text-zinc-500">PSL facial analysis — diagnostic report</p>
        </header>

        <section className="mb-8 space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 sm:p-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Image</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800"
            >
              Upload image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
            {!camOn ? (
              <button
                type="button"
                onClick={startCamera}
                className="rounded border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800"
              >
                Use camera
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="rounded border border-emerald-600/50 bg-emerald-950/40 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-950/60"
                >
                  Capture
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="rounded border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-500"
                >
                  Cancel camera
                </button>
              </>
            )}
            {imageDataUrl && (
              <button
                type="button"
                onClick={() => {
                  setImageDataUrl(null);
                  setResult(null);
                  setError(null);
                }}
                className="rounded border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
              >
                Clear image
              </button>
            )}
          </div>

          {camOn && (
            <div className="overflow-hidden rounded border border-zinc-800 bg-black">
              <video ref={videoRef} className="max-h-80 w-full object-contain" playsInline muted />
            </div>
          )}

          {imageDataUrl && !camOn && (
            <div className="overflow-hidden rounded border border-zinc-800 bg-black">
              <img src={imageDataUrl} alt="Selected for analysis" className="max-h-80 w-full object-contain" />
            </div>
          )}

          <button
            type="button"
            onClick={runAnalysis}
            disabled={loading}
            className="w-full rounded border border-zinc-500 bg-zinc-800 py-3 text-sm font-medium text-zinc-100 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
          >
            Run analysis
          </button>
        </section>

        {error && (
          <div
            className="mb-8 rounded border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}

        {loading && <LoadingSpinner />}

        {result && !loading && (
          <div className="space-y-8 border-t border-zinc-800 pt-10">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">PSL score</p>
              <p className={`mt-2 text-6xl font-semibold tabular-nums sm:text-7xl ${pslTone(result.psl_score)}`}>
                {result.psl_score.toFixed(1)}
              </p>
              <p className="mt-2 text-lg text-zinc-300">{result.tier_label}</p>
              <p className="mt-1 text-sm text-zinc-500">{result.percentile}</p>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Feature breakdown</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {featureEntries.map(([key, score]) => (
                  <div
                    key={key}
                    className={`rounded border px-4 py-3 ${featureTone(score)}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-zinc-300">{FEATURE_LABELS[key] ?? key}</span>
                      <span className="text-lg font-semibold tabular-nums">
                        {typeof score === "number" ? score.toFixed(1) : score}
                        <span className="text-xs font-normal text-zinc-500"> /10</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Written analysis</h3>
              <div className="rounded border border-zinc-800 bg-zinc-950/40 p-4 text-sm leading-relaxed text-zinc-300">
                {result.written_analysis}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Strengths</h3>
                <ul className="list-inside list-disc space-y-1.5 text-sm text-zinc-300">
                  {result.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Weaknesses</h3>
                <ul className="list-inside list-disc space-y-1.5 text-sm text-zinc-300">
                  {result.weaknesses.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Looksmaxxing tips</h3>
              <ol className="list-inside list-decimal space-y-2 text-sm text-zinc-300">
                {result.looksmaxxing_tips.map((s, i) => (
                  <li key={i} className="pl-1">
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
