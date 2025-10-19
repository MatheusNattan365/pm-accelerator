# Use Ubuntu base image for better Playwright compatibility
FROM ubuntu:22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install Python 3.11 and system dependencies
RUN apt-get update && apt-get install -y \
    software-properties-common \
    && add-apt-repository ppa:deadsnakes/ppa \
    && apt-get update && apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-unifont \
    && rm -rf /var/lib/apt/lists/*

# Create symlinks for python and pip
RUN rm -f /usr/bin/python3 /usr/bin/pip && \
    ln -s /usr/bin/python3.11 /usr/bin/python && \
    ln -s /usr/bin/python3.11 /usr/bin/python3 && \
    ln -s /usr/bin/pip3 /usr/bin/pip

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers
RUN playwright install chromium

# Install Playwright system dependencies
RUN playwright install-deps chromium

# Copy application code
COPY main.py .
COPY env.example .

# Create log directory
RUN mkdir -p /app/logs

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
