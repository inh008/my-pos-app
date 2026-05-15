// Types for the POS system
export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number; // Giá vốn
  category: string;
  sku: string;
  stock: number;
  unit: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface ImportRecord {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  costPerUnit: number;
  totalCost: number;
  supplier: string;
  date: string;
}

export interface SaleRecord {
  id: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    cost: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  profit: number;
  date: string;
  paymentMethod: string;
}

export interface RevenueData {
  period: string;
  revenue: number;
  cost: number;
  profit: number;
  orders: number;
}

export const categories = [
  "Tất cả",
  "Đồ uống",
  "Thực phẩm",
  "Bánh kẹo",
  "Gia vị",
  "Đồ dùng",
];

export const products: Product[] = [
  {
    id: "1",
    name: "Cà phê sữa đá",
    price: 29000,
    cost: 12000,
    category: "Đồ uống",
    sku: "CF001",
    stock: 100,
    unit: "ly",
  },
  {
    id: "2",
    name: "Trà sữa trân châu",
    price: 35000,
    cost: 15000,
    category: "Đồ uống",
    sku: "MT001",
    stock: 50,
    unit: "ly",
  },
  {
    id: "3",
    name: "Nước cam ép",
    price: 25000,
    cost: 10000,
    category: "Đồ uống",
    sku: "OJ001",
    stock: 30,
    unit: "ly",
  },
  {
    id: "4",
    name: "Bánh mì thịt",
    price: 20000,
    cost: 8000,
    category: "Thực phẩm",
    sku: "BM001",
    stock: 25,
    unit: "ổ",
  },
  {
    id: "5",
    name: "Phở bò tái",
    price: 45000,
    cost: 22000,
    category: "Thực phẩm",
    sku: "PH001",
    stock: 20,
    unit: "tô",
  },
  {
    id: "6",
    name: "Cơm sườn bì",
    price: 40000,
    cost: 18000,
    category: "Thực phẩm",
    sku: "CS001",
    stock: 15,
    unit: "phần",
  },
  {
    id: "7",
    name: "Kẹo dẻo trái cây",
    price: 15000,
    cost: 7000,
    category: "Bánh kẹo",
    sku: "KD001",
    stock: 80,
    unit: "gói",
  },
  {
    id: "8",
    name: "Bánh quy bơ",
    price: 22000,
    cost: 10000,
    category: "Bánh kẹo",
    sku: "BQ001",
    stock: 60,
    unit: "hộp",
  },
  {
    id: "9",
    name: "Nước mắm Phú Quốc",
    price: 55000,
    cost: 35000,
    category: "Gia vị",
    sku: "NM001",
    stock: 40,
    unit: "chai",
  },
  {
    id: "10",
    name: "Muối tiêu chanh",
    price: 12000,
    cost: 5000,
    category: "Gia vị",
    sku: "MTC01",
    stock: 70,
    unit: "hũ",
  },
  {
    id: "11",
    name: "Khăn giấy lụa",
    price: 18000,
    cost: 9000,
    category: "Đồ dùng",
    sku: "KG001",
    stock: 100,
    unit: "bịch",
  },
  {
    id: "12",
    name: "Nước rửa tay",
    price: 35000,
    cost: 18000,
    category: "Đồ dùng",
    sku: "NR001",
    stock: 45,
    unit: "chai",
  },
];

// Sample sales data for reports
export const sampleSalesData: SaleRecord[] = [
  // Today
  {
    id: "S001",
    items: [
      { productId: "1", productName: "Cà phê sữa đá", quantity: 5, price: 29000, cost: 12000 },
      { productId: "4", productName: "Bánh mì thịt", quantity: 3, price: 20000, cost: 8000 },
    ],
    subtotal: 205000,
    tax: 20500,
    total: 225500,
    profit: 109000,
    date: new Date().toISOString(),
    paymentMethod: "Tiền mặt",
  },
  {
    id: "S002",
    items: [
      { productId: "2", productName: "Trà sữa trân châu", quantity: 4, price: 35000, cost: 15000 },
      { productId: "7", productName: "Kẹo dẻo trái cây", quantity: 2, price: 15000, cost: 7000 },
    ],
    subtotal: 170000,
    tax: 17000,
    total: 187000,
    profit: 66000,
    date: new Date().toISOString(),
    paymentMethod: "Chuyển khoản",
  },
  // Yesterday
  {
    id: "S003",
    items: [
      { productId: "5", productName: "Phở bò tái", quantity: 8, price: 45000, cost: 22000 },
      { productId: "3", productName: "Nước cam ép", quantity: 6, price: 25000, cost: 10000 },
    ],
    subtotal: 510000,
    tax: 51000,
    total: 561000,
    profit: 274000,
    date: new Date(Date.now() - 86400000).toISOString(),
    paymentMethod: "Tiền mặt",
  },
  // 2 days ago
  {
    id: "S004",
    items: [
      { productId: "6", productName: "Cơm sườn bì", quantity: 10, price: 40000, cost: 18000 },
      { productId: "1", productName: "Cà phê sữa đá", quantity: 8, price: 29000, cost: 12000 },
    ],
    subtotal: 632000,
    tax: 63200,
    total: 695200,
    profit: 356000,
    date: new Date(Date.now() - 172800000).toISOString(),
    paymentMethod: "Thẻ",
  },
];

// Sample import data
export const sampleImportData: ImportRecord[] = [
  {
    id: "I001",
    productId: "1",
    productName: "Cà phê sữa đá",
    quantity: 50,
    costPerUnit: 12000,
    totalCost: 600000,
    supplier: "Nhà cung cấp A",
    date: new Date().toISOString(),
  },
  {
    id: "I002",
    productId: "4",
    productName: "Bánh mì thịt",
    quantity: 30,
    costPerUnit: 8000,
    totalCost: 240000,
    supplier: "Nhà cung cấp B",
    date: new Date(Date.now() - 86400000).toISOString(),
  },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function formatShortDate(dateString: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
}
