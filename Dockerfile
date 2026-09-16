# Build stage
FROM public.ecr.aws/docker/library/node:24-alpine AS base
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

FROM base AS builder
WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

ARG NODE_ENV=production
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_ALLOWED_HOSTS
ARG NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=false
ARG NEXT_PUBLIC_DEFAULT_DEMO_MODE=false

ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_ALLOWED_HOSTS=$NEXT_PUBLIC_ALLOWED_HOSTS
ENV NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=$NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS
ENV NEXT_PUBLIC_DEFAULT_DEMO_MODE=$NEXT_PUBLIC_DEFAULT_DEMO_MODE

RUN yarn build


# Production stage
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["yarn", "start"]
