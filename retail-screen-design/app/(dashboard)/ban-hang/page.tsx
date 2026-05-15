"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { SearchBar } from "@/components/pos/search-bar";
import { CategoryTabs } from "@/components/pos/category-tabs";
import { ProductGrid } from "@/components/pos/product-grid";
import { CartSidebar } from "@/components/pos/cart-sidebar";
import {
  BarcodeScanDialog,
  type ScanMode,
} from "@/components/pos/barcode-scan-dialog";
import { Product, CartItem } from "@/lib/store";
import { usePosCatalog } from "@/hooks/use-pos-catalog";
import {
  loadSettings,
  saveSettings,
  pushSaleRecord,
  loadStoredProducts,
  saveStoredProducts,
} from "@/lib/pos/storage";
import { buildSaleQrPayload, printInvoice } from "@/lib/pos/invoice";
import { calcCartTotals, parseInvoicePayload } from "@/lib/pos/scan";
import type { LastSale } from "@/lib/pos/types";

export default function SalesPage() {
  const { products, ready, findBySku, saveAll, refresh } = usePosCatalog();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [vatRate, setVatRate] = useState(10);
  const [discount, setDiscount] = useState(0);
  const [printOnCheckout, setPrintOnCheckout] = useState(true);
  const [lastSale, setLastSale] = useState<LastSale | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>("cart");

  useEffect(() => {
    const s = loadSettings();
    setVatRate(s.defaultVat);
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["Tất cả", ...Array.from(set).sort((a, b) => a.localeCompare(b, "vi"))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === "Tất cả" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const addToCart = useCallback((product: Product, qty = 1) => {
    if (product.stock <= 0) {
      toast.error("Hết hàng: " + product.name);
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        const nextQty = existing.quantity + qty;
        if (nextQty > product.stock) {
          toast.error("Không đủ tồn kho");
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: nextQty } : item
        );
      }
      return [...prev, { ...product, quantity: Math.min(qty, product.stock) }];
    });
  }, []);

  const addByBarcode = useCallback(
    (code: string, qty = 1) => {
      const p = findBySku(code);
      if (p) {
        addToCart(p, qty);
        toast.success("Đã thêm: " + p.name);
      } else {
        toast.error("Không tìm thấy mã: " + code);
        setSearchQuery(code);
      }
    },
    [findBySku, addToCart]
  );

  const applyInboundFromQr = useCallback(
    (items: { barcode: string; qty: number }[]) => {
      const stored = loadStoredProducts();
      let n = 0;
      for (const it of items) {
        const idx = stored.findIndex((p) => p.barcode === it.barcode);
        if (idx >= 0) {
          stored[idx].qty += it.qty;
          n++;
        }
      }
      if (n > 0) {
        saveStoredProducts(stored);
        refresh();
        toast.success(`Nhập kho QR: ${n} mặt hàng`);
      } else {
        toast.error("QR không khớp sản phẩm trong kho");
      }
    },
    [refresh]
  );

  const handleScan = useCallback(
    (text: string) => {
      const inv = parseInvoicePayload(text);
      if (scanMode === "invoice") {
        if (inv) applyInboundFromQr(inv);
        else toast.error("QR không phải hóa đơn nhập hợp lệ");
        return;
      }
      if (scanMode === "cart") {
        if (inv) {
          applyInboundFromQr(inv);
          return;
        }
        addByBarcode(text.trim(), 1);
        return;
      }
      if (inv) {
        applyInboundFromQr(inv);
        return;
      }
      const p = findBySku(text.trim());
      if (p) {
        setSearchQuery(p.sku);
        toast.success("Sản phẩm: " + p.name);
      } else {
        setSearchQuery(text.trim());
        toast.error("Không tìm thấy mã");
      }
    },
    [scanMode, addByBarcode, applyInboundFromQr, findBySku]
  );

  const updateQuantity = (id: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const p = products.find((x) => x.id === id);
        const max = p?.stock ?? quantity;
        return { ...item, quantity: Math.min(Math.max(1, quantity), max) };
      })
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCartItems([]);

  const handleCheckout = async () => {
    if (!cartItems.length) return;

    for (const line of cartItems) {
      const p = products.find((x) => x.id === line.id);
      if (!p || line.quantity > p.stock) {
        toast.error("Không đủ tồn: " + line.name);
        return;
      }
    }

    const { subtotal, vatAmount, total } = calcCartTotals(
      cartItems,
      vatRate,
      discount
    );
    const settings = loadSettings();
    const shop = settings.shopName || "Hóa đơn bán lẻ";
    const id = "HD-" + Date.now().toString(36).toUpperCase();
    const at = new Date();
    let cogs = 0;

    const lines = cartItems.map((line) => {
      const lt = line.price * line.quantity;
      cogs += (line.cost ?? 0) * line.quantity;
      return {
        barcode: line.sku,
        name: line.name,
        qty: line.quantity,
        price: line.price,
        lineTotal: lt,
      };
    });

    const nextProducts = products.map((p) => {
      const line = cartItems.find((c) => c.id === p.id);
      if (!line) return p;
      return { ...p, stock: p.stock - line.quantity };
    });
    saveAll(nextProducts);

    const saleBase = {
      id,
      at: at.toLocaleString("vi-VN"),
      shop,
      lines,
      subtotal,
      discount,
      vatRate,
      vatAmount,
      total,
    };
    const qrData = buildSaleQrPayload({
      ...saleBase,
      at: at.toISOString(),
    });
    const sale: LastSale = { ...saleBase, qrData };
    setLastSale(sale);

    pushSaleRecord({
      id,
      at: at.toISOString(),
      shop,
      lines,
      subtotal,
      discount,
      vatRate,
      vatAmount,
      total,
      cogs,
    });

    saveSettings({ ...settings, defaultVat: vatRate });
    clearCart();
    toast.success("Thanh toán thành công");

    if (printOnCheckout) {
      setTimeout(() => printInvoice(sale), 250);
    }
  };

  const handlePrintLast = () => {
    if (!lastSale) {
      toast.error("Chưa có hóa đơn để in");
      return;
    }
    printInvoice(lastSale);
  };

  if (!ready) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Đang tải sản phẩm...
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden p-6">
        <div className="space-y-5">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onScanClick={() => setScanOpen(true)}
          />
          <CategoryTabs
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            categories={categories}
          />
        </div>

        <div className="flex-1 overflow-y-auto mt-6 pr-2">
          <ProductGrid products={filteredProducts} onAddToCart={addToCart} />
        </div>
      </div>

      <aside className="w-[380px] flex-shrink-0">
        <CartSidebar
          items={cartItems}
          vatRate={vatRate}
          discount={discount}
          printOnCheckout={printOnCheckout}
          onVatRateChange={setVatRate}
          onDiscountChange={setDiscount}
          onPrintOnCheckoutChange={setPrintOnCheckout}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onCheckout={handleCheckout}
          onClearCart={clearCart}
          onPrintLast={handlePrintLast}
          canPrint={!!lastSale}
        />
      </aside>

      <BarcodeScanDialog
        open={scanOpen}
        onOpenChange={setScanOpen}
        mode={scanMode}
        onModeChange={setScanMode}
        onScan={handleScan}
      />
    </div>
  );
}
