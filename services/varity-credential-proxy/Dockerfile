# Varity Credential Proxy - Docker Image
# Secure credential management for Varity infrastructure

FROM python:3.11-slim
LABEL org.opencontainers.image.source="https://github.com/varity-labs/varity-sdk"

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/

# Create non-root user for security
RUN useradd -m -u 1000 varity && chown -R varity:varity /app
USER varity

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health').read()" || exit 1

# Run application
CMD ["python3", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
