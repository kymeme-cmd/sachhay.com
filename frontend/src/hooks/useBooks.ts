// ============================================================
// Hook: useBooks - Quản lý danh sách sách và chi tiết sách
// ============================================================

import { useState, useCallback, useEffect } from "react";
import { productAPI, categoryAPI } from "@/api/client";
import type { Product, Category } from "@/types";

interface UseBooksReturn {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchProducts: (params?: { category_id?: string; search?: string; page?: number; per_page?: number }) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchProduct: (id: string) => Promise<Product | null>;
  selectedProduct: Product | null;
  productLoading: boolean;
}

export function useBooks(): UseBooksReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(
    async (params?: { category_id?: string; search?: string; page?: number; per_page?: number }) => {
      setLoading(true);
      setError(null);
      try {
        const response = await productAPI.list(params);
        setProducts(response.data as Product[]);
      } catch (err: any) {
        setError(err.response?.data?.message || "Không thể tải danh sách sách");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchCategories = useCallback(async () => {
    setError(null);
    try {
      const response = await categoryAPI.list();
      setCategories(response.data as Category[]);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh mục");
    }
  }, []);

  const fetchProduct = useCallback(async (id: string): Promise<Product | null> => {
    setProductLoading(true);
    setError(null);
    try {
      const response = await productAPI.get(id);
      const product = response.data as Product;
      setSelectedProduct(product);
      return product;
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải chi tiết sách");
      return null;
    } finally {
      setProductLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  return {
    products,
    categories,
    loading,
    error,
    fetchProducts,
    fetchCategories,
    fetchProduct,
    selectedProduct,
    productLoading,
  };
}