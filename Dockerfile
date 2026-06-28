# --- Stage 1: build the React frontend ---
FROM node:20-slim AS frontend
WORKDIR /web/frontend
COPY web/frontend/package*.json ./
RUN npm install
COPY web/frontend/ ./
RUN npm run build

# --- Stage 2: Python backend that serves the built frontend + API ---
FROM python:3.12-slim
WORKDIR /app
COPY web/backend/requirements.txt ./web/backend/requirements.txt
RUN pip install --no-cache-dir -r web/backend/requirements.txt
# Copy the whole project (backend imports utils/recommender/logos from the root)
COPY . .
# Bring in the compiled frontend from stage 1
COPY --from=frontend /web/frontend/dist ./web/frontend/dist
WORKDIR /app/web/backend
ENV PORT=8000
# Render provides $PORT; shell form lets it expand.
CMD uvicorn api:app --host 0.0.0.0 --port $PORT
