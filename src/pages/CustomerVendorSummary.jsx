import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import * as services from "../api/services";
import "../styles/CustomerVendorSummary.css";

const CustomerVendorSummary = () => {
  const { collapsed } = useOutletContext();
  const [period, setPeriod] = useState("monthly");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const partyType = type === "customer" ? "CUSTOMER" : type === "vendor" ? "VENDOR" : "";
        const res = await services.getCustomerVendorSummaryRpt({ party_type: partyType });
        const payload = res.data || {};
        const rows = Array.isArray(payload) ? payload : payload.parties ?? payload.results ?? [];
        setRawData(rows.map(r => ({
          name: r.party_name || r.name || "",
          type: (r.party_type || "").toUpperCase() === "VENDOR" ? "Creditor" : "Debtor",
          gstin: r.gstin || "",
          phone: r.phone || "",
          email: r.email || "",
          sales: r.total_sales ?? r.total_sales_amount ?? 0,
          purchases: r.total_purchases ?? r.total_purchase_amount ?? 0,
          salesBalance: r.sales_balance ?? 0,
          purchasesBalance: r.purchases_balance ?? 0,
          netBalance: r.net_balance ?? ((r.sales_balance ?? 0) - (r.purchases_balance ?? 0)),
        })));
      } catch {
        setRawData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [period, type]);

  const processed = useMemo(() => {
    let filtered = rawData.filter((d) => {
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
      if (type === "customer") return matchesSearch && d.type === "Debtor";
      if (type === "vendor") return matchesSearch && d.type === "Creditor";
      return matchesSearch;
    });

    let calculated = filtered.map((d) => ({
      ...d,
      closingAmt: d.netBalance,
    }));

    if (sortConfig.key) {
      calculated.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return calculated;
  }, [rawData, search, type, sortConfig]);

  const summaryStats = useMemo(() => {
    const totalSales = processed.reduce((sum, row) => sum + row.sales, 0);
    const totalPurchases = processed.reduce((sum, row) => sum + row.purchases, 0);
    const netBalance = processed.reduce((sum, row) => sum + row.netBalance, 0);
    const customerCount = processed.filter(d => d.type === "Debtor").length;
    const vendorCount = processed.filter(d => d.type === "Creditor").length;
    return { totalSales, totalPurchases, netBalance, customerCount, vendorCount };
  }, [processed]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "\u2195\uFE0F";
    return sortConfig.direction === "asc" ? "\u2191" : "\u2193";
  };

  const getPartyTypeBadge = (type) => {
    return type === "Creditor"
      ? <span className="badge vendor">Vendor</span>
      : <span className="badge customer">Customer</span>;
  };

  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>
      <div className="cv-container">
        <div className="cv-header">
          <div className="header-left">
            <h1 className="cv-title"><span className="title-icon">{"\uD83D\uDC65"}</span> Customer / Vendor Summary</h1>
            <p className="cv-subtitle">Track party-wise transactions and balances</p>
          </div>
        </div>

        <div className="stats-grid-compact">
          <div className="stat-card-compact">
            <div className="stat-icon-compact purple">{"\uD83D\uDCE6"}</div>
            <div className="stat-info-compact">
              <span className="stat-label">Customers</span>
              <strong>{summaryStats.customerCount}</strong>
            </div>
          </div>
          <div className="stat-card-compact">
            <div className="stat-icon-compact green">{"\uD83D\uDCB0"}</div>
            <div className="stat-info-compact">
              <span className="stat-label">Total Sales</span>
              <strong>{"\u20B9"} {summaryStats.totalSales.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</strong>
            </div>
          </div>
          <div className="stat-card-compact">
            <div className="stat-icon-compact blue">{"\uD83D\uDCE4"}</div>
            <div className="stat-info-compact">
              <span className="stat-label">Total Purchases</span>
              <strong>{"\u20B9"} {summaryStats.totalPurchases.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</strong>
            </div>
          </div>
          <div className="stat-card-compact">
            <div className="stat-icon-compact orange">{"\uD83D\uDCE5"}</div>
            <div className="stat-info-compact">
              <span className="stat-label">Net Balance</span>
              <strong>{"\u20B9"} {summaryStats.netBalance.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</strong>
            </div>
          </div>
        </div>

        <div className="filters-row-compact">
          <div className="filter-group-compact">
            <label>Period</label>
            <select className="compact-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="filter-group-compact">
            <label>View Type</label>
            <select className="compact-select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">All Parties</option>
              <option value="customer">Customers Only</option>
              <option value="vendor">Vendors Only</option>
            </select>
          </div>
          <div className="search-group-compact">
            <label>Search</label>
            <div className="search-wrapper-compact">
              <input className="compact-search" placeholder="Search party name..." value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && <button className="clear-btn" onClick={() => setSearch("")}>x</button>}
            </div>
          </div>
        </div>

        <div className="table-card-compact">
          <div className="table-header-compact">
            <div className="table-title-compact">
              <span>{"\uD83D\uDCCB"}</span>
              <h3>Transaction Details</h3>
              <span className="record-badge">{loading ? "Loading..." : `${processed.length} records`}</span>
            </div>
          </div>

          <div className="table-container-compact">
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center" }}>Loading data...</div>
            ) : type !== "gst" ? (
              <table className="compact-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("name")} className="sortable">Party Name {getSortIcon("name")}</th>
                    <th onClick={() => handleSort("type")} className="sortable">Type {getSortIcon("type")}</th>
                    <th>GSTIN</th>
                    <th onClick={() => handleSort("sales")} className="sortable numeric">Total Sales {getSortIcon("sales")}</th>
                    <th onClick={() => handleSort("purchases")} className="sortable numeric">Total Purchases {getSortIcon("purchases")}</th>
                    <th onClick={() => handleSort("salesBalance")} className="sortable numeric">Sales Balance {getSortIcon("salesBalance")}</th>
                    <th onClick={() => handleSort("purchasesBalance")} className="sortable numeric">Purchase Balance {getSortIcon("purchasesBalance")}</th>
                    <th onClick={() => handleSort("netBalance")} className="sortable numeric">Net Balance {getSortIcon("netBalance")}</th>
                  </tr>
                </thead>
                <tbody>
                  {processed.length === 0 ? (
                    <tr><td colSpan="8" className="empty-state-compact"><span>{"\uD83D\uDCED"}</span><p>No records found</p></td></tr>
                  ) : (
                    processed.map((row, i) => (
                      <tr key={i} className="data-row">
                        <td className="party-name">{row.name}</td>
                        <td>{getPartyTypeBadge(row.type)}</td>
                        <td>{row.gstin || "-"}</td>
                        <td className="numeric">{"\u20B9"} {row.sales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td className="numeric inward">{"\u20B9"} {row.purchases.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td className="numeric outward">{"\u20B9"} {row.salesBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td className="numeric">{"\u20B9"} {row.purchasesBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td className="numeric closing-amt">{"\u20B9"} {row.netBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="compact-table gst-table">
                <thead>
                  <tr>
                    <th rowSpan="2">Party Name</th>
                    <th rowSpan="2">GST Rate</th>
                    <th colSpan="3">Opening</th>
                    <th colSpan="3">Inward</th>
                    <th colSpan="3">Outward</th>
                    <th colSpan="3">Closing</th>
                  </tr>
                  <tr>
                    <th>Qty</th><th>Rate</th><th>Amt</th>
                    <th>Qty</th><th>Rate</th><th>Amt</th>
                    <th>Qty</th><th>Rate</th><th>Amt</th>
                    <th>Qty</th><th>Rate</th><th>Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {processed.length === 0 ? (
                    <tr><td colSpan="13" className="empty-state-compact"><span>{"\uD83D\uDCED"}</span><p>No records found</p></td></tr>
                  ) : (
                    processed.map((row, i) => (
                      <tr key={i} className="data-row">
                        <td className="party-name">{row.name}</td>
                        <td><span className="gst-pill">{row.gst}</span></td>
                        <td className="numeric">{row.opening}</td>
                        <td className="numeric">{"\u20B9"}{row.rate}</td>
                        <td className="numeric">{"\u20B9"}{row.openingAmt}</td>
                        <td className="numeric">{row.inward}</td>
                        <td className="numeric">{"\u20B9"}{row.rate}</td>
                        <td className="numeric">{"\u20B9"}{row.inwardAmt}</td>
                        <td className="numeric">{row.outward}</td>
                        <td className="numeric">{"\u20B9"}{row.rate}</td>
                        <td className="numeric">{"\u20B9"}{row.outwardAmt}</td>
                        <td className="numeric closing-qty">{row.closingQty}</td>
                        <td className="numeric">{"\u20B9"}{row.rate}</td>
                        <td className="numeric closing-amt">{"\u20B9"}{row.closingAmt}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerVendorSummary;
