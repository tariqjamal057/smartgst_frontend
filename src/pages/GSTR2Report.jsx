import { useState, useEffect } from "react";
import { getFinancialYearLabel } from "../utils/financialYear";
import { useOutletContext } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../styles/GSTR1Report.css";
import * as services from "../api/services";

const GSTR2Report = () => {
  const [mode, setMode] = useState("month");
  const [month, setMonth] = useState("");
  const [quarter, setQuarter] = useState("");
  const [fileType, setFileType] = useState("software_excel");
  const { collapsed } = useOutletContext();
  const [purchaseData, setPurchaseData] = useState([]);
  const [returns, setReturns] = useState([]);
  const [company, setCompany] = useState({});
  const [hsn, setHsn] = useState([]);
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
      const res = await services.getGSTR2({ from_date, to_date });
      const payload = res.data || res;
      setPurchaseData(Array.isArray(payload) ? payload : payload.results || []);
      setReturns(Array.isArray(payload.returns) ? payload.returns : []);
      setCompany(payload.company || {});
      setHsn(Array.isArray(payload.hsn) ? payload.hsn : []);
    } catch (err) {
      setError("Failed to fetch GSTR-2 data.");
      setPurchaseData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, quarter, mode]);

  const downloadSoftwareExcel = () => {
    const workbook = XLSX.utils.book_new();
    const commonHeaders = [["GSTIN", "Supplier Name", "Invoice No", "Invoice Date", "Invoice Value", "Place Of Supply", "Reverse Charge", "Invoice Type", "GST Rate", "Taxable Value", "IGST", "CGST", "SGST", "CESS"]];
    const commonRows = purchaseData.map((item) => [item.gstin, item.supplier, item.invoiceNo, item.invoiceDate, item.invoiceValue, item.placeOfSupply, item.reverseCharge, item.invoiceType, item.rate, item.taxableValue, item.igst, item.cgst, item.sgst, item.cess]);

    const createSheet = (sheetName, data) => {
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      worksheet["!cols"] = [{ wch: 20 }, { wch: 28 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    };

    createSheet("General", [["Company Name", "GSTIN", "Financial Year"], [company.company_name || "", company.gstin || "", company.financial_year || getFinancialYearLabel()]]);

    const registered = purchaseData.filter((i) => i.gstin);
    const unregistered = purchaseData.filter((i) => !i.gstin);
    createSheet("B2B", [...commonHeaders, ...registered.map((item) => [item.gstin, item.supplier, item.invoiceNo, item.invoiceDate, item.invoiceValue, item.placeOfSupply, item.reverseCharge, item.invoiceType, item.rate, item.taxableValue, item.igst, item.cgst, item.sgst, item.cess])]);
    createSheet("B2BUR", [...commonHeaders, ...unregistered.map((item) => [item.supplier, item.invoiceNo, item.invoiceDate, item.invoiceValue, item.placeOfSupply, item.invoiceType, item.rate, item.taxableValue, item.igst, item.cgst, item.sgst, item.cess])]);
    createSheet("Export", [...commonHeaders]);
    createSheet("Reverse charge", [...commonHeaders, ...purchaseData.filter((i) => i.reverseCharge === "Y").map((item) => [item.gstin, item.supplier, item.invoiceNo, item.invoiceDate, item.invoiceValue, item.placeOfSupply, item.reverseCharge, item.invoiceType, item.rate, item.taxableValue, item.igst, item.cgst, item.sgst, item.cess])]);
    createSheet("Import Goods", [...commonHeaders]);
    createSheet("Import Services", [...commonHeaders]);
    createSheet("Cr.Dr", [["Supplier GSTIN", "Supplier Name", "Note No", "Note Date", "Note Type", "Place Of Supply", "GST Rate", "Note Value", "Taxable Value", "IGST", "CGST", "SGST", "CESS"], ...(returns || []).filter((i) => i.gstin).map((item) => [item.gstin, item.supplier, item.noteNo, item.noteDate, item.noteType, item.placeOfSupply, item.rate, item.noteValue, item.taxableValue, item.igst, item.cgst, item.sgst, item.cess])]);
    createSheet("Cr.Dr Unregistered", [["Supplier Name", "Note No", "Note Date", "Note Type", "Place Of Supply", "GST Rate", "Note Value", "Taxable Value", "IGST", "CGST", "SGST", "CESS"], ...(returns || []).filter((i) => !i.gstin).map((item) => [item.supplier, item.noteNo, item.noteDate, item.noteType, item.placeOfSupply, item.rate, item.noteValue, item.taxableValue, item.igst, item.cgst, item.sgst, item.cess])]);
    createSheet("Nil Rated", [...commonHeaders]);
    createSheet("ISD", [...commonHeaders]);
    createSheet("TDS and TCS", [...commonHeaders]);
    createSheet("Advance Paid", [...commonHeaders]);
    createSheet("Advance Adjusted", [...commonHeaders]);
    createSheet("ITC Reversal", [...commonHeaders]);
    createSheet("HSN Summary", [["HSN Code", "Description", "UQC", "Quantity", "Total Value", "Taxable Value", "GST Rate", "IGST", "CGST", "SGST", "Cess"], ...hsn.map((h) => [h.hsn, h.description, h.uqc, h.quantity, h.totalValue, h.taxableValue, h.rate, h.igst, h.cgst, h.sgst, h.cess])]);
    createSheet("Master", [["System"], ["Generated By ERP"]]);
    createSheet("Dropdowns", [["Dropdown Values"], ["Regular"], ["SEZ"], ["Composition"]]);

    const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "Software_GSTR2_Report.xlsx");
  };

  const downloadGovtExcel = async () => {
    try {
      const response = await fetch("/templates/GSTR2_Excel_Workbook_TemplateNew_V1.1.xlsx");
      if (!response.ok) throw new Error("Govt template not found.");
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array", cellStyles: true, cellFormula: true, cellDates: true });

      const setCellValue = (sheetName, cell, value) => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return;
        if (value === undefined || value === null || value === "") return;
        sheet[cell] = { t: typeof value === "number" ? "n" : "s", v: value };
      };

      const insertRows = (sheetName, rows, startCell) => {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) return;
        if (!rows.length) return;
        XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: startCell });
      };

      const clearDataRows = () => {
        Object.keys(workbook.Sheets).forEach((name) => {
          if (name === "Help Instructions" || name === "master") return;
          const sheet = workbook.Sheets[name];
          Object.keys(sheet).forEach((key) => {
            if (key[0] === "!") return;
            const row = XLSX.utils.decode_cell(key).r + 1;
            if (row >= 5) delete sheet[key];
          });
        });
      };

      const sum = (arr, key) => (arr || []).reduce((s, i) => s + (Number(i[key]) || 0), 0);

      clearDataRows();

      const registered = (purchaseData || []).filter((i) => i.gstin);
      const unregistered = (purchaseData || []).filter((i) => !i.gstin);
      const regReturns = (returns || []).filter((i) => i.gstin);
      const unregReturns = (returns || []).filter((i) => !i.gstin);

      // b2b - supplies from registered suppliers
      insertRows("b2b", registered.map((item) => [item.gstin, item.invoiceNo, item.invoiceDate, item.invoiceValue, item.placeOfSupply, item.reverseCharge || "N", item.invoiceType, item.rate, item.taxableValue, item.igst, item.cgst, item.sgst, item.cess, "Inputs"]), "A5");
      setCellValue("b2b", "A3", new Set(registered.map((i) => i.gstin)).size);
      setCellValue("b2b", "B3", registered.length);
      setCellValue("b2b", "D3", sum(registered, "invoiceValue"));
      setCellValue("b2b", "I3", sum(registered, "taxableValue"));
      setCellValue("b2b", "J3", sum(registered, "igst"));
      setCellValue("b2b", "K3", sum(registered, "cgst"));
      setCellValue("b2b", "L3", sum(registered, "sgst"));
      setCellValue("b2b", "M3", sum(registered, "cess"));

      // b2bur - supplies from unregistered suppliers
      insertRows("b2bur", unregistered.map((item) => [item.supplier, item.invoiceNo, item.invoiceDate, item.invoiceValue, item.placeOfSupply, item.invoiceType === "SEZ" ? "SEZ" : "Inter State", item.rate, item.taxableValue, item.igst, item.cgst, item.sgst, item.cess, "Inputs"]), "A5");
      setCellValue("b2bur", "B3", unregistered.length);
      setCellValue("b2bur", "D3", sum(unregistered, "invoiceValue"));
      setCellValue("b2bur", "H3", sum(unregistered, "taxableValue"));
      setCellValue("b2bur", "I3", sum(unregistered, "igst"));
      setCellValue("b2bur", "J3", sum(unregistered, "cgst"));
      setCellValue("b2bur", "K3", sum(unregistered, "sgst"));
      setCellValue("b2bur", "L3", sum(unregistered, "cess"));

      // cdnr - credit/debit notes from registered suppliers
      insertRows("cdnr", regReturns.map((item) => [item.gstin, item.noteNo, item.noteDate, "", "", "N", "D", "02-Post Sale Discount", "Inter State", item.noteValue, item.rate, item.taxableValue, item.igst, item.cgst, item.sgst, item.cess, "Inputs"]), "A5");
      setCellValue("cdnr", "A3", new Set(regReturns.map((i) => i.gstin)).size);
      setCellValue("cdnr", "B3", regReturns.length);
      setCellValue("cdnr", "J3", sum(regReturns, "noteValue"));
      setCellValue("cdnr", "L3", sum(regReturns, "taxableValue"));
      setCellValue("cdnr", "M3", sum(regReturns, "igst"));
      setCellValue("cdnr", "N3", sum(regReturns, "cgst"));
      setCellValue("cdnr", "O3", sum(regReturns, "sgst"));
      setCellValue("cdnr", "P3", sum(regReturns, "cess"));

      // cdnur - credit/debit notes from unregistered suppliers
      insertRows("cdnur", unregReturns.map((item) => [item.noteNo, item.noteDate, "", "", "N", "D", "02-Post Sale Discount", "Inter State", "B2BUR", item.noteValue, item.rate, item.taxableValue, item.igst, item.cgst, item.sgst, item.cess, "Inputs"]), "A5");
      setCellValue("cdnur", "A3", unregReturns.length);
      setCellValue("cdnur", "J3", sum(unregReturns, "noteValue"));
      setCellValue("cdnur", "L3", sum(unregReturns, "taxableValue"));
      setCellValue("cdnur", "M3", sum(unregReturns, "igst"));
      setCellValue("cdnur", "N3", sum(unregReturns, "cgst"));
      setCellValue("cdnur", "O3", sum(unregReturns, "sgst"));
      setCellValue("cdnur", "P3", sum(unregReturns, "cess"));

      // hsnsum - HSN summary
      insertRows("hsnsum", hsn.map((h) => [h.hsn, h.description, h.uqc, h.quantity, h.totalValue, h.taxableValue, h.igst, h.cgst, h.sgst, h.cess]), "A5");
      setCellValue("hsnsum", "A3", hsn.length);
      setCellValue("hsnsum", "E3", sum(hsn, "totalValue"));
      setCellValue("hsnsum", "F3", sum(hsn, "taxableValue"));
      setCellValue("hsnsum", "G3", sum(hsn, "igst"));
      setCellValue("hsnsum", "H3", sum(hsn, "cgst"));
      setCellValue("hsnsum", "I3", sum(hsn, "sgst"));
      setCellValue("hsnsum", "J3", sum(hsn, "cess"));

      const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx", cellStyles: true });
      saveAs(new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "Govt_GSTR2_Report.xlsx");
    } catch (error) {
      console.error("Govt Excel Error:", error);
      alert(error.message || "Unable to generate govt excel.");
    }
  };

  const downloadJSON = () => {
    const jsonBlob = new Blob([JSON.stringify(purchaseData, null, 2)], { type: "application/json" });
    saveAs(jsonBlob, "GSTR2_Report.json");
  };

  const handleDownload = async () => {
    if (fileType === "software_excel") { downloadSoftwareExcel(); return; }
    if (fileType === "govt_excel") { await downloadGovtExcel(); return; }
    if (fileType === "json") { downloadJSON(); }
  };

  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>
      <div className="gstr-container">
        <h2 className="gstr-title">GSTR-2 Report</h2>
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
          <button className="gstr-download-btn" onClick={handleDownload} disabled={loading || purchaseData.length === 0}>
            {loading ? "Loading..." : "⬇ Download"}
          </button>
        </div>
        {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
        {!loading && !error && purchaseData.length === 0 && (
          <p style={{ color: "#888", marginTop: 10 }}>No data available for the selected period.</p>
        )}
      </div>
    </div>
  );
};

export default GSTR2Report;
