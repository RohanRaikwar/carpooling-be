# Railway Deployment (API + Workers with Docker)

This project now supports one Docker image that can run 3 process types:

- `api`
- `mail-worker`
- `sms-worker`

The process is selected with `PROCESS_TYPE` environment variable.

## 1) Local Docker (quick check)

```bash
docker compose up --build -d
docker compose logs -f api
docker compose logs -f mail-worker
docker compose logs -f sms-worker
```

## 2) Railway Setup

Create these Railway services from the same GitHub repo and same `Dockerfile`:

1. `carpooling-api`
2. `carpooling-mail-worker`
3. `carpooling-sms-worker`

Also provision Railway database services:

1. PostgreSQL
2. Redis

## 3) Required Variables

Set these on **all 3 app services**:

- `NODE_ENV=production`
- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `REDIS_URL=${{Redis.REDIS_URL}}`
- `JWT_SECRET=...`
- `REFRESH_TOKEN_SECRET=...`
- `MAIL_HOST=...`
- `MAIL_PORT=...`
- `MAIL_USER=...`
- `MAIL_PASS=...`
- `MAIL_FROM=...`
- `TWILIO_ACCOUNT_SID=...`
- `TWILIO_AUTH_TOKEN=...`
- `TWILIO_PHONE_NUMBER=...`
- `AWS_ACCESS_KEY_ID=...`
- `AWS_SECRET_ACCESS_KEY=...`
- `AWS_REGION=...`
- `AWS_S3_BUCKET_NAME=...`
- `GOOGLE_MAPS_API_KEY=...`
- `FIREBASE_SERVICE_ACCOUNT_PATH=...` (or `GOOGLE_APPLICATION_CREDENTIALS`)

Set this per service:

- API service: `PROCESS_TYPE=api`
- Mail service: `PROCESS_TYPE=mail-worker`
- SMS service: `PROCESS_TYPE=sms-worker`

API service also needs:

- `PORT=${{PORT}}`

## 4) Deploy and Verify

After deploy:

1. API logs should show server boot (`Server running on port ...`).
2. Mail worker logs should show `Mail worker booting`.
3. SMS worker logs should show `SMS worker booting`.
4. Queue jobs created by API should be consumed by worker services.

## 5) Scaling Workers

To increase throughput, scale `carpooling-mail-worker` and `carpooling-sms-worker` independently in Railway.
