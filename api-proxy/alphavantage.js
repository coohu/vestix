const axios = require('axios');
const BASE_URL = 'https://www.alphavantage.co/query';

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchData( cacheKey, params ) {
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }
  try {
    // const urlParams = new URLSearchParams({apikey: 'JO90E8HQ3QGVRJ98', ...params});
    // const finalUrl = `${BASE_URL}?${urlParams.toString()}`;
    // console.log('生成的 GET 请求 URL:', finalUrl);
    // const res = await axios.get(BASE_URL, {
    //   params: {
    //     apikey: 'JO90E8HQ3QGVRJ98', function: 'MARKET_STATUS'
    //   },
    //   // proxy: {
    //   //   host: 'http://127.0.0.1', port: 1080               
    //   // },
    //   timeout: 30000
    // });

    const res = await axios.get('https://www.alphavantage.co/query?apikey=JO90E8HQ3QGVRJ98&function=MARKET_STATUS');
    if (res.data['Note']) {
      console.warn('Alpha Vantage API rate limit likely reached:', res.data['Note']);
      return null;
    }
    if (res.data['Error Message']) {
      console.error('Alpha Vantage API Error:', res.data['Error Message']);
      return null;
    }
    cache.set(cacheKey, { timestamp: Date.now(), data: res.data });
    return res.data;
  } catch (error) {
    console.error(`Error fetching ${cacheKey} from Alpha Vantage:`, error.message);
    return null;
  }
}

function transformGlobalQuote( quote, name, category ) {
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

function transformFxDaily( dailyData, symbol, name, category ) {
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
    const data = await fetchData(`metal-${m.from}`, { 
      function: 'FX_DAILY', from_symbol: m.from, to_symbol: m.to 
    });
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

  const data = await fetchData(cacheKey, { function: 'SYMBOL_SEARCH', keywords })
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

async function marketStatus() {
  const cacheKey = `market-status`;
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < 60 * 60 * 1000)) { // 60 minutes
    return cached.data;
  }
  const data = await fetchData(cacheKey, { function: 'MARKET_STATUS' })
  if (data && data.markets && data.markets.length > 0) {
    const markets = {...data.markets, timestamp: Date.now()}
    cache.set(cacheKey, { timestamp: Date.now(), data: markets });
    return markets;
  }
  return [];
}
module.exports = { getGlobalIndices, getMetalsData, getFxData, searchAssets, marketStatus };
