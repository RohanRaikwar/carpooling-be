// ============ Notification Types ============

export interface CreateNotificationInput {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
}

export interface NotificationListItem {
    id: string;
    type: string;
    title: string;
    body: string;
    data: Record<string, unknown> | null;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
}

export interface RegisterDeviceInput {
    platform: 'ios' | 'android';
    token: string;
}

export interface NotificationPayload {
    type: 'notification.new';
    data: {
        id: string;
        title: string;
        body: string;
        notificationType: string;
        preview: boolean;
        createdAt: Date;
    };
}
