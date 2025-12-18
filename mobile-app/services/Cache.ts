import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_TTL = 60 * 60 * 1000; // 60 minutes

interface CacheData<T> {
  timestamp: number;
  data: T;
}

export async function getCache<T>(key: string, ttl: number = CACHE_TTL): Promise<T | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    if (jsonValue !== null) {
      const parsed: CacheData<T> = JSON.parse(jsonValue);
      if (Date.now() - parsed.timestamp < ttl) {
        return parsed.data;
      }
    }
  } catch (e) {
    console.error('Failed to read cache', e);
  }
  return null;
}

export async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    const cacheData: CacheData<T> = {
      timestamp: Date.now(),
      data,
    };
    const jsonValue = JSON.stringify(cacheData);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Failed to write cache', e);
  }
}
