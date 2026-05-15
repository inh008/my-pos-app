export interface StoredProduct {
  barcode: string;
  name: string;
  price: number;
  qty: number;
  category: string;
  costPrice: number;
  unit?: string;
}

export interface SaleLine {
  barcode?: string;
  name: string;
  qty: number;
  price: number;
  lineTotal: number;
}

export interface SaleRecord {
  id: string;
  at: string;
  shop: string;
  lines: SaleLine[];
  subtotal: number;
  discount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  cogs: number;
}

export interface LastSale {
  id: string;
  at: string;
  shop: string;
  lines: SaleLine[];
  subtotal: number;
  discount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  qrData: string;
}

export interface OcrLine {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CnkRow {
  name: string;
  unit: string;
  qty: number;
  revenue: number;
  note?: string;
}

export interface PosSettings {
  shopName: string;
  defaultVat: number;
}
