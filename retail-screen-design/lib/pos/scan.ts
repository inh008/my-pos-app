export const PREFIX_INV = "BANHANG:INV:";
export const PREFIX_SALE = "BANHANG:SL:";

export function normalizeBarcode(raw: string) {
  return String(raw || "").trim();
}

export interface InvoiceQrItem {
  barcode: string;
  qty: number;
}

export function parseInvoicePayload(text: string): InvoiceQrItem[] | null {
  const t = String(text || "").trim();
  if (!t) return null;

  const parseJson = (j: {
    type?: string;
    items?: { b?: string; barcode?: string; q?: number; qty?: number }[];
  }) => {
    if (j?.type === "banhang_invoice" && Array.isArray(j.items)) {
      const out: InvoiceQrItem[] = [];
      for (const it of j.items) {
        const barcode = normalizeBarcode(
          it.b != null ? String(it.b) : String(it.barcode ?? "")
        );
        const qty = parseInt(String(it.q != null ? it.q : it.qty), 10);
        if (barcode && !isNaN(qty) && qty > 0) out.push({ barcode, qty });
      }
      return out.length ? out : null;
    }
    return null;
  };

  if (t.startsWith(PREFIX_INV)) {
    try {
      return parseJson(JSON.parse(t.slice(PREFIX_INV.length)));
    } catch {
      return null;
    }
  }
  try {
    return parseJson(JSON.parse(t));
  } catch {
    return null;
  }
}

export function calcCartTotals(
  items: { price: number; quantity: number }[],
  vatRate: number,
  discount: number
) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const afterDisc = Math.max(0, subtotal - discount);
  const vatAmount = Math.round((afterDisc * vatRate) / 100);
  const total = afterDisc + vatAmount;
  return { subtotal, afterDisc, vatAmount, total };
}
