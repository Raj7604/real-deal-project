# RealDeal - Smart Grocery Price Comparison Platform

## Quick Setup Guide

This guide will help you set up and run the RealDeal platform on your local machine.

## Prerequisites

- Node.js 16+ and npm
- MongoDB running on localhost:27017
- Git

## Installation Steps

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd realdeal

# Install all dependencies (both server and client)
npm run install-all
```

### 2. Environment Configuration

```bash
# Server environment
cp .env.example .env
# Edit .env with your configuration

# Client environment  
cd client
cp .env.example .env
# Edit .env with your API URL
cd ..
```

### 3. Database Setup

Make sure MongoDB is running on localhost:27017. The application will create a database named `realdeal`.

### 4. Seed Initial Data

```bash
# Run the database seeder to populate initial data
npm run seed
```

This will create:
- Sample locations (Bangalore, Delhi, Mumbai, Chennai, Kolkata)
- Sample products with pricing across all platforms
- Proper database indexes for performance

### 5. Start the Application

```bash
# Development mode (both frontend and backend)
npm run dev

# Or start individually:
npm run server  # Backend only
npm run client  # Frontend only
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Project Structure

```
realdeal/
├── server/                 # Backend Node.js application
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── controllers/       # Route controllers
│   ├── services/          # Business logic
│   ├── middleware/        # Express middleware
│   ├── scripts/           # Background jobs & utilities
│   └── utils/             # Helper functions
├── client/                # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── types/         # TypeScript types
├── docs/                  # Documentation
└── README.md              # Project documentation
```

## Key Features Implemented

### Backend
- ✅ Express.js API with TypeScript support
- ✅ MongoDB with Mongoose ODM
- ✅ Product search and comparison endpoints
- ✅ Location-aware pricing
- ✅ Web scraping service for multiple platforms
- ✅ Background job scheduler
- ✅ Product normalization and matching
- ✅ Comprehensive error handling and logging

### Frontend
- ✅ React with TypeScript
- ✅ TailwindCSS for styling
- ✅ Product search with suggestions
- ✅ Price comparison across platforms
- ✅ Cheapest price highlighting
- ✅ Location detection and management
- ✅ Responsive design
- ✅ Filter and sort functionality
- ✅ Clean, intuitive UI

## API Endpoints

### Products
- `GET /api/products/search?q=query&city=city` - Search products
- `GET /api/products/:id` - Get product details
- `GET /api/products/:id/compare` - Compare prices
- `GET /api/products/popular/:city` - Get popular products
- `GET /api/products/categories/:city` - Get categories
- `GET /api/products/brands/:city` - Get brands

### Locations
- `GET /api/locations/cities` - Get all cities
- `GET /api/locations/pincode/:pincode` - Get location by pincode
- `GET /api/locations/platform-support/:city/:platform` - Check platform support

### Scraping
- `POST /api/scrape/trigger` - Trigger manual scraping
- `GET /api/scrape/status` - Get scraping status
- `GET /api/scrape/logs` - Get scraping logs
- `GET /api/scrape/stats` - Get scraping statistics

## Development Commands

```bash
# Install all dependencies
npm run install-all

# Start development servers
npm run dev

# Start backend only
npm run server

# Start frontend only
npm run client

# Build for production
npm run build

# Seed database
npm run seed

# Manual scraping
npm run scrape
```

## Platform-Specific Notes

### Web Scraping
- Uses Puppeteer for headless browser automation
- Supports Blinkit, Zepto, Instamart, BigBasket
- Location-aware data collection
- Automatic retry and error handling

### Data Pipeline
- High-priority items: Every 15 minutes
- Medium-priority items: Every 1 hour  
- Low-priority items: Every 4 hours
- Change detection to minimize database writes

### Product Matching
- Advanced normalization algorithms
- Similarity scoring system
- Brand and quantity matching
- Fuzzy name matching

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running on localhost:27017
   - Check your .env file for correct MONGODB_URI

2. **Port Conflicts**
   - Backend uses port 5000
   - Frontend uses port 3000
   - Change if these ports are occupied

3. **Scraping Issues**
   - Some platforms may block automated access
   - Check internet connection
   - Review scraping logs for errors

4. **CORS Issues**
   - Backend is configured for localhost:3000 in development
   - Update CORS settings if using different ports

### Logs and Debugging

- Backend logs: Console output
- Database logs: logs/ directory
- Scraping logs: Check /api/scrape/logs endpoint

## Production Deployment

### Environment Variables
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-db
REACT_APP_API_URL=https://your-domain.com/api
```

### Build and Deploy
```bash
# Build frontend
npm run build

# Start production server
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review API documentation
- Create an issue on GitHub
- Check logs for error details

## Next Steps

The platform is fully functional with all core features implemented. Potential enhancements:

- Mobile app development
- AI-powered product recommendations
- Price trend analysis
- User accounts and preferences
- Notifications for price drops
- Integration with more platforms
- Advanced filtering options
