import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const inr = (v) => "₹" + (Number(v) || 0).toLocaleString();

export const ledgerColumns = (config) => {
  const cols = ["Date", "Ledger"];
  if (config.showNarration) cols.push("Narration");
  cols.push("Voucher Type");
  if (config.showVoucherNo) cols.push("Voucher No");
  if (config.showInvoiceNo) cols.push("Invoice No");
  cols.push("Amount Dr", "Amount Cr");
  if (config.showBalance) cols.push("Balance");
  return cols;
};

export const ledgerRowValues = (entry, config) => {
  const row = [entry.date, entry.ledger];
  if (config.showNarration) row.push(entry.narration || "");
  row.push(entry.voucherType || "");
  if (config.showVoucherNo) row.push(entry.voucherNo || "");
  if (config.showInvoiceNo) row.push(entry.invoiceNo || "");
  row.push(entry.dr, entry.cr);
  if (config.showBalance) row.push(entry.balance);
  return row;
};

const totalsRow = (cols, label, value, columnName) => {
  const row = new Array(cols.length).fill("");
  const index = cols.indexOf(columnName);
  if (index >= 0) row[index] = value;
  row[0] = label;
  return row;
};

export const buildLedgerReportHtml = ({ title, party, entries, config, totalDr, totalCr }) => {
  const cols = ledgerColumns(config);
  const colIndex = (name) => cols.indexOf(name);

  const head = cols.map((c, i) => {
    const numeric = c === "Amount Dr" || c === "Amount Cr" || c === "Balance";
    return `<th class="${numeric ? "num" : ""}">${c}</th>`;
  }).join("");

  const body = entries.map((entry) => {
    const cells = [];
    cells.push(`<td>${entry.date || ""}</td>`);
    cells.push(`<td>${entry.ledger || ""}</td>`);
    if (config.showNarration) cells.push(`<td>${entry.narration || ""}</td>`);
    cells.push(`<td>${entry.voucherType || ""}</td>`);
    if (config.showVoucherNo) cells.push(`<td>${entry.voucherNo || ""}</td>`);
    if (config.showInvoiceNo) cells.push(`<td>${entry.invoiceNo || ""}</td>`);
    cells.push(`<td class="num">${inr(entry.dr)}</td>`);
    cells.push(`<td class="num">${inr(entry.cr)}</td>`);
    if (config.showBalance) cells.push(`<td class="num">${inr(entry.balance)}</td>`);
    return `<tr>${cells.join("")}</tr>`;
  }).join("");

  const closing = totalDr - totalCr;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${title || "Ledger"}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #222; margin: 24px; }
  .toolbar { margin-bottom: 14px; }
  .toolbar button {
    padding: 6px 14px; margin-right: 8px; cursor: pointer;
    border: 1px solid #1f6fb2; border-radius: 4px;
    background: #1f6fb2; color: #fff; font-size: 12px;
  }
  .toolbar button.secondary { background: #fff; color: #1f6fb2; }
  .report-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 2px solid #1f6fb2; padding-bottom: 10px; margin-bottom: 14px;
  }
  .report-title { font-size: 18px; font-weight: 700; color: #1f6fb2; margin-bottom: 6px; }
  .party-name { font-size: 14px; font-weight: 700; }
  .report-meta { font-size: 11px; color: #555; margin-top: 2px; }
  .report-balance { text-align: right; font-size: 13px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  th { background: #eaf3fb; color: #1f6fb2; }
  td.num, th.num { text-align: right; }
  tr:nth-child(even) td { background: #f8fafc; }
  .totals {
    display: flex; justify-content: flex-end; gap: 24px;
    margin-top: 12px; font-size: 12px; font-weight: 700;
  }
  .totals span { color: #555; font-weight: 400; display: block; }
  @media print { .toolbar { display: none; } body { margin: 0; } }
</style>
</head>
<body>
  <div class="toolbar no-print">
    <button onclick="window.print()">Print</button>
    <button class="secondary" onclick="window.close()">Close</button>
  </div>
  <div class="report-header">
    <div>
      <div class="report-title">${title || "Ledger"}</div>
      <div class="party-name">${party?.name || ""}</div>
      ${config.showGSTIN && party?.gstin ? `<div class="report-meta">GSTIN: ${party.gstin}</div>` : ""}
      ${config.showCompanyAddress && party?.address ? `<div class="report-meta">${party.address}</div>` : ""}
      ${config.showContactNumber && party?.contact ? `<div class="report-meta">Contact: ${party.contact}</div>` : ""}
      ${config.showEmail && party?.email ? `<div class="report-meta">Email: ${party.email}</div>` : ""}
    </div>
    ${party?.balance !== undefined && party?.balance !== null ? `<div class="report-balance">Balance<br />${inr(party.balance)}</div>` : ""}
  </div>
  <table>
    <thead><tr>${head}</tr></thead>
    <tbody>${body || `<tr><td colspan="${cols.length}" style="text-align:center;color:#888;">No transactions found.</td></tr>`}</tbody>
  </table>
  <div class="totals">
    <div>Current Total Dr<span>${inr(totalDr)}</span></div>
    <div>Current Total Cr<span>${inr(totalCr)}</span></div>
    <div>Closing Balance<span>${inr(closing)}</span></div>
  </div>
</body>
</html>`;
};

export const previewLedgerReport = (options) => {
  const win = window.open("", "_blank", "width=950,height=720");
  if (!win) {
    alert("Popup blocked. Please allow popups for this site.");
    return;
  }
  win.document.open();
  win.document.write(buildLedgerReportHtml(options));
  win.document.close();
  win.focus();
};

export const printLedgerReport = (options) => {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Popup blocked. Please allow popups for this site.");
    return;
  }
  win.document.open();
  win.document.write(buildLedgerReportHtml(options));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 350);
};

export const exportLedgerExcel = ({ filename, entries, config, totalDr, totalCr }) => {
  const cols = ledgerColumns(config);
  const body = entries.map((entry) => ledgerRowValues(entry, config));
  const rows = [
    cols,
    ...body,
    [],
    totalsRow(cols, "Current Total Dr", totalDr, "Amount Dr"),
    totalsRow(cols, "Current Total Cr", totalCr, "Amount Cr"),
    totalsRow(cols, "Closing Balance", totalDr - totalCr, "Amount Dr")
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = cols.map((c) => ({ wch: c.length > 6 ? c.length + 6 : 14 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ledger");
  const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
};

export const exportLedgerPDF = ({ filename, title, party, entries, config, totalDr, totalCr }) => {
  const doc = new jsPDF();
  const cols = ledgerColumns(config);
  doc.setFontSize(16);
  doc.text(title || "Ledger", 14, 18);
  doc.setFontSize(10);
  let y = 28;
  if (party?.name) {
    doc.text(`Name: ${party.name}`, 14, y);
    y += 5;
  }
  if (config.showGSTIN && party?.gstin) {
    doc.text(`GSTIN: ${party.gstin}`, 14, y);
    y += 5;
  }
  if (config.showCompanyAddress && party?.address) {
    doc.text(doc.splitTextToSize(String(party.address), 180)[0], 14, y);
    y += 5;
  }
  if (config.showContactNumber && party?.contact) {
    doc.text(`Contact: ${party.contact}`, 14, y);
    y += 5;
  }
  if (config.showEmail && party?.email) {
    doc.text(`Email: ${party.email}`, 14, y);
    y += 5;
  }
  if (party?.balance !== undefined && party?.balance !== null) {
    doc.text(`Balance: ${inr(party.balance)}`, 150, 28);
  }
  autoTable(doc, {
    startY: y + 6,
    head: [cols],
    body: entries.map((entry) => ledgerRowValues(entry, config)),
    foot: [
      totalsRow(cols, "Current Total Dr", totalDr, "Amount Dr"),
      totalsRow(cols, "Current Total Cr", totalCr, "Amount Cr"),
      totalsRow(cols, "Closing Balance", totalDr - totalCr, "Amount Dr")
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [31, 111, 178], textColor: [255, 255, 255] },
    footStyles: { fillColor: [234, 243, 251], textColor: [34, 34, 34] }
  });
  doc.save(filename);
};
