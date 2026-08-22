# Build stage
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

FROM base AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .

ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_ALLOWED_HOSTS
ARG NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=false
ARG NEXT_PUBLIC_DEFAULT_DEMO_MODE=false
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_ALLOWED_HOSTS=$NEXT_PUBLIC_ALLOWED_HOSTS
ENV NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=$NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS
ENV NEXT_PUBLIC_DEFAULT_DEMO_MODE=$NEXT_PUBLIC_DEFAULT_DEMO_MODE

RUN yarn build

# Production stage
FROM base AS runner
WORKDIR /app
ENV HOME=/home/node
ENV COREPACK_HOME=/home/node/.cache/node/corepack
ENV NEXT_TELEMETRY_DISABLED=1

# Copy everything from builder; no second install at all
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p /home/node/.cache/node/corepack /app/.next/cache && \
    chown -R node:node /app /home/node
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/health || exit 1
CMD ["sh", "-c", "node_modules/.bin/next start -p ${PORT:-3000}"]
