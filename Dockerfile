FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN npm install

# Copy source
COPY apps/api/ ./apps/api/
COPY packages/ ./packages/
COPY tsconfig.base.json ./
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/nest-cli.json ./apps/api/

# Generate Prisma client and build
WORKDIR /app/apps/api
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN npm install --omit=dev

COPY apps/api/ ./apps/api/
COPY packages/ ./packages/
COPY --from=base /app/apps/api/node_modules/.prisma ./apps/api/node_modules/.prisma
COPY --from=base /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api
EXPOSE 10000
CMD ["node", "dist/main"]
