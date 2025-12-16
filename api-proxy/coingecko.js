const axios = require('axios');

const cache = new Map();
let coinListCache = null;

async function getCoinList() {
  if (coinListCache) {
    return coinListCache;
  }
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/list');
    coinListCache = new Map(response.data.map(c => [c.symbol.toUpperCase(), c.id]));
    return coinListCache;
  } catch (error) {
    console.error('Error fetching coin list from CoinGecko:', error);
    return null;
  }
}

async function getMarketData() {
  const cacheKey = 'crypto-markets';
  const cachedData = cache.get(cacheKey);

  if (cachedData && (Date.now() - cachedData.timestamp < 60000)) {
    return cachedData.data;
  }

  try {
    await getCoinList(); // Ensure coin list is cached
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd', order: 'market_cap_desc', per_page: 100, page: 1, sparkline: false
      }
    });

    const unifiedData = response.data.map(item => ({
      id: item.id, // Add id for kline fetching
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

async function getKlineData(coinId, days = '1') {
  const cacheKey = `kline-${coinId}-${days}`;
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < 60000)) {
    return cached.data;
  }
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}/ohlc`, {
      params: { vs_currency: 'usd', days: days}
    })
    const unifiedData = response.data.map(d => (
      { time: d[0], open: d[1], high: d[2], low: d[3], close: d[4]}
    ))
    cache.set(cacheKey, { timestamp: Date.now(), data: unifiedData });
    return unifiedData;
  } catch (error) {
    console.error(`Error fetching kline for ${coinId} from CoinGecko:`, error.message);
    return null;
  }
}

module.exports = { getMarketData, getKlineData, getCoinList };
