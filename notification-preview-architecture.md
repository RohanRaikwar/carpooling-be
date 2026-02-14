# Notification Preview System Architecture  
(Express.js + Redis + Prisma + PostgreSQL + React Native)

---

## 1. Goal

Design a **highly scalable**, **low-latency**, and **fault-tolerant** notification system that:

- Sends real-time notifications
- Supports push notifications (FCM / APNs)
- Provides in-app notification preview
- Handles offline users
- Stores notification history
- Supports unread count tracking
- Works with Express.js backend

---

## 2. Tech Stack

### Backend
- Express.js (API + Notification Service)
- Redis (Pub/Sub + Cache + Rate limit)
- PostgreSQL (Persistent storage)
- Prisma (ORM)
- WebSocket (ws / socket.io)

### Mobile
- React Native
- FCM (Android)
- APNs (iOS)

---

## 3. High-Level Architecture

```
React Native App
        |
        | HTTPS / WebSocket
        v
   Express.js API Cluster
        |
        |---- Redis (Pub/Sub + Cache)
        |
        v
   PostgreSQL (Notifications)
        |
        v
   Push Service (FCM / APNs)
```

---

## 4. Notification Types

1. Chat message preview
2. System notification
3. Transaction alerts
4. Status updates
5. Marketing (optional)

---

## 5. Data Model (Prisma)

```prisma
model Notification {
  id          String   @id @default(uuid())
  userId      String
  type        String
  title       String
  body        String
  data        Json?
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
  readAt      DateTime?

  @@index([userId, createdAt])
  @@index([userId, isRead])
}

model DeviceToken {
  id        String   @id @default(uuid())
  userId    String
  platform  String
  token     String   @unique
  createdAt DateTime @default(now())
  lastSeen  DateTime?

  @@index([userId])
}
```

---

## 6. Notification Flow

### 6.1 Real-time (User Online)

1. Event triggered (e.g. chat message).
2. Express stores notification in PostgreSQL.
3. Publish event to Redis.
4. WebSocket server emits notification to connected user.
5. Client shows in-app preview.

### 6.2 Offline User

1. Store notification in PostgreSQL.
2. Fetch user device tokens.
3. Send push notification via FCM/APNs.
4. When user opens app → fetch unread notifications.

---

## 7. API Endpoints

### REST APIs

- `GET /notifications?cursor=...`
- `POST /notifications/read`
- `GET /notifications/unread-count`
- `POST /devices/register`
- `DELETE /devices/:id`

---

## 8. Redis Usage

### 8.1 Pub/Sub

Channel:
```
notification:user:{userId}
```

Used for cross-node delivery.

### 8.2 Caching

- Cache unread count:
```
SET unread:{userId} 5 EX 60
```

### 8.3 Rate Limiting

Prevent notification spam using token bucket.

---

## 9. Notification Preview Payload

Example WebSocket payload:

```json
{
  "type": "notification.new",
  "data": {
    "id": "uuid",
    "title": "New Message",
    "body": "Rohan sent you a message",
    "preview": true,
    "createdAt": "timestamp"
  }
}
```

---

## 10. Unread Count Strategy

### Option 1: DB Query
Count where `isRead = false`.

### Option 2 (Recommended): Redis Counter
- Increment on new notification
- Reset when user reads

---

## 11. Scaling Strategy

- Horizontal Express instances
- Redis cluster
- Postgres read replicas
- Background worker for push sending
- Queue (BullMQ) for heavy notification jobs

---

## 12. Fault Tolerance

### If Redis fails
- Still store notifications in DB
- Push notifications continue

### If Push fails
- Retry via background worker

### If Node crashes
- WebSocket reconnect automatically
- Notifications fetched via REST

---

## 13. Performance Optimization

- Index `userId + createdAt`
- Paginate notifications
- Limit payload size
- Async push sending
- Cache unread count

Target latency: < 200ms for in-app notification.

---

## 14. Security

- JWT authentication
- Validate user ownership
- Rate limit push requests
- Encrypt device tokens
- Validate payload size

---

## 15. Folder Structure (Express Monorepo Example)

```
src/
  modules/
    notification/
      notification.controller.ts
      notification.service.ts
      notification.ws.ts
      notification.worker.ts
  redis/
  prisma/
  websocket/
```

---

## 16. Production Checklist

- Enable sticky sessions for WebSocket
- Redis HA (Sentinel / Cluster)
- Postgres backup + monitoring
- Alerting for push failure rate
- Logging correlation ID
- Track delivery metrics

---

## 17. Summary

This architecture provides:

- Real-time in-app notification preview
- Push notifications for offline users
- Scalable Express.js backend
- Redis-based fast delivery
- Durable storage in PostgreSQL
- Fault tolerance & retry handling
- Efficient unread count management

---

If needed, this can be extended to:
- Notification batching
- Scheduled notifications
- Priority-based delivery
- Analytics & tracking
