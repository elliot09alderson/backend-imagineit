#!/bin/bash

# Exit on error
set -e

DOMAIN="imagineit.cloud"
EMAIL="support@imagineit.cloud"

echo "🚀 Starting deployment for $DOMAIN..."

# Create frontend-build directory if it doesn't exist
if [ ! -d "./frontend-build" ]; then
    echo "⚠️  frontend-build directory not found. Creating it..."
    mkdir -p ./frontend-build
    echo "Please copy your frontend build files (dist/*) into server/frontend-build/"
fi

# SSL setup skipped to avoid port conflicts
echo "⚠️  Skipping SSL setup. App will run on HTTP port 8080."

echo "🐳 Starting all services..."
docker compose up -d --build

echo "✅ Deployment Complete! Your app is running at https://$DOMAIN"
