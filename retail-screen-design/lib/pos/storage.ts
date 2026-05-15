import { products as seedProducts, Product } from "@/lib/store";
import type { PosSettings, SaleRecord, StoredProduct } from "./types";

const STORAGE_PRODUCTS = "banhang_products_v1";
const STORAGE_SETTINGS = "banhang_settings_v1";
const STORAGE_SALES = "banhang_sales_v1";

function migrateProduct(p: StoredProduct): StoredProduct {
  return {
    ...p,
    category: (p.category || "").trim() || "Khác",
    costPrice: typeof p.costPrice === "number" && !isNaN(p.costPrice) ? p.costPrice : 0,
    unit: p.unit || "cái",
  };
}

function seedFromStore(): StoredProduct[] {
  return seedProducts.map((p) => ({
    barcode: p.sku,
    name: p.name,
    price: p.price,
    qty: p.stock,
    category: p.category,
    costPrice: p.cost,
    unit: p.unit,
  }));
}

export function loadStoredProducts(): StoredProduct[] {
  if (typeof window === "undefined") return seedFromStore();
  try {
    const raw = localStorage.getItem(STORAGE_PRODUCTS);
    let list: StoredProduct[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list) || !list.length) {
      list = seedFromStore();
      localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(list));
    }
    return list.map(migrateProduct);
  } catch {
    return seedFromStore();
  }
}

export function saveStoredProducts(products: StoredProduct[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));
}

export function storedToProduct(p: StoredProduct): Product {
  return {
    id: p.barcode,
    name: p.name,
    price: p.price,
    cost: p.costPrice,
    category: p.category,
    sku: p.barcode,
    stock: p.qty,
    unit: p.unit || "cái",
  };
}

export function productToStored(p: Product): StoredProduct {
  return {
    barcode: p.sku,
    name: p.name,
    price: p.price,
    qty: p.stock,
    category: p.category,
    costPrice: p.cost,
    unit: p.unit,
  };
}

export function loadSettings(): PosSettings {
  if (typeof window === "undefined") return { shopName: "", defaultVat: 10 };
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS);
    const o = raw ? JSON.parse(raw) : {};
    return {
      shopName: o.shopName || "",
      defaultVat: typeof o.defaultVat === "number" ? o.defaultVat : 10,
    };
  } catch {
    return { shopName: "", defaultVat: 10 };
  }
}

export function saveSettings(settings: PosSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
}

export function loadSales(): SaleRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_SALES);
    const a = raw ? JSON.parse(raw) : [];
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

export function pushSaleRecord(rec: SaleRecord) {
  const arr = loadSales();
  arr.push(rec);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_SALES, JSON.stringify(arr));
  }
}

export function aggregateForCnk(fromStr: string, toStr: string) {
  const fromD = new Date(fromStr + "T00:00:00");
  const toD = new Date(toStr + "T23:59:59.999");
  const sales = loadSales().filter((s) => {
    const d = new Date(s.at);
    return d >= fromD && d <= toD;
  });
  const map = new Map<
    string,
    { name: string; unit: string; qty: number; revenue: number; note: string }
  >();
  for (const s of sales) {
    for (const ln of s.lines || []) {
      const key = (ln.barcode || "") + "|" + ln.name;
      const cur = map.get(key) || {
        name: ln.name,
        unit: "Cái",
        qty: 0,
        revenue: 0,
        note: "",
      };
      cur.qty += ln.qty;
      cur.revenue += ln.lineTotal;
      map.set(key, cur);
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "vi")
  );
}
