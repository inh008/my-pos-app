import QRCode from "qrcode";
import type { LastSale } from "./types";

const PREFIX_SALE = "BANHANG:SL:";

export function buildSaleQrPayload(sale: Omit<LastSale, "qrData">) {
  return (
    PREFIX_SALE +
    JSON.stringify({
      type: "banhang_sale",
      id: sale.id,
      at: new Date().toISOString(),
      shop: sale.shop,
      items: sale.lines.map((c) => ({
        b: c.barcode,
        n: c.name,
        q: c.qty,
        p: c.price,
      })),
      subtotal: sale.subtotal,
      discount: sale.discount,
      vatRate: sale.vatRate,
      vatAmount: sale.vatAmount,
      total: sale.total,
    })
  );
}

function escapeHtml(s: string) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function escapeAttr(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function formatMoney(n: number) {
  return Number(n).toLocaleString("vi-VN") + " đ";
}

async function createQrDataUrl(text: string) {
  try {
    return await QRCode.toDataURL(text, {
      width: 148,
      margin: 1,
      errorCorrectionLevel: "M",
    });
  } catch {
    return null;
  }
}

function buildPrintHtml(sale: LastSale, qrDataUrl: string | null) {
  const rows = sale.lines
    .map(
      (l) =>
        `<tr><td>${escapeHtml(l.name)}</td><td>${l.qty}</td><td>${formatMoney(l.price)}</td><td>${formatMoney(l.lineTotal)}</td></tr>`
    )
    .join("");
  const qrBlock = qrDataUrl
    ? `<div class="qr-wrap"><img src="${escapeAttr(qrDataUrl)}" alt="QR" width="120" height="120" /></div>`
    : `<div class="qr-wrap" style="font-size:10px;text-align:center">Không tạo được QR</div>`;
  const sub =
    sale.subtotal != null
      ? sale.subtotal
      : sale.lines.reduce((s, l) => s + l.lineTotal, 0);
  const disc = sale.discount ?? 0;
  const vat = sale.vatAmount ?? 0;
  const vr = sale.vatRate ?? 0;

  return `<div class="print-invoice">
<h3>${escapeHtml(sale.shop)}</h3>
<div class="meta">${escapeHtml(sale.id)}<br/>${escapeHtml(sale.at)}</div>
<table><thead><tr><th>Hàng</th><th>SL</th><th>ĐG</th><th>T.Tiền</th></tr></thead><tbody>${rows}</tbody></table>
<div class="sum">Tạm tính: ${formatMoney(sub)}</div>
${disc > 0 ? `<div class="sum">Chiết khấu: −${formatMoney(disc)}</div>` : ""}
${vat > 0 ? `<div class="sum">VAT (${vr}%): ${formatMoney(vat)}</div>` : ""}
<div class="sum"><strong>Tổng: ${formatMoney(sale.total)}</strong></div>
${qrBlock}
<div class="foot">Cảm ơn quý khách</div>
</div>`;
}

export async function printInvoice(sale: LastSale) {
  const qrDataUrl = await createQrDataUrl(sale.qrData);
  let host = document.getElementById("printHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "printHost";
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "position:absolute;left:-9999px;top:0;width:72mm";
    document.body.appendChild(host);
  }
  host.innerHTML = buildPrintHtml(sale, qrDataUrl);
  host.style.left = "0";
  setTimeout(() => {
    window.print();
    host!.innerHTML = "";
    host!.style.left = "-9999px";
  }, 200);
}
