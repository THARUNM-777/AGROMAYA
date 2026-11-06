# ==============================================================
# AGROMAYA AI & Remote Sensing Microservice Dockerfile
# Sentinel-2 STAC Query Pipeline & OpenCV Biometric Face Engine
# ==============================================================

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV and network health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose microservice port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start Uvicorn FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
