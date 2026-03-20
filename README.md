# RealDeal - Smart Grocery Price Comparison Platform
## 🚀 Live Project
[Click here to view live website](https://real-deal-project-ieo2.vercel.app/)
## 🚀 Features

- **Product Search**: Search for any grocery item and get instant price comparisons
- **Multi-Platform Comparison**: View prices from Blinkit, Zepto, Instamart, and BigBasket side-by-side
- **Best Deal Highlighting**: Automatically identifies and highlights the cheapest option
- **Delivery Time Comparison**: Compare delivery speeds across platforms
- **Location-Aware Pricing**: Prices based on your city/pincode
- **Smart Sorting & Filtering**: Sort by price, delivery time, or platform
- **Product Normalization**: Intelligently groups same products across platforms
- **Real-Time Data Updates**: Background data refresh system

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Database**: MongoDB with Mongoose ODM
- **Web Scraping**: Puppeteer + Cheerio for data collection
- **Background Jobs**: Node-cron for scheduled data updates
- **Product Matching**: Advanced normalization and similarity scoring

### Frontend (React)
- **UI Framework**: Modern React with hooks
- **Styling**: TailwindCSS for responsive design
- **State Management**: React Context API
- **Components**: Modular, reusable component architecture

### Data Pipeline
1. **Collection**: Automated scraping from multiple platforms
2. **Normalization**: Product name and quantity standardization
3. **Matching**: Similarity-based product grouping
4. **Storage**: Structured database with location awareness
5. **Serving**: Fast API responses with cached data

## 📦 Project Structure

```
realdeal/
├── server/                 # Backend application
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── controllers/       # Route controllers
│   ├── services/          # Business logic
│   ├── middleware/        # Express middleware
│   ├── scripts/           # Background jobs & utilities
│   └── utils/             # Helper functions
├── client/                # React frontend
└── docs/                  # Documentation
```

## 🛠️ Tech Stack

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- Puppeteer (web scraping)
- Node-cron (scheduled jobs)
- Winston (logging)
- Helmet (security)

### Frontend
- React 18
- TailwindCSS
- Axios (API calls)
- React Router

### Development Tools
- Nodemon (development server)
- Concurrently (run multiple scripts)
- ESLint & Prettier (code quality)

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd realdeal
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on localhost:27017
   ```

5. **Run the application**
   ```bash
   # Development mode (both frontend and backend)
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📊 Database Schema

### Products Collection
```javascript
{
  _id: ObjectId,
  name: String,           // Normalized product name
  category: String,
  brand: String,
  quantity: Number,       // Standardized quantity in grams/ml
  unit: String,          // 'g' or 'ml'
  image: String,         // Representative image URL
  platforms: [{
    name: String,        // Platform name
    price: Number,
    originalName: String, // Original product name
    imageUrl: String,
    deliveryTime: String,
    availability: Boolean,
    lastUpdated: Date
  }],
  location: {
    city: String,
    pincode: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `DEFAULT_CITY`: Default city for location-based pricing
- `DEFAULT_PINCODE`: Default pincode
- `SCRAPING_INTERVAL_*`: Data refresh intervals in minutes

### Scraping Configuration
- **High-demand items**: Every 15-30 minutes
- **Medium-demand items**: Every 1 hour
- **Low-demand items**: Every 2-4 hours

## 🔄 Data Pipeline

### 1. Data Collection
- Platform-specific scrapers
- Location-aware data fetching
- Error handling and retry logic

### 2. Product Normalization
- Text cleaning and standardization
- Quantity unit conversion
- Brand and category extraction

### 3. Product Matching
- Similarity scoring algorithm
- Attribute-based matching
- Threshold-based grouping

### 4. Data Storage
- Change detection
- Efficient updates
- Historical data tracking

## 🎯 API Endpoints

### Search & Comparison
- `GET /api/products/search?q=query` - Search products
- `GET /api/products/:id` - Get product details
- `GET /api/products/compare/:id` - Get price comparison

### Data Management
- `POST /api/scrape/trigger` - Manual scraping trigger
- `GET /api/scrape/status` - Scraping status

### Location
- `GET /api/locations/cities` - Available cities
- `POST /api/locations/set` - Set user location

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📈 Performance & Scalability

- **Caching**: Redis for frequently accessed data
- **Rate Limiting**: API protection against abuse
- **Compression**: Gzip for reduced bandwidth
- **Database Indexing**: Optimized queries
- **Background Processing**: Non-blocking data updates

## 🔒 Security

- Helmet.js for security headers
- CORS configuration
- Input validation and sanitization
- Rate limiting
- Environment variable protection

## 🚀 Deployment

### Production Setup
1. Set up MongoDB cluster
2. Configure environment variables
3. Build the frontend
4. Deploy to your preferred platform

### Docker Support
```bash
docker build -t realdeal .
docker run -p 5000:5000 realdeal
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: support@realdeal.com
- Documentation: [docs/](docs/)

## 🗺️ Roadmap

- [ ] Mobile app development
- [ ] AI-powered product recommendations
- [ ] Price trend analysis
- [ ] User accounts and preferences
- [ ] Notifications for price drops
- [ ] Integration with more platforms
- [ ] Advanced filtering options
