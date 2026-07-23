import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import * as services from "../api/services";
import "../styles/ProfitLoss.css";
import { Calendar, Settings2, ChevronDown, FileText } from "lucide-react";

const ProfitLoss = () => {
  const { collapsed } = useOutletContext();

  const [view, setView] = useState("horizontal");
  const [configOpen, setConfigOpen] = useState(false);
  const [type, setType] = useState("both");
  const [fromDate, setFromDate] = useState("2024-04-01");
  const [toDate, setToDate] = useState("2025-03-31");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [company, setCompany] = useState({ name: "" });

  const [config, setConfig] = useState({
    showGross: true,
    showVertical: false,
    showPercent: true,
  });

  const fetchData = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const [plRes, companyRes] = await Promise.all([
        services.getProfitLoss(params),
        services.getCompanySettings(),
      ]);
      setData(plRes.data);
      const companyData = companyRes.data.results || companyRes.data;
      if (Array.isArray(companyData) && companyData.length > 0) {
        setCompany(companyData[0]);
      } else if (companyData.name) {
        setCompany(companyData);
      }
    } catch (err) {
      console.error("Failed to fetch profit & loss:", err);
      setError("Failed to load Profit & Loss data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ from_date: fromDate, to_date: toDate });
  }, []);

  const handleFilter = () => {
    fetchData({ from_date: fromDate, to_date: toDate });
  };

  const generateRows = (groupData) => {
    if (!groupData) return [];
    const rows = [];
    const items = groupData.items || groupData.children || [];
    items.forEach((c) => {
      rows.push({
        type: "child",
        name: `${c.name} ${c.amount}`,
        percent: c.percent || "",
      });
    });
    return rows;
  };

  const renderGroup = (title, groupData) => {
    if (!groupData) return null;
    const total = groupData.total || 0;
    const items = groupData.items || groupData.children || [];

    return (
      <>
        <tr className="group">
          <td>{title}</td>
          <td></td>
          <td className="amount">{total}</td>
          {config.showPercent && <td></td>}
        </tr>

        {items.map((item, i) => (
          <tr className="child" key={i}>
            <td>- {item.name}</td>
            <td className="inner">
              {item.type === "minus" ? `(${item.amount})` : item.amount}
            </td>
            <td></td>
            {config.showPercent && <td></td>}
          </tr>
        ))}
      </>
    );
  };

  const syncRows = (left, right) => {
    const max = Math.max(left.length, right.length);
    const l = [...left];
    const r = [...right];
    while (l.length < max) l.push({});
    while (r.length < max) r.push({});
    return l.map((_, i) => ({ left: l[i], right: r[i] }));
  };

  // Build data from API response or fallback to empty
  const trading = data?.trading || data?.trading_account || {};
  const incomeStatement = data?.income_statement || {};
  const grossProfit = data?.gross_profit || data?.grossProfit || 0;
  const netProfit = data?.net_profit || data?.netProfit || 0;

  const expenses = [
    { group: "Opening Stock", total: trading.opening_stock?.total || 0, children: trading.opening_stock?.items || [] },
    { group: "Purchase Accounts", total: trading.purchases?.total || 0, children: trading.purchases?.items || [] },
    { group: "Direct Expenses", total: trading.direct_expenses?.total || 0, children: trading.direct_expenses?.items || [] },
  ];

  const incomeItems = [
    { group: "Sales Accounts", total: trading.sales?.total || 0, children: trading.sales?.items || [] },
    { group: "Closing Stock", total: trading.closing_stock?.total || 0, children: trading.closing_stock?.items || [] },
  ];

  const indirectIncome = [{ group: "Indirect Income", total: incomeStatement.indirect_income?.total || 0, children: incomeStatement.indirect_income?.items || [] }];
  const indirectExpenses = [{ group: "Indirect Expenses", total: incomeStatement.indirect_expenses?.total || 0, children: incomeStatement.indirect_expenses?.items || [] }];

  const tradingExpenses = expenses;
  const tradingIncome = incomeItems;

  const leftTrading = generateRows({ items: tradingExpenses.flatMap(g => g.children.map(c => ({ name: `${c.name} ${c.amount || 0}` }))) });
  const rightTrading = generateRows({ items: tradingIncome.flatMap(g => g.children.map(c => ({ name: `${c.name} ${c.amount || 0}` }))) });

  const leftIndirect = generateRows({ items: indirectExpenses.flatMap(g => g.children.map(c => ({ name: `${c.name} ${c.amount || 0}` }))) });
  const rightIndirect = generateRows({ items: indirectIncome.flatMap(g => g.children.map(c => ({ name: `${c.name} ${c.amount || 0}` }))) });

  const tradingRows = syncRows(leftTrading, rightTrading);
  const indirectRows = syncRows(leftIndirect, rightIndirect);

  const sum = (arr) => arr.reduce((a, b) => a + (b.total || 0), 0);
  const tradingLeftTotal = sum(tradingExpenses);
  const tradingRightTotal = sum(tradingIncome);

  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>
      <div className="bs-header">
        <div className="bs-top">
          <div className="bs-title">
            <FileText size={24} />
            <span>Profit & Loss Report</span>
          </div>
          <div className="bs-date">
            <Calendar size={16} />
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <span>to</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            <button className="bs-apply-btn" onClick={handleFilter}>Apply</button>
          </div>
        </div>

        <div className="bs-company">{company.name || "Company"}</div>
        <div className="bs-subtitle">({fromDate} to {toDate})</div>

        <div className="bs-filter">
          <div className="bs-filter-left">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="both">Both</option>
              <option value="ledger">Ledgers Only</option>
              <option value="group">Groups Only</option>
            </select>
          </div>

          <div className="bs-filter-right">
            <label>Configuration</label>
            <div className="bs-config">
              <button onClick={() => setConfigOpen(!configOpen)}>
                <Settings2 size={16} />
                Configuration
                <ChevronDown size={16} />
              </button>
              {configOpen && (
                <div className="bs-config-dropdown">
                  <label>
                    <input type="checkbox" checked={config.showGross}
                      onChange={() => setConfig({ ...config, showGross: !config.showGross })} />
                    Show Gross profit
                  </label>
                  <label>
                    <input type="checkbox" checked={config.showVertical}
                      onChange={() => setConfig({ ...config, showVertical: !config.showVertical })} />
                    Show Vertical
                  </label>
                  <label>
                    <input type="checkbox" checked={config.showPercent}
                      onChange={() => setConfig({ ...config, showPercent: !config.showPercent })} />
                    Show Percentage
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: "40px" }}>Loading profit & loss data...</div>}
      {error && <div style={{ textAlign: "center", padding: "20px", color: "red" }}>{error}</div>}

      {!loading && !error && (
        <>
          <div className="pl-toggle">
            <span className={view === "horizontal" ? "active" : ""}>Horizontal</span>
            <div className={`pl-switch ${view === "vertical" ? "right" : ""}`}
              onClick={() => setView((prev) => prev === "horizontal" ? "vertical" : "horizontal")}>
              <div className="pl-thumb"></div>
            </div>
            <span className={view === "vertical" ? "active" : ""}>Vertical</span>
          </div>

          {view === "horizontal" && !config.showVertical && (
            <div className="pl-table-wrapper">
              <table className="pl-table">
                <thead>
                  <tr>
                    <th>PARTICULARS</th>
                    {config.showPercent && <th>%</th>}
                    <th>AMOUNT</th>
                    <th className="divider"></th>
                    <th>PARTICULARS</th>
                    {config.showPercent && <th>%</th>}
                    <th>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {tradingRows.map((row, i) => (
                    <tr key={i}>
                      <td className={row.left.type}>{row.left.name || ""}</td>
                      {config.showPercent && <td>{row.left.percent || ""}</td>}
                      <td className="amount">{row.left.type === "group" ? row.left.amount : ""}</td>
                      <td className="divider"></td>
                      <td className={row.right.type}>{row.right.name || ""}</td>
                      {config.showPercent && <td>{row.right.percent || ""}</td>}
                      <td className="amount">{row.right.type === "group" ? row.right.amount : ""}</td>
                    </tr>
                  ))}

                  {config.showGross && (
                    <tr className="highlight">
                      <td>Gross Profit c/d</td>
                      {config.showPercent && <td></td>}
                      <td>{tradingLeftTotal < tradingRightTotal ? grossProfit : ""}</td>
                      <td className="divider"></td>
                      <td>Gross Profit b/d</td>
                      {config.showPercent && <td></td>}
                      <td>{tradingRightTotal > tradingLeftTotal ? grossProfit : ""}</td>
                    </tr>
                  )}

                  {indirectRows.map((row, i) => (
                    <tr key={i}>
                      <td className={row.left.type}>{row.left.name || ""}</td>
                      {config.showPercent && <td>{row.left.percent || ""}</td>}
                      <td className="amount">{row.left.type === "group" ? row.left.amount : ""}</td>
                      <td className="divider"></td>
                      <td className={row.right.type}>{row.right.name || ""}</td>
                      {config.showPercent && <td>{row.right.percent || ""}</td>}
                      <td className="amount">{row.right.type === "group" ? row.right.amount : ""}</td>
                    </tr>
                  ))}

                  <tr className="total">
                    <td>Net Profit</td>
                    {config.showPercent && <td></td>}
                    <td>{netProfit}</td>
                    <td className="divider"></td>
                    <td></td>
                    {config.showPercent && <td></td>}
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {(view === "vertical" || config.showVertical) && (
            <div className="pl-vertical">
              <table className="pl-vertical-table">
                <thead>
                  <tr>
                    <th>Particulars</th>
                    <th></th>
                    <th>Amount</th>
                    {config.showPercent && <th>%</th>}
                  </tr>
                </thead>
                <tbody>
                  <tr className="section">
                    <td colSpan={config.showPercent ? 4 : 3}>TRADING ACCOUNT</td>
                  </tr>
                  {renderGroup("Sales Accounts", trading.sales)}
                  {renderGroup("Opening Stock", trading.opening_stock)}
                  {renderGroup("Purchases", trading.purchases)}
                  {renderGroup("Direct Expenses", trading.direct_expenses)}
                  {config.showGross && (
                    <tr className="highlight">
                      <td>Gross Profit</td>
                      <td></td>
                      <td className="amount">{grossProfit}</td>
                      {config.showPercent && <td></td>}
                    </tr>
                  )}
                  <tr className="section">
                    <td colSpan={config.showPercent ? 4 : 3}>INCOME STATEMENT</td>
                  </tr>
                  {renderGroup("Indirect Income", incomeStatement.indirect_income)}
                  {renderGroup("Indirect Expenses", incomeStatement.indirect_expenses)}
                  <tr className="total">
                    <td>Net Income Before Tax</td>
                    <td></td>
                    <td className="amount">{netProfit}</td>
                    {config.showPercent && <td></td>}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProfitLoss;
