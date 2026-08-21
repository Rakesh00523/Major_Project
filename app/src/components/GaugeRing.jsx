const SIZE = 96
const STROKE = 8
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const TONES = {
  good: '#10b981',
  warn: '#f59e0b',
  bad: '#ef4444',
}

function toneFor(seconds, warnAt, badAt) {
  if (badAt && seconds >= badAt) return TONES.bad
  if (warnAt && seconds >= warnAt) return TONES.warn
  return TONES.good
}

export default function GaugeRing({ label, seconds, tool, maxSeconds = 90, warnAt, badAt }) {
  const pct = Math.min(seconds / maxSeconds, 1)
  const offset = CIRCUMFERENCE * (1 - pct)
  const color = toneFor(seconds, warnAt, badAt)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="icon-glow relative" style={{ background: `${color}22`, borderRadius: '9999px' }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-data text-sm font-semibold text-slate-900 dark:text-white">
            {seconds}s
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</p>
        <p className="font-data text-[10px] text-slate-400">{tool}</p>
      </div>
    </div>
  )
}
