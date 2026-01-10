/**
 * ToastManager - Global Toast Notification System
 * 
 * Usage:
 *   import { ToastManager } from '../utils/ToastManager';
 * 
 *   // Show toast only
 *   ToastManager.show('success', 'Settings saved!');
 * 
 *   // Show toast + play sound
 *   ToastManager.showWithSound('error', 'Connection failed');
 * 
 * Types:
 *   - success: Green, checkmark icon
 *   - error: Red, X icon
 *   - info: Blue, info icon
 *   - achievement: Purple gradient, sparkles (special!)
 */

import { SoundManager } from './SoundManager';

export type ToastType = 'success' | 'error' | 'info' | 'achievement';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration: number;
    timestamp: number;
}

type ToastListener = (toasts: Toast[]) => void;

class ToastManagerClass {
    private toasts: Toast[] = [];
    private listeners: ToastListener[] = [];
    private maxToasts = 3; // Max visible toasts at once

    /**
     * Show a toast notification
     * @param type - Type of toast (success/error/info/achievement)
     * @param message - Message to display
     * @param duration - Duration in ms (default: 3000)
     */
    show(type: ToastType, message: string, duration: number = 3000): string {
        const id = this.generateId();
        const toast: Toast = {
            id,
            type,
            message,
            duration,
            timestamp: Date.now()
        };

        // Add to stack
        this.toasts.push(toast);

        // Remove oldest if exceeding max
        if (this.toasts.length > this.maxToasts) {
            this.toasts.shift();
        }

        // Notify listeners (React components)
        this.notify();

        // Auto-remove after duration
        setTimeout(() => {
            this.remove(id);
        }, duration);

        console.log(`[ToastManager] 📢 Showing ${type}: "${message}"`);

        return id;
    }

    /**
     * Show toast + play corresponding sound
     * @param type - Type of toast
     * @param message - Message to display
     * @param duration - Duration in ms (default: 3000)
     */
    showWithSound(type: ToastType, message: string, duration: number = 3000): string {
        // Map toast type to sound type
        const soundMap: Record<ToastType, string> = {
            'success': 'success',
            'error': 'error',
            'info': 'notification',
            'achievement': 'achievement'
        };

        // Play sound
        const soundType = soundMap[type];
        SoundManager.play(soundType as any);

        // Show toast
        return this.show(type, message, duration);
    }

    /**
     * Remove a specific toast by ID
     * @param id - Toast ID to remove
     */
    remove(id: string): void {
        const index = this.toasts.findIndex(t => t.id === id);
        if (index !== -1) {
            this.toasts.splice(index, 1);
            this.notify();
        }
    }

    /**
     * Clear all toasts
     */
    clear(): void {
        this.toasts = [];
        this.notify();
    }

    /**
     * Subscribe to toast updates
     * @param listener - Function to call when toasts change
     * @returns Unsubscribe function
     */
    subscribe(listener: ToastListener): () => void {
        this.listeners.push(listener);

        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index !== -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * Get current toasts (for debugging)
     */
    getToasts(): Toast[] {
        return [...this.toasts];
    }

    // Private methods

    private notify(): void {
        this.listeners.forEach(listener => {
            listener([...this.toasts]);
        });
    }

    private generateId(): string {
        return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Export singleton instance
export const ToastManager = new ToastManagerClass();

// Expose to window for debugging (dev only)
if (typeof window !== 'undefined') {
    (window as any).ToastManager = ToastManager;
}
