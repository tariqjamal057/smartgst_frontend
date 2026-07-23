import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import * as services from "../api/services";
import "../styles/CashBankBook.css";

const CashBankBook = () => {
  const { collapsed } = useOutletContext();
  const [bookType, setBookType] = useState("both");
  const [fromDate, setFromDate] = useState("2025-04-01");
  const [toDate, setToDate] = useState("2026-03-31");
  const [reconciliation, setReconciliation] = useState(false);
  const [reconDate, setReconDate] = useState("");

  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ cash: { name: "Cash-in-Hand", items: [] }, bank: { name: "Bank Accounts", items: [] } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { from_date: fromDate, to_date: toDate };
      if (bookType !== "both") params.account_type = bookType;

      const res = await services.getTransactions(params);
      const results = res.data.results || res.data || [];
      const transactions = Array.isArray(results) ? results : [];

      const formatted = transactions.map((t) => ({
        date: t.date || t.transaction_date || "",
        particulars: t.particulars || t.ledger_name || t.description || "",
        type: t.voucher_type || t.type || "",
        voucherNo: t.voucher_no || "",
        ref: t.reference || t.ref || "",
        dr: Number(t.debit || t.dr || t.amount_dr || 0),
        cr: Number(t.credit || t.cr || t.amount_cr || 0),
      }));

      setData(formatted);

      // Build summary from accounts
      const accountsRes = await services.getAccounts({ account_type: bookType === "both" ? "" : bookType });
      const accounts = accountsRes.data.results || accountsRes.data || [];
      const accountArray = Array.isArray(accounts) ? accounts : [];

      const cashItems = accountArray
        .filter(a => (a.account_type || "").toLowerCase() === "cash" || (a.name || "").toLowerCase().includes("cash"))
        .map(a => ({ name: a.name, dr: Number(a.debit || a.dr || 0), cr: Number(a.credit || a.cr || 0) }));

      const bankItems = accountArray
        .filter(a => (a.account_type || "").toLowerCase() === "bank" || (a.name || "").toLowerCase().includes("bank"))
        .map(a => ({ name: a.name, dr: Number(a.debit || a.dr || 0), cr: Number(a.credit || a.cr || 0) }));

      setSummary({
        cash: { name: "Cash-in-Hand", items: cashItems.length > 0 ? cashItems : [{ name: "Cash", dr: 0, cr: 0 }] },
        bank: { name: "Bank Accounts", items: bankItems.length > 0 ? bankItems : [{ name: "Bank", dr: 0, cr: 0 }] },
      });
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilter = () => {
    fetchData();
  };

  const [configOpen, setConfigOpen] = useState();
  const [config, setConfig] = useState({
    mode: "day",
    details: false,
    stripe: false,
    lineShow: false,
    narration: false,
    itemDetails: false,
  });

  const getTotal = (items, key) =>
    items.reduce((sum, i) => sum + (i[key] || 0), 0);

  // RUNNING BALANCE LOGIC
  const processedData = data.map((row, idx) => {
    return { ...row, balance: 0 };
  });

  const groupByDate = (data) => {
    const grouped = {};
    data.forEach((row) => {
      if (!grouped[row.date]) grouped[row.date] = [];
      grouped[row.date].push(row);
    });
    return grouped;
  };

  const groupedData = groupByDate(data);

  const processDayWise = () => {
    let runningBalance = 0;
    const result = [];

    Object.keys(groupedData).forEach((date) => {
      const rows = groupedData[date];

      result.push({
        type: "opening",
        date,
        particulars: "Opening Balance",
        dr: runningBalance > 0 ? runningBalance : 0,
        cr: runningBalance < 0 ? Math.abs(runningBalance) : 0,
      });

      let dayDr = 0;
      let dayCr = 0;

      rows.forEach((r) => {
        runningBalance = runningBalance + (r.dr || 0) - (r.cr || 0);
        dayDr += r.dr || 0;
        dayCr += r.cr || 0;
        result.push({ ...r, type: "entry", balance: runningBalance });
      });

      result.push({ type: "total", particulars: "Total", dr: dayDr, cr: dayCr });
      result.push({
        type: "closing",
        particulars: "Closing Balance",
        dr: runningBalance > 0 ? runningBalance : 0,
        cr: runningBalance < 0 ? Math.abs(runningBalance) : 0,
      });
    });

    return result;
  };

  const finalRows = processDayWise();

  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>
      <div className="cb-container">
        <h2>Cash / Bank Book</h2>

        {/* FILTER */}
        <div className="cb-filter">
          <div className="cb-field">
            <label>Type</label>
            <select value={bookType} onChange={(e) => setBookType(e.target.value)}>
              <option value="both">Both</option>
              <option value="cash">Cash Book</option>
              <option value="bank">Bank Book</option>
            </select>
          </div>

          <div className="cb-field">
            <label>Date Period</label>
            <div className="cb-date">
              <Calendar size={16} />
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <span>to</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          <div className="cb-field">
            <button className="cb-apply-btn" onClick={handleFilter}>Apply</button>
          </div>

          <div className="cb-config">
            <button onClick={() => setConfigOpen(!configOpen)}>
              Configuration
            </button>
            {configOpen && (
              <div className="cb-config-dropdown">
                <p className="cfg-title">Balance Type</p>
                <label>
                  <input type="radio" checked={config.mode === "day"}
                    onChange={() => setConfig({ ...config, mode: "day" })} />
                  Day Wise Balance
                </label>
                <label>
                  <input type="radio" checked={config.mode === "month"}
                    onChange={() => setConfig({ ...config, mode: "month" })} />
                  Month Wise Balance
                </label>
                <label>
                  <input type="radio" checked={config.mode === "quarter"}
                    onChange={() => setConfig({ ...config, mode: "quarter" })} />
                  Quarter Wise Balance
                </label>
                <hr />
                <p className="cfg-title">View Options</p>
                <label>
                  <input type="checkbox" checked={config.details}
                    onChange={() => setConfig({ ...config, details: !config.details })} />
                  Details Wise
                </label>
                <label>
                  <input type="checkbox" checked={config.stripe}
                    onChange={() => setConfig({ ...config, stripe: !config.stripe })} />
                  Stripe View
                </label>
                <label>
                  <input type="checkbox" checked={config.narration}
                    onChange={() => setConfig({ ...config, narration: !config.narration })} />
                  Show Narration
                </label>
              </div>
            )}
          </div>

          <div className="cb-field">
            <label>Bank Reconciliation</label>
            <div className="cb-radio">
              <label>
                <input type="radio" checked={reconciliation === true}
                  onChange={() => setReconciliation(true)} />
                Yes
              </label>
              <label>
                <input type="radio" checked={reconciliation === false}
                  onChange={() => setReconciliation(false)} />
                No
              </label>
            </div>
            {reconciliation && (
              <input type="date" value={reconDate}
                onChange={(e) => setReconDate(e.target.value)}
                className="cb-recon-date" />
            )}
          </div>
        </div>

        {loading && <div style={{ textAlign: "center", padding: "40px" }}>Loading data...</div>}
        {error && <div style={{ textAlign: "center", padding: "20px", color: "red" }}>{error}</div>}

        {!loading && !error && (
          <>
            {/* BALANCE SUMMARY */}
            <div className="cb-balance">
              <div className="cb-balance-header">
                <h3>Cash / Bank Balance</h3>
                <span>({fromDate} to {toDate})</span>
              </div>

              <table className="cb-balance-table">
                <thead>
                  <tr>
                    <th>Particulars</th>
                    <th>Amount Dr.</th>
                    <th>Amount Cr.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="group">
                    <td>{summary.cash.name}</td>
                    <td className="amount">{getTotal(summary.cash.items, "dr")}</td>
                    <td className="amount">{getTotal(summary.cash.items, "cr")}</td>
                  </tr>
                  {summary.cash.items.map((item, i) => (
                    <tr key={i} className="child">
                      <td>- {item.name}</td>
                      <td className="amount">{item.dr || ""}</td>
                      <td className="amount">{item.cr || ""}</td>
                    </tr>
                  ))}

                  <tr className="group">
                    <td>{summary.bank.name}</td>
                    <td className="amount">{getTotal(summary.bank.items, "dr")}</td>
                    <td className="amount">{getTotal(summary.bank.items, "cr")}</td>
                  </tr>
                  {summary.bank.items.map((item, i) => (
                    <tr key={i} className="child">
                      <td>- {item.name}</td>
                      <td className="amount">{item.dr || ""}</td>
                      <td className="amount">{item.cr || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="cb-balance-actions">
                <button className="cb-btn">Print</button>
                <button className="cb-btn">PDF</button>
              </div>
            </div>

            {/* MAIN TABLE */}
            <div className="cb-table-wrapper">
              <div className="cb-balance-header">
                <h3>Cash Book</h3>
                <span>({fromDate} to {toDate})</span>
              </div>
              <table className="cb-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Particulars</th>
                    <th>Voucher Type</th>
                    <th>Voucher No.</th>
                    <th>Ref</th>
                    <th>Dr</th>
                    <th>Cr</th>
                  </tr>
                </thead>
                <tbody>
                  {finalRows.map((row, i) => (
                    <tr key={i} className={row.type}>
                      <td>{row.date || ""}</td>
                      <td>{row.particulars}</td>
                      <td>{row.type === "entry" ? (row.type || "") : ""}</td>
                      <td>{row.voucherNo || ""}</td>
                      <td>{row.ref || ""}</td>
                      <td className="dr">{row.dr || ""}</td>
                      <td className="cr">{row.cr || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CashBankBook;
