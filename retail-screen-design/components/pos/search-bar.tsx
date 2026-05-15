"use client";

import { Search, Barcode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onScanClick?: () => void;
}

export function SearchBar({ value, onChange, onScanClick }: SearchBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Tìm kiếm sản phẩm theo tên hoặc mã SKU..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-12 pr-4 h-14 text-base bg-card border-border rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-14 px-6 rounded-xl border-border bg-card hover:bg-secondary"
        onClick={onScanClick}
      >
        <Barcode className="h-5 w-5 mr-2" />
        Quét mã
      </Button>
    </div>
  );
}

