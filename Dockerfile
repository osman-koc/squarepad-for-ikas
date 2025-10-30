# Use Node.js 20 slim as the base image
FROM node:24-slim AS base

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
# Allow install even if pnpm-lock.yaml is not perfectly in sync with package.json.
# For a stricter/safer approach, regenerate and commit pnpm-lock.yaml instead of using --no-frozen-lockfile.
RUN pnpm install --no-frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy files needed for build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables (use key=value form to avoid legacy warnings)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generate Prisma Client
RUN pnpm prisma generate

# Run build
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Use key=value form here too
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and migrations
COPY --from=builder /app/prisma ./prisma

USER nextjs

# Set environment variables for runtime
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Update next.config.js to output standalone
CMD ["node", "server.js"]