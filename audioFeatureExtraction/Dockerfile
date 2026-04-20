FROM python:3.12-slim

# Install system dependencies for Essentia and audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libavcodec-dev \
    libavformat-dev \
    libavutil-dev \
    libswresample-dev \
    libfftw3-dev \
    libtag1-dev \
    libyaml-dev \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uv/bin/

WORKDIR /app

# Copy dependency files
COPY pyproject.toml .
RUN /uv/bin/uv pip install --system .

# Copy source code
COPY . .

ENV NODE_ENV=production
EXPOSE 8000

CMD ["python", "main.py"]
