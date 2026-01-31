#!/bin/bash

# Varity Monitoring Quick Start Script

set -e

echo "🚀 Starting Varity Monitoring Server..."

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if build exists
if [ ! -d "dist" ]; then
    echo "🔨 Building TypeScript..."
    npm run build
fi

# Set default environment variables
export METRICS_PORT=${METRICS_PORT:-9090}
export NODE_ENV=${NODE_ENV:-development}
export DEFAULT_METRICS_INTERVAL=${DEFAULT_METRICS_INTERVAL:-10000}
export AGGREGATION_INTERVAL=${AGGREGATION_INTERVAL:-30000}

echo ""
echo "✅ Configuration:"
echo "   Port: $METRICS_PORT"
echo "   Environment: $NODE_ENV"
echo "   Metrics Interval: ${DEFAULT_METRICS_INTERVAL}ms"
echo "   Aggregation Interval: ${AGGREGATION_INTERVAL}ms"
echo ""

# Start the server
echo "🎯 Starting metrics server..."
npm run dev
