import { z } from 'zod';

// ============ Param Schemas ============

export const conversationIdParamSchema = z.object({
    conversationId: z.string().uuid('Invalid conversation ID'),
});

// ============ Query Schemas ============

export const getConversationsQuerySchema = z.object({
    cursor: z.string().uuid().optional(),
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 20))
        .pipe(z.number().int().min(1).max(50)),
});

export const getMessagesQuerySchema = z.object({
    cursor: z.string().uuid().optional(),
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 30))
        .pipe(z.number().int().min(1).max(100)),
});

// ============ Body Schemas ============

export const sendMessageSchema = z.object({
    receiverId: z.string().uuid('Invalid receiver ID'),
    text: z.string().min(1, 'Message text is required').max(5000, 'Message too long'),
    clientMsgId: z.string().min(1, 'Client message ID is required').max(100),
    type: z.string().optional().default('TEXT'),
    payloadJson: z.record(z.string(), z.unknown()).optional(),
});

export const markReadSchema = z.object({
    lastReadMessageId: z.string().uuid('Invalid message ID'),
});

export const syncQuerySchema = z.object({
    lastMessageTs: z.string().datetime().optional(),
});
