require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const database = require('./utils/database');

// Import routes
const productRoutes = require('./routes/products');
const locationRoutes = require('./routes/locations');
const scrapingRoutes = require('./routes/scraping');
const intelligenceRoutes = require('./routes/intelligence');
const apiIndexRoutes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    let dbHealth = { status: 'disconnected' };
    
    // Only try to check DB health if we have a connection
    if (mongoose.connection.readyState === 1) {
      dbHealth = await database.healthCheck();
    }
    
    res.status(200).json({
      status: mongoose.connection.readyState === 1 ? 'healthy' : 'limited',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      uptime: process.uptime(),
      message: mongoose.connection.readyState === 1 ? 'All systems operational' : 'Database not connected - limited functionality'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API routes
app.use('/api', apiIndexRoutes);
app.use('/api/products', productRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/scrape', scrapingRoutes);
app.use('/api/intelligence', intelligenceRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'RealDeal - Smart Grocery Price Comparison Platform',
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    links: {
      api: '/api',
      health: '/health',
      docs: '/api'
    }
  });
});

// Serve static files from frontend in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// 404 handler - must be after all other routes
app.use('*', (req, res) => {
  // Don't interfere with frontend static files in production
  if (process.env.NODE_ENV === 'production' && req.path.startsWith('/static')) {
    return res.status(404).send('Static file not found');
  }
  
  // API 404 response
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      error: 'API Endpoint Not Found',
      message: `Route ${req.originalUrl} not found`,
      availableEndpoints: {
        api: '/api',
        products: '/api/products',
        locations: '/api/locations',
        scraping: '/api/scrape', 
        intelligence: '/api/intelligence',
        health: '/health'
      },
      timestamp: new Date().toISOString()
    });
  }
  
  // General 404 response
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: {
      root: '/',
      api: '/api',
      health: '/health'
    },
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await database.disconnect();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    console.log('🔌 Connecting to database...');
    await database.connect();
    
    // Auto-seed database if empty
    try {
      const Product = require('./models/Product');
      const count = await Product.countDocuments();
      if (count === 0) {
        console.log('📦 Database is empty. Auto-seeding with realistic sample products...');
        const { seedDatabase } = require('./scripts/seed');
        await seedDatabase(false); // pass false so it doesn't disconnect the server! 
      }
    } catch (seedErr) {
      console.error('⚠️ Auto-seeding failed:', seedErr.message);
    }
    
    console.log('🚀 Starting Express server...');
    
    // Check if port is already in use
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API docs: http://localhost:${PORT}/api`);
      console.log('✅ Server started successfully!');
      
      // Cron Background Scheduler
      const cron = require('node-cron');
      cron.schedule('*/30 * * * *', async () => {
        console.log('⏰ Running 30-minute background scraping cache refresh...');
        try {
          const { scrapeAllPlatforms } = require('./services/scrapingService');
          const Location = require('./models/Location');
          const locations = await Location.find();
          for (const loc of locations) {
            await scrapeAllPlatforms(loc.city, loc.pincode);
          }
        } catch (err) {
          console.error('❌ Cron scrape error:', err.message);
        }
      });
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please stop the other server or use a different port.`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    
    // If MongoDB connection fails, still start server with limited functionality
    if (error.name === 'MongooseServerSelectionError' || error.message.includes('ECONNREFUSED')) {
      console.log('⚠️ MongoDB not available. Starting server in limited mode...');
      console.log('📝 Note: Database-dependent features will not work until MongoDB is running.');
      
      const server = app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} (limited mode)`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📍 Health check: http://localhost:${PORT}/health`);
        console.log(`🔗 API docs: http://localhost:${PORT}/api`);
        console.log('💡 To enable full functionality, start MongoDB and restart the server.');
        console.log('✅ Server started successfully (limited mode)!');
      });

      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${PORT} is already in use. Please stop the other server or use a different port.`);
        } else {
          console.error('❌ Server error:', error);
        }
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  }
}

startServer();

module.exports = app;
