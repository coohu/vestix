import axios from 'axios';
import * as iconv from 'iconv-lite';

export interface GlobalFuturesData {
  symbol: string;    // 代码 (如 CAD)
  name: string;      // 中文名 (如 伦铜)
  last: number;      // 最新价
  changeAmount: number; // 涨跌额
  bid: number;       // 买入价
  ask: number;       // 卖出价
  high: number;      // 最高价
  low: number;       // 最低价
  time: string;      // 时间 (HH:mm:ss)
  close: number;     // 昨收
  open: number;      // 今开
  date: string;      // 日期 (yyyy-MM-dd)
  nameInApi: string; // 接口返回的名称
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
  const url = `http://hq.sinajs.cn/list=${listParam}`;

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Referer': 'https://finance.sina.com.cn/futuremarket/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const text = iconv.decode(Buffer.from(response.data), 'gbk');
    const lines = text.split('\n');
    const results: GlobalFuturesData[] = [];

    lines.forEach(line => {
      // 匹配示例: var hq_str_hf_CL="71.50,0.25,71.49,71.51,72.10,71.10,10:30:05,71.25,71.30,...";
      const match = line.match(/var hq_str_hf_(\w+)="(.+)";/);
      if (match) {
        const symbol = match[1];
        const dataStr = match[2];
        const f = dataStr.split(',');

        if (f.length < 10) return;

        results.push({
          symbol: symbol,
          name: CURRENT_FUTURES[symbol] || f[13],
          last: parseFloat(f[0]),
          changeAmount: parseFloat(f[1]),
          bid: parseFloat(f[2]),
          ask: parseFloat(f[3]),
          high: parseFloat(f[4]),
          low: parseFloat(f[5]),
          time: f[6],
          prevClose: parseFloat(f[7]),
          open: parseFloat(f[8]),
          date: f[12],
          nameInApi: f[13]
        });
      }
    });

    return results;
  } catch (error) {
    console.error('获取国际期货数据失败:', error);
    return [];
  }
}


export interface AgtdMarketData {
  symbol: string;        // 最终生效的代码
  name: string;          // 名称
  last: number;          // 最新价
  open: number;          // 开盘价
  close: number;     // 昨收
  high: number;          // 最高
  low: number;           // 最低
  volume: number;        // 成交量
  amount: number;        // 成交额
  date: string;          // 日期
  pct: string;           // 增长率
}

export async function fetchAgtdData(): Promise<AgtdMarketData[]> {
  const CURRENT_FUTURES: Record<string, string> = {
    "SGE_AGTD": "白银T+D",
    "SGE_AUTD": "黄金T+D",
  };
  const listParam = Object.keys(CURRENT_FUTURES).join(',');
  const URL = `http://hq.sinajs.cn/list=${listParam}`;
  try {
    const response = await axios.get(URL, {
      responseType: 'arraybuffer',
      headers: {
        // 使用通用的新浪财经 Referer，避免被期货频道限制
        'Referer': 'https://finance.sina.com.cn/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const text = iconv.decode(Buffer.from(response.data), 'gbk');
    const lines = text.split('\n');
    const result: AgtdMarketData[] = [];
    for (const line of lines) {
      // 匹配 var hq_str_CODE="DATA";
      const match = line.match(/var hq_str_(\w+)="(.+)";/);
      if (match && match[2].length > 5) { // 确保数据长度足够（不是空字符串）
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
            pct: f[17] || '',
          })
      }
    }
    return result;
  }catch (error:any) {
    console.error('获取失败:', error.message);
    return [];
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