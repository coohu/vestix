import axios from 'axios';
import { DateTime } from 'luxon';
import { getCache, setCache } from './Cache';

const BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = 'JO90E8HQ3QGVRJ98';
const MIN_INTERVAL = 1100
let lastScheduledTime = 0

export async function fetchData(cacheKey: string, params: any) {
  const cachedData = await getCache<any>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const now = Date.now();
  const executeAt = Math.max(now, lastScheduledTime + MIN_INTERVAL);
  lastScheduledTime = executeAt;
  const waitTime = executeAt - now;
  if (waitTime > 0) {
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  try {
    const res = await axios.get(BASE_URL, {
      params: { apikey: API_KEY, ...params },
      timeout: 30000,
    });

    if (res.data['Error Message'] || res.data['Information'] || res.data['Note']) {
      const msg = res.data['Error Message'] || res.data['Information'] || res.data['Note']
      console.error('Alpha Vantage API Error:', msg, params);
      return null;
    }

    await setCache(cacheKey, res.data);
    return res.data;
  } catch (error) {
    console.error(`Error fetching from Alpha Vantage:`, error);
    return null;
  }
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
  return results;
}

export function transformedForex(rates:any) {
  if (rates && Object.keys(rates).length > 1){
    const meta = rates["Meta Data"]
    const date = meta["5. Last Refreshed"]
    const series = rates["Time Series FX (Daily)"][date]
    if(series && Object.keys(series).length>3){
      const items :Record<string, string> = {}
      for (const key of Object.keys(series)){
        const k = key.split(' ').pop()
        if(k){
          items[k] = series[key]
        }
      }
      if(Object.keys(items).length>3){
        return {date, ...items }
      }
    }
  }
  return null;
}

type ForexParam ={
  function:'FX_INTRADAY' | 'FX_DAILY';
  from_symbol:string;
  to_symbol:string;
  interval: '1min' | '5min' | '15min' | '30min' | '60min' | '1d';
  outputsize?: 'compact' | 'full' // default compact for latest 100 data points
  datatype?: 'json' | 'csv'       // default json
}

export async function getForex(param:ForexParam) {
  const {function:func, from_symbol, to_symbol, interval} = param
  if((func=='FX_INTRADAY' && interval=='1d') || (func=='FX_DAILY' && interval !='1d')){
    console.log(`getForex() 中 function="${func}" 与 interval="${interval}" 参数冲突:\n https://www.alphavantage.co/documentation/`)
    return null
  }
  const cacheKey = `fx-${from_symbol}-${to_symbol}-${interval}`;
  const cached = await getCache<any>(cacheKey);
  if (cached) return cached;
  return await fetchData(cacheKey, { ...param });
}

export async function searchAssets(keywords: string) {
  const data :any = await axios.get(BASE_URL, {
    params: { function: 'SYMBOL_SEARCH', keywords, apikey:'demo' },
    timeout: 30000,
  });
  if (data && data.bestMatches) {
    return data.bestMatches.map((m: any) => {
      const rts : any= {}
      for(const key of Object.keys(m)){
        const k = key.split(' ').pop()|| ''
        rts [k] = m[key]
      }
      return rts
    })
  }
  return [];
}

export async function marketStatus() {
  const cacheKey = `market-status`;
  const cached = await getCache<any>(cacheKey, 60 * 60 * 1000);
  if (cached) return cached.markets;

  const data = await fetchData(cacheKey, { function: 'MARKET_STATUS' });
  if (Array.isArray(data?.markets) && data.markets?.length > 0) {
    return data.markets;
  }
  return [];
}


export function transformSecurities(data:any) {
  let meta = null , ts = null
  for(const key of Object.keys(data || {})){
    if (key == 'Meta Data'){
      meta = data[key]
    }
    if(key.includes('Time Series')){
      ts = data[key]
    }
  }
  const idx = Object.keys(ts)
  if(!meta || !ts || !idx.length){
    return null;
  }

  let date = null, tz = 'UTC', target = ts[idx[0]]
  for(const key of Object.keys(meta)){
    if (key.includes('Last Refreshed')){
      date = meta[key]
    }
    if (key.includes('Time Zone')){
      tz = meta[key]
    }
  }

  if( date ){
    const fmt = date.length > 12 ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd'
    date = DateTime.fromSQL(date, { zone: tz })
      .setZone(Intl.DateTimeFormat().resolvedOptions().timeZone)  
      .toFormat(fmt);         
  }
  const items :Record<string, number> = {}
  for (const key of Object.keys(target)){
    const k = key.split(' ').pop()
    if(k){
      items[k] = Number(target[key])
    }
  }
  if (Object.keys(items).length){
    return {date, ...items}
  }
  return null
}

export async function getKlineData(symbol: string, interval:string = '1d') {
  const cacheKey = `kline-${symbol}-${interval}`;
  const cached = await getCache<any>(cacheKey);
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

  const func = functionMap[interval] 
  return await fetchData(cacheKey, { function: func, symbol: symbol,
    ...(func === 'TIME_SERIES_INTRADAY' && { interval }),
  });
}

type CommoditiesParam = {
  function:string;
  interval?: 'daily'| 'weekly' | 'monthly'; // default : monthly
  datatype?: 'csv' | 'json';                // default : json
}

export async function getCommodities(params:CommoditiesParam){
  const { function:func, interval } = params
  const cacheKey = `commodities-${func}-${interval}`;
  const cached = await getCache<any>(cacheKey);
  if (cached) return cached;

  const data = await fetchData(cacheKey, params)
  if (data && Object.keys(data).length){
    return data
  }
  return null
}

export function transformedCryptoCurrencies(data:any){
  if(data && Object.keys(data).length > 1){
    const meta = data["Meta Data"]
    const date = meta["6. Last Refreshed"]
    const tz = meta["7. Time Zone"]
    const fmt = date.length > 12 ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd'
    const timestamp = DateTime.fromSQL(date, { zone: tz })
      .setZone(Intl.DateTimeFormat().resolvedOptions().timeZone)  
      .toFormat(fmt);
    const series = data["Time Series (Digital Currency Daily)"][date]
    if(series && Object.keys(series).length>4){
      const items :Record<string, string> = {}
      for (const key of Object.keys(series)){
        const k = key.split(' ').pop()
        if(k){
          items[k] = series[key]
        }
      }
      if(Object.keys(items).length > 4){
        return {timestamp, ...items }
      }
    }
  }
  return null
}

export async function getCryptoCurrencies(symbol:string, market:string){
  const cacheKey = `crypto-${symbol}-${market}`;
  const cached = await getCache<any>(cacheKey);
  if (cached) return cached;
  return await fetchData(cacheKey, {function:'DIGITAL_CURRENCY_DAILY', symbol, market})
}
