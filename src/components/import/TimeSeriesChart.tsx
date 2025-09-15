'use client'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { PortfolioPoint } from '@/lib/portfolio/types';

export default function TimeSeriesChart({ data }: { data: PortfolioPoint[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
          <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
          <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }}/>
          <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


