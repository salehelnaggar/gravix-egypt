// app/page.tsx
export default function Page() {
  return (
    <main className="min-h-screen bg-[#05040A] text-zinc-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Top label */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/40 bg-red-500/5 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-[11px] tracking-[0.22em] uppercase text-red-400">
            GRAVIX SYSTEM UPDATE
          </span>
        </div>

        {/* Main heading */}
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4">
          We&apos;re tuning the{" "}
          <span className="text-red-500">nightlife</span> experience
        </h1>

        {/* Sub text */}
        <p className="text-sm md:text-base text-zinc-400 mb-6">
          gravixegypt.online is currently under a fast upgrade.
          We&apos;ll be back online shortly with smoother booking,
          better performance, and new exclusive events.
        </p>

        {/* Arabic line */}
        <p className="text-xs md:text-sm text-zinc-500 mb-10">
          الموقع بيتحدّث دلوقتي وهيرجع أونلاين خلال وقت قصير جداً بتجربة حجز أهدى وأقوى.
        </p>

        {/* Bottom bar */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          <span className="text-[11px] uppercase tracking-[0.25em] text-zinc-600">
            EGYPT · LIVE EVENTS · TECHNO
          </span>
        </div>
      </div>
    </main>
  );
}
