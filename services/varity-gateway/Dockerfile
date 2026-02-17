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

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist/ ./dist/

RUN useradd -m varity && chown -R varity:varity /app
USER varity

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://localhost:8080/health').then(r=>{if(!r.ok)throw 1;process.exit(0)}).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
