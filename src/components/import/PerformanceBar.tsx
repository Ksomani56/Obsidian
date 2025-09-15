'use client'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function PerformanceBar({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
          <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
          <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} formatter={(v: any) => [`${Number(v).toFixed(2)}%`, 'Return']} />
          <Bar dataKey="value" fill="#089981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


