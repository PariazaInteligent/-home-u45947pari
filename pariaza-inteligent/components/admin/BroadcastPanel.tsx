import React, { useState, useEffect } from 'react';
import { Mail, Users, Send, Sparkles, Target, UserPlus, TrendingUp, Eye, CheckCircle2, XCircle, BarChart3, Clock } from 'lucide-react';
import { BroadcastAnalyticsWidget } from './BroadcastAnalyticsWidget';
import { EMAIL_TEMPLATES } from './BroadcastTemplates';
import { RichTextEditor } from './editor/RichTextEditor';

interface BroadcastStats {
    totalUsers: number;
    activeUsers: number;
    notificationsEnabled: number;
    notificationsDisabled: number;
    activeUsersLast7Days: number;
    activeUsersLast7DaysTrend: number;
    newUsersLast3Days: number;
    newUsersLast3DaysTrend: number;
}

interface BroadcastPreview {
    html: string;
    recipientCount: number;
}

export const BroadcastPanel: React.FC = () => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [stats, setStats] = useState<BroadcastStats | null>(null);
    const [preview, setPreview] = useState<BroadcastPreview | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [sendResult, setSendResult] = useState<any>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
    const [selectedDesign, setSelectedDesign] = useState<string>('standard');
    const [selectedFilterRule, setSelectedFilterRule] = useState<string>('custom');
    const [targetRecipientCount, setTargetRecipientCount] = useState<number | null>(null);
    const [isLoadingCount, setIsLoadingCount] = useState(false);
    const [hasEdited, setHasEdited] = useState(false);
    const [shouldHighlight, setShouldHighlight] = useState(false);


    useEffect(() => {
        fetchStats();

        // Deep-linking support: Check for query params
        const urlParams = new URLSearchParams(window.location.search);
        const templateId = urlParams.get('template');
        const highlight = urlParams.get('highlight');

        if (templateId) {
            // Find and select template
            const matchingTemplate = EMAIL_TEMPLATES.find(t => t.id === templateId);
            if (matchingTemplate) {
                setSelectedTemplate(templateId);
                setSubject(matchingTemplate.subject);
                setMessage(matchingTemplate.message);
                setSelectedDesign(matchingTemplate.design);
                setSelectedFilterRule(matchingTemplate.filterRule);

                // Fetch recipient count
                fetchRecipientCountForTemplate(matchingTemplate.filterRule);

                // Trigger highlight animation
                if (highlight === 'true') {
                    setShouldHighlight(true);
                    setTimeout(() => setShouldHighlight(false), 3000); // 3 seconds
                }
            }

            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const fetchRecipientCountForTemplate = async (filterRule: string) => {
        setIsLoadingCount(true);
        try {
            const token = localStorage.getItem('accessToken') ||
                localStorage.getItem('token') ||
                localStorage.getItem('auth_token');

            const response = await fetch('http://localhost:3001/admin/broadcast/preview', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subject: 'Preview',
                    message: 'Preview',
                    filters: { filterRule }
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setTargetRecipientCount(data.preview.recipientCount);
            }
        } catch (error) {
            console.error('Failed to fetch recipient count:', error);
        } finally {
            setIsLoadingCount(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('accessToken') ||
                localStorage.getItem('token') ||
                localStorage.getItem('auth_token');

            const response = await fetch('http://localhost:3001/admin/broadcast/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const handleTemplateSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templateId = e.target.value;

        // Warn if switching templates with unsaved edits
        if (hasEdited && (subject || message)) {
            if (!window.confirm('Schimbi template-ul? Modificările curente se vor pierde.')) {
                return;
            }
        }

        setSelectedTemplate(templateId);

        if (templateId === 'custom') {
            setSubject('');
            setMessage('');
            setSelectedDesign('standard');
            setSelectedFilterRule('custom');
            setTargetRecipientCount(null);
        } else {
            const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
            if (template) {
                setSubject(template.subject);
                setMessage(template.message);
                setSelectedDesign(template.design);
                setSelectedFilterRule(template.filterRule);

                // Fetch recipient count for this filter rule
                await fetchRecipientCount(template.filterRule);
            }
        }

        setHasEdited(false);
    };

    const fetchRecipientCount = async (filterRule: string) => {
        setIsLoadingCount(true);
        try {
            const token = localStorage.getItem('accessToken') ||
                localStorage.getItem('token') ||
                localStorage.getItem('auth_token');

            const response = await fetch('http://localhost:3001/admin/broadcast/preview', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subject: 'Preview',
                    message: 'Preview',
                    filters: { filterRule }
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setTargetRecipientCount(data.preview.recipientCount);
            }
        } catch (error) {
            console.error('Failed to fetch recipient count:', error);
        } finally {
            setIsLoadingCount(false);
        }
    };

    const getFilterRuleExplanation = (filterRule: string): string => {
        const explanations: Record<string, string> = {
            'new_users': '🎉 Utilizatori noi înregistrați în ultimele 3 zile',
            'active_users': '🔥 Utilizatori care s-au logat în ultimele 7 zile',
            'vip_opportunities': '💎 Utilizatori VIP (Tier PRO/WHALE sau Clearance ≥ 3)',
            'all_active': '✅ Toți utilizatorii cu cont activ',
            'beginners': '📚 Începători (Tier ENTRY sau Clearance ≤ 2)',
            'forgot_checkin': '⏰ Utilizatori care au uitat check-in-ul de azi dar sunt activi',
            'streak_at_risk': '⚠️ Utilizatori cu streak activ care riscă să-l piardă (> 20h fără check-in)',
            'upsell_targets': '🚀 Utilizatori Tier INVESTOR (mid-range, gata pentru upgrade)',
            'loyal_users': '💙 Utilizatori fideli (Streak > 10 sau Loialitate > 500)',
            'custom': 'Filtrare personalizată'
        };
        return explanations[filterRule] || 'Criterii de filtrare personalizate';
    };

    const handlePreview = async () => {
        try {
            const token = localStorage.getItem('accessToken') ||
                localStorage.getItem('token') ||
                localStorage.getItem('auth_token');

            const response = await fetch('http://localhost:3001/admin/broadcast/preview', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subject,
                    message,
                    design: selectedDesign,
                    filters: { filterRule: selectedFilterRule }
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setPreview(data.preview);
                setShowPreview(true);
            }
        } catch (error) {
            console.error('Failed to generate preview:', error);
            alert('Eroare la generarea preview-ului');
        }
    };

    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleSendClick = () => {
        if (!subject.trim() || !message.trim()) {
            alert('Subject și mesaj sunt obligatorii!');
            return;
        }
        setShowConfirmModal(true);
    };

    const confirmSend = async () => {
        setShowConfirmModal(false);
        setIsSending(true);

        try {
            const token = localStorage.getItem('accessToken') ||
                localStorage.getItem('token') ||
                localStorage.getItem('auth_token');

            const response = await fetch('http://localhost:3001/admin/broadcast/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subject,
                    message,
                    design: selectedDesign,
                    filters: { filterRule: selectedFilterRule },
                    templateId: selectedTemplate !== 'custom' ? selectedTemplate : undefined
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setSendResult(data.broadcast);
                setShowSuccess(true);
                setSubject('');
                setMessage('');

                // Refresh stats
                await fetchStats();
            } else {
                alert('Eroare la trimiterea broadcast-ului');
            }
        } catch (error) {
            console.error('Failed to send broadcast:', error);
            alert('Eroare la trimiterea broadcast-ului');
        } finally {
            setIsSending(false);
        }
    };

    if (showSuccess && sendResult) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50 p-8 flex items-center justify-center animate-in fade-in duration-500">
                <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-12 text-center">
                    <div className="text-8xl mb-6">🎉</div>
                    <h1 className="text-4xl font-black text-green-600 mb-4">
                        BROADCAST TRIMIS!
                    </h1>
                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-8 mb-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <div className="text-sm text-green-700 font-bold mb-2">✅ Trimise</div>
                                <div className="text-3xl font-black text-green-600">{sendResult.sent}</div>
                            </div>
                            <div>
                                <div className="text-sm text-orange-700 font-bold mb-2">⏭️ Skipate</div>
                                <div className="text-3xl font-black text-orange-600">{sendResult.skipped}</div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSuccess(false)}
                        className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-2xl hover:scale-105 transition-all">
                        TRIMITE ALTUL
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="text-7xl mb-4">📧🦉</div>
                    <h1 className="text-4xl font-black text-cyan-800 mb-2">
                        Notificări Email
                    </h1>
                    <p className="text-cyan-600 font-bold">Trimite mesaje importante către investitori</p>
                </div>

                {/* Enhanced Stats Cards with Trends */}
                {stats && (
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        {/* Total Investitori */}
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 shadow-lg border-3 border-blue-300 hover:scale-105 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-3xl">👥</div>
                                <Users className="w-6 h-6 text-blue-500" />
                            </div>
                            <div className="text-sm text-blue-700 font-bold mb-1">Total Investitori</div>
                            <div className="text-4xl font-black text-blue-600">{stats.totalUsers}</div>
                        </div>

                        {/* Notificări ON */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-lg border-3 border-green-300 hover:scale-105 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-3xl">📬</div>
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                            </div>
                            <div className="text-sm text-green-700 font-bold mb-1">Notificări ON</div>
                            <div className="text-4xl font-black text-green-600">{stats.notificationsEnabled}</div>
                        </div>

                        {/* Utilizatori Activi (7d) cu Trend */}
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 shadow-lg border-3 border-orange-300 hover:scale-105 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-3xl">🔥</div>
                                <div className="flex items-center gap-1">
                                    {stats.activeUsersLast7DaysTrend > 0 ? (
                                        <>
                                            <span className="text-green-600 font-black text-sm">+{stats.activeUsersLast7DaysTrend}</span>
                                            <span className="text-xl">📈</span>
                                        </>
                                    ) : stats.activeUsersLast7DaysTrend < 0 ? (
                                        <>
                                            <span className="text-red-600 font-black text-sm">{stats.activeUsersLast7DaysTrend}</span>
                                            <span className="text-xl">📉</span>
                                        </>
                                    ) : (
                                        <span className="text-gray-500 text-sm">━</span>
                                    )}
                                </div>
                            </div>
                            <div className="text-sm text-orange-700 font-bold mb-1">Activi (7 zile)</div>
                            <div className="text-4xl font-black text-orange-600">{stats.activeUsersLast7Days}</div>
                            <div className="text-xs text-orange-600 mt-2 font-bold">vs. săptămâna trecută</div>
                        </div>

                        {/* Utilizatori Noi (3d) cu Trend */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg border-3 border-purple-300 hover:scale-105 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-3xl">🎉</div>
                                <div className="flex items-center gap-1">
                                    {stats.newUsersLast3DaysTrend > 0 ? (
                                        <>
                                            <span className="text-green-600 font-black text-sm">+{stats.newUsersLast3DaysTrend}</span>
                                            <span className="text-xl">📈</span>
                                        </>
                                    ) : stats.newUsersLast3DaysTrend < 0 ? (
                                        <>
                                            <span className="text-red-600 font-black text-sm">{stats.newUsersLast3DaysTrend}</span>
                                            <span className="text-xl">📉</span>
                                        </>
                                    ) : (
                                        <span className="text-gray-500 text-sm">━</span>
                                    )}
                                </div>
                            </div>
                            <div className="text-sm text-purple-700 font-bold mb-1">Utilizatori Noi (3 zile)</div>
                            <div className="text-4xl font-black text-purple-600">{stats.newUsersLast3Days}</div>
                            <div className="text-xs text-purple-600 mt-2 font-bold">vs. perioada anterioară</div>
                        </div>
                    </div>
                )}

                {/* ✨ BONUS: Analytics & Insights Dashboard */}
                <BroadcastAnalyticsWidget />

                {/* Compose Area */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border-4 border-cyan-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="text-4xl">✍️</div>
                        <h2 className="text-2xl font-black text-cyan-800">Compune Mesaj</h2>
                    </div>

                    {/* Template Selector */}
                    <div className={`mb-6 transition-all duration-300 ${shouldHighlight ? 'animate-pulse ring-4 ring-green-400 rounded-3xl p-2' : ''}`}>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            📋 Alege Template sau Compune La Liber
                        </label>
                        <select
                            value={selectedTemplate}
                            onChange={handleTemplateSelect}
                            className={`w-full px-6 py-4 border-4 rounded-2xl 
                                     bg-gradient-to-r from-blue-50 to-cyan-50 
                                     focus:border-blue-500 focus:ring-4 focus:ring-blue-200
                                     text-lg font-bold text-blue-900 cursor-pointer outline-none transition-all
                                     ${shouldHighlight ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50' : 'border-blue-300'}`}
                        >
                            <option value="custom">✍️ Custom - Compune La Liber</option>
                            {EMAIL_TEMPLATES.map(template => (
                                <option key={template.id} value={template.id}>
                                    {template.emoji} {template.name}
                                </option>
                            ))}
                        </select>
                        {selectedTemplate !== 'custom' && (
                            <p className="text-sm text-blue-600 mt-2 font-bold flex items-center gap-2">
                                💡 {EMAIL_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
                            </p>
                        )}
                    </div>

                    {/* 🎯 Targeting Audience Badge (Duolingo-style) */}
                    {selectedTemplate !== 'custom' && (
                        <div className="mb-6 animate-in slide-in-from-top duration-300">
                            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-cyan-50 border-4 border-green-300 rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="text-3xl">🎯</div>
                                    <h3 className="text-lg font-black text-green-800">Public Țintă</h3>
                                </div>

                                {isLoadingCount ? (
                                    <div className="flex items-center gap-3 animate-pulse">
                                        <div className="w-8 h-8 rounded-full bg-green-300 animate-bounce"></div>
                                        <p className="text-green-700 font-bold">Calculez numărul destinatarilor...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white rounded-full px-6 py-3 shadow-md border-2 border-green-400">
                                                <span className="text-3xl font-black text-green-600">
                                                    {targetRecipientCount !== null ? targetRecipientCount : '...'}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-green-800">
                                                    {targetRecipientCount !== null && targetRecipientCount > 0 ? (
                                                        <>
                                                            Vei trimite către <span className="text-green-600 text-lg">{targetRecipientCount}</span> investitori
                                                            {stats && <> (din {stats.notificationsEnabled} cu notificări active)</>}
                                                        </>
                                                    ) : (
                                                        <span className="text-orange-600">⚠️ Niciun utilizator nu corespunde acestor criterii momentan.</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Visual explanation of filtering */}
                                        <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                                            <p className="text-xs text-gray-600 font-bold mb-2">📝 De ce acești utilizatori?</p>
                                            <p className="text-sm text-gray-700">
                                                {getFilterRuleExplanation(selectedFilterRule)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Owl Helper */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-3 border-yellow-300 rounded-2xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="text-3xl">🦉</div>
                            <div className="flex-1">
                                <p className="text-sm text-orange-800 font-bold">
                                    💡 <strong>Sfat:</strong> Fii concis și clar! Folosește emojii pentru a face mesajul mai prietenos.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Subject Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            📌 Subject (max 100 caractere)
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => {
                                setSubject(e.target.value.slice(0, 100));
                                setHasEdited(true);
                            }}
                            placeholder="Ex: Noutăți importante pentru investitori!"
                            className="w-full px-6 py-4 rounded-2xl border-4 border-cyan-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-200 outline-none text-lg font-bold text-cyan-900"
                            maxLength={100}
                        />
                        <div className="text-right text-sm text-gray-500 mt-1 font-bold">
                            {subject.length}/100
                        </div>
                    </div>

                    {/* Message Editor */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            📝 Mesaj (Rich Text)
                        </label>
                        <RichTextEditor
                            value={message}
                            onChange={(html) => {
                                setMessage(html);
                                setHasEdited(true);
                            }}
                            placeholder="Scrie mesajul tău aici... Folosește **bold**, liste și titluri!"
                            className="w-full"
                        />
                        <div className="text-right text-sm text-gray-500 mt-1 font-bold">
                            {/* Length approximation for HTML is tricky, maybe just show "Rich Content" or stripped length */}
                            {message.replace(/<[^>]*>/g, '').length} / ~2000 chars
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handlePreview}
                            disabled={!subject.trim() || !message.trim()}
                            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-black rounded-2xl text-lg shadow-lg hover:scale-105 transition-all disabled:cursor-not-allowed">
                            <Eye className="w-6 h-6" />
                            VEZI PREVIEW
                        </button>
                        <button
                            onClick={handleSendClick}
                            disabled={!subject.trim() || !message.trim() || isSending}
                            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-black rounded-2xl text-lg shadow-lg hover:scale-105 transition-all disabled:cursor-not-allowed">
                            <Send className="w-6 h-6" />
                            {isSending ? '🔄 TRIMITERE...' : 'TRIMITE NOTIFICARE'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in duration-300">
                        <div className="text-6xl mb-4">📢</div>
                        <h3 className="text-2xl font-black text-gray-800 mb-2">Ești sigur?</h3>
                        <p className="text-gray-600 mb-8 font-bold">
                            Vei trimite acest email către <span className="text-green-600 text-lg">{stats?.notificationsEnabled || 0} investitori</span>.
                            <br />
                            <span className="text-sm text-red-500 mt-2 block">Acțiunea nu poate fi anulată!</span>
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                                ANULEAZĂ
                            </button>
                            <button
                                onClick={confirmSend}
                                className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-lg">
                                DA, TRIMITE 🚀
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && preview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50" onClick={() => setShowPreview(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto p-8" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-black text-cyan-800">📧 Preview Email</h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="text-4xl hover:scale-110 transition-transform">
                                ×
                            </button>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-xl mb-4">
                            <p className="text-sm font-bold text-gray-700">
                                👥 Se va trimite către: <span className="text-green-600">{preview.recipientCount} investitori</span>
                            </p>
                        </div>
                        <div className="border-4 border-cyan-200 rounded-2xl overflow-hidden">
                            <iframe
                                srcDoc={preview.html}
                                className="w-full h-[600px]"
                                title="Email Preview"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
