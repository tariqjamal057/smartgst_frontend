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

        const insertRows = (sheetName, rows, startCell) => {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) return;
          XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: startCell });
        };

        const b2bRows = (voucherData.b2b || []).map((item) => [item.gstin, item.receiver, item.invoiceNo, item.invoiceDate, item.invoiceValue, item.placeOfSupply, item.reverseCharge, item.invoiceType, item.ecommerceGSTIN, item.gstRate, item.taxableValue, item.cess]);
        insertRows("b2b,sez,de", b2bRows, "A5");

        const b2clRows = (voucherData.b2cLarge || []).map((item) => [item.invoiceNo, item.invoiceDate, item.invoiceValue, item.placeOfSupply, item.applicableTaxRate, item.gstRate, item.taxableValue, item.cess, item.ecommerceGSTIN]);
        insertRows("b2cl", b2clRows, "A5");

        const exportRows = (voucherData.export || []).map((item) => [item.exportType, item.invoiceNo, item.invoiceDate, item.invoiceValue, item.portCode, item.shippingBillNo, item.shippingBillDate, item.gstRate, item.taxableValue, item.cess]);
        insertRows("exp", exportRows, "A5");

        const hsnRows = (voucherData.hsnSummary || []).map((item) => [item.hsn, item.description, item.uqc, item.quantity, item.totalValue, item.taxableValue, item.igst, item.cgst, item.sgst, item.cess]);
        insertRows("hsn(b2b)", hsnRows, "A5");

        const docsRows = (voucherData.documentIssued || []).map((item) => [item.nature, item.from, item.to, item.total, item.cancelled]);
        insertRows("docs", docsRows, "A5");

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
