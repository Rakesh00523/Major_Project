import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = { low: '#10b981', medium: '#f59e0b', high: '#dc2626' }

export default function FailurePredictionChart({ prediction }) {
  const data = [
    { name: 'Low', key: 'low', value: prediction.low },
    { name: 'Medium', key: 'medium', value: prediction.medium },
    { name: 'High', key: 'high', value: prediction.high },
  ]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.key} fill={COLORS[entry.key]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${value}%`} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
