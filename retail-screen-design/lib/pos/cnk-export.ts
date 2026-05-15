import { saveAs } from "file-saver";
import PizZip from "pizzip";
import type { CnkRow } from "./types";

const TEMPLATE_URL = "/templates/Mau-01-CNKD.docx";

function escapeXml(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wRun(text: string, bold?: boolean) {
  const b = bold ? "<w:b/>" : "";
  return `<w:r><w:rPr>${b}<w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
}

function wPara(text: string, opts?: { center?: boolean; bold?: boolean }) {
  const pPr = opts?.center ? '<w:pPr><w:jc w:val="center"/></w:pPr>' : "";
  return `<w:p>${pPr}${wRun(text, opts?.bold)}</w:p>`;
}

function wTableCell(text: string) {
  return `<w:tc><w:tcPr><w:tcW w:w="2000" w:type="dxa"/></w:tcPr><w:p>${wRun(text)}</w:p></w:tc>`;
}

function buildAnnexXml(
  shop: string,
  from: string,
  to: string,
  rows: CnkRow[],
  totalRev: number
) {
  const parts: string[] = [];
  parts.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
  parts.push(
    wPara("PHỤ LỤC — BẢNG KÊ HOẠT ĐỘNG KINH DOANH TRONG KỲ (01-2/BK-HĐKD)", {
      center: true,
      bold: true,
    })
  );
  parts.push(wPara("(Dữ liệu xuất từ POS — kèm Tờ khai mẫu 01/CNKD)", { center: true }));
  parts.push(wPara(""));
  parts.push(wPara("Tên hộ kinh doanh / cá nhân kinh doanh: " + shop, { bold: true }));
  parts.push(wPara("Kỳ báo cáo: từ " + from + " đến " + to));
  parts.push(
    wPara("Tổng doanh thu kỳ (theo bảng): " + totalRev.toLocaleString("vi-VN") + " đ", {
      bold: true,
    })
  );
  parts.push(wPara(""));

  let tbl =
    '<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>' +
    '<w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>' +
    '<w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>' +
    '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>' +
    '<w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>' +
    '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>' +
    '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>' +
    "</w:tblBorders></w:tblPr>";

  const hdr = ["STT", "Tên hàng hóa, dịch vụ", "ĐVT", "Số lượng", "Doanh thu (đ)"];
  tbl += "<w:tr>" + hdr.map((h) => wTableCell(h)).join("") + "</w:tr>";
  rows.forEach((r, i) => {
    const cells = [
      String(i + 1),
      r.name,
      r.unit || "Cái",
      String(r.qty),
      r.revenue.toLocaleString("vi-VN"),
    ];
    tbl += "<w:tr>" + cells.map((c) => wTableCell(c)).join("") + "</w:tr>";
  });
  tbl += "</w:tbl>";
  parts.push(tbl);
  parts.push(wPara(""));
  parts.push(wPara("Người lập biểu                    Cá nhân / Hộ kinh doanh"));
  parts.push(wPara("(Ký, ghi rõ họ tên)"));
  return parts.join("");
}

export async function exportCnkFromTemplate(
  shop: string,
  from: string,
  to: string,
  rows: CnkRow[],
  templateBuffer?: ArrayBuffer | null
) {
  let buf = templateBuffer;
  if (!buf) {
    const res = await fetch(TEMPLATE_URL);
    if (!res.ok) throw new Error("Không tải được mẫu Word. Kiểm tra file public/templates/Mau-01-CNKD.docx");
    buf = await res.arrayBuffer();
  }
  const totalRev = rows.reduce((s, r) => s + r.revenue, 0);
  const zip = new PizZip(buf);
  let docXml = zip.file("word/document.xml")?.asText();
  if (!docXml) throw new Error("File Word không hợp lệ");
  const annex = buildAnnexXml(shop, from, to, rows, totalRev);
  docXml = docXml.replace("</w:body>", annex + "</w:body>");
  zip.file("word/document.xml", docXml);
  const blob = zip.generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  });
  saveAs(blob, `Mau-01-CNKD-da-dien-${from}_${to}.docx`);
}

export async function exportCnkSummary(
  shop: string,
  from: string,
  to: string,
  rows: CnkRow[]
) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    AlignmentType,
  } = await import("docx");

  const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
  const borders = {
    top: border,
    bottom: border,
    left: border,
    right: border,
    insideHorizontal: border,
    insideVertical: border,
  };

  const cell = (text: string, w?: number) =>
    new TableCell({
      width: w ? { size: w, type: WidthType.DXA } : undefined,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: String(text), size: 22 })],
        }),
      ],
    });

  const cellL = (text: string, w?: number) =>
    new TableCell({
      width: w ? { size: w, type: WidthType.DXA } : undefined,
      children: [new Paragraph({ children: [new TextRun({ text: String(text), size: 22 })] })],
    });

  const headerRow = new TableRow({
    children: [
      cell("STT", 720),
      cellL("Tên hàng hóa, dịch vụ", 3200),
      cell("Đơn vị tính", 900),
      cell("Số lượng", 900),
      cell("Doanh thu", 1440),
      cellL("Ghi chú", 1400),
    ],
  });

  const dataRows = rows.map(
    (r, i) =>
      new TableRow({
        children: [
          cell(String(i + 1), 720),
          cellL(r.name, 3200),
          cell(r.unit || "Cái", 900),
          cell(String(r.qty), 900),
          cell(r.revenue.toLocaleString("vi-VN"), 1440),
          cellL(r.note || "", 1400),
        ],
      })
  );

  const table = new Table({
    columnWidths: [720, 3200, 900, 900, 1440, 1400],
    borders,
    rows: [headerRow, ...dataRows],
  });

  const totalRev = rows.reduce((s, r) => s + r.revenue, 0);
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "BẢNG KÊ CHI TIẾT HỘ KINH DOANH, CÁ NHÂN KINH DOANH",
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "(Mẫu số 01/CNKD — xuất từ POS)",
                italics: true,
                size: 22,
              }),
            ],
          }),
          new Paragraph({ children: [new TextRun({ text: "" })] }),
          new Paragraph({
            children: [
              new TextRun({ text: "Tên hộ kinh doanh / cá nhân: ", bold: true }),
              new TextRun({ text: shop, size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Kỳ báo cáo: ", bold: true }),
              new TextRun({ text: `Từ ${from} đến ${to}`, size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Tổng doanh thu kỳ: ", bold: true }),
              new TextRun({ text: totalRev.toLocaleString("vi-VN") + " đ", size: 24 }),
            ],
          }),
          new Paragraph({ children: [new TextRun({ text: "" })] }),
          table,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Bang-ke-01-CNKD-${from}-${to}.docx`);
}

export async function exportCnk(
  shop: string,
  from: string,
  to: string,
  rows: CnkRow[],
  templateBuffer?: ArrayBuffer | null
) {
  try {
    await exportCnkFromTemplate(shop, from, to, rows, templateBuffer);
  } catch {
    await exportCnkSummary(shop, from, to, rows);
  }
}
