export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16" role="status" aria-live="polite">
      <div
        className="h-12 w-12 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200"
        aria-hidden
      />
      <p className="text-sm tracking-wide text-zinc-400">Analyzing...</p>
    </div>
  );
}
