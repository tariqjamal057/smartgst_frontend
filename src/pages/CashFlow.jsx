import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as services from '../api/services';
import {
  FiSearch, FiArrowUpRight, FiArrowDownLeft,
  FiPrinter, FiFileText, FiFilter
} from 'react-icons/fi';
import '../styles/CashFlow.css';

const CashFlow = () => {
  const { collapsed } = useOutletContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [activePeriod, setActivePeriod] = useState("Last month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rawData, setRawData] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const res = await services.getCashFlow(params);
      const result = res.data;
      setRawData(result.transactions || result.results || result.data || []);
      setOpeningBalance(result.opening_balance || result.openingBalance || 0);
    } catch (err) {
      console.error("Failed to fetch cash flow:", err);
      setError("Failed to load cash flow data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const applyPeriod = (period) => {
    setActivePeriod(period);
    const n = new Date();
    let f = "", t = "";

    if (period === "Today") {
      f = t = n.toISOString().slice(0, 10);
    } else if (period === "Last week") {
      const lastWeek = new Date(n);
      lastWeek.setDate(n.getDate() - 7);
      f = lastWeek.toISOString().slice(0, 10);
      t = n.toISOString().slice(0, 10);
    } else if (period === "Last month") {
      const lastMonth = new Date(n);
      lastMonth.setMonth(n.getMonth() - 1);
      f = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString().slice(0, 10);
      t = new Date(n.getFullYear(), n.getMonth(), 0).toISOString().slice(0, 10);
    } else if (period === "Yearly") {
      f = `${n.getFullYear()}-01-01`;
      t = `${n.getFullYear()}-12-31`;
    }

    setFromDate(f);
    setToDate(t);
    fetchData({ from_date: f, to_date: t });
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return rawData;
    const term = searchTerm.toLowerCase();
    return rawData.filter(row =>
      Object.values(row).join(" ").toLowerCase().includes(term)
    );
  }, [rawData, searchTerm]);

  const tableData = useMemo(() => {
    let currentBalance = openingBalance;
    return filteredData.map(item => {
      const cashIn = Number(item.cash_in || item.cashIn || 0);
      const cashOut = Number(item.cash_out || item.cashOut || 0);
      currentBalance = currentBalance + cashIn - cashOut;
      return {
        ...item,
        cashIn,
        cashOut,
        running: currentBalance,
      };
    });
  }, [filteredData, openingBalance]);

  const totals = useMemo(() => ({
    in: tableData.reduce((acc, curr) => acc + curr.cashIn, 0),
    out: tableData.reduce((acc, curr) => acc + curr.cashOut, 0),
    net: tableData.length > 0 ? tableData[tableData.length - 1].running : openingBalance
  }), [tableData, openingBalance]);

  return (
    <div className={`main ${collapsed ? 'collapsed' : ''}`}>
      {/* HEADER SECTION */}
      <div className="cf-header">
        <div className="title-group">
          <h1>Cash Flow Statement</h1>
          <p>Real-time liquidity and transaction monitoring</p>
        </div>
        <div className="action-buttons">
          <button className="btn-secondary"><FiPrinter /> Print</button>
          <button className="btn-primary"><FiFileText /> Export PDF</button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="cf-kpi-grid">
        <div className="kpi-card opening">
          <label>Opening Balance</label>
          <h3>₹ {openingBalance.toLocaleString()}</h3>
        </div>
        <div className="kpi-card inflow">
          <label><FiArrowUpRight /> Total Cash In</label>
          <h3>₹ {totals.in.toLocaleString()}</h3>
        </div>
        <div className="kpi-card outflow">
          <label><FiArrowDownLeft /> Total Cash Out</label>
          <h3>₹ {totals.out.toLocaleString()}</h3>
        </div>
        <div className="kpi-card closing">
          <label>Current Liquidity</label>
          <h3 className={totals.net < 0 ? 'text-danger' : 'text-success'}>
            ₹ {totals.net.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="cf-filters">
        <div className="period-tabs">
          {["Today", "Last week", "Last month", "Yearly", "Custom"].map(p => (
            <button
              key={p}
              className={activePeriod === p ? "active" : ""}
              onClick={() => applyPeriod(p)}
            >{p}</button>
          ))}
        </div>
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by ledger or voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && <div style={{ textAlign: "center", padding: "40px" }}>Loading cash flow data...</div>}
      {error && <div style={{ textAlign: "center", padding: "20px", color: "red" }}>{error}</div>}

      {/* TRANSACTION TABLE */}
      {!loading && !error && (
        <div className="cf-table-wrapper">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Voucher Type</th>
                <th>Ledger Name</th>
                <th className="text-right">Cash In (+)</th>
                <th className="text-right">Cash Out (-)</th>
                <th className="text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="opening-row">
                <td colSpan="3"><b>Opening Balance</b></td>
                <td>-</td>
                <td>-</td>
                <td className="text-right"><b>₹ {openingBalance.toLocaleString()}</b></td>
              </tr>
              {tableData.map((row, idx) => (
                <tr key={idx} className="data-row">
                  <td>{row.date || row.transaction_date}</td>
                  <td><span className={`badge ${(row.type || row.voucher_type || "").toLowerCase()}`}>{row.type || row.voucher_type || "-"}</span></td>
                  <td>{row.ledger || row.ledger_name || row.party || ""}</td>
                  <td className="text-right text-success">{row.cashIn > 0 ? `+ ₹${row.cashIn.toLocaleString()}` : "-"}</td>
                  <td className="text-right text-danger">{row.cashOut > 0 ? `- ₹${row.cashOut.toLocaleString()}` : "-"}</td>
                  <td className="text-right font-weight-bold">₹ {row.running.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3"><b>Totals for Period</b></td>
                <td className="text-right text-success"><b>₹ {totals.in.toLocaleString()}</b></td>
                <td className="text-right text-danger"><b>₹ {totals.out.toLocaleString()}</b></td>
                <td className="text-right"><b>₹ {totals.net.toLocaleString()}</b></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default CashFlow;
