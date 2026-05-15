"use client";

import { Package, Plus } from "lucide-react";
import { Product, formatCurrency } from "@/lib/store";
import { cn } from "@/lib/utils";

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Package className="h-16 w-16 mb-4" />
        <p className="text-lg">Không tìm thấy sản phẩm</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
          className={cn(
            "group relative bg-card rounded-2xl border border-border p-4 text-left transition-all",
            "hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5",
            "focus:outline-none focus:ring-2 focus:ring-primary/20",
            product.stock === 0 && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="aspect-square rounded-xl bg-secondary mb-3 flex items-center justify-center overflow-hidden">
            <Package className="h-12 w-12 text-muted-foreground/40" />
          </div>
          
          <div className="space-y-1">
            <p className="font-medium text-foreground line-clamp-2 leading-tight">
              {product.name}
            </p>
            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(product.price)}
            </p>
          </div>

          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
              <Plus className="h-4 w-4" />
            </div>
          </div>

          <div className="absolute top-3 left-3">
            <span
              className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                product.stock > 20
                  ? "bg-success/10 text-success"
                  : product.stock > 0
                  ? "bg-accent/10 text-accent"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {product.stock > 0 ? `Còn ${product.stock}` : "Hết hàng"}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
