import axios from 'axios';
import { getCache, setCache } from './Cache';

async function getCoinList() {
    const cacheKey = 'coingecko-coinlist';
    const cached = await getCache<[string, string][]>(cacheKey);
    if(cached) {
        return new Map(cached);
    }

  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/list');
    const coinList = new Map(response.data.map((c: any) => [c.symbol.toUpperCase(), c.id]));
    await setCache(cacheKey, Array.from(coinList.entries()));
    return coinList;
  } catch (error) {
    console.error('Error fetching coin list from CoinGecko:', error);
    return null;
  }
}

export async function getMarketData() {
    const cacheKey = 'coingecko-market-data';
    const cached = await getCache<any[]>(cacheKey);
    if(cached) return cached;
  try {
    await getCoinList();
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
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
      category: 'crypto',
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

export async function getKlineData(coinId: string, days = '1') {
    const cacheKey = `coingecko-kline-${coinId}-${days}`;
    const cached = await getCache<any[]>(cacheKey);
    if(cached) return cached;
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}/ohlc`, {
      params: { vs_currency: 'usd', days: days },
    });
    const results = response.data.map((d: any) => ({
      time: d[0],
      open: d[1],
      high: d[2],
      low: d[3],
      close: d[4],
    }));
    await setCache(cacheKey, results);
    return results;
  } catch (error) {
    console.error(`Error fetching kline for ${coinId} from CoinGecko:`, error);
    return null;
  }
}
export { getCoinList };
