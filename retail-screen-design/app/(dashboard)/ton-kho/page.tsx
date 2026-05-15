"use client";

import { useState, useMemo } from "react";
import {
  Warehouse,
  Search,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Package,
  Filter,
  ArrowUpDown,
  X,
  Save,
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
import { categories, formatCurrency, Product } from "@/lib/store";
import { cn } from "@/lib/utils";
import { usePosCatalog } from "@/hooks/use-pos-catalog";
import { toast } from "sonner";

type SortField = "name" | "stock" | "price" | "cost" | "category";
type SortDirection = "asc" | "desc";

export default function InventoryPage() {
  const { products, saveAll, ready } = usePosCatalog();
  const setProducts = (updater: Product[] | ((prev: Product[]) => Product[])) => {
    const next = typeof updater === "function" ? updater(products) : updater;
    saveAll(next);
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    sku: "",
    category: "Đồ uống",
    price: 0,
    cost: 0,
    stock: 0,
    unit: "cái",
  });

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== "Tất cả") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "stock":
          comparison = a.stock - b.stock;
          break;
        case "price":
          comparison = a.price - b.price;
          break;
        case "cost":
          comparison = a.cost - b.cost;
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [products, searchQuery, selectedCategory, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSaveEdit = () => {
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? editingProduct : p))
      );
      setEditingProduct(null);
    }
  };

  const handleAddProduct = () => {
    const id = (Math.max(...products.map((p) => parseInt(p.id))) + 1).toString();
    setProducts((prev) => [...prev, { ...newProduct, id } as Product]);
    setIsAddModalOpen(false);
    setNewProduct({
      name: "",
      sku: "",
      category: "Đồ uống",
      price: 0,
      cost: 0,
      stock: 0,
      unit: "cái",
    });
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const totalValue = products.reduce((sum, p) => sum + p.cost * p.stock, 0);
  const totalItems = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock <= 10).length;

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 rounded-xl p-3">
              <Warehouse className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Quản lý tồn kho</h1>
              <p className="text-muted-foreground">Theo dõi và quản lý hàng hóa</p>
            </div>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm sản phẩm
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-xl p-2.5">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng mặt hàng</p>
                <p className="text-2xl font-bold text-foreground">{products.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-3">
              <div className="bg-success/10 rounded-xl p-2.5">
                <Warehouse className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng tồn kho</p>
                <p className="text-2xl font-bold text-foreground">{totalItems}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 rounded-xl p-2.5">
                <span className="text-accent font-bold text-sm">VNĐ</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Giá trị tồn kho</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-3">
              <div className="bg-destructive/10 rounded-xl p-2.5">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sắp hết hàng</p>
                <p className="text-2xl font-bold text-destructive">{lowStockCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên hoặc mã SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="w-[60px]">STT</TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort("name")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Sản phẩm
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Mã SKU</TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort("category")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Danh mục
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => toggleSort("cost")}
                    className="flex items-center gap-1 hover:text-foreground ml-auto"
                  >
                    Giá vốn
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => toggleSort("price")}
                    className="flex items-center gap-1 hover:text-foreground ml-auto"
                  >
                    Giá bán
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-center">
                  <button
                    onClick={() => toggleSort("stock")}
                    className="flex items-center gap-1 hover:text-foreground mx-auto"
                  >
                    Tồn kho
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Đơn vị</TableHead>
                <TableHead className="text-right">Giá trị</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Không tìm thấy sản phẩm nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product, index) => (
                  <TableRow key={product.id} className="hover:bg-secondary/30">
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full bg-secondary text-xs">
                        {product.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(product.cost)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(product.price)}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          product.stock <= 10
                            ? "bg-destructive/10 text-destructive"
                            : product.stock <= 30
                            ? "bg-accent/10 text-accent"
                            : "bg-success/10 text-success"
                        )}
                      >
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.unit}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.cost * product.stock)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingProduct(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Tên sản phẩm</label>
                <Input
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Mã SKU</label>
                  <Input
                    value={editingProduct.sku}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, sku: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Danh mục</label>
                  <Select
                    value={editingProduct.category}
                    onValueChange={(value) =>
                      setEditingProduct({ ...editingProduct, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter((c) => c !== "Tất cả").map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Giá vốn</label>
                  <Input
                    type="number"
                    value={editingProduct.cost}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, cost: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Giá bán</label>
                  <Input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Tồn kho</label>
                  <Input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Đơn vị</label>
                  <Input
                    value={editingProduct.unit}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, unit: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProduct(null)}>
              Hủy
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="h-4 w-4 mr-2" />
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm sản phẩm mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Tên sản phẩm</label>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Nhập tên sản phẩm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Mã SKU</label>
                <Input
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  placeholder="VD: SP001"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Danh mục</label>
                <Select
                  value={newProduct.category}
                  onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter((c) => c !== "Tất cả").map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Giá vốn</label>
                <Input
                  type="number"
                  value={newProduct.cost}
                  onChange={(e) => setNewProduct({ ...newProduct, cost: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Giá bán</label>
                <Input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Số lượng ban đầu</label>
                <Input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Đơn vị</label>
                <Input
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                  placeholder="VD: cái, hộp, kg"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddProduct} disabled={!newProduct.name || !newProduct.sku}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm sản phẩm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
