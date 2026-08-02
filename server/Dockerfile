# Multi-stage build: 'builder' compiles TS -> JS, final image only ships
# production deps + compiled dist/, keeping the runtime image small and
# without dev tooling (tsx, typescript, ts-jest) that has no business
# being in production.
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 5000
CMD ["node", "dist/server.js"]
