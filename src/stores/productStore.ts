import { create } from 'zustand';
import { Product, CreateProductInput, ProductFilters, PaginatedResponse } from '@/types';

interface ProductState {
  products: Product[];
  currentProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;

  // Actions
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  createProduct: (productData: CreateProductInput) => Promise<Product>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  clearError: () => void;
  setCurrentProduct: (product: Product | null) => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  currentProduct: null,
  isLoading: false,
  error: null,
  pagination: null,

  fetchProducts: async (filters?: ProductFilters) => {
    set({ isLoading: true, error: null });

    try {
      const queryParams = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`/api/products?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      const result = data.data as PaginatedResponse<Product>;

      set({
        products: result.data,
        pagination: result.pagination,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch products',
      });
    }
  },

  fetchProduct: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/products/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch product');
      }

      set({
        currentProduct: data.data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch product',
      });
    }
  },

  createProduct: async (productData: CreateProductInput) => {
    set({ isLoading: true, error: null });

    try {
      // Получаем токен из authStore
      const authStore = (window as any).__authStore;
      const tokens = authStore?.getState()?.tokens;

      if (!tokens) {
        throw new Error('No access token');
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      const newProduct = data.data as Product;

      set(state => ({
        products: [newProduct, ...state.products],
        isLoading: false,
        error: null,
      }));

      return newProduct;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create product',
      });
      throw error;
    }
  },

  updateProduct: async (id: string, productData: Partial<Product>) => {
    set({ isLoading: true, error: null });

    try {
      // Получаем токен из authStore
      const authStore = (window as any).__authStore;
      const tokens = authStore?.getState()?.tokens;

      if (!tokens) {
        throw new Error('No access token');
      }

      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update product');
      }

      const updatedProduct = data.data as Product;

      set(state => ({
        products: state.products.map(p => (p._id === id ? updatedProduct : p)),
        currentProduct: state.currentProduct?._id === id ? updatedProduct : state.currentProduct,
        isLoading: false,
        error: null,
      }));

      return updatedProduct;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update product',
      });
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      // Получаем токен из authStore
      const authStore = (window as any).__authStore;
      const tokens = authStore?.getState()?.tokens;

      if (!tokens) {
        throw new Error('No access token');
      }

      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete product');
      }

      set(state => ({
        products: state.products.filter(p => p._id !== id),
        currentProduct: state.currentProduct?._id === id ? null : state.currentProduct,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete product',
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setCurrentProduct: (product: Product | null) => {
    set({ currentProduct: product });
  },
}));
