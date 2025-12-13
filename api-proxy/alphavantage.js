const axios = require('axios');

// TODO: Move this to an environment variable in a production environment
const API_KEY = 'JO90E8HQ3QGVRJ98';
const BASE_URL = 'https://www.alphavantage.co/query';

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
        { symbol: 'XIU.TRT', name: 'TSX 60' },
        { symbol: '^N225', name: 'Nikkei 225' },
        { symbol: '000300.SS', name: 'CSI 300' },
    ];

    const results = [];
    for (const s of symbols) {
        const data = await fetchData(`index-${s.symbol}`, { function: 'GLOBAL_QUOTE', symbol: s.symbol });
        if (data && data['Global Quote']) {
            const transformed = transformGlobalQuote(data['Global Quote'], s.name, 'index');
            if (transformed) {
                results.push(transformed);
            }
        }
        await new Promise(resolve => setTimeout(resolve, 15000));
    }

    return results;
}

async function getMetalsData() {
    const metals = [
        { from: 'XAU', to: 'USD', name: 'Gold' },
        { from: 'XAG', to: 'USD', name: 'Silver' },
    ];

    const results = [];
    for (const m of metals) {
        const data = await fetchData(`metal-${m.from}`, { function: 'FX_DAILY', from_symbol: m.from, to_symbol: m.to });
        if (data && data['Time Series FX (Daily)']) {
            const transformed = transformFxDaily(data['Time Series FX (Daily)'], `${m.from}/${m.to}`, m.name, 'metal');
            if (transformed) {
                results.push(transformed);
            }
        }
        await new Promise(resolve => setTimeout(resolve, 15000));
    }

    return results;
}

async function getFxData() {
    const pairs = [
        { from: 'EUR', to: 'USD', name: 'EUR/USD' },
        { from: 'USD', to: 'JPY', name: 'USD/JPY' },
        { from: 'USD', to: 'CNY', name: 'USD/CNY' },
    ];

    const results = [];
    for (const p of pairs) {
        const data = await fetchData(`fx-${p.from}${p.to}`, { function: 'FX_DAILY', from_symbol: p.from, to_symbol: p.to });
        if (data && data['Time Series FX (Daily)']) {
            const transformed = transformFxDaily(data['Time Series FX (Daily)'], `${p.from}/${p.to}`, p.name, 'fx');
            if (transformed) {
                results.push(transformed);
            }
        }
        await new Promise(resolve => setTimeout(resolve, 15000));
    }

    return results;
}

async function searchAssets(keywords) {
    const cacheKey = `search-${keywords}`;
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return cached.data;
    }

    const data = await fetchData(cacheKey, { function: 'SYMBOL_SEARCH', keywords });

    if (data && data.bestMatches) {
        const unifiedData = data.bestMatches.map(m => ({
            symbol: m['1. symbol'],
            name: m['2. name'],
            category: 'search',
            price: 0,
            change: 0,
            changePercent: 0,
            timestamp: Date.now(),
        }));
        cache.set(cacheKey, { timestamp: Date.now(), data: unifiedData });
        return unifiedData;
    }

    return [];
}


module.exports = {
  getGlobalIndices,
  getMetalsData,
  getFxData,
  searchAssets,
};
