import { stock } from 'tushare';
import { getCache, setCache } from './Cache';
const token = '3dcd6ebb3cbadc3c6162d8e9a211dec89929549aff2312c22f970581'
export async function getHS300() : Promise<any[]> {
    const cacheKey = `tushare-HS300`;
    const d = getCache<any>(cacheKey, 10000*60*60*4)
    if(d) return d
    try{
        const { data } = await stock.getHS300()
        if(data && Array.isArray(data) && data.length){
            console.log('tushare.js stock.getHS300()', data)
            setCache(cacheKey, data)
            return data
        }
        return []
    }catch(e:any){
        console.log('tushare.js stock.getHS300() Error: ', String(e))
        return []
    }
}