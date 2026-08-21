import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { ShieldCheck } from 'lucide-react'

const COLORS = {
  Critical: '#dc2626',
  High: '#ea580c',
  Medium: '#d97706',
  Low: '#94a3b8',
}

export default function SeverityBarChart({ trivy }) {
  const data = [
    { name: 'Critical', count: trivy.critical },
    { name: 'High', count: trivy.high },
    { name: 'Medium', count: trivy.medium },
    { name: 'Low', count: trivy.low },
  ]
  const total = data.reduce((sum, d) => sum + d.count, 0)

  if (total === 0) {
    return (
      <div className="flex h-[140px] flex-col items-center justify-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/5">
        <ShieldCheck size={28} className="text-emerald-500" />
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          No vulnerabilities found
        </p>
        <p className="text-xs text-slate-400">0 findings across all severities</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={64}
          tick={{ fontSize: 12 }}
          stroke="currentColor"
          className="text-slate-400"
        />
        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
