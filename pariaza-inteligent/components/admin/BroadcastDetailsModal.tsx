'use client';

import React, { useState, useEffect } from 'react';
import { History, X, Check, Eye, Mouse, Clock } from 'lucide-react';

interface BroadcastRecipient {
    userId: string;
    name: string;
    email: string;
    opened: boolean;
    clicked: boolean;
    openedAt?: string;
    clickedAt?: string;
}

interface BroadcastDetails {
    broadcast: {
        id: string;
        subject: string;
        message: string;
        templateId: string;
        sentAt: string;
        sentBy: string;
    };
    analytics: {
        recipientCount: number;
        openedCount: number;
        clickedCount: number;
        openRate: number;
        clickRate: number;
        engagementScore: number;
    };
    recipients: BroadcastRecipient[];
}

interface BroadcastDetailsModalProps {
    broadcastId: string;
    onClose: () => void;
}

export const BroadcastDetailsModal: React.FC<BroadcastDetailsModalProps> = ({ broadcastId, onClose }) => {
    const [details, setDetails] = useState<BroadcastDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'opened' | 'clicked' | 'inactive'>('all');

    useEffect(() => {
        fetchDetails();
    }, [broadcastId]);

    const fetchDetails = async () => {
        try {
            const token = localStorage.getItem('accessToken') ||
                localStorage.getItem('token') ||
                localStorage.getItem('auth_token');

            const response = await fetch(`http://localhost:3001/admin/broadcast/history/${broadcastId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setDetails(data);
            }
        } catch (error) {
            console.error('Failed to fetch broadcast details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredRecipients = details?.recipients.filter(r => {
        if (filter === 'opened') return r.opened;
        if (filter === 'clicked') return r.clicked;
        if (filter === 'inactive') return !r.opened && !r.clicked;
        return true;
    }) || [];

    const formatDateTime = (dateString?: string): string => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('ro-RO', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white rounded-3xl p-8 text-center">
                    <div className="text-6xl mb-4 animate-bounce">📜</div>
                    <p className="text-xl font-black text-purple-700">Loading Details...</p>
                </div>
            </div>
        );
    }

    if (!details) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl border-4 border-purple-300 shadow-2xl w-full max-w-4xl my-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-3xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-5xl">📧</div>
                        <div>
                            <h2 className="text-2xl font-black text-white">{details.broadcast.subject}</h2>
                            <p className="text-sm font-bold text-purple-100">
                                {formatDateTime(details.broadcast.sentAt)} • {details.broadcast.sentBy}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Message Preview */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-3 border-purple-200">
                        <h3 className="text-lg font-black text-purple-800 mb-3">📝 Message Content</h3>
                        <div
                            className="text-gray-700 prose prose-sm max-w-none leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: details.broadcast.message }}
                        />
                    </div>

                    {/* Analytics Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-2xl p-4 border-3 border-blue-200">
                            <div className="text-3xl mb-1">👥</div>
                            <div className="text-xs font-bold text-blue-700">Recipients</div>
                            <div className="text-2xl font-black text-blue-600">{details.analytics.recipientCount}</div>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200 opacity-75">
                            <div className="text-3xl mb-1 opacity-60">👁️</div>
                            <div className="text-xs font-bold text-gray-600">~Opened</div>
                            <div className="text-2xl font-black text-gray-500">{details.analytics.openRate}%</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border-3 border-green-300">
                            <div className="text-3xl mb-1">🎯</div>
                            <div className="text-xs font-bold text-green-700">Clicked</div>
                            <div className="text-2xl font-black text-green-600">{details.analytics.clickRate}%</div>
                        </div>
                        <div className="bg-yellow-50 rounded-2xl p-4 border-3 border-yellow-200">
                            <div className="text-3xl mb-1">🏆</div>
                            <div className="text-xs font-bold text-yellow-700">Score</div>
                            <div className="text-2xl font-black text-yellow-600">{details.analytics.engagementScore}</div>
                        </div>
                    </div>

                    {/* Recipients List */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black text-purple-800">👥 Recipients ({filteredRecipients.length})</h3>

                            {/* Filter Buttons */}
                            <div className="flex gap-2">
                                {[
                                    { key: 'all', label: 'All', icon: '📋' },
                                    { key: 'clicked', label: 'Clicked', icon: '✅' },
                                    { key: 'opened', label: 'Opened', icon: '👁️' },
                                    { key: 'inactive', label: 'No Action', icon: '⏸️' },
                                ].map((f) => (
                                    <button
                                        key={f.key}
                                        onClick={() => setFilter(f.key as any)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${filter === f.key
                                            ? 'bg-purple-500 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {f.icon} {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recipients Table */}
                        <div className="bg-white rounded-2xl border-3 border-purple-200 max-h-96 overflow-y-auto">
                            {filteredRecipients.map((recipient) => (
                                <div
                                    key={recipient.userId}
                                    className="flex items-center justify-between p-4 border-b-2 border-gray-100 last:border-0 hover:bg-purple-50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-800">{recipient.name}</div>
                                        <div className="text-sm text-gray-500">{recipient.email}</div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Clicked Status */}
                                        {recipient.clicked ? (
                                            <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full border-2 border-green-300">
                                                <Check className="w-4 h-4 text-green-600" />
                                                <div>
                                                    <div className="text-xs font-bold text-green-700">Clicked</div>
                                                    <div className="text-xs text-green-600">{formatDateTime(recipient.clickedAt)}</div>
                                                </div>
                                            </div>
                                        ) : recipient.opened ? (
                                            <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full border-2 border-blue-300 opacity-60">
                                                <Eye className="w-4 h-4 text-blue-600" />
                                                <div>
                                                    <div className="text-xs font-bold text-blue-700">Opened</div>
                                                    <div className="text-xs text-blue-600">{formatDateTime(recipient.openedAt)}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full border-2 border-gray-200">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <div className="text-xs font-bold text-gray-500">No action</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t-4 border-purple-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black px-8 py-3 rounded-full hover:scale-105 transition-transform shadow-lg"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
