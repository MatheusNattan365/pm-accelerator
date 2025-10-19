# Docker Setup for Weather Application

This project includes Docker configuration for running both the frontend and backend services together with hot reloading during development.

## Prerequisites

- Docker and Docker Compose installed on your machine
- MongoDB Atlas account and cluster (for database)
- Git (to clone the repository)

## Quick Start

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd pm-accelerator
   ```

2. **Set up MongoDB Atlas**:
   - Create a MongoDB Atlas account at https://www.mongodb.com/atlas
   - Create a new cluster
   - Create a database user with read/write permissions
   - Get your connection string from the Atlas dashboard

3. **Set up environment variables**:
   ```bash
   # Copy the example environment file
   cp docker.env.example .env
   
   # Edit the .env file and replace the MONGODB_URI with your Atlas connection string
   # Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/weather_db
   ```

4. **Build and start all services**:
   ```bash
   docker-compose up --build
   ```

5. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - API Health Check: http://localhost:4000/health
   - YouTube Scraper API: http://localhost:8000

## Services

### Frontend (Port 3000)
- React application with Vite
- Hot reloading enabled
- Source code mounted for live updates

### Backend (Port 4000)
- Node.js/Express API server
- TypeScript with ts-node-dev for hot reloading
- Source code mounted for live updates
- Connects to MongoDB Atlas for data persistence

### YouTube Scraper (Port 8000)
- FastAPI Python application
- Playwright for web scraping
- YouTube video information extraction
- Source code mounted for live updates

## Development Workflow

### Hot Reloading
All services support hot reloading:
- **Frontend**: Changes to React components, styles, and other assets will automatically refresh the browser
- **Backend**: Changes to TypeScript files will automatically restart the server
- **YouTube Scraper**: Changes to Python files will automatically restart the FastAPI server

### Making Changes
1. Edit files in the `front/src`, `back/src`, or `yt-video-information-scrap/` directories
2. Changes will be automatically detected and the respective service will reload
3. No need to rebuild Docker images during development

### Adding Dependencies
If you need to add new dependencies:

**For Backend:**
```bash
# Stop the services
docker-compose down

# Add dependency to back/package.json
# Then rebuild
docker-compose up --build backend
```

**For Frontend:**
```bash
# Stop the services
docker-compose down

# Add dependency to front/package.json
# Then rebuild
docker-compose up --build frontend
```

**For YouTube Scraper:**
```bash
# Stop the services
docker-compose down

# Add dependency to yt-video-information-scrap/requirements.txt
# Then rebuild
docker-compose up --build yt-scraper
```

## Docker Commands

### Start all services
```bash
docker-compose up
```

### Start services in background
```bash
docker-compose up -d
```

### Build and start (force rebuild)
```bash
docker-compose up --build
```

### Stop all services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs yt-scraper
```

### Access container shell
```bash
# Backend container
docker-compose exec backend sh

# Frontend container
docker-compose exec frontend sh

# YouTube Scraper container
docker-compose exec yt-scraper bash
```

## Environment Variables

The following environment variables can be customized in your `.env` file:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | **Yes** | MongoDB Atlas connection string |
| `MONGODB_DBNAME` | No | Database name (defaults to `weather_db`) |
| `NODE_ENV` | No | Node.js environment (defaults to `development`) |
| `PORT` | No | Backend server port (defaults to `4000`) |
| `ALLOWED_ORIGINS` | No | CORS allowed origins (defaults to `http://localhost:3000,http://frontend:3000`) |
| `CORS_ALLOW_ORIGINS` | No | YouTube Scraper CORS origins (defaults to `*`) |

## Troubleshooting

### Port Already in Use
If you get port conflicts:
```bash
# Check what's using the ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :4000
netstat -tulpn | grep :8000

# Stop conflicting services or change ports in docker-compose.yml
```

### Database Connection Issues
```bash
# Check backend logs for MongoDB connection errors
docker-compose logs backend

# Verify your MongoDB Atlas connection string in .env file
# Make sure your IP address is whitelisted in MongoDB Atlas
# Check that your database user has proper permissions
```

### Permission Issues (Linux/Mac)
```bash
# Fix ownership of mounted volumes
sudo chown -R $USER:$USER ./front/src
sudo chown -R $USER:$USER ./back/src
sudo chown -R $USER:$USER ./yt-video-information-scrap/
```

### Clean Build
```bash
# Remove all containers and networks
docker-compose down

# Remove all images
docker-compose down --rmi all

# Rebuild from scratch
docker-compose up --build
```

## Production Deployment

For production deployment, you would typically:
1. Create production Dockerfiles (without development dependencies)
2. Use production environment variables
3. Set up proper logging and monitoring
4. Use a reverse proxy (nginx)
5. Set up SSL certificates

This current setup is optimized for development with hot reloading.
