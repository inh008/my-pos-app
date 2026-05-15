"use client";

import { useCallback, useEffect, useState } from "react";
import { Product } from "@/lib/store";
import {
  loadStoredProducts,
  saveStoredProducts,
  storedToProduct,
  productToStored,
} from "@/lib/pos/storage";
import type { StoredProduct } from "@/lib/pos/types";

export function usePosCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    const list = loadStoredProducts().map(storedToProduct);
    setProducts(list);
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveAll = useCallback((list: Product[]) => {
    const stored = list.map(productToStored);
    saveStoredProducts(stored);
    setProducts(list);
  }, []);

  const updateStock = useCallback(
    (sku: string, delta: number) => {
      const next = products.map((p) =>
        p.sku === sku ? { ...p, stock: Math.max(0, p.stock + delta) } : p
      );
      saveAll(next);
    },
    [products, saveAll]
  );

  const findBySku = useCallback(
    (sku: string) => products.find((p) => p.sku === sku || p.id === sku),
    [products]
  );

  const upsertStored = useCallback(
    (item: StoredProduct) => {
      const list = loadStoredProducts();
      const idx = list.findIndex((p) => p.barcode === item.barcode);
      if (idx >= 0) list[idx] = item;
      else list.push(item);
      saveStoredProducts(list);
      refresh();
    },
    [refresh]
  );

  return {
    products,
    ready,
    refresh,
    saveAll,
    updateStock,
    findBySku,
    upsertStored,
  };
}
