"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  PackagePlus,
  BarChart3,
  Store,
  Settings,
  LogOut,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Bán hàng",
    href: "/ban-hang",
    icon: ShoppingCart,
  },
  {
    name: "Nhập hàng",
    href: "/nhap-hang",
    icon: PackagePlus,
  },
  {
    name: "Tồn kho",
    href: "/ton-kho",
    icon: Warehouse,
  },
  {
    name: "Báo cáo",
    href: "/bao-cao",
    icon: BarChart3,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-primary rounded-xl p-2.5">
            <Store className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">POS System</h1>
            <p className="text-xs text-muted-foreground">Quản lý bán hàng</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
          <Settings className="h-5 w-5" />
          Cài đặt
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all">
          <LogOut className="h-5 w-5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
