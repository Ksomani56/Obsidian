'use client'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#2962FF', '#089981', '#F59E0B', '#F23645', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

export default function AllocationPie({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(d: any) => `${d.name} ${(d.percent * 100).toFixed(0)}%`}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Value']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}


