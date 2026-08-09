import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../styles/GSTR1Report.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as services from "../api/services";

const GSTR3BReport = () => {
  const [mode, setMode] = useState("month");
  const [month, setMonth] = useState("");
  const [quarter, setQuarter] = useState("");
  const [fileType, setFileType] = useState("software_excel");
  const { collapsed } = useOutletContext();
  const [reportData, setReportData] = useState([]);
  const [statewise, setStatewise] = useState([]);
  const [company, setCompany] = useState({});
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
      const res = await services.getGSTR3B({ from_date, to_date });
      const payload = res.data || res;
      setReportData(Array.isArray(payload) ? payload : payload.results || []);
      setStatewise(Array.isArray(payload.statewise) ? payload.statewise : []);
      setCompany(payload.company || {});
    } catch (err) {
      setError("Failed to fetch GSTR-3B data.");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, quarter, mode]);

  const setCellValue = (workbook, sheetName, cell, value) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;
    if (value === undefined || value === null || value === "") return;
    if (!sheet[cell]) {
      sheet[cell] = { t: typeof value === "number" ? "n" : "s", v: value };
    } else {
      sheet[cell].v = value;
    }
  };

  const fill31 = (workbook) => {
    setCellValue(workbook, "GSTR-3B - 3.1", "D5", company.gstin || "09ABCDE1234F1Z5");
    setCellValue(workbook, "GSTR-3B - 3.1", "D6", company.company_name || "TAXMATE TECHNOLOGY PRIVATE LIMITED");
    setCellValue(workbook, "GSTR-3B - 3.1", "D7", company.trade_name || "TAXMATE TECHNOLOGY PRIVATE LIMITED");
    setCellValue(workbook, "GSTR-3B - 3.1", "J2", company.financial_year || "2025-26");
    setCellValue(workbook, "GSTR-3B - 3.1", "J3", "Apr-Mar");
    reportData.forEach((item, index) => {
      const row = 12 + index;
      setCellValue(workbook, "GSTR-3B - 3.1", `F${row}`, item.taxableValue);
      setCellValue(workbook, "GSTR-3B - 3.1", `G${row}`, item.igst);
      setCellValue(workbook, "GSTR-3B - 3.1", `H${row}`, item.cgst);
      setCellValue(workbook, "GSTR-3B - 3.1", `I${row}`, item.sgst);
      setCellValue(workbook, "GSTR-3B - 3.1", `J${row}`, item.cess);
    });
  };

  const fill32 = (workbook) => {
    const sheet = workbook.Sheets["GSTR-3B - 3.2"];
    if (!sheet) return;
    const stateRows = statewise.map((item) => [item.nature, item.state, item.taxableValue, item.igst]);
    if (stateRows.length === 0) return;
    for (let r = 3; r <= 60; r++) {
      for (let c = 0; c < 4; c++) {
        const addr = XLSX.utils.encode_cell({ r: r - 1, c });
        delete sheet[addr];
      }
    }
    XLSX.utils.sheet_add_aoa(sheet, stateRows, { origin: "A3" });
  };

  const downloadSoftwareExcel = async () => {
    try {
      let workbook;
      try {
        const response = await fetch("/templates/GSTR-3B Month-Yearly Report (2025-26) TAXMATE TECHNOLOGY PRIVATE LIMITED.xlsx");
        if (!response.ok) throw new Error("Software template not found.");
        const arrayBuffer = await response.arrayBuffer();
        workbook = XLSX.read(arrayBuffer, { type: "array", cellStyles: true, cellFormula: true, cellDates: true });
      } catch (e) {
        workbook = XLSX.utils.book_new();
        const ws1 = XLSX.utils.aoa_to_sheet([
          ["GSTR-3B - Monthly Return", "", company.gstin || ""],
          ["Company", company.company_name || ""],
          ["Trade Name", company.trade_name || ""],
        ]);
        XLSX.utils.book_append_sheet(workbook, ws1, "GSTR-3B - 3.1");
        const ws2 = XLSX.utils.aoa_to_sheet([]);
        XLSX.utils.sheet_add_aoa(
          ws2,
          [["Nature Of Supply", "State/UT", "Taxable Value", "IGST", "CGST", "SGST", "Cess"]],
          { origin: "A2" }
        );
        ws2["!cols"] = [{ wch: 60 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(workbook, ws2, "GSTR-3B - 3.2");
      }

      fill31(workbook);
      fill32(workbook);

      const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx", cellStyles: true });
      saveAs(new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "Software_GSTR3B_Report.xlsx");
    } catch (error) {
      console.error(error);
      alert("Unable to generate software excel.");
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("GSTR-3B Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Company : ${company.company_name || "TAXMATE TECHNOLOGY PRIVATE LIMITED"}`, 14, 32);
    doc.text(`GSTIN : ${company.gstin || "09ABCDE1234F1Z5"}`, 14, 40);
    doc.text(`Mode : ${mode === "month" ? "Monthly" : "Quarterly"}`, 14, 48);

    autoTable(doc, {
      startY: 60,
      head: [["Nature Of Supply", "State", "Taxable Value", "IGST"]],
      body: reportData.map((item) => [item.nature, item.state, item.taxableValue, item.igst]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("GSTR3B_Report.pdf");
  };

  const handleDownload = async () => {
    if (fileType === "software_excel") { await downloadSoftwareExcel(); return; }
    if (fileType === "pdf") { downloadPDF(); }
  };

  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>
      <div className="gstr-container">
        <h2 className="gstr-title">GSTR-3B Report</h2>
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
              <option value="pdf">PDF</option>
            </select>
          </div>
        </div>
        <div className="gstr-action">
          <button className="gstr-download-btn" onClick={handleDownload} disabled={loading || reportData.length === 0}>
            {loading ? "Loading..." : "⬇ Download"}
          </button>
        </div>
        {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
        {!loading && !error && reportData.length === 0 && (
          <p style={{ color: "#888", marginTop: 10 }}>No data available for the selected period.</p>
        )}
      </div>
    </div>
  );
};

export default GSTR3BReport;
