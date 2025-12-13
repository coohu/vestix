const axios = require('axios');

const cache = new Map();

// Note: This is a simple in-memory cache. For production use, consider
// a more robust, persistent caching solution like Redis.
async function getMarketData() {
  const cacheKey = 'crypto-markets';
  const cachedData = cache.get(cacheKey);

  if (cachedData && (Date.now() - cachedData.timestamp < 60000)) {
    return cachedData.data;
  }

  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false,
      },
    });

    const unifiedData = response.data.map(item => ({
      symbol: item.symbol.toUpperCase(),
      name: item.name,
      category: 'crypto',
      price: item.current_price,
      change: item.price_change_24h,
      changePercent: item.price_change_percentage_24h,
      timestamp: Date.now(),
    }));

    cache.set(cacheKey, { timestamp: Date.now(), data: unifiedData });
    return unifiedData;
  } catch (error) {
    console.error('Error fetching data from CoinGecko:', error);
    return [];
  }
}

module.exports = {
  getMarketData,
};
