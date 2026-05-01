# ── Stage 1: build ───────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN npm install -g pnpm@10.33.2

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY client/package.json ./client/
COPY server/package.json ./server/

RUN pnpm install --frozen-lockfile

COPY client/ ./client/
COPY server/ ./server/

RUN pnpm build

# ── Stage 2: runtime ─────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN npm install -g pnpm@10.33.2

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY server/package.json ./server/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 5001

CMD ["node", "server/dist/index.js"]
