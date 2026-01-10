import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Trophy, Zap, Lightbulb, AlertTriangle, BarChart2, PieChart, Filter, Target } from 'lucide-react';
import { EngagementTrendChart } from './charts/EngagementTrendChart';
import { EngagementFunnelChart } from './charts/EngagementFunnelChart';

interface AnalyticsOverview {
    totalSent: number;
    avgOpenRate: number;
    avgClickRate: number;
    engagementTrend: number;
    topPerformingTemplate: string;
}

interface TemplatePerformance {
    templateId: string;
    name: string;
    emoji: string;
    totalSent: number;
    openRate: number;
    clickRate: number;
    engagementScore: number;
    bestSendHour: number | null;
    rank: number;
}

interface SmartRecommendation {
    type: 'action' | 'insight' | 'warning' | 'tip';
    icon: string;
    title: string;
    message: string;
    priority: number;
}

export const BroadcastAnalyticsWidget: React.FC = () => {
    const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
    const [topTemplates, setTopTemplates] = useState<TemplatePerformance[]>([]);
    const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
    const [historyData, setHistoryData] = useState<any[]>([]);

    const [viewMode, setViewMode] = useState<'overview' | 'charts'>('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [animatedCount, setAnimatedCount] = useState(0);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    // Animated counter effect
    useEffect(() => {
        if (overview && animatedCount < overview.totalSent) {
            const timer = setTimeout(() => {
                setAnimatedCount(prev => Math.min(prev + Math.ceil(overview.totalSent / 20), overview.totalSent));
            }, 30);
            return () => clearTimeout(timer);
        }
    }, [animatedCount, overview]);

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem('accessToken') ||
                localStorage.getItem('token') ||
                localStorage.getItem('auth_token');

            const headers = { 'Authorization': `Bearer ${token}` };

            const [overviewRes, templatesRes, recommendationsRes, historyRes] = await Promise.all([
                fetch('http://localhost:3001/admin/broadcast/analytics/overview', { headers }),
                fetch('http://localhost:3001/admin/broadcast/analytics/top-templates', { headers }),
                fetch('http://localhost:3001/admin/broadcast/analytics/recommendations', { headers }),
                fetch('http://localhost:3001/admin/broadcast/analytics/history?days=30', { headers }),
            ]);

            if (overviewRes.ok) {
                const data = await overviewRes.json();
                setOverview(data.data);
            }

            if (templatesRes.ok) {
                const data = await templatesRes.json();
                setTopTemplates(data.data);
            }

            if (recommendationsRes.ok) {
                const data = await recommendationsRes.json();
                setRecommendations(data.data);
            }

            if (historyRes.ok) {
                const data = await historyRes.json();
                setHistoryData(data.data);
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            setIsLoading(false);
        }
    };

    const getMedalIcon = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const getRecommendationStyle = (type: string) => {
        switch (type) {
            case 'action': return 'from-green-100 to-emerald-100 border-green-300';
            case 'insight': return 'from-blue-100 to-cyan-100 border-blue-300';
            case 'warning': return 'from-orange-100 to-yellow-100 border-orange-300';
            case 'tip': return 'from-purple-100 to-pink-100 border-purple-300';
            default: return 'from-gray-100 to-slate-100 border-gray-300';
        }
    };

    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl p-8 text-center border-4 border-purple-300">
                <div className="text-5xl mb-3 animate-bounce">📊</div>
                <p className="text-lg font-black text-purple-700">Loading Analytics Magic...</p>
            </div>
        );
    }

    if (!overview) return null;

    return (
        <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 rounded-3xl p-8 mb-8 border-4 border-purple-300 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="text-5xl">📊</div>
                    <div>
                        <h2 className="text-3xl font-black text-purple-800">Analytics & Insights</h2>
                        <p className="text-sm font-bold text-purple-600">Performanță în timp real</p>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex bg-white rounded-2xl p-1 border-2 border-purple-200 shadow-sm">
                    <button
                        onClick={() => setViewMode('overview')}
                        className={`px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${viewMode === 'overview'
                            ? 'bg-purple-100 text-purple-700 shadow-inner'
                            : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                            }`}
                    >
                        <PieChart className="w-4 h-4" />
                        General
                    </button>
                    <button
                        onClick={() => setViewMode('charts')}
                        className={`px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${viewMode === 'charts'
                            ? 'bg-purple-100 text-purple-700 shadow-inner'
                            : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                            }`}
                    >
                        <BarChart2 className="w-4 h-4" />
                        Grafice de Conversie
                    </button>
                </div>
            </div>

            {viewMode === 'overview' ? (
                <>
                    {/* Performance Overview Items */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Total Sent - Animated Counter */}
                        <div className="bg-white rounded-2xl p-6 border-3 border-purple-200 shadow-lg hover:scale-105 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-2xl">📬</div>
                                <div className={`flex items-center gap-1 text-sm font-black ${overview.engagementTrend > 0 ? 'text-green-600' : overview.engagementTrend < 0 ? 'text-red-600' : 'text-gray-400'
                                    }`}>
                                    {overview.engagementTrend > 0 ? <TrendingUp className="w-4 h-4" /> :
                                        overview.engagementTrend < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                                    {overview.engagementTrend !== 0 && `${Math.abs(overview.engagementTrend)}%`}
                                </div>
                            </div>
                            <div className="text-sm font-bold text-purple-700 mb-1">Broadcast-uri Trimise</div>
                            <div className="text-5xl font-black text-purple-600">{animatedCount}</div>
                        </div>

                        {/* Open Rate - ESTIMATED */}
                        <div className="bg-white rounded-2xl p-6 border-3 border-gray-200 shadow-lg opacity-75 hover:opacity-100 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-2xl opacity-60">👁️</div>
                                <div className="text-xs font-black text-gray-500 bg-gray-100 px-2 py-1 rounded-full">~ESTIMAT</div>
                            </div>
                            <div className="text-sm font-bold text-gray-600 mb-1">Open Rate Mediu</div>
                            <div className="text-4xl font-black text-gray-500">~{overview.avgOpenRate}%</div>
                            <div className="mt-3 text-xs font-medium text-gray-500 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Privacy protections limitează acuratețea</span>
                            </div>
                        </div>

                        {/* Click Rate - PRIMARY METRIC */}
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-4 border-blue-400 shadow-xl hover:scale-105 transition-all relative">
                            <div className="absolute -top-3 -right-3 bg-blue-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                                ✓ RELIABLE
                            </div>
                            <div className="text-3xl mb-2 animate-pulse">🎯</div>
                            <div className="text-sm font-bold text-blue-700 mb-1">Click Rate Mediu</div>
                            <div className="text-5xl font-black text-blue-600">{overview.avgClickRate}%</div>
                            <div className="mt-2 h-3 bg-blue-100 rounded-full overflow-hidden" aria-label={`Click rate progress: ${overview.avgClickRate}%`}>
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000 shadow-inner"
                                    style={{ width: `${Math.min(overview.avgClickRate, 100)}%` }}
                                />
                            </div>
                            <div className="mt-2 text-xs font-bold text-blue-600">📊 Metric Principal</div>
                        </div>
                    </div>

                    {/* Top Templates */}
                    {topTemplates.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 mb-6 border-3 border-yellow-200 shadow-lg">
                            <div className="flex items-center gap-2 mb-4">
                                <Trophy className="w-6 h-6 text-yellow-500" />
                                <h3 className="text-xl font-black text-gray-800">Top Performeri</h3>
                            </div>
                            <div className="space-y-3">
                                {topTemplates.slice(0, 3).map((template) => (
                                    <div
                                        key={template.templateId}
                                        className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200 hover:scale-102 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-3xl">{getMedalIcon(template.rank)}</div>
                                            <div className="text-2xl">{template.emoji}</div>
                                            <div>
                                                <div className="font-black text-gray-800">{template.name}</div>
                                                <div className="text-xs text-gray-600">
                                                    {template.totalSent} trimise | <span className="font-black text-blue-600">Click: {template.clickRate}%</span> | <span className="opacity-60">Open: ~{template.openRate}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-yellow-600">{template.engagementScore}</div>
                                            <div className="text-xs font-bold text-yellow-700">Score</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Smart Recommendations */}
                    {recommendations.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Zap className="w-6 h-6 text-purple-500 animate-pulse" />
                                <h3 className="text-xl font-black text-gray-800">Recomandări Inteligente</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recommendations.map((rec, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-2xl border-3 shadow-md hover:scale-105 transition-all bg-gradient-to-br ${getRecommendationStyle(rec.type)}`}
                                    >
                                        <div className="text-3xl mb-2">{rec.icon}</div>
                                        <div className="font-black text-gray-800 mb-1">{rec.title}</div>
                                        <div className="text-sm font-medium text-gray-700">{rec.message}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Charts Mode */
                <div className="space-y-8 animate-fade-in-up">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Engagement Trend Chart */}
                        <div className="bg-white rounded-2xl p-6 border-3 border-gray-100 shadow-lg">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-gray-800">Evoluție Engagement</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ultimele 30 Zile</p>
                                </div>
                                <div className="p-2 bg-blue-50 rounded-xl">
                                    <TrendingUp className="w-6 h-6 text-blue-500" />
                                </div>
                            </div>
                            {historyData.length > 0 ? (
                                <EngagementTrendChart data={historyData} />
                            ) : (
                                <div className="h-64 flex items-center justify-center text-gray-400 font-bold bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                    Nu există date suficiente
                                </div>
                            )}
                        </div>

                        {/* Engagement Funnel Chart (Replaces Global Comparison) */}
                        <div className="bg-white rounded-2xl p-6 border-3 border-gray-100 shadow-lg">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-gray-800">Pâlnie de Conversie</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sent ➡️ Opened ➡️ Clicked</p>
                                </div>
                                <div className="p-2 bg-indigo-50 rounded-xl">
                                    <Filter className="w-6 h-6 text-indigo-500" />
                                </div>
                            </div>

                            <EngagementFunnelChart
                                totalSent={overview.totalSent}
                                openRate={overview.avgOpenRate}
                                clickRate={overview.avgClickRate}
                            />

                            <div className="mt-4 p-4 bg-indigo-50 rounded-xl border-2 border-indigo-100 text-sm font-medium text-indigo-800 flex items-start gap-2">
                                <Target className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                                <p>
                                    Cu un Click Rate de <span className="font-black">{overview.avgClickRate}%</span>, conținutul tău convinge!
                                    Concentrează-te pe subiecte clare pentru a crește deschiderile.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State for Recommendations (Shown in both modes logic could be adjusted if needed) */}
            {viewMode === 'overview' && recommendations.length === 0 && (
                <div className="text-center py-8">
                    <div className="text-5xl mb-3">💡</div>
                    <p className="text-lg font-bold text-purple-600">Trimite mai multe broadcast-uri pentru insights!</p>
                </div>
            )}
        </div>
    );
};
