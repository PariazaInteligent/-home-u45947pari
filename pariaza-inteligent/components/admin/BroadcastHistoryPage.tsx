'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { History, TrendingUp, Sparkles, Calendar, Filter, Search, X, Download } from 'lucide-react';
import { BroadcastDetailsModal } from './BroadcastDetailsModal';
import { BroadcastCardSkeleton, QuickStatSkeleton } from './BroadcastCardSkeleton';
import { DateRangePicker, type DateRangePreset } from './DateRangePicker';
import type { BroadcastHistoryItem } from '../../types/broadcast';

// Type imported from types/broadcast.ts

interface BroadcastHistoryPageProps { }

export const BroadcastHistoryPage: React.FC<BroadcastHistoryPageProps> = () => {
    const [broadcasts, setBroadcasts] = useState<BroadcastHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalBroadcasts, setTotalBroadcasts] = useState(0);
    const [selectedBroadcast, setSelectedBroadcast] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRangeStart, setDateRangeStart] = useState<Date | null>(null);
    const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(null);
    const [datePreset, setDatePreset] = useState<DateRangePreset>('all');

    useEffect(() => {
        fetchHistory();
    }, [page]);

    // Filter broadcasts based on search query and date range
    const filteredBroadcasts = useMemo(() => {
        let filtered = broadcasts;

        // Text search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(broadcast =>
                broadcast.subject.toLowerCase().includes(query) ||
                broadcast.templateId.toLowerCase().includes(query) ||
                broadcast.sentBy.toLowerCase().includes(query)
            );
        }

        // Date range filter
        if (dateRangeStart && dateRangeEnd) {
            filtered = filtered.filter(broadcast => {
                const sentDate = new Date(broadcast.sentAt);
                return sentDate >= dateRangeStart && sentDate <= dateRangeEnd;
            });
        }

        return filtered;
    }, [broadcasts, searchQuery, dateRangeStart, dateRangeEnd]);

    // Date range change handler
    const handleDateRangeChange = (start: Date | null, end: Date | null, preset: DateRangePreset) => {
        setDateRangeStart(start);
        setDateRangeEnd(end);
        setDatePreset(preset);
    };

    // Inject CSS animations (since no global CSS access)
    useEffect(() => {
        const styleId = 'broadcast-animations';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fade-in-up {
                    animation: fadeInUp 0.5s ease-out forwards;
                    opacity: 0;
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('access Token') ||
                localStorage.getItem('token') ||
                localStorage.getItem('auth_token');

            const response = await fetch(`http://localhost:3001/admin/broadcast/history?page=${page}&limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setBroadcasts(data.data);
                setTotalPages(data.pagination.totalPages);
                setTotalBroadcasts(data.pagination.totalBroadcasts || 0);
            }
        } catch (error) {
            console.error('Failed to fetch broadcast history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getTemplateEmoji = (templateId: string): string => {
        const emojiMap: Record<string, string> = {
            'welcome': '🎉',
            'streak_loss': '⚠️',
            'daily_checkin': '🔥',
            'weekly_recap': '📊',
            'opportunity': '🚀',
            'rewards': '🎁',
            'custom': '📬',
        };
        return emojiMap[templateId] || '📧';
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('ro-RO', options);
    };

    // CSV Export Handler
    const handleExportCSV = () => {
        const headers = [
            'ID',
            'Subject',
            'Template',
            'Sent At',
            'Sent By',
            'Recipients',
            'Opened',
            'Clicked',
            'Open Rate %',
            'Click Rate %',
            'Engagement Score'
        ];

        const rows = broadcasts.map(b => [
            b.id,
            `"${b.subject.replace(/"/g, '""')}"`, // Escape quotes
            b.templateId,
            new Date(b.sentAt).toLocaleString('ro-RO'),
            b.sentBy,
            b.recipientCount,
            b.openedCount,
            b.clickedCount,
            b.openRate,
            b.clickRate,
            b.engagementScore
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `broadcast-history-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-8">
                {/* Header Skeleton */}
                <div className="max-w-6xl mx-auto mb-8">
                    <div className="bg-white rounded-3xl p-8 shadow-2xl border-4 border-purple-300 animate-pulse">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-purple-200 rounded-2xl"></div>
                            <div className="flex-1 space-y-3">
                                <div className="h-10 bg-purple-200 rounded-full w-64"></div>
                                <div className="h-6 bg-purple-100 rounded-full w-96"></div>
                            </div>
                        </div>

                        {/* Quick Stats Skeletons */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                            <QuickStatSkeleton />
                            <QuickStatSkeleton />
                            <QuickStatSkeleton />
                        </div>
                    </div>
                </div>

                {/* Broadcast Cards Skeletons */}
                <div className="max-w-6xl mx-auto space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                        <BroadcastCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4 sm:p-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <div className="bg-white rounded-3xl p-4 sm:p-8 shadow-2xl border-4 border-purple-300">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                        <div className="text-5xl sm:text-6xl">📜</div>
                        <div className="flex-1">
                            <h1 className="text-3xl sm:text-4xl font-black text-purple-800">Broadcast History</h1>
                            <p className="text-base sm:text-lg font-bold text-purple-600">
                                Transparență completă - toate mesajele trimise 🎯
                            </p>
                        </div>
                        <div className="hidden sm:block ml-auto">
                            <Sparkles className="w-12 h-12 text-yellow-400 animate-pulse" />
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                        <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-4 border-3 border-blue-300">
                            <div className="text-3xl mb-1">📨</div>
                            <div className="text-sm font-bold text-blue-700">Total Broadcasts</div>
                            <div className="text-3xl font-black text-blue-600">{totalBroadcasts}</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-4 border-3 border-green-300">
                            <div className="text-3xl mb-1">👥</div>
                            <div className="text-sm font-bold text-green-700">Total Recipients</div>
                            <div className="text-3xl font-black text-green-600">
                                {broadcasts.reduce((sum, b) => sum + b.recipientCount, 0)}
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-4 border-3 border-yellow-300">
                            <div className="text-3xl mb-1">🎯</div>
                            <div className="text-sm font-bold text-yellow-700">Avg Click Rate</div>
                            <div className="text-3xl font-black text-yellow-600">
                                {broadcasts.length > 0
                                    ? Math.round(broadcasts.reduce((sum, b) => sum + b.clickRate, 0) / broadcasts.length)
                                    : 0}%
                            </div>
                        </div>
                    </div>

                    {/* Date Range Picker */}
                    <DateRangePicker onRangeChange={handleDateRangeChange} />

                    {/* Search and Export Section */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                        {/* Search Box */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="🔍 Search by subject, template, or sender..."
                                className="w-full pl-12 pr-12 py-4 text-lg font-bold
                                         border-4 border-purple-300 rounded-2xl
                                         focus:border-purple-500 focus:ring-4 focus:ring-purple-200
                                         bg-white shadow-lg transition-all outline-none
                                         placeholder:text-purple-400"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 
                                             text-purple-400 hover:text-purple-600 transition-colors"
                                    aria-label="Clear search"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Export CSV Button */}
                        <button
                            onClick={handleExportCSV}
                            disabled={broadcasts.length === 0}
                            className="flex items-center gap-2 px-6 py-4
                                     bg-gradient-to-r from-green-500 to-emerald-500
                                     text-white font-black rounded-2xl text-lg
                                     hover:scale-105 transition-transform shadow-lg
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     disabled:hover:scale-100"
                            title="Export to CSV"
                        >
                            <Download className="w-5 h-5" />
                            <span className="hidden sm:inline">Export CSV</span>
                        </button>
                    </div>

                    {/* Search Results Info */}
                    {searchQuery && (
                        <div className="mt-4 text-center">
                            <p className="text-sm font-bold text-purple-700">
                                {filteredBroadcasts.length === 0 ? (
                                    <>🔍 No results found for "{searchQuery}"</>
                                ) : (
                                    <>Found {filteredBroadcasts.length} broadcast{filteredBroadcasts.length !== 1 ? 's' : ''} matching "{searchQuery}"</>
                                )}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Broadcast Cards */}
            <div className="max-w-6xl mx-auto space-y-4">
                {filteredBroadcasts.map((broadcast, index) => (
                    <div
                        key={broadcast.id}
                        className="animate-fade-in-up bg-white rounded-2xl p-6 shadow-lg border-3 border-purple-200 hover:scale-102 hover:shadow-2xl transition-all cursor-pointer"
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={() => setSelectedBroadcast(broadcast.id)}
                    >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            {/* Template Emoji */}
                            <div className="text-4xl sm:text-5xl">{getTemplateEmoji(broadcast.templateId)}</div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                    <h3 className="text-lg sm:text-xl font-black text-gray-800">{broadcast.subject}</h3>
                                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full self-start">
                                        {broadcast.templateId}
                                    </span>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm text-gray-600 mb-3">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span className="font-bold">{formatDate(broadcast.sentAt)}</span>
                                    </div>
                                    <div>👤 {broadcast.sentBy}</div>
                                    <div>👥 {broadcast.recipientCount} recipients</div>
                                </div>

                                {/* Metrics - 2 columns mobile, 4 desktop */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                    <div className="bg-gray-100 rounded-xl px-3 py-2 flex items-center gap-2">
                                        <span className="text-xl sm:text-2xl opacity-60">👁️</span>
                                        <div>
                                            <div className="text-xs font-bold text-gray-600">Open ~{broadcast.openRate}%</div>
                                            <div className="text-xs text-gray-500">{broadcast.openedCount}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl px-3 py-2 flex items-center gap-2 border-2 border-blue-300">
                                        <span className="text-xl sm:text-2xl">🎯</span>
                                        <div>
                                            <div className="text-xs font-bold text-blue-700">Click {broadcast.clickRate}%</div>
                                            <div className="text-xs text-blue-600 font-bold">{broadcast.clickedCount} ✓</div>
                                        </div>
                                    </div>

                                    <div className="bg-yellow-50 rounded-xl px-3 py-2 flex items-center gap-2 border-2 border-yellow-300">
                                        <span className="text-xl sm:text-2xl">🏆</span>
                                        <div>
                                            <div className="text-xs font-bold text-yellow-700">Score</div>
                                            <div className="text-xs text-yellow-600 font-bold">{broadcast.engagementScore}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* View Button - Full width on mobile, auto on desktop */}
                            <div className="mt-4 sm:mt-0">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedBroadcast(broadcast.id);
                                    }}
                                    className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black 
                                             px-4 sm:px-6 py-3 rounded-full hover:scale-105 sm:hover:scale-110 transition-transform shadow-lg
                                             min-h-[44px] text-sm sm:text-base"
                                >
                                    Vezi Detalii →
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="max-w-6xl mx-auto mt-8 flex justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="bg-white border-3 border-purple-300 text-purple-700 font-black px-6 py-3 rounded-full disabled:opacity-50 hover:scale-105 transition-transform"
                    >
                        ← Prev
                    </button>
                    <div className="bg-purple-500 text-white font-black px-6 py-3 rounded-full">
                        Page {page} / {totalPages}
                    </div>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="bg-white border-3 border-purple-300 text-purple-700 font-black px-6 py-3 rounded-full disabled:opacity-50 hover:scale-105 transition-transform"
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredBroadcasts.length === 0 && (
                <div className="max-w-4xl mx-auto text-center py-20">
                    {searchQuery ? (
                        <>
                            <div className="text-8xl mb-6">🔍</div>
                            <h2 className="text-3xl font-black text-purple-700 mb-3">No matches found!</h2>
                            <p className="text-lg font-bold text-purple-600 mb-4">
                                No broadcasts match "{searchQuery}"
                            </p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black px-6 py-3 rounded-full hover:scale-105 transition-transform shadow-lg"
                            >
                                Clear Search
                            </button>
                        </>
                    ) : broadcasts.length === 0 ? (
                        <>
                            <div className="text-8xl mb-6">📭</div>
                            <h2 className="text-3xl font-black text-purple-700 mb-3">No Broadcasts Yet!</h2>
                            <p className="text-lg font-bold text-purple-600">Send your first broadcast to see history here! 🚀</p>
                        </>
                    ) : null}
                </div>
            )}

            {/* Details Modal */}
            {selectedBroadcast && (
                <BroadcastDetailsModal
                    broadcastId={selectedBroadcast}
                    onClose={() => setSelectedBroadcast(null)}
                />
            )}
        </div>
    );
};
