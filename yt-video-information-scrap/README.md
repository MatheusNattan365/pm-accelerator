# YouTube Search Scraper API

A FastAPI service that scrapes YouTube search results using Playwright and Chromium in headless mode.

## Features

- **FastAPI** web framework with automatic API documentation
- **Playwright** with Chromium for reliable web scraping
- **Async concurrency limiting** with asyncio.Semaphore(3)
- **CORS support** with configurable origins
- **Docker support** with optimized containerization
- **Consent banner handling** for GDPR compliance
- **Incremental scrolling** to load more results
- **Comprehensive logging** with detailed process tracking

## API Endpoints

### GET /search

Search YouTube for videos and return structured results.

**Query Parameters:**
- `q` (string, required): Search term
- `maxResults` (int, optional): Maximum number of results (1-50, default: 10)
- `hl` (string, optional): Language code (default: "en")
- `gl` (string, optional): Country code (default: "US")

**Response:**
```json
{
  "videos": [
    {
      "title": "Video Title",
      "url": "https://www.youtube.com/watch?v=...",
      "thumbnail": "https://i.ytimg.com/vi/.../hqdefault.jpg",
      "channelTitle": "Channel Name"
    }
  ],
  "total_results": 10
}
```

## Quick Start with Docker

### Build and Run

```bash
# Build the Docker image
docker build -t yt-playwright-api .

# Run the container
docker run --rm -p 8000:8000 yt-playwright-api
```

### Using Docker Compose

```bash
# Start the service
docker-compose up --build

# Run in background
docker-compose up -d --build
```

## API Usage

### Sample curl command

```bash
curl "http://localhost:8000/search?q=python%20tutorial&maxResults=5"
```

### Health Check

```bash
curl "http://localhost:8000/health"
```

### API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# CORS Configuration
CORS_ALLOW_ORIGINS=*

# Optional: Override default port
# PORT=8000
```

## Local Development

### Prerequisites

- Python 3.11+
- pip

### Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Run the application
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Project Structure

```
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── env.example         # Environment variables template
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose configuration
├── .dockerignore       # Docker ignore file
└── README.md           # This file
```

## Logging

The application includes comprehensive logging to track the entire scraping process:

- **Log Levels**: INFO (main process), DEBUG (detailed steps), WARNING (non-critical issues), ERROR (failures)
- **Log Output**: Both console and file (`yt_scraper.log`)
- **Process Tracking**: Browser initialization, page navigation, consent handling, video extraction, scrolling
- **Performance Metrics**: Timing information for each major operation
- **Error Details**: Detailed error messages with context

### Log Examples

```
2024-01-15 10:30:15 - __main__ - INFO - Starting YouTube search: query='python tutorial', maxResults=5
2024-01-15 10:30:15 - __main__ - INFO - Acquired semaphore, starting scraping process...
2024-01-15 10:30:16 - __main__ - INFO - Chromium browser launched successfully in 1.23s
2024-01-15 10:30:17 - __main__ - INFO - Successfully navigated to YouTube search page
2024-01-15 10:30:18 - __main__ - INFO - No consent banners found
2024-01-15 10:30:20 - __main__ - INFO - Found 20 video elements on page
2024-01-15 10:30:21 - __main__ - INFO - Search completed successfully in 6.45s. Found 5 videos
```

## Technical Details

- **Concurrency**: Limited to 3 concurrent requests using asyncio.Semaphore
- **Browser**: Chromium in headless mode with optimized flags
- **Scraping**: Handles consent banners and incremental scrolling
- **Thumbnails**: Falls back to YouTube's thumbnail API if missing
- **Error Handling**: Comprehensive error handling with HTTP status codes
- **Logging**: Detailed process tracking with performance metrics

## License

MIT License
