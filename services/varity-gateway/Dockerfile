FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM caddy:2 AS caddy

FROM node:20-slim
LABEL org.opencontainers.image.source="https://github.com/varity-labs/varity-sdk"
WORKDIR /app

# Copy Caddy binary from official image (avoids fragile curl installs)
COPY --from=caddy /usr/bin/caddy /usr/bin/caddy

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist/ ./dist/
COPY Caddyfile /etc/caddy/Caddyfile
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Caddy cert storage for non-root user
ENV XDG_DATA_HOME=/data
ENV XDG_CONFIG_HOME=/config

RUN mkdir -p /data/caddy /config/caddy \
  && useradd -m varity \
  && chown -R varity:varity /app /data /config

USER varity

EXPOSE 8080 8081 8443

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://localhost:8080/health').then(r=>{if(!r.ok)throw 1;process.exit(0)}).catch(()=>process.exit(1))"

CMD ["/app/entrypoint.sh"]
