// app/page.tsx
export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-xl text-center">
        {/* Logo / Title */}
        <h1 className="text-sm tracking-[0.35em] text-red-500 mb-3">
          GRAVIX
        </h1>

        <h2 className="text-3xl md:text-4xl font-semibold mb-4">
          We&apos;re upgrading your{" "}
          <span className="text-red-500">live events</span> experience
        </h2>

        <p className="text-sm md:text-base text-zinc-300 mb-8">
          The platform is currently undergoing a quick update.
          We&apos;ll be back online very soon with a faster, smoother
          booking flow and new exclusive events.
        </p>

        {/* Status pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-600/70 bg-red-600/10">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs uppercase tracking-[0.22em] text-red-400">
            Updating · Back very soon
          </span>
        </div>

        {/* Footer mini text */}
        <div className="mt-10 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          Egypt&apos;s #1 live events platform
        </div>
      </div>
    </main>
  );
}
