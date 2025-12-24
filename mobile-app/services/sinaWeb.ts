import axios from 'axios';
import * as iconv from 'iconv-lite';
import { getCache, setCache } from './Cache';

type Indices = {
  symbol:string;
  name:string;
  last?:number;
  gain?:number;
  percent?:number;
  close?:number;
  open?:number;
  high?:number;
  low?:number;
  volume?:number;
  amount?:number;
  date?:string;
  bid?:number;
  ask?:number;
}

const BASE_URL = `http://hq.sinajs.cn/list=`;
const headers = {
  'Referer': 'https://finance.sina.com.cn/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
async function fetchGlobalFutures() {
  const CURRENT_FUTURES: Record<string, string> = {
    "CAD": "伦铜",
    "CL": "纽约原油",
    "GC": "纽约黄金",
    "SI": "纽约白银",
    "S": "美国大豆",
    "BO": "美黄豆油",
    "C": "美国玉米",
    "W": "美国小麦",
    "AHD": "伦铝",
    "OIL": "布伦特原油"
  };
  // 1. 构造请求 URL，国际期货必须加 hf_ 前缀
  const symbols = Object.keys(CURRENT_FUTURES);
  const listParam = symbols.map(s => `hf_${s}`).join(',');
  try {
    const response = await axios.get(`${BASE_URL}${listParam}`, {
      responseType: 'arraybuffer',
      headers,
    });

    const text = iconv.decode(Buffer.from(response.data), 'gbk');
    const lines = text.split('\n');
    const results: Indices[] = [];

    lines.forEach((line:any) => {
      // 匹配示例: var hq_str_hf_CL="71.50,0.25,71.49,71.51,72.10,71.10,10:30:05,71.25,71.30,...";
      const match = line.match(/var hq_str_hf_(\w+)="(.+)";/);
      if (match) {
        console.log(match)
        const symbol = match[1];
        const dataStr = match[2];
        const f = dataStr.split(',');

        if (f.length < 10) return;

        results.push({
          symbol: symbol,
          name: CURRENT_FUTURES[symbol] || f[13],
          last: parseFloat(f[0]),
          gain: parseFloat(f[1]),
          bid: parseFloat(f[2]),
          ask: parseFloat(f[3]),
          high: parseFloat(f[4]),
          low: parseFloat(f[5]),
          close: parseFloat(f[7]),
          open: parseFloat(f[8]),
          date: f[12],
        });
      }
    });

    return results;
  } catch (error) {
    console.error('获取国际期货数据失败:', error);
    return [];
  }
}

export async function fetchAgtdData(): Promise<Indices[]> {
  const CURRENT_FUTURES: Record<string, string> = {
    "SGE_AGTD": "白银T+D",
    "SGE_AUTD": "黄金T+D",
  };
  const listParam = Object.keys(CURRENT_FUTURES).join(',');
  try {
    const response = await axios.get(`${BASE_URL}${listParam}`, {
      responseType: 'arraybuffer',
      headers,
    });

    const text = iconv.decode(Buffer.from(response.data), 'gbk');
    const lines = text.split('\n');
    const result: Indices[] = [];
    for (const line of lines) {
      // 匹配 var hq_str_CODE="DATA";
      const match = line.match(/var hq_str_(\w+)="(.+)";/);
      if (match && match[2].length > 5) { // 确保数据长度足够（不是空字符串）
        console.log(match )
        const symbol = match[1];
        const rawData = match[2];
        const f = rawData.split(',');

        // 针对不同前缀，字段定义可能略有不同，但前几位通常一致：
        // 贵金属/T+D 通常格式: 名称,最新,昨收,开盘,最高,最低,买,卖,成量,成额...
        result.push({
            symbol: symbol,
            name: f[2], // 名称
            last: parseFloat(f[3]), // 最新价 (注意：贵金属接口最新价常在 index 1)
            close: parseFloat(f[7]), // 昨收
            open: parseFloat(f[6]), // 开盘
            high: parseFloat(f[4]), // 最高
            low: parseFloat(f[5]),  // 最低
            volume: parseFloat(f[10]) || 0, // 成交量 (位置可能变动，暂取常见位)
            amount: parseFloat(f[11]) || 0, // 成交额
            date: f[16] || new Date().toISOString().split('T')[0],
            percent: f[17] || '',
          })
      }
    }
    return result;
  }catch (error:any) {
    console.error('获取失败:', error.message);
    return [];
  }
}

export async function indices(){
  const syl = ['s_sh000001', 's_sz399001', 's_sh000300', 's_bj899050', 's_sz399006']
  const result: Indices[] = [];
  try{
    for (const s of syl) {
      const res = await axios.get(`${URL}${syl.join(',')}`, {responseType: 'arraybuffer', headers})
      const text = iconv.decode(Buffer.from(res.data), 'gbk');
      const lines = text.split('\n');
      for (const line of lines) {
        const match = line.match(/var hq_str_s_(\w+)="(.+)";/);
        if (match && match[2].length > 5) {
          const symbol = match[1];
          const rawData = match[2];
          const f = rawData.split(',');
          console.log( match[1], f,'------------')
          result.push({
            symbol: symbol,
            name: f[0], 
            last: parseFloat(f[1]), 
            volume: parseFloat(f[4]),
            amount: parseFloat(f[5]), 
            percent: f[4],
          })
        }
      }
    }
  } catch (e:any){
    console.log(e)
  }
}


if (require.main === module) {
  fetchAgtdData().then(data => {
    if (data) {
      console.table(data, ['symbol', 'name', 'last', 'open', 'high', 'low', 'date']);
    }
  });

  fetchGlobalFutures().then(data => {
    console.table(data, ['symbol', 'name', 'last', 'open', 'high', 'low', 'date']);
  });
}

export async function cnIdx () {
  const cacheKey = 'sina-cn-index'
  const data = await getCache<any[]>(cacheKey , 1000*60*5)
  if(data && data.length) return data

  const url = 'https://vip.stock.finance.sina.com.cn'
  try{
    const res = await axios.get(`${url}/quotes_service/api/json_v2.php/Market_Center.getHQNodeDataSimple`, {
      headers:{
        'Referer': 'https://vip.stock.finance.sina.com.cn/mkt/' ,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      params:{page:1, num:40, sort:'symbol', asc:1, node:'dpzs', _s_r_a:'init'},
    })
    if(Array.isArray(res.data) && res.data.length){
      const data = res.data.map((it:any) => 
        ({ 
          ...(it.name && {name: it.name}),
          ...(it.symbol && {symbol: it.symbol}),
          ...(it.pricechange && {gain: parseFloat(it.pricechange) }),
          ...(it.changepercent && {percent:  parseFloat(it.changepercent)}),
          ...(it.settlement && {close:  parseFloat(it.settlement)}),
          ...(it.open && {open:  parseFloat(it.open)}),
          ...(it.high && {high:  parseFloat(it.high)}),
          ...(it.low && {low:  parseFloat(it.low)}),
          ...(it.volume && {volume: it.volume}),
          ...(it.amount && {amount: it.amount})
        }));
      setCache(cacheKey, data)
      return data
    }
    return null
  } catch (e:any) {
    console.log(e)
    return null
  }
}