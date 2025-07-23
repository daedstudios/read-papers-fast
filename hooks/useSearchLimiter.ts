// hooks/useSearchLimiter.ts
import { useState, useEffect } from "react";

const MAX_FREE_SEARCHES = 2;
const STORAGE_KEY = "search_count";

export const useSearchLimiter = () => {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if localStorage is available (client-side only)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      
      if (stored === null) {
        // Key doesn't exist, initialize with 0
        localStorage.setItem(STORAGE_KEY, "0");
        setCount(0);
      } else {
        // Key exists, parse and set the value
        const parsedCount = parseInt(stored, 10);
        setCount(isNaN(parsedCount) ? 0 : parsedCount);
      }
      
      setIsLoading(false);
    }
  }, []);

  const increment = () => {
    if (typeof window !== 'undefined') {
      const newCount = count + 1;
      localStorage.setItem(STORAGE_KEY, newCount.toString());
      setCount(newCount);
    }
  };

  const reset = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, "0");
      setCount(0);
    }
  };

  const getRemainingSearches = () => {
    return Math.max(0, MAX_FREE_SEARCHES - count);
  };

  const isLimitReached = count >= MAX_FREE_SEARCHES;

  return { 
    count, 
    increment, 
    reset,
    isLimitReached, 
    isLoading,
    remainingSearches: getRemainingSearches(),
    maxSearches: MAX_FREE_SEARCHES
  };
};
