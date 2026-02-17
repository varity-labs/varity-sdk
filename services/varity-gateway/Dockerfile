FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-slim
LABEL org.opencontainers.image.source="https://github.com/varity-labs/varity-sdk"
WORKDIR /app

# Install Caddy for automatic TLS (Let's Encrypt)
RUN apt-get update && apt-get install -y --no-install-recommends \
    debian-keyring debian-archive-keyring apt-transport-https curl gnupg \
  && curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg \
  && curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list \
  && apt-get update && apt-get install -y --no-install-recommends caddy \
  && apt-get purge -y curl gnupg debian-keyring debian-archive-keyring apt-transport-https \
  && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist/ ./dist/
COPY Caddyfile /etc/caddy/Caddyfile
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Caddy needs write access to /data and /config for certs
RUN mkdir -p /data/caddy /config/caddy \
  && useradd -m varity \
  && chown -R varity:varity /app /data /config

USER varity

EXPOSE 80 443 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://localhost:8080/health').then(r=>{if(!r.ok)throw 1;process.exit(0)}).catch(()=>process.exit(1))"

CMD ["/app/entrypoint.sh"]
