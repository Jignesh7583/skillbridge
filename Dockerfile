# Multi-service Unified Dockerfile for SkillBridge AI
# Runs React (built into static files), Express Backend, and Python ML Engine in one container
FROM node:20-bookworm-slim

# Install Python & system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Setup Python ML Engine in isolated virtual environment
COPY ml-engine/ ml-engine/
RUN python3 -m venv /app/ml-engine/venv \
    && /app/ml-engine/venv/bin/pip install --no-cache-dir flask flask-cors

# 2. Build Frontend (outputs static files to frontend/dist)
COPY frontend/package*.json frontend/
RUN cd frontend && npm install
COPY frontend/ frontend/
RUN cd frontend && npm run build

# 3. Setup Backend
COPY backend/package*.json backend/
RUN cd backend && npm install
COPY backend/ backend/
RUN cd backend && npx prisma generate

# 4. Setup Startup Script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Environment settings
EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production
ENV PATH="/app/ml-engine/venv/bin:$PATH"

CMD ["/app/start.sh"]
