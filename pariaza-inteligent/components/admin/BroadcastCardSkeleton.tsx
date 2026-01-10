'use client';

import React from 'react';

/**
 * Skeleton loader for broadcast cards during data fetching
 * Provides visual feedback with pulse animation
 */
export const BroadcastCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border-3 border-purple-200 animate-pulse">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                {/* Icon Skeleton */}
                <div className="w-16 h-16 bg-purple-200 rounded-2xl flex-shrink-0"></div>

                {/* Content Skeleton */}
                <div className="flex-1 w-full space-y-3">
                    {/* Subject Line */}
                    <div className="h-7 bg-purple-200 rounded-full w-3/4"></div>
                    {/* Metadata */}
                    <div className="h-4 bg-purple-100 rounded-full w-1/2"></div>
                </div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                <div className="bg-purple-100 rounded-xl p-3 h-20"></div>
                <div className="bg-gray-100 rounded-xl p-3 h-20 opacity-60"></div>
                <div className="bg-blue-100 rounded-xl p-3 h-20"></div>
                <div className="bg-yellow-100 rounded-xl p-3 h-20"></div>
            </div>

            {/* Action Button Skeleton */}
            <div className="mt-4 flex justify-end">
                <div className="h-12 w-40 bg-purple-200 rounded-full"></div>
            </div>
        </div>
    );
};

/**
 * Quick Stats Skeleton for header cards
 */
export const QuickStatSkeleton: React.FC = () => {
    return (
        <div className="bg-white rounded-2xl p-6 border-3 border-purple-200 shadow-lg animate-pulse">
            <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 bg-purple-200 rounded-full"></div>
                <div className="h-4 w-16 bg-purple-100 rounded-full"></div>
            </div>
            <div className="h-4 w-24 bg-purple-100 rounded-full mb-2"></div>
            <div className="h-10 w-20 bg-purple-200 rounded-full"></div>
        </div>
    );
};
