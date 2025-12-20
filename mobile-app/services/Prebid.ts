import axios from 'axios';
import { DateTime } from 'luxon';
import { getCache, setCache } from './Cache';

export const currencyRates = async (): Promise<any[]> => {
    const cacheKey = `prebid-currency`;
    const d = await getCache<any>(cacheKey, 10000*60*60*4)
    
    if(d) return d
  try {
    const url = 'https://cdn.jsdelivr.net/gh/prebid/currency-file@1/latest.json';
    const res = await axios.get(url, { timeout: 35000 });
    if(!res.data || !res.data.conversions){
        return []
    }
    const results: any[] = [];
    const utcDateTime = DateTime.fromISO(res.data.generatedAt); 
    const localDateTime = utcDateTime.setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const date = localDateTime.toFormat('yyyy-MM-dd');

    for(const from of Object.keys(res.data.conversions)){
        for(const to of Object.keys(res.data.conversions[from])){
            const rate = res.data.conversions[from][to];
            if( typeof rate === 'number' && rate > 0 && from !== to ){
                results.push({ name: `${from}/${to}`, symbol: `${from}/${to}`, close:rate, date } );
            }
        }
    }
    setCache(cacheKey, results)
    return results;
  } catch (error) {
    console.error('Error fetching Prebid currency rates:', error);
    return [];
  }
}