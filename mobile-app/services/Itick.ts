import axios from 'axios';
import { getCache, setCache } from './Cache';

const BASE_URL = "https://api.itick.org"
const headers = {
    "accept": "application/json",
    "token": "aa245ee602394e6886e97d869f95ab67f7d5c57963ee4b6e8ad1cfd205530f4b"
}
const MAX_REQUESTS_PER_WINDOW = 5; 
const WINDOW_MS = 60 * 1000; // 1 分钟
const SAFE_BUFFER = 1000;    // 增加 1 秒缓冲，防止服务器时钟微差
const requestQueue: number[] = []; // 记录计划执行的时间戳

// path = '/indices/kline'
// params = {region:'GB', code='SPX', kType=2 ,limit=10}
export async function fetchData(cacheKey: string, params: any, path:string='') {
  const cachedData = await getCache<any>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const now = Date.now();
  let executeAt = now;

  if (requestQueue.length >= MAX_REQUESTS_PER_WINDOW) {
    const earliestRelease = requestQueue[0] + WINDOW_MS + SAFE_BUFFER;
    executeAt = Math.max(now, earliestRelease);
  }

  if (requestQueue.length > 0) {
    const lastRequest = requestQueue[requestQueue.length - 1];
    executeAt = Math.max(executeAt, lastRequest + 200); // 相邻请求至少保留 200ms 间隙
  }

  requestQueue.push(executeAt);
  if (requestQueue.length > MAX_REQUESTS_PER_WINDOW) {
    requestQueue.shift();
  }

  const waitTime = executeAt - now;
  if (waitTime > 0) {
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  try {
    const res = await axios.get(`${BASE_URL}${path}`, {
        headers, params, timeout: 30000
    });

    if (res.data['code'] || !res.data.data || !res.data.data.length) {
      console.error('Itick.org API Error:', res.data['msg'], params);
      return null;
    }
    await setCache(cacheKey, res.data.data);
    return res.data.data;
  } catch (error) {
    console.error(`Error fetching from Alpha Vantage:`, error);
    return null;
  }
}

export function transformedIndices(data:any){
  if (Array.isArray(data) && data.length){
    const it = data [0]
    if(it && typeof it === 'object' && !Array.isArray(it) && Object.keys(it).length){
        const result = {
            ...(it.hasOwnProperty('o') && {open:it.o}), 
            ...(it.hasOwnProperty('h') && {high:it.h}), 
            ...(it.hasOwnProperty('l') && {low:it.l}), 
            ...(it.hasOwnProperty('c') && {close:it.c}), 
            ...(it.hasOwnProperty('v') && {volume:it.v}), 
            ...(it.hasOwnProperty('tu') && {amount:it.tu}), 
        }
        if (Object.keys(result).length>4){
            return result
        }
    }
  }
  return null
}

type Param ={
    code:string;
    region:string; //市场代码 股票包括（HK、SZ、SH、US、SG、JP、TW、IN、TH、DE、MX、MY、TR、ES、NL、GB、ID、VN），外汇（GB），指数（GB），数字币（BA）、期货（US、HK、CN）、基金（US）等
    [k:string]:any;
}
export async function getKlineData(params:Param){
    const { code } = params
    const cacheKey = `kline-${code}-GB`;
    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;
    return await fetchData(cacheKey, params, '/indices/kline')
}