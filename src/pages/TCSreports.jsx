import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../styles/TDSReport.css";
import * as services from "../api/services";

const TCSReport = () => {
  const [mode, setMode] = useState("month");
  const [month, setMonth] = useState("");
  const [quarter, setQuarter] = useState("");
  const [type, setType] = useState("tcs");
  const { collapsed } = useOutletContext();
  const [data, setData] = useState([]);
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
      const res = await services.getTCSReport({ from_date, to_date });
      const payload = res.data || res;
      setData(Array.isArray(payload) ? payload : payload.results || []);
    } catch (err) {
      setError("Failed to fetch TCS data.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, quarter, mode]);

  const downloadExcel = () => {
    const workbook = XLSX.utils.book_new();
    const headers = [["TCS Section", "Account", "PAN No.", "Date", "Rate %", "Amount", "Tax"]];
    const rows = data.map((row) => [row.section, row.account, row.pan, row.date, row.rate, row.amount, row.tax]);
    const worksheet = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    worksheet["!cols"] = [{ wch: 14 }, { wch: 30 }, { wch: 18 }, { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(workbook, worksheet, "TCS Report");
    const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "TCS_Report.xlsx");
  };

  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>
      <div className="tds-header-card">
        <div className="tds-header-left">
          <div className="tds-icon">📄</div>
          <div>
            <h2>TCS Report</h2>
            <p>Track and manage TCS/TDS deductions</p>
          </div>
        </div>
        <div className="tds-header-right">
          <button className="tds-download-btn" onClick={downloadExcel} disabled={loading || data.length === 0}>
            {loading ? "Loading..." : "⬇ Download Excel"}
          </button>
        </div>
      </div>

      <div className="tds-filter-card">
        <div className="tds-left">
          <div className="tds-switch-row">
            <span className={mode === "month" ? "label active" : "label"}>Month</span>
            <div className={`tds-switch ${mode === "quarter" ? "right" : ""}`} onClick={() => setMode((prev) => (prev === "month" ? "quarter" : "month"))}>
              <div className="tds-switch-thumb"></div>
            </div>
            <span className={mode === "quarter" ? "label active" : "label"}>Quarter</span>
          </div>
          {mode === "month" ? (
            <input type="month" className="tds-input" value={month} onChange={(e) => setMonth(e.target.value)} />
          ) : (
            <select className="tds-input" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
              <option value="">Select Quarter</option>
              <option value="Q1">Q1 (Apr - Jun)</option>
              <option value="Q2">Q2 (Jul - Sep)</option>
              <option value="Q3">Q3 (Oct - Dec)</option>
              <option value="Q4">Q4 (Jan - Mar)</option>
            </select>
          )}
        </div>
        <div className="tds-right">
          <label>Type</label>
          <select className="tds-input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="tcs">TCS Report</option>
            <option value="tds">TDS Report</option>
          </select>
        </div>
      </div>

      {error && <p style={{ color: "red", margin: "10px 0" }}>{error}</p>}
      {loading && <p style={{ color: "#888", margin: "10px 0" }}>Loading...</p>}

      <div className="tds-table-card">
        <table>
          <thead>
            <tr>
              <th>TDS Section</th>
              <th>Account</th>
              <th>PAN No.</th>
              <th>Date</th>
              <th>Rate %</th>
              <th>Amount</th>
              <th>Tax</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && !loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "#888" }}>No data available for the selected period.</td></tr>
            ) : (
              data.map((row, i) => (
                <tr key={i}>
                  <td>{row.section}</td>
                  <td>{row.account}</td>
                  <td>{row.pan}</td>
                  <td>{row.date}</td>
                  <td>{row.rate}</td>
                  <td>₹ {row.amount}</td>
                  <td>₹ {row.tax}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TCSReport;
