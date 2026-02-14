# Realtime 1:1 Chat Architecture (React Native + Express.js + Redis + Prisma + PostgreSQL)

Goal: **highly scalable**, **low-latency**, **fault-tolerant** 1:1 (peer-to-peer) chat with **presence/heartbeat**, **delivery receipts**, **offline handling**, and **durable chat history**.

---

## 1) High-level overview

**Client:** React Native  
**Gateway/API:** Express.js (REST + WebSocket)  
**Realtime backbone:** Redis (Pub/Sub + Streams + cache + presence)  
**Durable storage:** PostgreSQL (via Prisma)  
**Notifications:** FCM/APNs for offline users

### Key principles
- **WebSocket for realtime** + **REST for history & pagination**.
- **At-least-once delivery** from server to device (with idempotency on client).
- **Durable message log in PostgreSQL**, optional Redis Stream as a **fast event bus**.
- **Presence** derived from heartbeats with a short TTL.
- **Horizontal scaling** with multiple WebSocket nodes + Redis to coordinate.
- **Backpressure** and **rate limiting** to survive traffic spikes.

---

## 2) Component diagram (text)

```
React Native App
   |  HTTPS (REST)                     WebSocket (WSS)
   |-----------------------------------------|
   v                                         v
[API / Auth / Chat REST]               [WS Gateway Cluster]
 Express.js + Prisma                    Express.js WS servers
   |                                         |
   |-------------------- Redis --------------|
   |      (cache, presence, pubsub, streams) |
   v                                         v
 Postgres (messages, conversations, receipts)  Push Notifications (FCM/APNs)
```

---

## 3) Core services & responsibilities

### 3.1 Express.js REST API
- Auth (JWT)
- Conversation list
- Message history (pagination, search)
- Upload metadata (optional: media attachments)
- Delivery/read receipts queries (optional)

### 3.2 WebSocket Gateway (Express + ws / socket.io)
- Connection auth (JWT)
- Subscribe user to their channel(s)
- Handle send message, typing, presence
- Emit message events to receiver if online
- Emit ACKs back to sender
- Enforce rate limits & payload limits

### 3.3 Redis
Use Redis for **fast coordination** across many WS nodes:
- **Presence:** `SETEX presence:user:{userId} = nodeId|timestamp`
- **User-to-socket routing:** `HSET sockets:{nodeId} {userId} -> socketId` (local + shared mapping if needed)
- **Pub/Sub:** deliver events across nodes (message to user, typing, presence)
- **Streams (recommended):** durable-ish event bus with consumer groups for retries
- **Cache:** conversation list, unread counts, last message, etc.
- **Distributed rate limiting:** token bucket/leaky bucket per user/IP

### 3.4 PostgreSQL (Prisma)
- Source of truth for:
  - Users
  - Conversations (1:1)
  - Messages
  - Message status (sent/delivered/read)
  - Device tokens (push)

---

## 4) Data model (Prisma-oriented)

### 4.1 Conversations (1:1 only)
- A conversation is uniquely identified by a **pair of userIds**.
- Ensure uniqueness via normalized pair `(userA, userB)`.

### 4.2 Suggested Prisma schema (example)

```prisma
model User {
  id        String   @id @default(uuid())
  phone     String?  @unique
  email     String?  @unique
  name      String?
  createdAt DateTime @default(now())
  devices   DeviceToken[]
}

model Conversation {
  id        String   @id @default(uuid())

  // normalized pair for 1:1 uniqueness
  userAId   String
  userBId   String

  userA     User     @relation(fields: [userAId], references: [id])
  userB     User     @relation(fields: [userBId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  lastMsgAt DateTime?
  lastMsgId String?

  messages  Message[]

  @@unique([userAId, userBId])
  @@index([userAId, lastMsgAt])
  @@index([userBId, lastMsgAt])
}

model Message {
  id             String   @id @default(uuid())
  conversationId String
  senderId       String
  receiverId     String

  type           String   @default("text") // text, image, file, etc.
  text           String?
  payloadJson    Json?
  clientMsgId    String?  // idempotency key from client
  createdAt      DateTime @default(now())

  // status timestamps
  deliveredAt    DateTime?
  readAt         DateTime?

  conversation   Conversation @relation(fields: [conversationId], references: [id])

  @@index([conversationId, createdAt])
  @@index([receiverId, deliveredAt, createdAt])
  @@unique([senderId, clientMsgId])
}

model DeviceToken {
  id        String   @id @default(uuid())
  userId    String
  platform  String   // ios/android
  token     String   @unique
  createdAt DateTime @default(now())
  lastSeenAt DateTime?

  user      User     @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

**Notes**
- `clientMsgId` lets you safely retry sends without duplicates.
- For conversation uniqueness, always store `(min(userId), max(userId))`.

---

## 5) Realtime protocol (events)

Use JSON frames over WebSocket. Example event envelope:

```json
{
  "type": "chat.message.send",
  "id": "event-uuid",
  "ts": 1700000000000,
  "data": { "...": "..." }
}
```

### 5.1 Required events
- `auth` (client -> server): JWT handshake
- `presence.ping` (client -> server): heartbeat
- `presence.update` (server -> client): online/offline/lastSeen
- `chat.message.send` (client -> server)
- `chat.message.ack` (server -> client): accepted by server + messageId
- `chat.message.delivered` (server -> sender)
- `chat.message.read` (server -> sender)
- `chat.typing` (client -> server, server -> receiver)

---

## 6) Heartbeat / presence design

### 6.1 Client heartbeat
- Client sends `presence.ping` every **15–25s** (jitter to avoid thundering herd).
- Server writes presence TTL to Redis:
  - `SETEX presence:user:{userId} 60 "{nodeId}:{now}"`

### 6.2 Online/offline calculation
- Online if presence key exists.
- Offline if key is missing (TTL expired) OR socket disconnect event.

### 6.3 Last seen
- On disconnect (or TTL expire), write `lastSeenAt` to Postgres **asynchronously** (queue/stream).

**Why TTL?**  
It handles crashes and network cuts without relying purely on disconnect events.

---

## 7) Message lifecycle (durable + fast)

### 7.1 Send flow (online receiver)
1. Client -> WS: `chat.message.send {receiverId, text, clientMsgId}`
2. WS gateway:
   - Auth + validate
   - Resolve conversation (create if not exists)
   - Insert message in Postgres (transaction)
   - Publish event in Redis (Pub/Sub or Streams)
3. Receiver’s WS node:
   - If receiver is online, emit `chat.message.new` to receiver socket
   - Receiver replies `chat.message.delivered` (or server auto-marks delivered when emitted)
4. Update Postgres `deliveredAt` and notify sender.

### 7.2 Send flow (offline receiver)
1. Store message in Postgres.
2. Send push notification via FCM/APNs (async).
3. When receiver reconnects:
   - Client calls REST `GET /messages?since=...` or WS `sync`
   - Server returns undelivered messages; client ACKs delivered/read.

---

## 8) Offline user handling (reliable sync)

### 8.1 On reconnect
- Client sends `sync` with:
  - last received message timestamp per conversation OR a global cursor
  - last delivered/read markers

### 8.2 Server returns
- Missing messages (pagination)
- Current presence of peer
- Unread counts & last read positions

### 8.3 Idempotency
- Client sends `clientMsgId` for each message.
- Server enforces `@@unique([senderId, clientMsgId])` to avoid duplicates.

---

## 9) Scaling strategy (high load)

### 9.1 Horizontal scaling of WS nodes
- Multiple WS servers behind a load balancer.
- Prefer **sticky sessions** (consistent hashing by userId) for lower cross-node chatter.
  - If no sticky sessions, Redis routing still works, but more coordination needed.

### 9.2 Redis usage patterns
**Option A (simple): Pub/Sub**
- Publish to `user:{receiverId}` channel.
- Any node subscribed can deliver to local sockets.
- Lightweight, but Pub/Sub is not durable.

**Option B (recommended): Redis Streams**
- Append chat events to stream `stream:chat`.
- Consumer group per WS node or per shard.
- Allows retry if a node crashes mid-delivery.

### 9.3 Sharding
For very high scale:
- Shard by userId hash:
  - Presence keys remain global, but streams/topics can be sharded:
    - `stream:chat:{shard}` or `channel:user:{shard}:{userId}`

### 9.4 Postgres performance
- Index `conversationId, createdAt` for history pagination.
- Partition `Message` by time or conversation (optional, large scale).
- Use read replicas for history reads if needed.

---

## 10) Fault tolerance

### 10.1 Node crash
- Presence TTL expires → user becomes offline automatically.
- Redis Streams consumer groups can reassign pending messages.
- Clients auto-reconnect to another WS node.

### 10.2 Redis outage
- Degrade gracefully:
  - WS node can still accept messages by writing to Postgres.
  - Presence becomes unreliable; show “unknown” instead of online.
- Use Redis Sentinel / Cluster for HA in production.

### 10.3 Postgres outage
- Reject message sends (return error) or queue locally (not recommended unless you can guarantee durability).
- Use managed Postgres with HA, backups, PITR.

---

## 11) High responsiveness (latency tactics)

- Keep WS handlers **non-blocking**:
  - Write to Postgres, then publish to Redis.
  - Push notifications and analytics happen async.
- Use **connection pooling** (pgBouncer in transaction mode).
- Cache conversation list + last message in Redis.
- Reduce payload size (gzip for REST, compact JSON for WS).

---

## 12) Delivery receipts & read receipts

### 12.1 Delivered
- Mark `deliveredAt` when:
  - Server emits to receiver socket **and** receives `delivered` ACK; OR
  - Receiver fetches via sync and ACKs.

### 12.2 Read
- Mark `readAt` when receiver opens conversation and sends `read` with last message id/ts.

**Tip:** store “lastReadMessageId” per conversation per user for fast unread computation.

---

## 13) Security

- JWT auth for WS + REST.
- Validate that user can only access conversations they belong to.
- Rate limit:
  - per IP for handshake
  - per user for message send (e.g., 10 msg/sec burst)
- Payload limits (text length, attachments via signed URLs).
- Encrypt in transit (TLS), consider at-rest encryption (managed DB).

---

## 14) Suggested API endpoints

### REST
- `POST /auth/login`
- `GET /conversations?cursor=...`
- `GET /conversations/:id/messages?cursor=...&limit=...`
- `POST /conversations/:id/read` (lastReadMessageId)
- `POST /devices/register` (FCM/APNs token)

### WebSocket
- `auth`
- `presence.ping`
- `chat.message.send`
- `chat.typing`
- `chat.sync`

---

## 15) Operational checklist (production)

- **Load balancer** supports WebSocket (Nginx/ALB).
- **Sticky sessions** enabled (recommended).
- Redis: Sentinel/Cluster + memory alerts + eviction policy configured.
- Postgres: backups + PITR + monitoring (slow queries, locks).
- Observability:
  - metrics: WS connections, message send latency, Redis ops, DB latency
  - logs: correlation id per message event
  - tracing: request id across REST/WS handlers
- Chaos test:
  - kill WS nodes
  - disconnect Redis
  - slow Postgres

---

## 16) Minimal message flow sequence

### Online receiver
1. Sender WS -> `send`
2. Server stores in Postgres
3. Server publishes via Redis
4. Receiver WS gets `new_message`
5. Receiver -> `delivered`
6. Server updates deliveredAt + notifies sender

### Offline receiver
1. Sender WS -> `send`
2. Server stores in Postgres
3. Server triggers push notification
4. Receiver later reconnects -> `sync`
5. Server returns missing messages
6. Receiver ACKs delivered/read

---

## 17) Implementation choices (recommended libraries)

### Express.js
- `express` for REST
- `ws` or `socket.io` for WebSocket  
  - If you need fallbacks, reconnection helpers, and rooms: `socket.io`
  - If you want minimal overhead and full control: `ws`

### Redis
- `ioredis` (popular, stable)
- Use:
  - `SETEX` for presence
  - Streams for event bus if you need retries

### Prisma + Postgres
- Prisma migrations in CI/CD
- Use proper indexes (see schema section)

---

## 18) Extra: How to keep 500ms response under load
- REST endpoints return from cache when possible (conversation list, unread counts).
- Avoid N+1 queries; use Prisma `include/select` carefully.
- Keep WS message send path:
  - validate → write (transaction) → publish → ACK
- Push notification in background worker (BullMQ / custom worker), not inline.
