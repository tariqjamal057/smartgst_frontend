import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import * as services from "../api/services";
import "../styles/HSNSACReport.css";

const HSNSACReport = () => {
  const [rangeType, setRangeType] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const { collapsed } = useOutletContext();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await services.getHSNSACRpt({
          from_date: startDate,
          to_date: endDate,
          type,
        });
        const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        setData(rows.map(r => ({
          type: r.supply_type || r.type || "B2C",
          hsn: r.hsn_code || r.hsn || "",
          description: r.description || r.hsn_description || "",
          unit: r.unit || "",
          qty: r.quantity ?? r.qty ?? 0,
          amount: r.total_amount ?? r.amount ?? 0,
          taxable: r.taxable_value ?? r.taxable ?? 0,
          igst: r.igst ?? 0,
          cgst: r.cgst ?? 0,
          sgst: r.sgst ?? 0,
          cess: r.cess ?? 0,
          rate: r.gst_rate || r.rate || "",
        })));
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [startDate, endDate, type]);

  const filteredData = useMemo(() => {
    return data.filter(d =>
      d.hsn.includes(search) ||
      d.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>
      <div className="hsn-page">
        <h2 className="hsn-title">HSN/SAC Wise Summary</h2>

        <div className="hsn-filters">
          <div className="hsn-field">
            <label>Select Period</label>
            <select value={rangeType} onChange={(e) => setRangeType(e.target.value)}>
              <option value="custom">Custom Range</option>
              <option value="quarterly">Quarterly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          {rangeType === "custom" && (
            <div className="hsn-field">
              <label>Date Range</label>
              <div className="hsn-date-wrap">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <span>{"\u2192"}</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          )}
          <div className="hsn-field">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">All (Default)</option>
              <option value="b2b_hsn">B2B HSN</option>
              <option value="b2c_hsn">B2C HSN</option>
              <option value="b2b_sac">B2B SAC</option>
              <option value="b2c_sac">B2C SAC</option>
              <option value="by_book">By Book HSN/SAC</option>
            </select>
          </div>
        </div>

        <div className="hsn-table-header">
          <div className="hsn-title-row">
            <span>{"\uD83D\uDCCB"}</span>
            <h3>Report Details</h3>
            <span className="hsn-count">{loading ? "Loading..." : `${filteredData.length} records`}</span>
          </div>
          <div className="hsn-search">
            <span className="icon">{"\uD83D\uDD0E"}</span>
            <input type="text" placeholder="Search HSN / Description / Unit..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="hsn-table-box">
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>Loading data...</div>
          ) : type !== "by_book" ? (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>HSN/SAC</th>
                  <th>Description</th>
                  <th>Unit</th>
                  <th>Total Qty</th>
                  <th>Total Amount</th>
                  <th>Taxable</th>
                  <th>IGST</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>Cess</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan="12" style={{ textAlign: "center", padding: "2rem" }}>No records found</td></tr>
                ) : (
                  filteredData.map((row, i) => (
                    <tr key={i}>
                      <td>{row.type}</td>
                      <td>{row.hsn}</td>
                      <td>{row.description}</td>
                      <td>{row.unit}</td>
                      <td>{row.qty}</td>
                      <td>{"\u20B9"} {row.amount}</td>
                      <td>{"\u20B9"} {row.taxable}</td>
                      <td>{row.igst}</td>
                      <td>{row.cgst}</td>
                      <td>{row.sgst}</td>
                      <td>{row.cess}</td>
                      <td>{row.rate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>HSN/SAC</th>
                  <th>Description</th>
                  <th>Total Qty</th>
                  <th>Unit</th>
                  <th>Opening Qty</th>
                  <th>Opening Stock</th>
                  <th>Inward</th>
                  <th>Outward</th>
                  <th>Closing Qty</th>
                  <th>Avg Rate</th>
                  <th>Closing Stock</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan="11" style={{ textAlign: "center", padding: "2rem" }}>No records found</td></tr>
                ) : (
                  filteredData.map((row, i) => (
                    <tr key={i}>
                      <td>{row.hsn}</td>
                      <td>{row.description}</td>
                      <td>{row.qty}</td>
                      <td>{row.unit}</td>
                      <td>0</td>
                      <td>{"\u20B9"} 0</td>
                      <td>{row.qty}</td>
                      <td>{row.qty / 2}</td>
                      <td>{row.qty / 2}</td>
                      <td>{"\u20B9"} {(row.amount / (row.qty || 1)).toFixed(2)}</td>
                      <td>{"\u20B9"} {row.amount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default HSNSACReport;
