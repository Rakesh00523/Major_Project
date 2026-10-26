FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Ensure data directory exists and is writable by non-root node user
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 4001

HEALTHCHECK --interval=20s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4001/api/health || exit 1

CMD ["node", "server.mjs"]
