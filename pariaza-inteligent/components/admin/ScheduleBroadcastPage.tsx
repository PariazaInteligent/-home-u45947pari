'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Send, Clock, Users, X, Edit, Trash2, CheckCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { RichTextEditor } from './editor/RichTextEditor';

interface ScheduledBroadcast {
    id: string;
    subject: string;
    templateId: string;
    scheduledFor: string;
    recipientCount: number;
    status: 'SCHEDULED' | 'CANCELLED';
    createdAt: string;
}

export const ScheduleBroadcastPage: React.FC = () => {
    // Form state
    const [templateId, setTemplateId] = useState('weekly_recap');
    const [subject, setSubject] = useState('');
    const [messageText, setMessageText] = useState('');
    const [recipients, setRecipients] = useState<string[]>([]); // Changed to string[] for user IDs
    const [scheduledDate, setScheduledDate] = useState<Date | null>(null);

    // Users list state
    const [users, setUsers] = useState<Array<{ id: string, nume: string, prenume: string, email: string }>>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [scheduledBroadcasts, setScheduledBroadcasts] = useState<ScheduledBroadcast[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(true);

    // Fetch users and scheduled broadcasts on mount
    useEffect(() => {
        fetchUsers();
        fetchScheduledBroadcasts();
    }, []);

    const fetchUsers = async () => {
        try {
            setIsLoadingUsers(true);
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:3001/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                // API returns ARRAY directly, not {users: [...]}
                setUsers(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const fetchScheduledBroadcasts = async () => {
        try {
            setIsLoadingList(true);
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:3001/admin/broadcast/scheduled', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setScheduledBroadcasts(data.broadcasts || []);
            }
        } catch (error) {
            console.error('Error fetching scheduled broadcasts:', error);
        } finally {
            setIsLoadingList(false);
        }
    };

    const toggleRecipient = (userId: string) => {
        setRecipients(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleSelectAll = () => {
        if (recipients.length === users.length) {
            setRecipients([]);
        } else {
            setRecipients(users.map(u => u.id));
        }
    };

    const handleSchedule = async () => {
        if (!subject || !messageText || !scheduledDate || recipients.length === 0) {
            alert('Te rog completează toate câmpurile!');
            return;
        }

        const now = new Date();
        if (scheduledDate <= now) {
            alert('Data programată trebuie să fie în viitor!');
            return;
        }

        setIsSubmitting(true);
        let response;

        try {
            const token = localStorage.getItem('accessToken');
            response = await fetch('http://localhost:3001/admin/broadcast/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    template_id: templateId,
                    subject,
                    message_text: messageText,
                    recipient_user_ids: recipients,
                    scheduled_for: scheduledDate.toISOString(),
                    sent_by_name: 'Admin'
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Schedule broadcast failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
                alert(`Eroare la programare: ${errorData.error || response.statusText}`);
                throw new Error('Failed to schedule broadcast');
            }

            const data = await response.json();

            // Show success message
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 5000);

            // Reset form
            setSubject('');
            setMessageText('');
            setRecipients([]);
            setScheduledDate(null);

            // Refresh list
            fetchScheduledBroadcasts();

        } catch (error) {
            console.error('Error scheduling broadcast:', error);
            if (!response || response.ok) {
                alert('Eroare la programare! Verifică consola.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Sigur vrei să anul ezi acest broadcast programat?')) {
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:3001/admin/broadcast/scheduled/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to cancel');
            }

            fetchScheduledBroadcasts();
        } catch (error) {
            console.error('Error cancelling broadcast:', error);
            alert('Eroare la anulare!');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ro-RO', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4 sm:p-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-purple-300">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="text-5xl sm:text-6xl">📅</div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-purple-800">Programează Broadcast</h1>
                            <p className="text-base sm:text-lg font-bold text-purple-600">
                                Marketing automation - trimite broadcasts în viitor! 🚀
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {showSuccess && (
                <div className="max-w-4xl mx-auto mb-6">
                    <div className="bg-green-100 border-4 border-green-300 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div className="flex-1 font-bold text-green-700">
                            ✅ Broadcast programat cu succes! Se va trimite automat la data selectată.
                        </div>
                    </div>
                </div>
            )}

            {/* Form Section */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-3 border-purple-200">
                    <h2 className="text-2xl font-black text-purple-800 mb-6">📝 Detalii Broadcast</h2>

                    {/* Template Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-black text-purple-700 mb-2">
                            📌 Template
                        </label>
                        <select
                            value={templateId}
                            onChange={(e) => setTemplateId(e.target.value)}
                            className="w-full px-4 py-3 border-3 border-purple-300 rounded-2xl font-bold text-purple-800 focus:outline-none focus:border-purple-500"
                        >
                            <option value="weekly_recap">📊 Weekly Recap</option>
                            <option value="opportunity">🚀 Opportunity Alert</option>
                            <option value="streak_alert">🔥 Streak Alert</option>
                            <option value="achievement">🏆 Achievement Unlock</option>
                        </select>
                    </div>

                    {/* Subject */}
                    <div className="mb-6">
                        <label className="block text-sm font-black text-purple-700 mb-2">
                            ✉️ Subject
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Ex: Weekly Performance Update - Oportunitățile Săptămânii"
                            className="w-full px-4 py-3 border-3 border-purple-300 rounded-2xl font-bold text-purple-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Message */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            💬 Message (Rich Text)
                        </label>
                        <RichTextEditor
                            value={messageText}
                            onChange={setMessageText}
                            placeholder="Scrie mesajul aici... Folosește **bold**, liste și titluri!"
                            className="w-full"
                        />
                    </div>

                    {/* Recipients - Multi-Select Dropdown */}
                    <div className="mb-6">
                        <label className="block text-sm font-black text-purple-700 mb-2">
                            👥 Recipients
                        </label>

                        {/* Select All / Deselect All Button */}
                        <div className="mb-3">
                            <button
                                type="button"
                                onClick={toggleSelectAll}
                                className="px-4 py-2 bg-purple-100 border-2 border-purple-300 text-purple-700 font-black rounded-full hover:scale-105 transition-transform text-sm"
                            >
                                {recipients.length === users.length ? '❌ Deselect All' : '✅ Select All Users'}
                            </button>
                            <span className="ml-3 text-sm font-bold text-purple-600">
                                {recipients.length > 0 && `${recipients.length} / ${users.length} users selected`}
                            </span>
                        </div>

                        {/* Users List with Checkboxes */}
                        {isLoadingUsers ? (
                            <div className="text-purple-600 font-bold py-4">Loading users...</div>
                        ) : (
                            <div className="border-3 border-purple-300 rounded-2xl p-4 max-h-64 overflow-y-auto bg-purple-50">
                                {users.length === 0 ? (
                                    <div className="text-center text-purple-600 font-bold py-4">
                                        No users found
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {users.map(user => (
                                            <label
                                                key={user.id}
                                                className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={recipients.includes(user.id)}
                                                    onChange={() => toggleRecipient(user.id)}
                                                    className="w-5 h-5 rounded border-2 border-purple-400 text-purple-600 focus:ring-2 focus:ring-purple-500"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-black text-purple-800">
                                                        {user.prenume} {user.nume}
                                                    </div>
                                                    <div className="text-sm text-purple-600">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Scheduled Date & Time */}
                    <div className="mb-6">
                        <label className="block text-sm font-black text-purple-700 mb-2">
                            🗓️ Programat pentru
                        </label>
                        <DatePicker
                            selected={scheduledDate}
                            onChange={(date) => setScheduledDate(date)}
                            showTimeSelect
                            timeIntervals={15}
                            minDate={new Date()}
                            dateFormat="dd MMM yyyy, HH:mm"
                            timeCaption="Ora"
                            placeholderText="Selectează data și ora"
                            className="w-full px-4 py-3 border-3 border-purple-300 rounded-2xl font-bold focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Preview */}
                    {subject && messageText && (
                        <div className="mb-6 bg-purple-50 rounded-2xl p-6 border-3 border-purple-200">
                            <h3 className="text-lg font-black text-purple-800 mb-3">👁️ Preview</h3>
                            <div className="bg-white rounded-xl p-4 shadow">
                                <div className="font-black text-lg text-gray-800 mb-2">{subject}</div>
                                <div
                                    className="text-gray-700 prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: messageText }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleSchedule}
                            disabled={isSubmitting || !subject || !messageText || !scheduledDate || recipients.length === 0}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black px-6 py-4 rounded-full hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Clock className="w-5 h-5" />
                            {isSubmitting ? 'Se programează...' : '⏰ Programează Trimitere'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Scheduled Broadcasts List */}
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-3 border-purple-200">
                    <h2 className="text-2xl font-black text-purple-800 mb-6">📋 Broadcasts Programate</h2>

                    {isLoadingList ? (
                        <div className="text-center py-8 text-purple-600 font-bold">
                            Se încarcă...
                        </div>
                    ) : scheduledBroadcasts.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📭</div>
                            <div className="text-xl font-black text-purple-700">Niciun broadcast programat</div>
                            <p className="text-purple-600 font-bold mt-2">Programează primul tău broadcast automat! 🚀</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {scheduledBroadcasts.map((broadcast) => (
                                <div
                                    key={broadcast.id}
                                    className="border-3 border-purple-300 rounded-2xl p-4 sm:p-6"
                                >
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg sm:text-xl font-black text-gray-800 mb-2">
                                                {broadcast.subject}
                                            </h3>
                                            <div className="space-y-1 text-sm font-bold text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    Programat: {formatDate(broadcast.scheduledFor)}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4" />
                                                    {broadcast.recipientCount} destinatari
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    📌 Template: {broadcast.templateId}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className={`px-4 py-2 rounded-full font-black text-sm ${broadcast.status === 'SCHEDULED'
                                            ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                                            : 'bg-gray-100 text-gray-500 border-2 border-gray-300'
                                            }`}>
                                            {broadcast.status === 'SCHEDULED' ? '⏰ Programat' : '🚫 Anulat'}
                                        </div>
                                    </div>

                                    {/* Actions (only for SCHEDULED in future) */}
                                    {broadcast.status === 'SCHEDULED' && new Date(broadcast.scheduledFor) > new Date() && (
                                        <div className="mt-4 flex flex-wrap gap-3">
                                            <button
                                                onClick={() => handleCancel(broadcast.id)}
                                                className="px-4 py-2 bg-red-100 border-2 border-red-300 text-red-700 font-black rounded-full hover:scale-105 transition-transform flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Anulează
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
