import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import "../styles/GSTR1Report.css";
import * as XLSX from "xlsx";
import * as services from "../api/services";

const GSTR1Report = () => {
  const { collapsed } = useOutletContext();
  const [mode, setMode] = useState("month");
  const [month, setMonth] = useState("");
  const [quarter, setQuarter] = useState("");
  const [fileType, setFileType] = useState("software_excel");
  const [voucherData, setVoucherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      let from_date = "";
      let to_date = "";
      if (mode === "month" && month) {
        const [y, m] = month.split("-");
        from_date = `${y}-${m}-01`;
        const lastDay = new Date(y, m, 0).getDate();
        to_date = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
      } else if (mode === "quarter" && quarter) {
        const qMap = { Q1: ["04", "06"], Q2: ["07", "09"], Q3: ["10", "12"], Q4: ["01", "03"] };
        const [startM, endM] = qMap[quarter] || [];
        const fy = new Date().getFullYear();
        from_date = `${fy}-${startM}-01`;
        const lastDay = new Date(fy, parseInt(endM), 0).getDate();
        to_date = `${fy}-${endM}-${String(lastDay).padStart(2, "0")}`;
      }
      const res = await services.getGSTR1({ from_date, to_date });
      const payload = res.data || res;
      const emptyStructure = {
        general: [], b2b: [], b2cLarge: [], export: [], nilRated: [],
        crdr: [], crdrUnregistered: [], advanceReceived: [], advanceAdjusted: [],
        hsnSummary: [], documentIssued: [], ecomSupplies: [], ecomSupplies9_5: []
      };
      setVoucherData({ ...emptyStructure, ...payload });
    } catch (err) {
      setError("Failed to fetch GSTR-1 data.");
      setVoucherData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, quarter, mode]);

  const sheetHeaders = {
    general: ["GSTIN", "Legal Name", "Trade Name", "Return Period", "Financial Year"],
    b2b: ["GSTIN/UIN of Recipient", "Receiver Name", "Invoice Number", "Invoice Date", "Invoice Value", "Place Of Supply", "Reverse Charge", "Invoice Type", "E-Commerce GSTIN", "Rate", "Taxable Value", "Cess Amount"],
    b2cLarge: ["Invoice Number", "Invoice Date", "Invoice Value", "Place Of Supply", "Applicable % of Tax Rate", "Rate", "Taxable Value", "Cess Amount", "E-Commerce GSTIN"],
    export: ["Export Type", "Invoice Number", "Invoice Date", "Invoice Value", "Port Code", "Shipping Bill Number", "Shipping Bill Date", "Rate", "Taxable Value", "Cess Amount"],
    nilRated: ["Description", "Nil Rated Supplies", "Exempted Supplies", "Non GST Supplies"],
    crdr: ["GSTIN/UIN", "Receiver Name", "Note Number", "Note Date", "Note Type", "Place Of Supply", "Rate", "Taxable Value", "Cess Amount"],
    crdrUnregistered: ["Note Number", "Note Date", "Note Type", "Place Of Supply", "Rate", "Taxable Value", "Cess Amount"],
    advanceReceived: ["Place Of Supply", "Rate", "Gross Advance Received", "Cess Amount"],
    advanceAdjusted: ["Place Of Supply", "Rate", "Gross Advance Adjusted", "Cess Amount"],
    hsnSummary: ["HSN", "Description", "UQC", "Total Quantity", "Total Value", "Taxable Value", "Integrated Tax Amount", "Central Tax Amount", "State/UT Tax Amount", "Cess Amount"],
    documentIssued: ["Nature Of Document", "Sr. No. From", "Sr. No. To", "Total Number", "Cancelled"],
    ecomSupplies: ["GSTIN of E-Commerce Operator", "Supply Value", "Rate", "Taxable Value", "Cess Amount"],
    ecomSupplies9_5: ["GSTIN of E-Commerce Operator", "Supply Value", "Rate", "Taxable Value", "Cess Amount"]
  };

  const handleDownload = async () => {
    if (!voucherData) return;

    if (fileType === "govt_excel") {
      try {
        const response = await fetch("/templates/GSTR1_Excel_Workbook_Template_V2.2.xlsx");
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array", cellStyles: true, cellFormula: true, cellDates: true });

        const setCell = (sheetName, cell, value) => {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) return;
          if (value === undefined || value === null || value === "") return;
          sheet[cell] = { t: typeof value === "number" ? "n" : "s", v: value };
        };

        const clearDataRows = () => {
          Object.keys(workbook.Sheets).forEach((name) => {
            if (name === "Help Instruction" || name === "master") return;
            const sheet = workbook.Sheets[name];
            Object.keys(sheet).forEach((key) => {
              if (key[0] === "!") return;
              const row = XLSX.utils.decode_cell(key).r + 1;
              if (row >= 5) delete sheet[key];
            });
          });
        };

        const insertRows = (sheetName, rows, startCell) => {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) return;
          if (!rows.length) return;
          XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: startCell });
        };

        const sum = (arr, key) => (arr || []).reduce((s, i) => s + (Number(i[key]) || 0), 0);

        clearDataRows();

        // b2b,sez,de (4A,4B,6B,6C)
        const b2b = voucherData.b2b || [];
        const b2bRows = b2b.map((item) => [item.gstin, item.receiver, item.invoiceNo, item.invoiceDate, item.invoiceValue, item.placeOfSupply, item.reverseCharge || "N", 100, item.invoiceType, item.ecommerceGSTIN, item.gstRate, item.taxableValue, item.cess]);
        insertRows("b2b,sez,de", b2bRows, "A5");
        setCell("b2b,sez,de", "A3", new Set(b2b.map((i) => i.gstin)).size);
        setCell("b2b,sez,de", "C3", b2b.length);
        setCell("b2b,sez,de", "E3", sum(b2b, "invoiceValue"));
        setCell("b2b,sez,de", "L3", sum(b2b, "taxableValue"));
        setCell("b2b,sez,de", "M3", sum(b2b, "cess"));

        // b2cl (5)
        const b2cl = voucherData.b2cLarge || [];
        const b2clRows = b2cl.map((item) => [item.invoiceNo, item.invoiceDate, item.invoiceValue, item.placeOfSupply, item.applicableTaxRate ?? 100, item.gstRate, item.taxableValue, item.cess, item.ecommerceGSTIN]);
        insertRows("b2cl", b2clRows, "A5");
        setCell("b2cl", "A3", b2cl.length);
        setCell("b2cl", "C3", sum(b2cl, "invoiceValue"));
        setCell("b2cl", "G3", sum(b2cl, "taxableValue"));
        setCell("b2cl", "H3", sum(b2cl, "cess"));

        // b2cs (7) - aggregated by place of supply + rate
        const b2cLarge = voucherData.b2cLarge || [];
        const b2csMap = {};
        b2cLarge.forEach((item) => {
          const key = `${item.placeOfSupply || ""}|${item.applicableTaxRate ?? 100}|${item.gstRate}`;
          if (!b2csMap[key]) b2csMap[key] = { pos: item.placeOfSupply, appRate: item.applicableTaxRate ?? 100, rate: item.gstRate, taxable: 0, cess: 0 };
          b2csMap[key].taxable += Number(item.taxableValue) || 0;
          b2csMap[key].cess += Number(item.cess) || 0;
        });
        const b2csRows = Object.values(b2csMap).map((g) => ["OE", g.pos, g.appRate, g.rate, g.taxable, g.cess]);
        insertRows("b2cs", b2csRows, "A5");
        setCell("b2cs", "E3", sum(Object.values(b2csMap), "taxable"));
        setCell("b2cs", "F3", sum(Object.values(b2csMap), "cess"));

        // exp (6)
        const exp = voucherData.export || [];
        const expRows = exp.map((item) => [item.exportType, item.invoiceNo, item.invoiceDate, item.invoiceValue, item.portCode, item.shippingBillNo, item.shippingBillDate, item.gstRate, item.taxableValue, item.cess]);
        insertRows("exp", expRows, "A5");
        setCell("exp", "B3", exp.length);
        setCell("exp", "D3", sum(exp, "invoiceValue"));
        setCell("exp", "F3", exp.filter((i) => i.shippingBillNo).length);
        setCell("exp", "J3", sum(exp, "taxableValue"));

        // exemp (8) - nil rated / exempted
        const nil = voucherData.nilRated || [];
        const nilRows = nil.map((item) => [item.description, item.nilRated, item.exempted, item.nonGst]);
        insertRows("exemp", nilRows, "A5");
        setCell("exemp", "B3", sum(nil, "nilRated"));
        setCell("exemp", "C3", sum(nil, "exempted"));
        setCell("exemp", "D3", sum(nil, "nonGst"));

        // cdnr (9B) - registered
        const crdr = voucherData.crdr || [];
        const cdnrRows = crdr.map((item) => [item.gstin, item.receiver, item.noteNo, item.noteDate, item.noteType, item.placeOfSupply, "N", "", item.noteValue, 100, item.gstRate, item.taxableValue, item.cess]);
        insertRows("cdnr", cdnrRows, "A5");
        setCell("cdnr", "A3", new Set(crdr.map((i) => i.gstin)).size);
        setCell("cdnr", "C3", cdnrRows.length);
        setCell("cdnr", "I3", sum(crdr, "noteValue"));
        setCell("cdnr", "L3", sum(crdr, "taxableValue"));
        setCell("cdnr", "M3", sum(crdr, "cess"));

        // cdnur (9B) - unregistered
        const crdrUnreg = voucherData.crdrUnregistered || [];
        const cdnurRows = crdrUnreg.map((item) => ["B2C", item.noteNo, item.noteDate, item.noteType, item.placeOfSupply, item.noteValue, 100, item.gstRate, item.taxableValue, item.cess]);
        insertRows("cdnur", cdnurRows, "A5");
        setCell("cdnur", "B3", cdnurRows.length);
        setCell("cdnur", "F3", sum(crdrUnreg, "noteValue"));
        setCell("cdnur", "I3", sum(crdrUnreg, "taxableValue"));
        setCell("cdnur", "J3", sum(crdrUnreg, "cess"));

        // at (11B) - advance received
        const advRec = voucherData.advanceReceived || [];
        const atRows = advRec.map((item) => [item.placeOfSupply, item.applicableTaxRate ?? 100, item.gstRate, item.taxableValue, item.cess]);
        insertRows("at", atRows, "A5");
        setCell("at", "D3", sum(advRec, "taxableValue"));
        setCell("at", "E3", sum(advRec, "cess"));

        // atadj (11B) - advance adjusted
        const advAdj = voucherData.advanceAdjusted || [];
        const atadjRows = advAdj.map((item) => [item.placeOfSupply, item.applicableTaxRate ?? 100, item.gstRate, item.taxableValue, item.cess]);
        insertRows("atadj", atadjRows, "A5");
        setCell("atadj", "D3", sum(advAdj, "taxableValue"));
        setCell("atadj", "E3", sum(advAdj, "cess"));

        // hsn(b2b) + hsn(b2c) (12)
        const hsn = voucherData.hsnSummary || [];
        const hsnRows = hsn.map((item) => [item.hsn, item.description, item.uqc, item.quantity, item.totalValue, item.rate, item.taxableValue, item.igst, item.cgst, item.sgst, item.cess]);
        insertRows("hsn(b2b)", hsnRows, "A5");
        insertRows("hsn(b2c)", hsnRows, "A5");
        setCell("hsn(b2b)", "A3", hsn.length);
        setCell("hsn(b2b)", "E3", sum(hsn, "totalValue"));
        setCell("hsn(b2b)", "G3", sum(hsn, "taxableValue"));
        setCell("hsn(b2b)", "H3", sum(hsn, "igst"));
        setCell("hsn(b2b)", "I3", sum(hsn, "cgst"));
        setCell("hsn(b2b)", "J3", sum(hsn, "sgst"));
        setCell("hsn(b2b)", "K3", sum(hsn, "cess"));

        // docs (13)
        const docs = voucherData.documentIssued || [];
        const docsRows = docs.map((item) => [item.nature, item.from, item.to, item.total, item.cancelled]);
        insertRows("docs", docsRows, "A5");
        setCell("docs", "D3", sum(docs, "total"));
        setCell("docs", "E3", sum(docs, "cancelled"));

        // eco (14) - supplies through e-commerce
        const eco = voucherData.ecomSupplies || [];
        const ecoRows = eco.map((item) => ["Liable to collect tax u/s 52(TCS)", item.gstin, "", item.supplyValue, item.igst, item.cgst, item.sgst, item.cess]);
        insertRows("eco", ecoRows, "A5");
        setCell("eco", "B3", new Set(eco.map((i) => i.gstin)).size);
        setCell("eco", "D3", sum(eco, "supplyValue"));
        setCell("eco", "E3", sum(eco, "igst"));
        setCell("eco", "F3", sum(eco, "cgst"));
        setCell("eco", "G3", sum(eco, "sgst"));
        setCell("eco", "H3", sum(eco, "cess"));

        // ecob2c - supplies u/s 9(5)
        const eco9_5 = voucherData.ecomSupplies9_5 || [];
        const ecob2cRows = eco9_5.map((item) => [item.gstin, "", item.placeOfSupply, item.taxableValue, item.rate, item.cess]);
        insertRows("ecob2c", ecob2cRows, "A5");
        setCell("ecob2c", "A3", eco9_5.length);
        setCell("ecob2c", "D3", sum(eco9_5, "taxableValue"));
        setCell("ecob2c", "F3", sum(eco9_5, "cess"));

        const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx", cellStyles: true });
        saveAs(new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "Govt_GSTR1_Report.xlsx");
        return;
      } catch (err) {
        console.error(err);
        alert("Government Excel generation failed.");
        return;
      }
    }

    if (fileType === "json") {
      const blob = new Blob([JSON.stringify(voucherData, null, 2)], { type: "application/json" });
      saveAs(blob, "GSTR1_Report.json");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SmartGST ERP";
    workbook.created = new Date();
    Object.keys(sheetHeaders).forEach((sheetName) => {
      const worksheet = workbook.addWorksheet(sheetName);
      worksheet.addRow(sheetHeaders[sheetName]);
      const headerRow = worksheet.getRow(1);
      headerRow.height = 24;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4F46E5" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      });

      const rowMapping = {
        general: (item) => [item.gstin, item.legalName, item.tradeName, item.returnPeriod, item.financialYear],
        b2b: (item) => [item.gstin, item.receiver, item.invoiceNo, item.invoiceDate, item.invoiceValue, item.placeOfSupply, item.reverseCharge, item.invoiceType, item.ecommerceGSTIN, item.gstRate, item.taxableValue, item.cess],
        b2cLarge: (item) => [item.invoiceNo, item.invoiceDate, item.invoiceValue, item.placeOfSupply, item.applicableTaxRate, item.gstRate, item.taxableValue, item.cess, item.ecommerceGSTIN],
        export: (item) => [item.exportType, item.invoiceNo, item.invoiceDate, item.invoiceValue, item.portCode, item.shippingBillNo, item.shippingBillDate, item.gstRate, item.taxableValue, item.cess],
        nilRated: (item) => [item.description, item.nilRated, item.exempted, item.nonGst],
        crdr: (item) => [item.gstin, item.receiver, item.noteNo, item.noteDate, item.noteType, item.placeOfSupply, item.gstRate, item.taxableValue, item.cess],
        crdrUnregistered: (item) => [item.noteNo, item.noteDate, item.noteType, item.placeOfSupply, item.gstRate, item.taxableValue, item.cess],
        advanceReceived: (item) => [item.placeOfSupply, item.gstRate, item.grossAdvance, item.cess],
        advanceAdjusted: (item) => [item.placeOfSupply, item.gstRate, item.grossAdvanceAdjusted, item.cess],
        hsnSummary: (item) => [item.hsn, item.description, item.uqc, item.quantity, item.totalValue, item.taxableValue, item.igst, item.cgst, item.sgst, item.cess],
        documentIssued: (item) => [item.nature, item.from, item.to, item.total, item.cancelled],
        ecomSupplies: (item) => [item.gstin, item.supplyValue, item.rate, item.taxableValue, item.cess],
        ecomSupplies9_5: (item) => [item.gstin, item.supplyValue, item.rate, item.taxableValue, item.cess]
      };

      const rows = voucherData[sheetName] || [];
      rows.forEach((item) => {
        const row = rowMapping[sheetName] ? rowMapping[sheetName](item) : [];
        worksheet.addRow(row);
      });

      worksheet.columns.forEach((column) => { column.width = 24; });
      worksheet.views = [{ state: "frozen", ySplit: 1 }];
      worksheet.autoFilter = { from: "A1", to: "Z1" };
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber !== 1) {
          row.eachCell((cell) => {
            cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
            cell.alignment = { vertical: "middle", horizontal: "left" };
            if (rowNumber % 2 === 0) {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F8FAFC" } };
            }
          });
        }
      });

      if (sheetName === "b2b") {
        worksheet.dataValidations.add("G2:G500", { type: "list", allowBlank: true, formulae: ['"Y,N"'] });
        worksheet.dataValidations.add("H2:H500", { type: "list", allowBlank: true, formulae: ['"Regular B2B,SEZWP,SEZWOP"'] });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "Software_GSTR1_Report.xlsx");
  };

  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>
      <div className="gstr-container">
        <div className="gstr-header">
          <div>
            <h2 className="gstr-title">GSTR-1 Report</h2>
          </div>
        </div>
        <div className="gstr-card">
          <div className="gstr-left">
            <div className="gstr-switch-row">
              <span className={mode === "month" ? "label active" : "label"}>Month</span>
              <div className={`gstr-switch ${mode === "quarter" ? "right" : ""}`} onClick={() => setMode((prev) => prev === "month" ? "quarter" : "month")}>
                <div className="gstr-switch-thumb"></div>
              </div>
              <span className={mode === "quarter" ? "label active" : "label"}>Quarterly</span>
            </div>
            {mode === "month" ? (
              <input type="month" className="gstr-input" value={month} onChange={(e) => setMonth(e.target.value)} />
            ) : (
              <select className="gstr-input" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
                <option value="">Select Quarter</option>
                <option value="Q1">Q1 (Apr - Jun)</option>
                <option value="Q2">Q2 (Jul - Sep)</option>
                <option value="Q3">Q3 (Oct - Dec)</option>
                <option value="Q4">Q4 (Jan - Mar)</option>
              </select>
            )}
          </div>
          <div className="gstr-right">
            <label>Type of File</label>
            <select className="gstr-input" value={fileType} onChange={(e) => setFileType(e.target.value)}>
              <option value="software_excel">Software Excel</option>
              <option value="govt_excel">Govt Excel</option>
              <option value="json">JSON</option>
            </select>
          </div>
        </div>
        <div className="gstr-action">
          <button className="gstr-download-btn" onClick={handleDownload} disabled={loading || !voucherData}>
            {loading ? "Loading..." : "⬇ Download"}
          </button>
        </div>
        {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
        {!loading && !error && voucherData && Object.values(voucherData).every((arr) => Array.isArray(arr) && arr.length === 0) && (
          <p style={{ color: "#888", marginTop: 10 }}>No data available for the selected period.</p>
        )}
      </div>
    </div>
  );
};
export default GSTR1Report;
