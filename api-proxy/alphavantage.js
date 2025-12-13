const axios = require('axios');

// TODO: Move this to an environment variable in a production environment
const API_KEY = 'JO90E8HQ3QGVRJ98';
const BASE_URL = 'https://www.alphavantage.co/query';

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * A generic function to fetch data from Alpha Vantage with caching.
 * @param {string} cacheKey The key for caching the result.
 * @param {object} params The parameters for the Alpha Vantage API call.
 * @returns {Promise<any>} The data from the API.
 */
async function fetchData(cacheKey, params) {
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        apikey: API_KEY,
        ...params,
      },
    });

    if (response.data['Note']) {
      console.warn('Alpha Vantage API rate limit likely reached:', response.data['Note']);
      return null;
    }
    if (response.data['Error Message']) {
      console.error('Alpha Vantage API Error:', response.data['Error Message']);
      return null;
    }

    cache.set(cacheKey, { timestamp: Date.now(), data: response.data });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${cacheKey} from Alpha Vantage:`, error.message);
    return null;
  }
}

/**
 * Transforms the Global Quote data from Alpha Vantage to the UnifiedTicker format.
 * @param {object} quote The Global Quote object from the API response.
 * @param {string} name The display name for the ticker.
 * @param {'index' | 'metal' | 'fx'} category The category of the asset.
 * @returns {object|null} A UnifiedTicker object or null if input is invalid.
 */
function transformGlobalQuote(quote, name, category) {
  if (!quote || !quote['01. symbol']) return null;
  return {
    symbol: quote['01. symbol'],
    name: name,
    category: category,
    price: parseFloat(quote['05. price']),
    change: parseFloat(quote['09. change']),
    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
    timestamp: Date.now(),
  };
}

/**
 * Transforms the daily FX/Crypto data to calculate change and format as UnifiedTicker.
 * @param {object} dailyData The "Time Series FX (Daily)" object.
 * @param {string} symbol The symbol for the ticker.
 * @param {string} name The display name for the ticker.
 * @param {'fx' | 'metal'} category The category of the asset.
 * @returns {object|null} A UnifiedTicker object or null if input is invalid.
 */
function transformFxDaily(dailyData, symbol, name, category) {
    if (!dailyData) return null;
    const dates = Object.keys(dailyData).sort((a, b) => new Date(b) - new Date(a));
    if (dates.length < 2) return null;

    const latest = dailyData[dates[0]];
    const previous = dailyData[dates[1]];

    const price = parseFloat(latest['4. close']);
    const prevPrice = parseFloat(previous['4. close']);
    const change = price - prevPrice;
    const changePercent = (change / prevPrice) * 100;

    return {
        symbol: symbol,
        name: name,
        category: category,
        price: price,
        change: change,
        changePercent: changePercent,
        timestamp: new Date(dates[0]).getTime(),
    }
}

async function getGlobalIndices() {
  const symbols = [
    { symbol: 'SPY', name: 'S&P 500' },
    { symbol: 'QQQ', name: 'NASDAQ 100' },
    { symbol: 'DAX', name: 'DAX' },
    { symbol: '^N225', name: 'Nikkei 225' },
    { symbol: '000300.SS', name: 'CSI 300' },
  ];

  const promises = symbols.map(s =>
    fetchData(`index-${s.symbol}`, { function: 'GLOBAL_QUOTE', symbol: s.symbol })
      .then(data => transformGlobalQuote(data['Global Quote'], s.name, 'index'))
  );

  const results = await Promise.all(promises);
  return results.filter(r => r !== null);
}

async function getMetalsData() {
    const metals = [
        { from: 'XAU', to: 'USD', name: 'Gold' },
        { from: 'XAG', to: 'USD', name: 'Silver' },
    ];

    const promises = metals.map(m =>
        fetchData(`metal-${m.from}`, { function: 'FX_DAILY', from_symbol: m.from, to_symbol: m.to })
            .then(data => transformFxDaily(data['Time Series FX (Daily)'], `${m.from}/${m.to}`, m.name, 'metal'))
    );

    const results = await Promise.all(promises);
    return results.filter(r => r !== null);
}

async function getFxData() {
    const pairs = [
        { from: 'EUR', to: 'USD', name: 'EUR/USD' },
        { from: 'USD', to: 'JPY', name: 'USD/JPY' },
        { from: 'USD', to: 'CNY', name: 'USD/CNY' },
    ];

    const promises = pairs.map(p =>
        fetchData(`fx-${p.from}${p.to}`, { function: 'FX_DAILY', from_symbol: p.from, to_symbol: p.to })
            .then(data => transformFxDaily(data['Time Series FX (Daily)'], `${p.from}/${p.to}`, p.name, 'fx'))
    );

    const results = await Promise.all(promises);
    return results.filter(r => r !== null);
}

module.exports = {
  getGlobalIndices,
  getMetalsData,
  getFxData,
};
