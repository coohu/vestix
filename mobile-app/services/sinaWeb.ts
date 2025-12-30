import axios from 'axios';
import { getCache, setCache } from './Cache';

export async function cnIdx () {
  const cacheKey = 'sina-cn-index'
  const data = await getCache<any[]>(cacheKey , 1000*60*5)
  if(data && data.length) return data

  const url = 'http://H384fj23045v.aivon.top' //'https://vip.stock.finance.sina.com.cn'
  try{
    const res = await axios.get(`${url}/quotes_service/api/json_v2.php/Market_Center.getHQNodeDataSimple`, {
      // headers:{
      //   'Referer': 'https://vip.stock.finance.sina.com.cn/mkt/' ,
      //   'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      //   'Accept': '*/*',
      //   'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      // },
      params:{ page:1, num:40, sort:'symbol', asc:1, node:'dpzs', _s_r_a:'init' },
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

// export  {
//   async fetch(request) {
//     const url = new URL(request.url);
    
//     // 目标 API 地址
//     const targetUrl = 'https://api.coingecko.com/api/v3' + url.pathname + url.search;

//     // 复制原始请求的 Header
//     const newHeaders = new Headers(request.headers);
    
//     // 【核心】在这里填入你的 CoinGecko API Key
//     // 如果是免费版，Header 名通常是 x-cg-demo-api-key
//     // newHeaders.set('x-cg-demo-api-key', '你的_API_KEY_粘贴在这里');

//     const modifiedRequest = new Request(targetUrl, {
//       method: request.method,
//       headers: newHeaders,
//       redirect: 'follow'
//     });

//     try {
//       const response = await fetch(modifiedRequest);
      
//       // 添加 CORS 跨域支持，方便你在本地网页调用
//       const corsHeaders = new Headers(response.headers);
//       corsHeaders.set('Access-Control-Allow-Origin', '*');
//       corsHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

//       return new Response(response.body, {
//         status: response.status,
//         statusText: response.statusText,
//         headers: corsHeaders
//       });
//     } catch (e) {
//       return new Response('Error connecting to CoinGecko', { status: 500 });
//     }
//   }
// };

// export default {
//   async fetch(request) {
//     const url = new URL(request.url);
//     const targetUrl = 'https://vip.stock.finance.sina.com.cn' + url.pathname + url.search;

//     const newHeaders = new Headers(request.headers);
//     newHeaders.set('Referer', 'https://vip.stock.finance.sina.com.cn/mkt/');
//     const modifiedRequest = new Request(targetUrl, {
//       method: request.method,
//       headers: newHeaders,
//       redirect: 'follow'
//     });

//     try {
//       const res = await fetch(modifiedRequest);
//       const corsHeaders = new Headers(res.headers);
//       corsHeaders.set('Access-Control-Allow-Origin', '*');
//       corsHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

//       return new Response(res.body, {
//         status: res.status,
//         statusText: res.statusText,
//         headers: corsHeaders
//       });
//     } catch (e) {
//       return new Response('Error connecting to CoinGecko', { status: 500 });
//     }
//   }
// };