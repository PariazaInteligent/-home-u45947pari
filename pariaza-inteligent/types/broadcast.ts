import React from 'react';

// Broadcast History Types
export interface BroadcastHistoryItem {
    id: string;
    subject: string;
    templateId: string;
    sentAt: string;
    sentBy: string;
    recipientCount: number;
    openedCount: number;
    clickedCount: number;
    openRate: number;
    clickRate: number;
    engagementScore: number;
}

export interface BroadcastDetails {
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
        convertedCount: number;
        openRate: number;
        clickRate: number;
        engagementScore: number;
    };
    recipients: RecipientEngagement[];
}

export interface RecipientEngagement {
    userId: string;
    name: string;
    email: string;
    opened: boolean;
    clicked: boolean;
    openedAt?: string;
    clickedAt?: string;
}

// Pagination
export interface PaginationInfo {
    page: number;
    limit: number;
    totalPages: number;
    totalBroadcasts: number;
}
