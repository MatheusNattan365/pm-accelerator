import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import weatherRoutes from './routes/weather.routes';
import recordsRoutes from './routes/records.routes';
import { errorHandler, notFoundHandler } from './middleware/error';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Weather API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/weather', weatherRoutes);
app.use('/api/records', recordsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Weather API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      weather: {
        search: 'POST /api/weather/search',
        current: 'GET /api/weather/current/:location',
        coordinates: 'GET /api/weather/coordinates/:lat/:lon',
        geocode: 'GET /api/weather/geocode/:location'
      },
      records: {
        list: 'GET /api/records',
        get: 'GET /api/records/:id',
        update: 'PUT /api/records/:id',
        delete: 'DELETE /api/records/:id',
        export: 'GET /api/records/export/all?format=json|csv|md'
      }
    }
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DBNAME;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    await mongoose.connect(mongoURI, {dbName});
    console.log('✅ Connected to MongoDB');
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = (signal: string): void => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  mongoose.connection.close().then(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close MongoDB connection in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database first
    await connectDB();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Weather API Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 API docs: http://localhost:${PORT}/`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📝 Allowed origins: ${allowedOrigins.join(', ')}`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
if (require.main === module) {
  startServer();
}

export default app;
