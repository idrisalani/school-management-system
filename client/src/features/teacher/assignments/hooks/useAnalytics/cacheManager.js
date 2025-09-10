//teacher/components/assignments/hooks/useAnalytics/cacheManager.js

export class AnalyticsCache {
    constructor(maxSize = 100) {
      this.cache = new Map();
      this.maxSize = maxSize;
      this.keyTimestamps = new Map();
    }
  
    set(key, value) {
      if (this.cache.size >= this.maxSize) {
        this.evictOldest();
      }
      this.cache.set(key, value);
      this.keyTimestamps.set(key, Date.now());
    }
  
    get(key) {
      if (this.cache.has(key)) {
        this.keyTimestamps.set(key, Date.now()); // Update timestamp
        return this.cache.get(key);
      }
      return null;
    }
  
    evictOldest() {
      const oldest = Array.from(this.keyTimestamps.entries())
        .reduce((a, b) => a[1] < b[1] ? a : b)[0];
      this.cache.delete(oldest);
      this.keyTimestamps.delete(oldest);
    }
  
    clear() {
      this.cache.clear();
      this.keyTimestamps.clear();
    }
  
    clearOlderThan(timestamp) {
      for (const [key, time] of this.keyTimestamps.entries()) {
        if (time < timestamp) {
          this.cache.delete(key);
          this.keyTimestamps.delete(key);
        }
      }
    }
  }