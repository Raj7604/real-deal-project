const mongoose = require('mongoose');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'database' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class DatabaseConnection {
  constructor() {
    this.connection = null;
    this.connectionString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/realdeal';
  }

  async connect() {
    try {
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      this.connection = await mongoose.connect(this.connectionString, options);
      
      logger.info('MongoDB connected successfully');
      console.log('✅ MongoDB connected successfully');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
        console.error('❌ MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        console.warn('⚠️ MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        console.log('🔄 MongoDB reconnected');
      });

      return this.connection;
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      logger.info('MongoDB disconnected successfully');
      console.log('✅ MongoDB disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      return {
        status: states[state],
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      throw error;
    }
  }

  async clearCollections(collections = []) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clear collections in production environment');
    }

    try {
      const db = mongoose.connection.db;
      
      for (const collectionName of collections) {
        await db.collection(collectionName).deleteMany({});
        logger.info(`Cleared collection: ${collectionName}`);
      }
      
      console.log(`✅ Cleared collections: ${collections.join(', ')}`);
    } catch (error) {
      logger.error('Error clearing collections:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      const stats = {};

      for (const collection of collections) {
        const collStats = await db.collection(collection.name).stats();
        stats[collection.name] = {
          count: collStats.count,
          size: collStats.size,
          avgObjSize: collStats.avgObjSize,
          indexes: collStats.nindexes
        };
      }

      return stats;
    } catch (error) {
      logger.error('Error getting database stats:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const database = new DatabaseConnection();

module.exports = database;
