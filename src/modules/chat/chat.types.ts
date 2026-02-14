// ============ Chat Types ============

export interface SendMessageInput {
    receiverId: string;
    text: string;
    clientMsgId: string;
    type?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
    payloadJson?: Record<string, unknown>;
}

export interface PaginationQuery {
    cursor?: string;
    limit?: number;
}

export interface ConversationListItem {
    id: string;
    peer: {
        id: string;
        name: string | null;
        avatarUrl: string | null;
    };
    lastMessage: {
        id: string;
        text: string | null;
        senderId: string;
        createdAt: Date;
        type: string;
    } | null;
    unreadCount: number;
    updatedAt: Date;
}

export interface MessageItem {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    type: string;
    text: string | null;
    payloadJson: unknown;
    clientMsgId: string | null;
    deliveredAt: Date | null;
    readAt: Date | null;
    createdAt: Date;
}

// ============ WebSocket Event Types ============

export interface WsEventEnvelope<T = unknown> {
    type: string;
    id: string;
    ts: number;
    data: T;
}

export interface WsSendMessageData {
    receiverId: string;
    text: string;
    clientMsgId: string;
    type?: string;
}

export interface WsTypingData {
    conversationId: string;
    receiverId: string;
}

export interface WsSyncData {
    lastMessageTs?: string; // ISO timestamp
}

export interface WsDeliveredData {
    messageId: string;
    conversationId: string;
}

export interface WsReadData {
    conversationId: string;
    lastReadMessageId: string;
}
