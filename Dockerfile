# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Declare build-time args and expose them as env vars for next build
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_ALLOWED_HOSTS
ARG NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=false
ARG NEXT_PUBLIC_DEFAULT_DEMO_MODE=false

ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_ALLOWED_HOSTS=$NEXT_PUBLIC_ALLOWED_HOSTS
ENV NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=$NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS
ENV NEXT_PUBLIC_DEFAULT_DEMO_MODE=$NEXT_PUBLIC_DEFAULT_DEMO_MODE

# Build the application (env vars are now baked in)
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["pnpm", "start"]