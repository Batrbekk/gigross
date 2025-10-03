import { PersistStorage, StorageValue } from 'zustand/middleware';

// Кастомное хранилище, которое сохраняет данные и в localStorage, и в cookie
export const createCookieStorage = <T>(): PersistStorage<T> => {
  return {
    getItem: async (name: string): Promise<StorageValue<T> | null> => {
      // Сначала пробуем получить из localStorage
      if (typeof window !== 'undefined') {
        const item = localStorage.getItem(name);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            // Также сохраняем в cookie для middleware
            document.cookie = `${name}=${encodeURIComponent(item)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Strict`;
            return parsed;
          } catch {
            return null;
          }
        }
      }
      return null;
    },
           setItem: async (name: string, value: StorageValue<T>): Promise<void> => {
             // Сохраняем в localStorage
             if (typeof window !== 'undefined') {
               const stringValue = JSON.stringify(value);
               localStorage.setItem(name, stringValue);
               // Также сохраняем в cookie для middleware
               document.cookie = `${name}=${encodeURIComponent(stringValue)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Strict`;
             }
           },
    removeItem: async (name: string): Promise<void> => {
      // Удаляем из localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(name);
        // Удаляем cookie
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    },
  };
};
