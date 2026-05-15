import type { OcrLine } from "./types";

function parseVnNumberToken(tok: string | null): number | null {
  if (tok == null) return null;
  const s = String(tok).replace(/\s/g, "");
  if (!s) return null;
  const isCommaDecimal = /,\d{1,2}$/.test(s) && !/\.\d{1,2}$/.test(s);
  let t = s;
  if (isCommaDecimal) {
    t = t.replace(/\./g, "").replace(",", ".");
  } else {
    t = t.replace(/\./g, "").replace(/,/g, "");
  }
  const n = Math.round(parseFloat(t));
  return isNaN(n) ? null : n;
}

export function parseInvoiceLinesFromOcr(text: string): OcrLine[] {
  const rawLines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const headerRe =
    /^(stt|tt|tên|ten|mặt|mat|hàng|hang|hh|dịch|dich|vụ|vu|mã|ma|sl|số|so|lượng|luong|đơn|don|giá|gia|thành|thanh|tiền|tien|cộng|cong|tổng|tong|vat|thuế|thue|chiết|chiet|khấu|khau)/i;
  const items: OcrLine[] = [];

  for (let line of rawLines) {
    if (headerRe.test(line.split(/\s+/)[0] || "")) continue;
    if (/^[-_=]{3,}$/.test(line)) continue;
    line = line.replace(/^\d{1,3}[).\]]\s*/, "");
    const matches = [...line.matchAll(/[\d]{1,3}(?:[.,]\d{3})+|[\d]+(?:[.,][\d]+)?/g)];
    if (matches.length < 2) continue;
    const nums: { v: number; i: number; len: number }[] = [];
    for (const m of matches) {
      const v = parseVnNumberToken(m[0]);
      if (v != null) nums.push({ v, i: m.index ?? 0, len: m[0].length });
    }
    if (nums.length < 2) continue;

    let qty = 0;
    let unitPrice = 0;
    let lineTotal = 0;
    let nameEnd = line.length;

    if (nums.length >= 3) {
      const a = nums[nums.length - 3].v;
      const b = nums[nums.length - 2].v;
      const c = nums[nums.length - 1].v;
      if (
        a > 0 &&
        a < 100000 &&
        b > 100 &&
        c > 100 &&
        Math.abs(a * b - c) <= Math.max(100, c * 0.02)
      ) {
        qty = a;
        unitPrice = b;
        lineTotal = c;
        nameEnd = nums[nums.length - 3].i;
      } else if (c > b && b > 100) {
        qty = a;
        unitPrice = b;
        lineTotal = c;
        nameEnd = nums[nums.length - 3].i;
      }
    }
    if (!qty && nums.length >= 2) {
      const b = nums[nums.length - 2].v;
      const c = nums[nums.length - 1].v;
      if (b > 0 && b < 100000 && c > b) {
        qty = b;
        unitPrice = Math.round(c / b) || b;
        lineTotal = c;
        nameEnd = nums[nums.length - 2].i;
      }
    }
    if (!qty || !unitPrice) continue;

    let name = line
      .slice(0, nameEnd)
      .replace(/[|•·]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    name = name.replace(/^(thành tiền|thanh tien|tổng cộng|tong cong)\s*/i, "").trim();
    if (name.length < 2 || name.length > 200) continue;
    items.push({
      name,
      qty,
      unitPrice,
      lineTotal: lineTotal || qty * unitPrice,
    });
  }

  const dedup: OcrLine[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    const k = `${it.name.toLowerCase()}|${it.qty}|${it.unitPrice}`;
    if (seen.has(k)) continue;
    seen.add(k);
    dedup.push(it);
  }
  return dedup;
}

export async function fileToImageDataUrl(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    const buf = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    const page = await pdf.getPage(1);
    const scale = Math.min(2.5, 1200 / page.getViewport({ scale: 1 }).width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({
      canvasContext: canvas.getContext("2d")!,
      viewport,
      canvas,
    }).promise;
    return canvas.toDataURL("image/png");
  }
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Đọc file ảnh lỗi"));
    r.readAsDataURL(file);
  });
}

export async function runOcrOnFile(file: File): Promise<OcrLine[]> {
  const dataUrl = await fileToImageDataUrl(file);
  const Tesseract = await import("tesseract.js");
  const {
    data: { text },
  } = await Tesseract.recognize(dataUrl, "vie+eng");
  return parseInvoiceLinesFromOcr(text);
}
