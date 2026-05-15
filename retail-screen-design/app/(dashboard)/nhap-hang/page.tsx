"use client";

import { useState, useRef, useCallback } from "react";
import {
  PackagePlus,
  Search,
  Plus,
  Trash2,
  Save,
  Package,
  Calendar,
  Building2,
  Camera,
  Upload,
  FileText,
  Loader2,
  Check,
  X,
  Sparkles,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  sampleImportData,
  formatCurrency,
  formatDate,
  Product,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import { usePosCatalog } from "@/hooks/use-pos-catalog";
import { runOcrOnFile } from "@/lib/pos/ocr";
import { toast } from "sonner";

interface ImportItem {
  id: string;
  product: Product | null;
  quantity: number;
  costPerUnit: number;
}

interface ScannedItem {
  name: string;
  quantity: number;
  price: number;
  matched?: Product;
}

function matchProductByName(name: string, catalog: Product[]): Product | undefined {
  const n = name.toLowerCase().trim();
  return (
    catalog.find((p) => p.name.toLowerCase() === n) ||
    catalog.find((p) => p.name.toLowerCase().includes(n) || n.includes(p.name.toLowerCase()))
  );
}

export default function ImportPage() {
  const { products, saveAll } = usePosCatalog();
  const [searchQuery, setSearchQuery] = useState("");
  const [supplier, setSupplier] = useState("");
  const [importItems, setImportItems] = useState<ImportItem[]>([
    { id: "1", product: null, quantity: 1, costPerUnit: 0 },
  ]);
  
  // Scanning states
  const [isScanning, setIsScanning] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [scanProgress, setScanProgress] = useState<"idle" | "uploading" | "processing" | "done">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addItem = () => {
    setImportItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        product: null,
        quantity: 1,
        costPerUnit: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setImportItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<ImportItem>) => {
    setImportItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const selectProduct = (id: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      updateItem(id, { product, costPerUnit: product.cost });
    }
  };

  const totalCost = importItems.reduce(
    (sum, item) => sum + item.quantity * item.costPerUnit,
    0
  );

  const totalItems = importItems.reduce(
    (sum, item) => sum + (item.product ? item.quantity : 0),
    0
  );

  const handleSave = () => {
    const valid = importItems.filter((i) => i.product && i.quantity > 0);
    if (!valid.length) {
      toast.error("Chọn ít nhất một sản phẩm");
      return;
    }
    const next = products.map((p) => {
      const lines = valid.filter((i) => i.product!.id === p.id);
      if (!lines.length) return p;
      const addQty = lines.reduce((s, i) => s + i.quantity, 0);
      const avgCost =
        lines.reduce((s, i) => s + i.costPerUnit * i.quantity, 0) /
        lines.reduce((s, i) => s + i.quantity, 0);
      return {
        ...p,
        stock: p.stock + addQty,
        cost: avgCost > 0 ? Math.round(avgCost) : p.cost,
      };
    });
    saveAll(next);
    toast.success("Đã lưu phiếu nhập — cập nhật tồn kho");
    setImportItems([{ id: "1", product: null, quantity: 1, costPerUnit: 0 }]);
    setSupplier("");
  };

  const filteredHistory = sampleImportData.filter(
    (record) =>
      record.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scan invoice handlers
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const processFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setScanProgress("uploading");
    try {
      await new Promise((r) => setTimeout(r, 300));
      setScanProgress("processing");
      const lines = await runOcrOnFile(file);
      if (!lines.length) {
        toast.error("Không nhận diện được dòng hàng trên hóa đơn");
        setScanProgress("idle");
        return;
      }
      const scanned: ScannedItem[] = lines.map((ln) => ({
        name: ln.name,
        quantity: ln.qty,
        price: ln.unitPrice,
        matched: matchProductByName(ln.name, products),
      }));
      setScannedItems(scanned);
      setScanProgress("done");
      toast.success(`OCR: ${scanned.length} dòng`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "OCR thất bại");
      setScanProgress("idle");
    }
  };

  const matchScannedItem = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setScannedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, matched: product } : item))
    );
  };

  const applyScannedItems = () => {
    const newItems: ImportItem[] = scannedItems
      .filter((item) => item.matched)
      .map((item, index) => ({
        id: `scanned-${Date.now()}-${index}`,
        product: item.matched!,
        quantity: item.quantity,
        costPerUnit: item.price,
      }));

    if (newItems.length > 0) {
      // Replace the empty first item or add to existing
      if (importItems.length === 1 && !importItems[0].product) {
        setImportItems(newItems);
      } else {
        setImportItems((prev) => [...prev, ...newItems]);
      }
    }

    // Reset scan state
    setScanModalOpen(false);
    setScannedItems([]);
    setScanProgress("idle");
    setPreviewUrl(null);
  };

  const resetScan = () => {
    setScannedItems([]);
    setScanProgress("idle");
    setPreviewUrl(null);
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: Import Form */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 rounded-xl p-3">
                <PackagePlus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Nhap hang</h1>
                <p className="text-muted-foreground">
                  Tao phieu nhap hang moi
                </p>
              </div>
            </div>
            
            {/* Scan Invoice Button */}
            <Button 
              onClick={() => setScanModalOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              Quet hoa don
            </Button>
          </div>

          {/* Supplier Info */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Thong tin nha cung cap
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Nha cung cap
                </label>
                <Input
                  placeholder="Nhap ten nha cung cap"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="h-11"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Ngay nhap
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="h-11 pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Danh sach san pham nhap
              </h2>
              <Button onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Them dong
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">San pham</TableHead>
                  <TableHead className="w-[120px]">So luong</TableHead>
                  <TableHead className="w-[150px]">Gia nhap/don vi</TableHead>
                  <TableHead className="w-[150px]">Thanh tien</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Select
                        value={item.product?.id || ""}
                        onValueChange={(value) => selectProduct(item.id, value)}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Chon san pham" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, {
                            quantity: parseInt(e.target.value) || 1,
                          })
                        }
                        className="h-10 w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={item.costPerUnit}
                        onChange={(e) =>
                          updateItem(item.id, {
                            costPerUnit: parseInt(e.target.value) || 0,
                          })
                        }
                        className="h-10 w-full"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.quantity * item.costPerUnit)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(item.id)}
                        disabled={importItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Summary */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Tong: <span className="font-medium">{totalItems}</span> san pham
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Tong gia tri</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(totalCost)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              size="lg"
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              <Save className="h-4 w-4 mr-2" />
              Luu phieu nhap
            </Button>
            <Button variant="outline" size="lg">
              Huy
            </Button>
          </div>
        </div>
      </div>

      {/* Right: History */}
      <aside className="w-[400px] bg-card border-l border-border flex flex-col">
        <div className="p-5 border-b border-border">
          <h2 className="font-bold text-lg text-foreground mb-4">
            Lich su nhap hang
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tim kiem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Chua co lich su nhap hang
            </div>
          ) : (
            filteredHistory.map((record) => (
              <div
                key={record.id}
                className={cn(
                  "bg-secondary/50 rounded-xl p-4 space-y-2",
                  "hover:bg-secondary/80 transition-colors cursor-pointer"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {record.productName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {record.supplier}
                    </p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    #{record.id}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    SL: {record.quantity} x {formatCurrency(record.costPerUnit)}
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(record.totalCost)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(record.date)}
                </p>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Scan Invoice Modal */}
      <Dialog open={scanModalOpen} onOpenChange={setScanModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Quet hoa don tu dong
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {scanProgress === "idle" && (
              <>
                {/* Upload Area */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                    "hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-primary/10 rounded-full p-4">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Keo tha hoac click de tai len
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ho tro anh (JPG, PNG) hoac PDF
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" size="sm">
                        <Camera className="h-4 w-4 mr-2" />
                        Chup anh
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Chon file
                      </Button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  AI se tu dong nhan dien cac san pham trong hoa don va dien vao form nhap hang
                </p>
              </>
            )}

            {(scanProgress === "uploading" || scanProgress === "processing") && (
              <div className="py-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="font-medium text-foreground">
                  {scanProgress === "uploading" ? "Dang tai len..." : "Dang xu ly hoa don..."}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {scanProgress === "processing" && "AI dang nhan dien cac san pham"}
                </p>
              </div>
            )}

            {scanProgress === "done" && scannedItems.length > 0 && (
              <>
                {/* Preview */}
                {previewUrl && (
                  <div className="relative rounded-xl overflow-hidden bg-secondary/50 p-2">
                    <img 
                      src={previewUrl} 
                      alt="Invoice preview" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 h-8 w-8 bg-background/80"
                      onClick={resetScan}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Scanned Results */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground">
                      Ket qua nhan dien ({scannedItems.length} san pham)
                    </h3>
                    <span className="text-xs text-success flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Hoan thanh
                    </span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {scannedItems.map((item, index) => (
                      <div
                        key={index}
                        className={cn(
                          "bg-secondary/50 rounded-xl p-3 space-y-2",
                          item.matched && "border border-success/30"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Tu hoa don: <span className="text-foreground">{item.name}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              SL: {item.quantity} x {formatCurrency(item.price)}
                            </p>
                          </div>
                          {item.matched && (
                            <Check className="h-4 w-4 text-success" />
                          )}
                        </div>
                        <Select
                          value={item.matched?.id || ""}
                          onValueChange={(value) => matchScannedItem(index, value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Chon san pham tuong ung" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} ({product.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setScanModalOpen(false);
              resetScan();
            }}>
              Huy
            </Button>
            {scanProgress === "done" && (
              <Button onClick={applyScannedItems}>
                <Check className="h-4 w-4 mr-2" />
                Ap dung ({scannedItems.filter(i => i.matched).length} san pham)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
