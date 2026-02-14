import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import * as controller from './chat.controller.js';
import {
    getConversationsQuerySchema,
    getMessagesQuerySchema,
    conversationIdParamSchema,
    sendMessageSchema,
    markReadSchema,
} from './chat.validator.js';

const router = Router();

// List user's conversations (paginated)
router.get(
    '/',
    validate({ query: getConversationsQuerySchema }),
    controller.getConversations,
);

// Get unread message count
router.get('/unread-count', controller.getUnreadCount);

// Get messages in a conversation (paginated)
router.get(
    '/:conversationId/messages',
    validate({
        params: conversationIdParamSchema,
        query: getMessagesQuerySchema,
    }),
    controller.getMessages,
);

// Send a message
router.post(
    '/send',
    validate({ body: sendMessageSchema }),
    controller.sendMessage,
);

// Mark messages as read in a conversation
router.post(
    '/:conversationId/read',
    validate({
        params: conversationIdParamSchema,
        body: markReadSchema,
    }),
    controller.markRead,
);

export default router;
