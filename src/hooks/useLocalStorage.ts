import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const readValue = useCallback((): T => {
    if (!isClient) {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [isClient, key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);
  
  useEffect(() => {
    // Update state if value is read from localStorage after initial mount
    // and is different from the initial computed state.
    // This handles scenarios where initialValue might be a function call.
    const valueFromStorage = readValue();
    if (JSON.stringify(storedValue) !== JSON.stringify(valueFromStorage)) {
        setStoredValue(valueFromStorage);
    }
  }, [readValue, storedValue]);


  const setValue = (value: T | ((val: T) => T)) => {
    if (!isClient) {
      console.warn(`Tried to set localStorage key "${key}" on the server.`);
      // Update the state optimistically even if not client-side yet,
      // so UI can reflect change before hydration if needed.
      const newValue = value instanceof Function ? value(storedValue) : value;
      setStoredValue(newValue);
      return;
    }
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        if (event.newValue !== null) {
          try {
            setStoredValue(JSON.parse(event.newValue));
          } catch (error) {
            console.warn(`Error parsing storage change for key "${key}":`, error);
          }
        } else {
          // Key was removed or set to null
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue, isClient]);


  return [storedValue, setValue];
}

export default useLocalStorage;
