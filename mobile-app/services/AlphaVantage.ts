import axios from 'axios';
import { getCache, setCache } from './Cache';

const BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = 'JO90E8HQ3QGVRJ98';

async function fetchData(cacheKey: string, params: any) {
  const cachedData = await getCache<any>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const res = await axios.get(BASE_URL, {
      params: { apikey: API_KEY, ...params },
      timeout: 30000,
    });

    if (res.data['Note']) {
      console.warn('Alpha Vantage API rate limit likely reached:', res.data['Note']);
      return null;
    }
    if (res.data['Error Message']) {
      console.error('Alpha Vantage API Error:', res.data['Error Message']);
      return null;
    }

    await setCache(cacheKey, res.data);
    return res.data;
  } catch (error) {
    console.error(`Error fetching from Alpha Vantage:`, error);
    return null;
  }
}

function transformGlobalQuote(quote: any, name: string, category: string) {
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

function transformFxDaily(dailyData: any, symbol: string, name: string, category: string) {
  if (!dailyData) return null;
  const dates = Object.keys(dailyData).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
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
  };
}

export async function getGlobalIndices() {
  const cacheKey = 'global-indices';
  const cached = await getCache<any[]>(cacheKey);
  if (cached) return cached;

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
    // The delay is to respect API rate limits, not needed for caching logic itself
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
  await setCache(cacheKey, results);
  return results;
}

export async function getMetalsData() {
    const cacheKey = 'metals-data';
    const cached = await getCache<any[]>(cacheKey);
    if (cached) return cached;

  const metals = [
    { from: 'XAU', to: 'USD', name: 'Gold' },
    { from: 'XAG', to: 'USD', name: 'Silver' },
  ];

  const results = [];
  for (const m of metals) {
    const data = await fetchData(`metal-${m.from}`,{
      function: 'FX_DAILY',
      from_symbol: m.from,
      to_symbol: m.to,
    });
    if (data && data['Time Series FX (Daily)']) {
      const transformed = transformFxDaily(data['Time Series FX (Daily)'], `${m.from}/${m.to}`, m.name, 'metal');
      if (transformed) {
        results.push(transformed);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
  await setCache(cacheKey, results);
  return results;
}

export async function getFxData() {
    const cacheKey = 'fx-data';
    const cached = await getCache<any[]>(cacheKey);
    if (cached) return cached;

  const pairs = [
    { from: 'EUR', to: 'USD', name: 'EUR/USD' },
    { from: 'USD', to: 'JPY', name: 'USD/JPY' },
    { from: 'USD', to: 'CNY', name: 'USD/CNY' },
  ];

  const results = [];
  for (const p of pairs) {
    const data = await fetchData(`fx-${p.from}${p.to}`,{ function: 'FX_DAILY', from_symbol: p.from, to_symbol: p.to });
    if (data && data['Time Series FX (Daily)']) {
      const transformed = transformFxDaily(data['Time Series FX (Daily)'], `${p.from}/${p.to}`, p.name, 'fx');
      if (transformed) {
        results.push(transformed);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
  await setCache(cacheKey, results);
  return results;
}

export async function searchAssets(keywords: string) {
    const cacheKey = `search-${keywords}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) return cached;

  const data = await fetchData(cacheKey, { function: 'SYMBOL_SEARCH', keywords });
  if (data && data.bestMatches) {
    const results = data.bestMatches.map((m: any) => ({
      symbol: m['1. symbol'],
      name: m['2. name'],
      category: 'search',
      price: 0,
      change: 0,
      changePercent: 0,
      timestamp: Date.now(),
    }));
    await setCache(cacheKey, results);
    return results;
  }
  return [];
}

export async function marketStatus() {
  const cacheKey = `market-status`;
  // Use a longer TTL of 60 minutes for market status
  const cached = await getCache<any[]>(cacheKey, 60 * 60 * 1000);
  if (cached) return cached;

  const data = await fetchData(cacheKey, { function: 'MARKET_STATUS' });
  if (Array.isArray(data?.markets) && data.markets?.length > 0) {
    await setCache(cacheKey, data.markets);
    return data.markets;
  }
  return [];
}

export async function getKlineData(symbol: string, interval = '1d') {
    const cacheKey = `kline-${symbol}-${interval}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) return cached;

  const functionMap: { [key: string]: string } = {
    '1min': 'TIME_SERIES_INTRADAY',
    '5min': 'TIME_SERIES_INTRADAY',
    '15min': 'TIME_SERIES_INTRADAY',
    '30min': 'TIME_SERIES_INTRADAY',
    '60min': 'TIME_SERIES_INTRADAY',
    '1d': 'TIME_SERIES_DAILY',
    '1wk': 'TIME_SERIES_WEEKLY',
    '1mo': 'TIME_SERIES_MONTHLY',
  };
  const func = functionMap[interval] || 'TIME_SERIES_DAILY';
  const params: any = {
    function: func,
    symbol: symbol,
    ...(func === 'TIME_SERIES_INTRADAY' && { interval: interval }),
  };
  const data = await fetchData(cacheKey, params);
  let timeSeriesKey: string | null = null;
  if (data) {
    for (const key of Object.keys(data)) {
      if (key.includes('Time Series')) {
        timeSeriesKey = key;
        break;
      }
    }
  }
  if (data && timeSeriesKey && data[timeSeriesKey]) {
    const series = data[timeSeriesKey];
    const results = Object.keys(series)
      .map(timestamp => ({
        time: new Date(timestamp).getTime(),
        open: parseFloat(series[timestamp]['1. open']),
        high: parseFloat(series[timestamp]['2. high']),
        low: parseFloat(series[timestamp]['3. low']),
        close: parseFloat(series[timestamp]['4. close']),
        volume: parseInt(series[timestamp]['5. volume'] || '0', 10),
      }))
      .sort((a, b) => a.time - b.time);
    await setCache(cacheKey, results);
    return results;
  }
  return [];
}
