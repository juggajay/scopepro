import { useState, useEffect } from "react";

/**
 * Returns a debounced version of the value that only updates
 * after the specified delay has elapsed since the last change.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default 500)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
