import { Server, Socket } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import http from 'http';
import logger from '../utils/logger.js';
import * as ChatService from '../modules/chat/chat.service.js';
import * as PresenceService from '../services/presence.service.js';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'access_secret';

// ============ USER-SOCKET MAPPING ============
// Map userId -> Set<socketId> (user can have multiple devices/tabs)
const userSockets = new Map<string, Set<string>>();
// Map socketId -> userId (reverse lookup)
const socketUsers = new Map<string, string>();

const addUserSocket = (userId: string, socketId: string) => {
    if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socketId);
    socketUsers.set(socketId, userId);
};

const removeUserSocket = (socketId: string) => {
    const userId = socketUsers.get(socketId);
    if (userId) {
        const sockets = userSockets.get(userId);
        if (sockets) {
            sockets.delete(socketId);
            if (sockets.size === 0) {
                userSockets.delete(userId);
            }
        }
        socketUsers.delete(socketId);
    }
    return userId;
};

export const getUserSocketIds = (userId: string): string[] => {
    const sockets = userSockets.get(userId);
    return sockets ? Array.from(sockets) : [];
};

// Module-level io reference for external access
let ioInstance: Server | null = null;

export const getIO = (): Server | null => ioInstance;

// ============ SOCKET.IO INITIALIZATION ============

export const initSocket = async (server: http.Server) => {
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
        pingInterval: 25000,
        pingTimeout: 60000,
    });

    // Setup Redis adapter for horizontal scaling
    try {
        const pubClient = createClient({
            url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
        });
        const subClient = pubClient.duplicate();
        await Promise.all([pubClient.connect(), subClient.connect()]);
        io.adapter(createAdapter(pubClient, subClient));
        logger.info('✅ Socket.IO Redis adapter connected');
    } catch (error) {
        logger.warn('⚠️ Redis adapter failed, running without horizontal scaling:', error);
    }

    // Store io reference for external access
    ioInstance = io;

    // ============ JWT AUTH MIDDLEWARE ============
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as any;
            (socket as any).userId = decoded.user?.id || decoded.id;

            if (!(socket as any).userId) {
                return next(new Error('Invalid token payload'));
            }

            next();
        } catch (error) {
            return next(new Error('Invalid or expired token'));
        }
    });

    // ============ CONNECTION HANDLER ============
    io.on('connection', async (socket: Socket) => {
        const userId = (socket as any).userId as string;
        logger.info(`🔌 User ${userId} connected (socket: ${socket.id})`);

        // Register user-socket mapping
        addUserSocket(userId, socket.id);

        // Set presence in Redis
        await PresenceService.setOnline(userId, socket.id);

        // Mark pending messages as delivered on connect
        try {
            const pendingMessages = await ChatService.getMessagesSince(userId);
            if (pendingMessages.length > 0) {
                socket.emit('chat:sync', { messages: pendingMessages });

                // Mark as delivered
                const conversationIds = [...new Set(pendingMessages.map((m: { conversationId: string }) => m.conversationId))];
                await Promise.all(
                    conversationIds.map((convId: string) =>
                        ChatService.markMessagesDelivered(userId, convId),
                    ),
                );
            }
        } catch (error) {
            logger.error('Error syncing pending messages:', error);
        }

        // ============ CHAT: SEND MESSAGE ============
        socket.on('chat:send', async (data, callback) => {
            try {
                const { receiverId, text, clientMsgId, type } = data;

                if (!receiverId || !text || !clientMsgId) {
                    return callback?.({ error: 'Missing required fields: receiverId, text, clientMsgId' });
                }

                // Persist message
                const message = await ChatService.sendMessage(userId, {
                    receiverId,
                    text,
                    clientMsgId,
                    type: type || 'TEXT',
                });

                // ACK to sender
                callback?.({
                    success: true,
                    message: {
                        id: message.id,
                        conversationId: message.conversationId,
                        createdAt: message.createdAt,
                    },
                });

                // Deliver to receiver if online
                const receiverSocketIds = getUserSocketIds(receiverId);
                if (receiverSocketIds.length > 0) {
                    const payload = {
                        id: message.id,
                        conversationId: message.conversationId,
                        senderId: userId,
                        receiverId,
                        type: message.type,
                        text: message.text,
                        clientMsgId: message.clientMsgId,
                        createdAt: message.createdAt,
                    };

                    receiverSocketIds.forEach((sid) => {
                        io.to(sid).emit('chat:message', payload);
                    });

                    // Auto-mark as delivered
                    await ChatService.markMessagesDelivered(receiverId, message.conversationId);

                    // Notify sender of delivery
                    socket.emit('chat:delivered', {
                        messageId: message.id,
                        conversationId: message.conversationId,
                        deliveredAt: new Date(),
                    });
                }
                // TODO: If receiver is offline, trigger push notification via FCM/APNs
            } catch (error: any) {
                logger.error('chat:send error:', error);
                const errorMsg =
                    error.message === 'NO_CONFIRMED_BOOKING'
                        ? 'Chat is only available after a booking is confirmed'
                        : error.message === 'CANNOT_MESSAGE_SELF'
                            ? 'You cannot send a message to yourself'
                            : 'Failed to send message';
                callback?.({ error: errorMsg });
            }
        });

        // ============ CHAT: TYPING INDICATOR ============
        socket.on('chat:typing', (data) => {
            const { conversationId, receiverId } = data;
            if (!conversationId || !receiverId) return;

            const receiverSocketIds = getUserSocketIds(receiverId);
            receiverSocketIds.forEach((sid) => {
                io.to(sid).emit('chat:typing', {
                    conversationId,
                    senderId: userId,
                });
            });
        });

        // ============ CHAT: STOP TYPING ============
        socket.on('chat:stopTyping', (data) => {
            const { conversationId, receiverId } = data;
            if (!conversationId || !receiverId) return;

            const receiverSocketIds = getUserSocketIds(receiverId);
            receiverSocketIds.forEach((sid) => {
                io.to(sid).emit('chat:stopTyping', {
                    conversationId,
                    senderId: userId,
                });
            });
        });

        // ============ CHAT: DELIVERED ACK ============
        socket.on('chat:delivered', async (data) => {
            try {
                const { messageId, conversationId } = data;
                if (!conversationId) return;

                await ChatService.markMessagesDelivered(userId, conversationId);

                // Notify sender
                const conversation = await ChatService.getOrCreateConversation(userId, '');
                // Find the sender — the other user in the conversation
                // We'll look up the message to find the sender
            } catch (error) {
                logger.error('chat:delivered error:', error);
            }
        });

        // ============ CHAT: READ RECEIPT ============
        socket.on('chat:read', async (data) => {
            try {
                const { conversationId, lastReadMessageId } = data;
                if (!conversationId || !lastReadMessageId) return;

                await ChatService.markMessagesRead(userId, conversationId, lastReadMessageId);

                // Notify the other user that their messages have been read
                // We need to find who the other user is
                const messages = await ChatService.getMessages(userId, conversationId, undefined, 1);
                if (messages.messages.length > 0) {
                    const peerId = messages.messages[0].senderId === userId
                        ? messages.messages[0].receiverId
                        : messages.messages[0].senderId;

                    const peerSocketIds = getUserSocketIds(peerId);
                    peerSocketIds.forEach((sid) => {
                        io.to(sid).emit('chat:read', {
                            conversationId,
                            readBy: userId,
                            lastReadMessageId,
                            readAt: new Date(),
                        });
                    });
                }
            } catch (error) {
                logger.error('chat:read error:', error);
            }
        });

        // ============ CHAT: SYNC (OFFLINE RECOVERY) ============
        socket.on('chat:sync', async (data, callback) => {
            try {
                const { lastMessageTs } = data || {};
                const messages = await ChatService.getMessagesSince(userId, lastMessageTs);

                callback?.({ success: true, messages });

                // Mark synced messages as delivered
                if (messages.length > 0) {
                    const conversationIds = [...new Set(messages.map((m: { conversationId: string }) => m.conversationId))];
                    await Promise.all(
                        conversationIds.map((convId: string) =>
                            ChatService.markMessagesDelivered(userId, convId),
                        ),
                    );
                }
            } catch (error: any) {
                logger.error('chat:sync error:', error);
                callback?.({ error: 'Failed to sync messages' });
            }
        });

        // ============ PRESENCE: HEARTBEAT ============
        socket.on('presence:ping', async () => {
            await PresenceService.refreshPresence(userId, socket.id);
        });

        // ============ PRESENCE: GET STATUS ============
        socket.on('presence:check', async (data, callback) => {
            try {
                const { userId: targetUserId } = data;
                if (!targetUserId) return callback?.({ error: 'userId required' });

                const presence = await PresenceService.isOnline(targetUserId);
                callback?.({
                    userId: targetUserId,
                    online: !!presence,
                    lastSeen: presence?.ts || null,
                });
            } catch (error) {
                callback?.({ error: 'Failed to check presence' });
            }
        });

        // ============ DISCONNECT ============
        socket.on('disconnect', async (reason) => {
            const disconnectedUserId = removeUserSocket(socket.id);
            logger.info(`🔌 User ${disconnectedUserId} disconnected (socket: ${socket.id}, reason: ${reason})`);

            if (disconnectedUserId) {
                // Only set offline if no other sockets remain for this user
                const remainingSockets = getUserSocketIds(disconnectedUserId);
                if (remainingSockets.length === 0) {
                    await PresenceService.setOffline(disconnectedUserId);
                }
            }
        });
    });

    logger.info('✅ Socket.IO server initialized');
    return io;
};
