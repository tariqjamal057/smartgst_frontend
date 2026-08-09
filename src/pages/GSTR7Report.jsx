import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../styles/GSTR1Report.css";
import * as services from "../api/services";

const GSTR7Report = () => {
  const [mode, setMode] = useState("month");
  const [month, setMonth] = useState("");
  const [quarter, setQuarter] = useState("");
  const [fileType, setFileType] = useState("software_excel");
  const { collapsed } = useOutletContext();
  const [reportData, setReportData] = useState([]);
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
      const res = await services.getGSTR7({ from_date, to_date });
      const payload = res.data || res;
      setReportData(Array.isArray(payload) ? payload : payload.results || []);
    } catch (err) {
      setError("Failed to fetch GSTR-7 data.");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, quarter, mode]);

  const downloadExcel = () => {
    const workbook = XLSX.utils.book_new();
    const headers = [["Date", "TDS Section", "Name of Deductee", "PAN", "Voucher No", "Amount", "Rate %", "TDS Amount"]];
    const rows = reportData.map((item) => [item.date, item.section, item.account, item.pan, item.voucher_number, item.amount, item.rate, item.tax]);
    const worksheet = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    worksheet["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 10 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(workbook, worksheet, "GSTR-7");
    const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "Software_GSTR7_Report.xlsx");
  };

  const handleDownload = () => {
    if (fileType === "software_excel" || fileType === "govt_excel") {
      downloadExcel();
      return;
    }
    const jsonBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "GSTR7_Report.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>
      <div className="gstr-container">
        <h2 className="gstr-title">GSTR-7 Report</h2>
        <div className="gstr-card">
          <div className="gstr-left">
            <div className="gstr-switch-row">
              <span className={mode === "month" ? "label active" : "label"}>Month</span>
              <div className={`gstr-switch ${mode === "quarter" ? "right" : ""}`} onClick={() => setMode((prev) => (prev === "month" ? "quarter" : "month"))}>
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
          <button className="gstr-download-btn" onClick={handleDownload} disabled={loading || reportData.length === 0}>
            {loading ? "Loading..." : "⬇ Download"}
          </button>
        </div>
        {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
        {!loading && !error && reportData.length === 0 && (
          <p style={{ color: "#888", marginTop: 10 }}>No data available for the selected period.</p>
        )}
      </div>
      {!loading && reportData.length > 0 && (
        <div className="tds-table-card" style={{ marginTop: 20 }}>
          <table>
            <thead>
              <tr>
                {reportData.length > 0 && Object.keys(reportData[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GSTR7Report;
