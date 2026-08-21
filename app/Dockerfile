# --- Build stage -----------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Runtime stage -----------------------------------------------------------
FROM nginx:1.29-alpine AS runtime

# Pick up the latest Alpine security patches at build time rather than
# pinning to whatever the base image tag happened to ship with.
RUN apk update && apk upgrade --no-cache && apk add --no-cache curl

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
  && chown -R appuser:appgroup /usr/share/nginx/html /var/cache/nginx /var/run \
  && touch /var/run/nginx.pid \
  && chown appuser:appgroup /var/run/nginx.pid

USER appuser
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD curl -f http://localhost:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
