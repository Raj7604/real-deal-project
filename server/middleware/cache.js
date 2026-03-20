const NodeCache = require('node-cache');

// Initialize cache with specific configuration:
// stdTTL: Default time to live in seconds (60 seconds = 1 minute Cache hit TTL)
// checkperiod: How often to delete expired entries
// maxKeys: To prevent memory leaks in large aggregate arrays
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120, maxKeys: 2000 });

/**
 * Cache Middleware
 * Checks if the request URL exists in the cache. 
 * If it does, safely return the JSON directly from Memory bypassng MongoDB.
 * If it doesn't, override res.json to simultaneously save to cache whilst transmitting exactly once.
 */
const cacheMiddleware = (durationInSeconds = 60) => {
  return (req, res, next) => {
    // We strictly use the originalUrl (e.g., /api/products/popular/Bangalore?limit=10) as the unique Cache Key.
    const key = '__express__' + req.originalUrl || req.url;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      // Hit! Return safely from RAM buffer, skipping mongoose connections completely
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedResponse);
    } else {
      // Miss. Injecting interceptors inside res.json to save future outputs seamlessly
      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json;
      
      res.json = function(body) {
        // Enforce cache insertion safely using native cache boundaries
        cache.set(key, body, durationInSeconds);
        // Execute original res.json logic explicitly without breaking stack traces!
        originalJson.call(this, body);
      };
      
      next();
    }
  };
};

module.exports = {
  cache,
  cacheMiddleware
};
