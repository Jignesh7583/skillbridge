#!/bin/bash
set -e

echo "=== Starting SkillBridge AI Unified Stack ==="

# 1. Start Python ML Engine in the background on port 5001
echo "Starting Python ML Engine on port 5001..."
python3 ml-engine/app.py &

# Wait 2 seconds for ML engine to initialize
sleep 2

# 2. Ensure database schema is up-to-date
echo "Syncing Prisma database..."
cd /app/backend
npx prisma db push --accept-data-loss || true

# 3. Start Node.js Express server (serves React frontend + /api) on $PORT
echo "Starting Express Web Server on port ${PORT:-5000}..."
exec npx tsx src/index.ts
