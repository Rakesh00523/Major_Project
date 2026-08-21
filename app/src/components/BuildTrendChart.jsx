import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { shortSha } from '../lib/format'

export default function BuildTrendChart({ builds }) {
  const data = [...builds]
    .reverse()
    .map((b) => ({
      name: shortSha(b.commitSha),
      duration: b.durationSeconds,
      status: b.status,
    }))

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Build duration trend
        </h3>
        <span className="text-xs text-slate-400">Last {data.length} runs</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="durationFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" />
          <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }}
            formatter={(value) => [`${value}s`, 'Duration']}
          />
          <Area
            type="monotone"
            dataKey="duration"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#durationFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
