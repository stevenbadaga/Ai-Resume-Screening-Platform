export default function Loading() {
  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        {/* Holographic glowing orb background */}
        <div className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-600/30 via-violet-600/20 to-emerald-500/20 blur-2xl animate-pulse"></div>

        {/* Outer orbital rotating gradient ring */}
        <div className="w-16 h-16 rounded-full border-2 border-transparent border-t-indigo-500 border-r-violet-500 animate-spin duration-700"></div>

        {/* Inner reverse rotating ring */}
        <div className="absolute w-10 h-10 rounded-full border-2 border-transparent border-b-emerald-400 border-l-indigo-400 animate-spin duration-1000 [animation-direction:reverse]"></div>

        {/* Center glowing core emblem */}
        <div className="absolute w-4 h-4 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/50 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>
        </div>
      </div>

      {/* Typography & Status Indicator */}
      <div className="mt-6 text-center space-y-1.5">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold dark:text-white text-slate-800 tracking-tight">
          <span>RecruitAI</span>
          <span className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded dark:bg-indigo-950/80 bg-indigo-50 border dark:border-indigo-800/80 border-indigo-200">
            SYSTEM
          </span>
        </div>
        <p className="text-[11px] font-mono dark:text-slate-400 text-slate-500 animate-pulse">
          Synchronizing explainable telemetry & pipeline models...
        </p>
      </div>
    </div>
  );
}