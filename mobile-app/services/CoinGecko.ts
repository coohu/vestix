import axios from 'axios';
import { getCache, setCache } from './Cache';

const BASE_URL = 'http://apij38sdhff.aivon.top' // 'https://api.coingecko.com/api/v3';
const headers = { 'Accept': 'application/json', 'x-cg-demo-api-key': 'CG-5MWFTWcgzTYTZxcXxYBJjzdr' };

async function getCoinList() {
  const cacheKey = 'coingecko-coinlist';
  const cached = await getCache<[string, string][]>(cacheKey);
  if(cached) {
      return new Map(cached);
  }
  try {
    const res = await axios.get(`${BASE_URL}/coins/list`, { timeout: 15000, headers });
    if(res.data && Array.isArray(res.data)){
      return res.data;
    }
    return []
  } catch (error) {
    console.error('Error fetching coin list from CoinGecko:', error);
    return [];
  }
}

async function getMarketData() {
    const cacheKey = 'coingecko';
    const cached = await getCache<any[]>(cacheKey);
    if(cached) return cached;
  try {
    await getCoinList();
    const response = await axios.get(`${BASE_URL}/coins/markets`, {
      headers,
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false,
      },
    });

    const results = response.data.map((item: any) => ({
      id: item.id,
      symbol: item.symbol.toUpperCase(),
      name: item.name,
      price: item.current_price,
      change: item.price_change_24h,
      changePercent: item.price_change_percentage_24h,
      timestamp: Date.now(),
    }));
    await setCache(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Error fetching data from CoinGecko:', error);
    return [];
  }
}

async function getKlineData(coinId: string, days = '1') {
  const cacheKey = `coingecko-kline-${coinId}-${days}`;
  const cached = await getCache<any[]>(cacheKey);
  if(cached) return cached;
  try {
    const response = await axios.get(`${BASE_URL}/coins/${coinId}/ohlc`, {
      headers,
      params: { vs_currency: 'usd', days: days },
    });
    const results = response.data.map((d: any) => ({
      time: d[0], open: d[1], high: d[2], low: d[3], close: d[4],
    }));
    await setCache(cacheKey, results);
    return results;
  } catch (error) {
    console.error(`Error fetching kline for ${coinId} from CoinGecko:`, error);
    return null;
  }
}

async function symbols2price(ss:string[]){
  const cacheKey = `coingecko-price`;
  const cached = await getCache<any>(cacheKey ,1000*60*60*8);
  if( cached ) return cached;
  try {
    const symbols = ss.join(',')
    const res = await axios.get(`${BASE_URL}/simple/price`, {
      headers,
      params: { vs_currencies: 'usd', symbols},
    });
    if(res.data && Object.keys(res.data).length){
      return res.data;
    }
    return null
  } catch (error) {
    console.error(`Error fetching symbols2price from CoinGecko:`, error);
    return null
  }
}

export { getCoinList, getMarketData, getKlineData, symbols2price};
