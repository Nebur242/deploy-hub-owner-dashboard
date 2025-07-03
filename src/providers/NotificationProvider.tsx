"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { notificationService } from '@/services/notifications';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface NotificationContextType {
    hasPermission: boolean | null;
    isInitialized: boolean;
    requestPermission: () => Promise<boolean>;
    notificationCount: number;
    refreshToken: () => Promise<string | null>;
}

const NotificationContext = createContext<NotificationContextType>({
    hasPermission: null,
    isInitialized: false,
    requestPermission: async () => false,
    notificationCount: 0,
    refreshToken: async () => null,
});

export const useNotifications = () => useContext(NotificationContext);

interface NotificationProviderProps {
    children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const router = useRouter();

    // Initialize notification service
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.log('⚠️ This browser does not support notifications');
            return;
        }

        // Initialize FCM
        try {
            notificationService.initialize();
            setIsInitialized(true);

            // Check current permission status
            const permissionStatus = Notification.permission;
            console.log('🔔 Current notification permission status:', permissionStatus);
            setHasPermission(permissionStatus === 'granted');

            // If permission is already granted, get a token
            if (permissionStatus === 'granted') {
                console.log('🔔 Permission already granted, getting FCM token');
                notificationService.getToken();
            }
        } catch (error) {
            console.error('❌ Error initializing notifications:', error);
        }
    }, []);

    // Listen for FCM notifications
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Log when the notification listener is set up
        console.log('🎧 Setting up notification event listener');

        // Handle custom FCM notification event from our service
        const handleFcmNotification = (event: Event) => {
            const customEvent = event as CustomEvent;
            const notification = customEvent.detail;

            // Log the notification receipt
            console.group('🔔 Notification Received in UI');
            console.log('Time:', new Date().toLocaleTimeString());
            console.log('Title:', notification.title);
            console.log('Body:', notification.body);
            console.log('Data:', notification.data);
            console.log('Timestamp:', notification.timestamp);
            console.groupEnd();

            // Update notification count
            setNotificationCount(prev => {
                const newCount = prev + 1;
                console.log(`📊 Updated notification count: ${prev} -> ${newCount}`);
                return newCount;
            });

            // Show toast notification
            toast(notification.title, {
                description: notification.body,
                action: {
                    label: 'View',
                    onClick: () => {
                        // Navigate based on notification data or default to notifications page
                        const url = notification.data?.url || '/dashboard/notifications';
                        console.log('🔗 Navigating to notification destination:', url);
                        router.push(url);
                    },
                },
            });
        };

        window.addEventListener('fcm-notification', handleFcmNotification);

        return () => {
            console.log('🧹 Cleaning up notification event listener');
            window.removeEventListener('fcm-notification', handleFcmNotification);
        };
    }, [router]);

    // Request notification permission
    const requestPermission = async () => {
        console.log('🔔 User initiated permission request');
        const granted = await notificationService.requestPermission();
        setHasPermission(granted);

        if (granted) {
            console.log('✅ Permission granted, getting FCM token');
            // Get FCM token since permission was granted
            await notificationService.getToken(true);
        } else {
            console.log('❌ Permission denied by user');
        }

        return granted;
    };

    // Force token refresh
    const refreshToken = async () => {
        console.log('🔄 Refreshing FCM token');
        return await notificationService.getToken(true);
    };

    // Context provider value
    const value = {
        hasPermission,
        isInitialized,
        requestPermission,
        notificationCount,
        refreshToken,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}