ARG NODE_IMAGE=node:22-alpine
ARG NPM_VERSION=10

FROM ${NODE_IMAGE} AS build

WORKDIR /app
ARG NPM_VERSION

RUN npm install -g npm@${NPM_VERSION}

COPY package*.json ./
RUN npm ci

COPY tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN npm run build
RUN npm prune --omit=dev

FROM ${NODE_IMAGE} AS runtime

WORKDIR /app
ARG NPM_VERSION
ENV NODE_ENV=production

RUN npm install -g npm@${NPM_VERSION}

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 3000

CMD ["/entrypoint.sh"]
