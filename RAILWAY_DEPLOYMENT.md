# Railway Deployment

This repo is set up to deploy to Railway as 3 app services built from the same `Dockerfile`:

- `carpooling-api`
- `carpooling-mail-worker`
- `carpooling-sms-worker`

Each service uses the same image and switches behavior with `PROCESS_TYPE`.

Template files derived from the local `.env` layout are included here:

- `railway.shared.env.example`
- `railway.api.env.example`
- `railway.mail-worker.env.example`
- `railway.sms-worker.env.example`

## 1. Create Railway Services

In one Railway project, provision:

1. PostgreSQL
2. Redis
3. `carpooling-api`
4. `carpooling-mail-worker`
5. `carpooling-sms-worker`

Point all 3 app services at this repo and let Railway build from the root `Dockerfile`.

## 2. Shared Variables

Set these on all 3 app services:

- `NODE_ENV=production`
- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `REDIS_URL=${{Redis.REDIS_URL}}`
- `ACCESS_TOKEN_SECRET=...`
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

Optional compatibility variable:

- `JWT_SECRET=...`

`ACCESS_TOKEN_SECRET` is now the canonical access-token secret. `JWT_SECRET` is only kept as a legacy fallback for older environments.

## 3. Firebase Configuration

For Railway, prefer one of these:

- `FIREBASE_SERVICE_ACCOUNT_JSON=...`
- `FIREBASE_SERVICE_ACCOUNT_BASE64=...`

Local file-based fallback is still supported:

- `FIREBASE_SERVICE_ACCOUNT_PATH=...`
- `GOOGLE_APPLICATION_CREDENTIALS=...`

On Railway, do not set `FIREBASE_SERVICE_ACCOUNT_PATH` or `GOOGLE_APPLICATION_CREDENTIALS` unless that JSON file actually exists inside the deployed container. Remove stale local paths such as `/app/...firebase-adminsdk....json`; use `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_SERVICE_ACCOUNT_BASE64` instead.

If Firebase is not configured, the app will still boot, but push notifications will be disabled.

## 4. Per-Service Variables

Set this on each service:

- API: `PROCESS_TYPE=api`
- Mail worker: `PROCESS_TYPE=mail-worker`
- SMS worker: `PROCESS_TYPE=sms-worker`

Do not manually set `PORT` on Railway. Railway injects it for web services.

## 5. Railway Service Settings

For `carpooling-api`:

1. Set the healthcheck path to `/health`
2. Add a pre-deploy command:

```bash
npx prisma migrate deploy
```

3. Generate a Railway domain or attach a custom domain

For the worker services, no HTTP healthcheck is needed.

## 6. Deploy Verification

After deployment:

1. API logs should show the server booting on the Railway-assigned port
2. Hitting `/health` should return `{"status":"ok"}`
3. Mail worker logs should show the worker process starting
4. SMS worker logs should show the worker process starting
5. Jobs enqueued by the API should be consumed by the worker services

## 7. Local Docker Check

To verify the container image locally before Railway:

```bash
docker compose up --build -d
docker compose logs -f api
docker compose logs -f mail-worker
docker compose logs -f sms-worker
```

`docker-compose.yml` is only for local development. On Railway, use Railway-managed PostgreSQL and Redis instead of the local Compose database containers.
