# Carpooling Backend: Tech Stack and Future Scope

## Current Stack Overview

This project is a TypeScript-based backend API for a carpooling platform.

Active core stack: `Node.js + Express + Prisma + PostgreSQL + Redis + Socket.IO + BullMQ`.

## Tech Stack With Individual Future Scope

| Layer | Technology | How It Is Used In This Project | Future Scope (Per Technology) |
|---|---|---|---|
| Language | TypeScript | Main codebase language across `src/` with strict typing for modules and services. | Increase type-safety by enabling stricter TS compiler flags and shared API contracts for frontend/mobile clients. |
| Runtime | Node.js (Docker base: `node:18-alpine`) | Runs API server and workers in all environments. | Upgrade to current LTS for better performance, security updates, and longer support window. |
| API Framework | Express 5 | REST API (`/api/v1/*`) with modular routes/controllers/middlewares. | Add versioned APIs and OpenAPI-generated validation/clients for faster integration scaling. |
| Validation | Zod | Request payload validation in module validators. | Reuse schemas for request/response docs and typed client SDK generation. |
| Authentication | JWT + bcryptjs | Access/refresh token auth with password hashing and protected routes. | Move toward key rotation, token revocation lists in Redis, and optional OAuth/social login. |
| ORM / DB Access | Prisma 7 (`@prisma/client`, `@prisma/adapter-pg`) | Main data access layer for users, rides, bookings, chat, notifications. | Add read/write split, query optimization, and Prisma Accelerate or pooling strategy for higher concurrency. |
| Primary Database | PostgreSQL (via `DATABASE_URL`) | Source of truth for transactional domain data and relationships. | Add replicas, partitioning for chat/notification-heavy tables, and backup/restore automation. |
| Cache / Ephemeral State | Redis (`ioredis`) | OTP, drafts, presence, maps cache, notifications count, and transient app state. | Add cache key standards, metrics, and eviction strategy tuning for predictable latency at scale. |
| Realtime | Socket.IO + Redis Adapter | 1:1 chat delivery, typing indicators, read receipts, online presence, cross-instance signaling. | Expand to resilient offline sync, event replay, and multi-region realtime architecture. |
| Background Processing | BullMQ | Queue-based async jobs for mail and SMS workers. | Add dead-letter queues, retry policies by error class, and queue observability dashboards. |
| Email | Nodemailer | Outbound transactional emails from background worker. | Replace/augment SMTP with managed providers (SES/SendGrid) for deliverability analytics. |
| SMS | Twilio | OTP/notification SMS sending via dedicated worker. | Add regional providers/fallback routing and delivery status webhooks for reliability. |
| Push Notifications | Firebase Admin (FCM) | Device token management and push delivery for mobile notifications. | Add topic-based delivery, notification preferences, and per-device delivery analytics. |
| File Storage | AWS S3 (`@aws-sdk/client-s3`, `multer-s3`) | Upload and store avatars, vehicle media, and documents. | Add signed URL flow, lifecycle policies, CDN fronting, and malware scanning pipeline. |
| Maps / Routing | Google Maps APIs + `@mapbox/polyline` | Places autocomplete, route computation, multi-route options, road snapping. | Add provider abstraction for cost control and fallback routing provider support. |
| Resilience / Security Middleware | Opossum, helmet, cors, express-rate-limit, connect-timeout | Circuit breaker for external calls, API hardening, and basic abuse protection. | Add distributed rate limits, WAF integration, and end-to-end resilience testing. |
| Scheduler | node-cron | Periodic fuel-price refresh job. | Move scheduled workloads to external scheduler/queue orchestration for better reliability. |
| Logging | Winston | Structured logs with console + production file transport. | Centralize logs (ELK/Datadog/OpenSearch) with request correlation IDs and alerting. |
| Testing | Jest + Supertest | API and auth flow tests (currently partial and mixed with legacy patterns). | Expand integration and contract tests; add CI gates for coverage and regression protection. |
| Deployment / Process Mgmt | Docker, Docker Compose, PM2 | Containerization for app and worker processes; PM2 process definitions for production. | Add CI/CD pipelines, environment parity, autoscaling strategy, and zero-downtime deploys. |

## Legacy / Transition Notes

- Mongoose/MongoDB files still exist (`src/models/*`, `src/config/database.ts`) but Prisma + PostgreSQL is the active data path in current modules.
- `docker-compose.yml` currently provisions `mongo` and `redis`; active Prisma setup needs PostgreSQL service for full local parity.
- Some old service code still references Mongoose refresh token operations; this should be aligned fully to Prisma.

## Suggested Near-Term Roadmap

1. Complete migration cleanup: remove remaining Mongoose paths and align all token flows to Prisma.
2. Update local infra: add PostgreSQL to Docker Compose and keep Redis as shared cache/queue backend.
3. Improve operability: add centralized logging, queue metrics, and CI checks for tests + migrations.
