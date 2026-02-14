import { Response } from 'express';
import * as ChatService from './chat.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';
import { sendSuccess, sendError, HttpStatus } from '../../utils/index.js';

/* ================= LIST CONVERSATIONS ================= */
export const getConversations = async (req: AuthRequest, res: Response) => {
    try {
        const { cursor, limit } = req.query as { cursor?: string; limit?: number };
        const result = await ChatService.getConversations(req.user.id, cursor, limit);

        return sendSuccess(res, {
            message: 'Conversations fetched successfully',
            data: result,
        });
    } catch (error: any) {
        return sendError(res, {
            status: HttpStatus.INTERNAL_ERROR,
            message: 'Failed to fetch conversations',
        });
    }
};

/* ================= GET MESSAGES ================= */
export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = req.params.conversationId as string;
        const { cursor, limit } = req.query as { cursor?: string; limit?: number };

        const result = await ChatService.getMessages(
            req.user.id,
            conversationId,
            cursor,
            limit,
        );

        return sendSuccess(res, {
            message: 'Messages fetched successfully',
            data: result,
        });
    } catch (error: any) {
        if (error.message === 'CONVERSATION_NOT_FOUND') {
            return sendError(res, {
                status: HttpStatus.NOT_FOUND,
                message: 'Conversation not found or you are not a participant',
            });
        }

        return sendError(res, {
            status: HttpStatus.INTERNAL_ERROR,
            message: 'Failed to fetch messages',
        });
    }
};

/* ================= SEND MESSAGE ================= */
export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const message = await ChatService.sendMessage(req.user.id, req.body);

        return sendSuccess(res, {
            status: HttpStatus.CREATED,
            message: 'Message sent successfully',
            data: message,
        });
    } catch (error: any) {
        let status = HttpStatus.INTERNAL_ERROR;
        let message = 'Failed to send message';

        switch (error.message) {
            case 'CANNOT_MESSAGE_SELF':
                status = HttpStatus.BAD_REQUEST;
                message = 'You cannot send a message to yourself';
                break;
            case 'NO_CONFIRMED_BOOKING':
                status = HttpStatus.FORBIDDEN;
                message = 'Chat is only available after a booking is confirmed between rider and driver';
                break;
        }

        return sendError(res, { status, message });
    }
};

/* ================= MARK MESSAGES AS READ ================= */
export const markRead = async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = req.params.conversationId as string;
        const { lastReadMessageId } = req.body;

        await ChatService.markMessagesRead(req.user.id, conversationId, lastReadMessageId);

        return sendSuccess(res, {
            message: 'Messages marked as read',
        });
    } catch (error: any) {
        if (error.message === 'MESSAGE_NOT_FOUND') {
            return sendError(res, {
                status: HttpStatus.NOT_FOUND,
                message: 'Message not found',
            });
        }

        return sendError(res, {
            status: HttpStatus.INTERNAL_ERROR,
            message: 'Failed to mark messages as read',
        });
    }
};

/* ================= GET UNREAD COUNT ================= */
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
    try {
        const count = await ChatService.getUnreadCount(req.user.id);

        return sendSuccess(res, {
            message: 'Unread count fetched successfully',
            data: { unreadCount: count },
        });
    } catch (error: any) {
        return sendError(res, {
            status: HttpStatus.INTERNAL_ERROR,
            message: 'Failed to fetch unread count',
        });
    }
};
