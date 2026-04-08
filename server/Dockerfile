# ── Build stage ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Production stage ──
FROM node:20-alpine
WORKDIR /app

# Copy built output & prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Create uploads directory
RUN mkdir -p uploads/avatars uploads/pod

# Environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Start
CMD ["node", "dist/index.js"]
