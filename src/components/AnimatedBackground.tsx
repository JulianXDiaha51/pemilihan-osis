export default function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-indigo-400/30 dark:bg-indigo-500/20 blur-3xl animate-blob" />
      <div className="absolute top-1/3 -right-40 w-[32rem] h-[32rem] rounded-full bg-purple-400/25 dark:bg-purple-500/20 blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-40 left-1/4 w-[30rem] h-[30rem] rounded-full bg-sky-400/25 dark:bg-sky-500/20 blur-3xl animate-blob animation-delay-4000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[24rem] h-[24rem] rounded-full bg-fuchsia-300/20 dark:bg-fuchsia-500/10 blur-3xl animate-blob animation-delay-6000" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)] dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)]" />

      <div className="absolute inset-0 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.6),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.4),transparent_45%)] dark:[background:radial-gradient(circle_at_20%_20%,rgba(30,41,59,0.6),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(15,23,42,0.6),transparent_45%)]" />
    </div>
  );
}
