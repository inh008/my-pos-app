"use client";

import { useState, useMemo, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Wallet,
  PiggyBank,
  Calendar,
  ArrowUpRight,
  FileDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatShortDate } from "@/lib/store";
import { loadSales, loadSettings, aggregateForCnk } from "@/lib/pos/storage";
import { exportCnk } from "@/lib/pos/cnk-export";
import type { SaleRecord } from "@/lib/pos/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TimeRange = "today" | "week" | "month" | "year";

function getFilterDate(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
  }
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "primary" | "success" | "accent" | "destructive";
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    accent: "bg-accent/10 text-accent",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-xl", colorClasses[color])}>{icon}</div>
      </div>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

export default function ReportPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setSales(loadSales());
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    setExportFrom(`${y}-${m}-01`);
    setExportTo(now.toISOString().slice(0, 10));
  }, []);

  const filteredSales = useMemo(() => {
    const filterDate = getFilterDate(timeRange);
    return sales.filter((s) => new Date(s.at) >= filterDate);
  }, [sales, timeRange]);

  const stats = useMemo(() => {
    const revenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const cost = filteredSales.reduce((sum, s) => sum + (s.cogs || 0), 0);
    const profit = revenue - cost;
    return {
      revenue,
      cost,
      profit,
      orders: filteredSales.length,
      profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0",
    };
  }, [filteredSales]);

  const timeRangeLabels: Record<TimeRange, string> = {
    today: "Hôm nay",
    week: "7 ngày qua",
    month: "Tháng này",
    year: "Năm nay",
  };

  const handleExportCnk = async () => {
    if (!exportFrom || !exportTo) {
      toast.error("Chọn khoảng ngày xuất 01/CNKD");
      return;
    }
    setExporting(true);
    try {
      const rows = aggregateForCnk(exportFrom, exportTo);
      if (!rows.length) {
        toast.error("Không có doanh thu trong kỳ đã chọn");
        return;
      }
      const shop = loadSettings().shopName || "Hộ kinh doanh";
      await exportCnk(shop, exportFrom, exportTo, rows);
      toast.success("Đã xuất file Word 01/CNKD");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xuất file thất bại");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 rounded-xl p-3">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Báo cáo doanh thu
              </h1>
              <p className="text-muted-foreground">
                Dữ liệu từ đơn bán hàng (localStorage)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select
              value={timeRange}
              onValueChange={(v) => setTimeRange(v as TimeRange)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="week">7 ngày qua</SelectItem>
                <SelectItem value="month">Tháng này</SelectItem>
                <SelectItem value="year">Năm nay</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Doanh thu"
            value={formatCurrency(stats.revenue)}
            icon={<DollarSign className="h-5 w-5" />}
            color="primary"
          />
          <StatCard
            title="Vốn (COGS)"
            value={formatCurrency(stats.cost)}
            icon={<Wallet className="h-5 w-5" />}
            color="accent"
          />
          <StatCard
            title="Lợi nhuận"
            value={formatCurrency(stats.profit)}
            icon={<PiggyBank className="h-5 w-5" />}
            color="success"
          />
          <StatCard
            title="Số đơn"
            value={stats.orders.toString()}
            icon={<ShoppingBag className="h-5 w-5" />}
            color="primary"
          />
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 flex flex-wrap items-end gap-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">
              Xuất mẫu 01/CNKD — Từ ngày
            </label>
            <Input
              type="date"
              value={exportFrom}
              onChange={(e) => setExportFrom(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">
              Đến ngày
            </label>
            <Input
              type="date"
              value={exportTo}
              onChange={(e) => setExportTo(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <Button onClick={handleExportCnk} disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Xuất 01/CNKD (Word)
          </Button>
          <p className="text-xs text-muted-foreground w-full">
            Kèm phụ lục bảng kê vào file mẫu{" "}
            <code className="text-foreground">public/templates/Mau-01-CNKD.docx</code>
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            Tổng kết — {timeRangeLabels[timeRange]}
          </h3>
          <div className="bg-secondary/50 rounded-xl p-4 inline-block">
            <p className="text-sm text-muted-foreground mb-1">Tỷ suất lợi nhuận</p>
            <p className="text-3xl font-bold text-success">{stats.profitMargin}%</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">
            Chi tiết đơn hàng — {timeRangeLabels[timeRange]}
          </h3>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="text-right">Doanh thu</TableHead>
                <TableHead className="text-right">Vốn</TableHead>
                <TableHead className="text-right">Lợi nhuận</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    Chưa có đơn bán trong kỳ — thanh toán tại Bán hàng để ghi nhận
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.id}</TableCell>
                    <TableCell>{formatShortDate(sale.at)}</TableCell>
                    <TableCell className="max-w-[240px] truncate">
                      {sale.lines.map((l) => l.name).join(", ")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(sale.cogs || 0)}
                    </TableCell>
                    <TableCell className="text-right text-success font-medium">
                      {formatCurrency(sale.total - (sale.cogs || 0))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
