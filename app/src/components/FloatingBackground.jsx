// Purely decorative ambient depth — blurred gradient orbs. aria-hidden and
// pointer-events-none so it never interferes with content or a11y tree.
export default function FloatingBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="orb-drift-a absolute -top-32 -left-24 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="orb-drift-b absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-violet-500/20 blur-3xl" />
      <div className="orb-drift-a absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
    </div>
  )
}
