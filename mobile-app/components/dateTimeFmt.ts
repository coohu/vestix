import { DateTime } from 'luxon';

export function transformTimeZone(timeStr: string,fromZone: string,toZone: string): string {
  return DateTime.fromSQL(timeStr, { zone: fromZone }) // 解析原始时区时间
    .setZone(toZone)                                   // 转换到目标时区
    .toFormat('yyyy-MM-dd HH:mm:ss');                  // 格式化输出
}

// // 针对你提供的 IBM 数据示例
// const ibmData = {
//   "3. Last Refreshed": "2025-12-17 16:00:00",
//   "5. Time Zone": "US/Eastern"
// };

// const result = transformTimeZone(
//   ibmData["3. Last Refreshed"],
//   "America/New_York", // US/Eastern 的标准 ID
//   "Asia/Shanghai"
// );

// console.log(result); // 输出: 2025-12-18 05:00:00 (假设处于冬令时)



export function convertTimeZone(utcTimeString:string, tz?:string) {
    const utcDate = new Date(utcTimeString + ' UTC');
    let timez = Intl.DateTimeFormat().resolvedOptions().timeZone
    let local = Intl.DateTimeFormat().resolvedOptions().locale
    if( tz ){
        timez = getLocaleTimezone(tz)
        local = tz
    }
    Intl.DateTimeFormat().resolvedOptions().locale
    return new Intl.DateTimeFormat(local, {
        timeZone: timez,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(utcDate).replace(/\//g, '-');
}

export const localeToTimezoneMap: Record<string, string> = {
  // 中国
  'zh-CN': 'Asia/Shanghai',
  'zh': 'Asia/Shanghai',
  
  // 美国
  'en-US': 'America/New_York',
  'en': 'America/New_York',
  
  // 日本
  'ja-JP': 'Asia/Tokyo',
  'ja': 'Asia/Tokyo',
  
  // 韩国
  'ko-KR': 'Asia/Seoul',
  'ko': 'Asia/Seoul',
  
  // 德国
  'de-DE': 'Europe/Berlin',
  'de': 'Europe/Berlin',
  
  // 法国
  'fr-FR': 'Europe/Paris',
  'fr': 'Europe/Paris',
  
  // 西班牙
  'es-ES': 'Europe/Madrid',
  'es': 'Europe/Madrid',
  
  // 俄罗斯
  'ru-RU': 'Europe/Moscow',
  'ru': 'Europe/Moscow',
  
  // 巴西
  'pt-BR': 'America/Sao_Paulo',
  'pt': 'America/Sao_Paulo',
  
  // 意大利
  'it-IT': 'Europe/Rome',
  'it': 'Europe/Rome',
  
  // 英国
  'en-GB': 'Europe/London',
  
  // 澳大利亚
  'en-AU': 'Australia/Sydney',
  
  // 印度
  'hi-IN': 'Asia/Kolkata',
  'en-IN': 'Asia/Kolkata',
  
  // 加拿大
  'en-CA': 'America/Toronto',
  'fr-CA': 'America/Montreal',
  
  // 默认时区
  'default': 'UTC'
};
export function getLocaleTimezone(locale: string = 'zh-CN'): string {
  // 尝试精确匹配
  if (localeToTimezoneMap[locale]) {
    return localeToTimezoneMap[locale];
  }
  
  // 尝试匹配语言部分 (如 'zh-CN' -> 'zh')
  const language = locale.split('-')[0];
  if (localeToTimezoneMap[language]) {
    return localeToTimezoneMap[language];
  }
  
  // 尝试匹配大写版本
  const upperLocale = locale.toUpperCase();
  if (localeToTimezoneMap[upperLocale]) {
    return localeToTimezoneMap[upperLocale];
  }
  
  // 尝试匹配小写版本
  const lowerLocale = locale.toLowerCase();
  if (localeToTimezoneMap[lowerLocale]) {
    return localeToTimezoneMap[lowerLocale];
  }
  
  // 返回默认时区
  console.warn(`No timezone found for locale "${locale}", using default`);
  return Intl.DateTimeFormat().resolvedOptions().timeZone || localeToTimezoneMap['default'];
}