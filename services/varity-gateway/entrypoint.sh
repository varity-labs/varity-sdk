#!/bin/sh
# Start Caddy (TLS termination) in the background, then run Node.js
caddy start --config /etc/caddy/Caddyfile
exec node dist/index.js
