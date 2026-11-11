export default function Loading() {
  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-300">
      <div className="relative flex h-8 w-8 items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-[var(--accent)] animate-spin dark:border-slate-700"></div>
        <div className="absolute h-2 w-2 rounded-full bg-[var(--accent)]"></div>
      </div>

      {/* Typography & Status Indicator */}
      <div className="mt-3 text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold dark:text-white text-slate-800 tracking-tight">
          <span>RecruitAI</span>
          <span className="text-[10px] font-mono text-[var(--accent)] font-bold px-1.5 py-0.5 rounded bg-[var(--accent-soft)] border border-[var(--accent-ring)]">
            SYSTEM
          </span>
        </div>
        <p className="text-[10px] font-mono dark:text-slate-400 text-slate-500">
          Loading workspace...
        </p>
      </div>
    </div>
  );
}