"use client";

import { ShoppingCart, Minus, Plus, Trash2, User, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CartItem, formatCurrency } from "@/lib/store";
import { cn } from "@/lib/utils";

interface CartSidebarProps {
  items: CartItem[];
  vatRate: number;
  discount: number;
  printOnCheckout: boolean;
  onVatRateChange: (rate: number) => void;
  onDiscountChange: (amount: number) => void;
  onPrintOnCheckoutChange: (v: boolean) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onClearCart: () => void;
  onPrintLast?: () => void;
  canPrint?: boolean;
}

export function CartSidebar({
  items,
  vatRate,
  discount,
  printOnCheckout,
  onVatRateChange,
  onDiscountChange,
  onPrintOnCheckoutChange,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onClearCart,
  onPrintLast,
  canPrint,
}: CartSidebarProps) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const afterDisc = Math.max(0, subtotal - discount);
  const tax = Math.round((afterDisc * vatRate) / 100);
  const total = afterDisc + tax;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-xl p-2.5">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">Giỏ hàng</h2>
              <p className="text-sm text-muted-foreground">
                {totalItems} sản phẩm
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearCart}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Xóa tất cả
            </Button>
          )}
        </div>

        <button
          type="button"
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-secondary/50 transition-colors"
        >
          <div className="bg-secondary rounded-full p-2">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-sm text-muted-foreground">Thêm khách hàng</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ShoppingCart className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-center">Giỏ hàng trống</p>
            <p className="text-sm text-center mt-1">
              Chọn sản phẩm hoặc quét mã để thêm
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-secondary/50 rounded-xl p-3 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {item.sku}
                  </p>
                  <p className="text-sm text-primary font-semibold">
                    {formatCurrency(item.price)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() =>
                      onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
                    }
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <p className="font-bold text-foreground">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-5 border-t border-border space-y-4 bg-secondary/30">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              VAT (%)
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={vatRate}
              onChange={(e) => onVatRateChange(parseFloat(e.target.value) || 0)}
              className="h-9"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Chiết khấu (đ)
            </label>
            <Input
              type="number"
              min={0}
              step={1000}
              value={discount}
              onChange={(e) => onDiscountChange(parseInt(e.target.value, 10) || 0)}
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tạm tính</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Chiết khấu</span>
              <span className="font-medium text-destructive">
                −{formatCurrency(discount)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VAT ({vatRate}%)</span>
            <span className="font-medium">{formatCurrency(tax)}</span>
          </div>
          <div className="h-px bg-border my-2" />
          <div className="flex justify-between items-center">
            <span className="font-semibold text-foreground">Tổng cộng</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={printOnCheckout}
            onChange={(e) => onPrintOnCheckoutChange(e.target.checked)}
            className="rounded border-border"
          />
          In hóa đơn sau thanh toán
        </label>

        <Button
          size="lg"
          className={cn(
            "w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all",
            "bg-success hover:bg-success/90 text-success-foreground",
            items.length === 0 && "opacity-50 cursor-not-allowed"
          )}
          disabled={items.length === 0}
          onClick={onCheckout}
        >
          <ShoppingCart className="h-5 w-5 mr-3" />
          Thanh toán
        </Button>

        {onPrintLast && (
          <Button
            variant="outline"
            className="w-full rounded-xl"
            disabled={!canPrint}
            onClick={onPrintLast}
          >
            <Printer className="h-4 w-4 mr-2" />
            In hóa đơn vừa bán
          </Button>
        )}
      </div>
    </div>
  );
}
