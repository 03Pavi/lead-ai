import NodeCache from "node-cache";

// Cache results for 10 minutes (600 seconds) by default
const searchCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

export class CacheService {
  static get<T>(key: string): T | undefined {
    try {
      return searchCache.get<T>(key);
    } catch {
      return undefined;
    }
  }

  static set<T>(key: string, value: T, ttlSeconds?: number): boolean {
    try {
      if (ttlSeconds !== undefined) {
        return searchCache.set(key, value, ttlSeconds);
      }
      return searchCache.set(key, value);
    } catch {
      return false;
    }
  }

  static delete(key: string): number {
    try {
      return searchCache.del(key);
    } catch {
      return 0;
    }
  }

  static clear(): void {
    try {
      searchCache.flushAll();
    } catch {
      // no-op
    }
  }
}
