import { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import * as services from "../api/services";
import "../styles/TrialBalance.css";

const TrialBalance = () => {
  const { collapsed } = useOutletContext();

  const [mode, setMode] = useState("month");
  const [quarter, setQuarter] = useState("");
  const [viewType, setViewType] = useState("both");
  const [showOpening, setShowOpening] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const res = await services.getTrialBalance(params);
      const payload = res.data || {};
      setData(payload.groups || payload.results || (Array.isArray(payload) ? payload : []));
      setTotals({
        debit: payload.total_debit ?? payload.totalDr ?? 0,
        credit: payload.total_credit ?? payload.totalCr ?? 0,
      });
    } catch (err) {
      console.error("Failed to fetch trial balance:", err);
      setError("Failed to load trial balance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilter = () => {
    const params = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    fetchData(params);
  };

  // ROWS
  const rows = useMemo(() => {
    let result = [];

    data.forEach((group) => {
      const children = group.children || group.ledgers || [];
      const groupDr = children.reduce((a, b) => a + (b.dr || b.debit || 0), 0);
      const groupCr = children.reduce((a, b) => a + (b.cr || b.credit || 0), 0);
      const groupODr = children.reduce((a, b) => a + (b.opening_debit || 0), 0);
      const groupOCr = children.reduce((a, b) => a + (b.opening_credit || 0), 0);
      const toRow = (l) => ({
        name: l.name,
        dr: l.dr || l.debit || 0,
        cr: l.cr || l.credit || 0,
        openingDr: l.opening_debit || 0,
        openingCr: l.opening_credit || 0,
        isGroup: false,
      });

      if (viewType === "group") {
        result.push({ name: group.group || group.name, dr: groupDr, cr: groupCr, openingDr: groupODr, openingCr: groupOCr, isGroup: true });
      } else if (viewType === "ledger") {
        children.forEach((l) => result.push(toRow(l)));
      } else {
        result.push({ name: group.group || group.name, dr: groupDr, cr: groupCr, openingDr: groupODr, openingCr: groupOCr, isGroup: true });
        children.forEach((l) => result.push(toRow(l)));
      }
    });

    return result;
  }, [data, viewType]);

  // TOTALS
  const totalDr = totals.debit || rows.reduce((s, r) => s + (r.dr || 0), 0);
  const totalCr = totals.credit || rows.reduce((s, r) => s + (r.cr || 0), 0);
  const totalODr = rows.reduce((s, r) => s + (r.openingDr || 0), 0);
  const totalOCr = rows.reduce((s, r) => s + (r.openingCr || 0), 0);
  const isMatched = totalDr === totalCr;

  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>

      {/* HEADER */}
      <div className="tb-header">
        <h2>Trial Balance</h2>
        <p>Compare Debit and Credit balances</p>
      </div>

      {/* FILTER CARD */}
      <div className="tb-filter-card">

        {/* ROW 1 */}
        <div className="tb-top-row">

          {/* LEFT SIDE (toggle + input column) */}
          <div className="tb-left-block">

            {/* TOGGLE */}
            <div className="tb-switch-row">
              <span className={mode === "month" ? "active" : ""}>Monthly</span>

              <div
                className={`tb-switch ${mode === "quarter" ? "right" : ""}`}
                onClick={() =>
                  setMode((prev) => (prev === "month" ? "quarter" : "month"))
                }
              >
                <div className="tb-thumb"></div>
              </div>

              <span className={mode === "quarter" ? "active" : ""}>Quarterly</span>
            </div>

            {/* INPUT JUST BELOW TOGGLE */}
            <div className="tb-bottom-row">
              {mode === "month" ? (
                <input
                  type="month"
                  className="tb-input"
                  value={fromDate.slice(0, 7)}
                  onChange={(e) => setFromDate(e.target.value + "-01")}
                />
              ) : (
                <select
                  className="tb-input"
                  value={quarter}
                  onChange={(e) => setQuarter(e.target.value)}
                >
                  <option value="">Select Quarter</option>
                  <option value="Q1">Apr - Jun</option>
                  <option value="Q2">Jul - Sep</option>
                  <option value="Q3">Oct - Dec</option>
                  <option value="Q4">Jan - Mar</option>
                </select>
              )}
            </div>

          </div>

          {/* RIGHT SIDE */}
          <div className="tb-right-block">

            <div className="tb-field-inline">
              <label>Type</label>
              <select
                value={viewType}
                onChange={(e) => setViewType(e.target.value)}
              >
                <option value="both">Both (Default)</option>
                <option value="group">Group Wise</option>
                <option value="ledger">Ledger Wise</option>
              </select>
            </div>

            <label className="tb-checkbox">
              <input
                type="checkbox"
                checked={showOpening}
                onChange={() => setShowOpening(!showOpening)}
              />
              <span>Show Opening Balance</span>
            </label>

            <button className="tb-apply-btn" onClick={handleFilter}>
              Apply
            </button>

          </div>

        </div>

      </div>

      {/* LOADING STATE */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          Loading trial balance...
        </div>
      )}

      {/* ERROR STATE */}
      {error && (
        <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
          {error}
        </div>
      )}

      {/* TABLE */}
      {!loading && !error && (
        <div className="tb-table">
          <table>
            <thead>
              <tr>
                <th>Particulars</th>

                {showOpening && (
                  <>
                    <th>Opening Dr</th>
                    <th>Opening Cr</th>
                  </>
                )}

                <th>Debit</th>
                <th>Credit</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={r.isGroup ? "group" : "ledger"}>
                  <td style={{ paddingLeft: r.isGroup ? "10px" : "30px" }}>
                    {r.isGroup ? <b>{r.name}</b> : r.name}
                  </td>

                  {showOpening && (
                    <>
                      <td>{r.openingDr ? r.openingDr.toLocaleString() : ""}</td>
                      <td>{r.openingCr ? r.openingCr.toLocaleString() : ""}</td>
                    </>
                  )}

                  <td>{r.dr ? r.dr.toLocaleString() : ""}</td>
                  <td>{r.cr ? r.cr.toLocaleString() : ""}</td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <td><b>Total</b></td>

                {showOpening && (
                  <>
                    <td><b>{totalODr.toLocaleString()}</b></td>
                    <td><b>{totalOCr.toLocaleString()}</b></td>
                  </>
                )}

                <td><b>{totalDr.toLocaleString()}</b></td>
                <td><b>{totalCr.toLocaleString()}</b></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* STATUS */}
      {!loading && !error && (
        <div className={`tb-status ${isMatched ? "match" : "not-match"}`}>
          {isMatched
            ? "✔ Trial Balance Matched"
            : "✖ Trial Balance Not Matching"}
        </div>
      )}

    </div>
  );
};

export default TrialBalance;
