#!/bin/bash

# Varity S3 Gateway - Quick Start Script

set -e

echo "============================================"
echo "Varity S3 Gateway - Quick Start"
echo "============================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js 16+ from https://nodejs.org"
    exit 1
fi

echo "Node.js version: $(node -v)"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please edit .env with your credentials"
    echo ""
fi

# Build TypeScript
echo "Building TypeScript..."
npm run build
echo ""

# Run tests (if available)
if [ -d "src/__tests__" ]; then
    echo "Running tests..."
    npm test
    echo ""
fi

echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "To start the server:"
echo "  Development: npm run dev"
echo "  Production:  npm start"
echo ""
echo "The server will run on http://localhost:3001"
echo ""
