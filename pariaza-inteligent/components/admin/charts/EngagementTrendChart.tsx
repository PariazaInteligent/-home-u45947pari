import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EngagementTrendChartProps {
    data: any[];
}

export const EngagementTrendChart: React.FC<EngagementTrendChartProps> = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        tick={{ fontSize: 12, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                        unit="%"
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            padding: '12px'
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="avgClickRate"
                        name="Click Rate"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="avgOpenRate"
                        name="Open Rate (Diff)"
                        stroke="#94A3B8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{ r: 4 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
