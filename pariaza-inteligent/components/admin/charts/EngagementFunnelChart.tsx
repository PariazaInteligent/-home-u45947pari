import React from 'react';
import { ResponsiveContainer, FunnelChart, Funnel, LabelList, Tooltip, Cell } from 'recharts';

interface EngagementFunnelProps {
    totalSent: number;
    openRate: number;
    clickRate: number;
}

export const EngagementFunnelChart: React.FC<EngagementFunnelProps> = ({ totalSent, openRate, clickRate }) => {

    // Calculate raw numbers (approximated from rates)
    const opened = Math.round(totalSent * (openRate / 100));
    const clicked = Math.round(totalSent * (clickRate / 100));

    const data = [
        {
            value: totalSent,
            name: 'Trimise',
            fill: '#8884d8',
            rate: 100
        },
        {
            value: opened,
            name: 'Deschise',
            fill: '#83a6ed',
            rate: openRate
        },
        {
            value: clicked,
            name: 'Click-uri',
            fill: '#8dd1e1',
            rate: clickRate
        }
    ];

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                    <Tooltip
                        formatter={(value: number, name: string, props: any) => {
                            const rate = props.payload.rate;
                            return [`${value} (${rate}%)`, name];
                        }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Funnel
                        dataKey="value"
                        data={data}
                        isAnimationActive
                    >
                        <LabelList position="right" fill="#666" stroke="none" dataKey="name" />
                        <Cell fill="#6366f1" /> {/* Sent - Indigo */}
                        <Cell fill="#94a3b8" /> {/* Opened - Slate (Uncertain) */}
                        <Cell fill="#3b82f6" /> {/* Clicked - Blue (Goal) */}
                    </Funnel>
                </FunnelChart>
            </ResponsiveContainer>
        </div>
    );
};
