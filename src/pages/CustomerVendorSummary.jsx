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
        const res = await services.getCustomerVendorSummaryRpt({ period });
        const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        setRawData(rows.map(r => ({
          name: r.party_name || r.name || "",
          type: r.party_type || r.type || "Debtor",
          unit: r.unit || "",
          opening: r.opening_qty ?? r.opening ?? 0,
          inward: r.inward_qty ?? r.inward ?? 0,
          outward: r.outward_qty ?? r.outward ?? 0,
          rate: r.avg_rate ?? r.rate ?? 0,
          gst: r.gst_rate || r.gst || "",
        })));
      } catch {
        setRawData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [period]);

  const processed = useMemo(() => {
    let filtered = rawData.filter((d) => {
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
      if (type === "customer") return matchesSearch && d.type === "Debtor";
      if (type === "vendor") return matchesSearch && d.type === "Creditor";
      return matchesSearch;
    });

    let calculated = filtered.map((d) => {
      const closingQty = d.opening + d.inward - d.outward;
      const closingAmt = closingQty * d.rate;
      const openingAmt = d.opening * d.rate;
      const inwardAmt = d.inward * d.rate;
      const outwardAmt = d.outward * d.rate;
      return { ...d, closingQty, closingAmt, openingAmt, inwardAmt, outwardAmt };
    });

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
    const totalOpening = processed.reduce((sum, row) => sum + row.opening, 0);
    const totalInward = processed.reduce((sum, row) => sum + row.inward, 0);
    const totalOutward = processed.reduce((sum, row) => sum + row.outward, 0);
    const totalClosing = processed.reduce((sum, row) => sum + row.closingQty, 0);
    const totalValue = processed.reduce((sum, row) => sum + row.closingAmt, 0);
    return { totalOpening, totalInward, totalOutward, totalClosing, totalValue };
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
              <span className="stat-label">Total Closing</span>
              <strong>{summaryStats.totalClosing.toLocaleString()} Units</strong>
            </div>
          </div>
          <div className="stat-card-compact">
            <div className="stat-icon-compact green">{"\uD83D\uDCB0"}</div>
            <div className="stat-info-compact">
              <span className="stat-label">Total Value</span>
              <strong>{"\u20B9"} {summaryStats.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</strong>
            </div>
          </div>
          <div className="stat-card-compact">
            <div className="stat-icon-compact blue">{"\uD83D\uDCE4"}</div>
            <div className="stat-info-compact">
              <span className="stat-label">Total Inward</span>
              <strong>{summaryStats.totalInward.toLocaleString()}</strong>
            </div>
          </div>
          <div className="stat-card-compact">
            <div className="stat-icon-compact orange">{"\uD83D\uDCE5"}</div>
            <div className="stat-info-compact">
              <span className="stat-label">Total Outward</span>
              <strong>{summaryStats.totalOutward.toLocaleString()}</strong>
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
              <option value="gst">GST Rate Wise</option>
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
                    <th onClick={() => handleSort("unit")} className="sortable">Unit {getSortIcon("unit")}</th>
                    <th onClick={() => handleSort("opening")} className="sortable numeric">Opening {getSortIcon("opening")}</th>
                    <th onClick={() => handleSort("inward")} className="sortable numeric">Inward {getSortIcon("inward")}</th>
                    <th onClick={() => handleSort("outward")} className="sortable numeric">Outward {getSortIcon("outward")}</th>
                    <th onClick={() => handleSort("closingQty")} className="sortable numeric">Closing Qty {getSortIcon("closingQty")}</th>
                    <th onClick={() => handleSort("closingAmt")} className="sortable numeric">Closing Amt {getSortIcon("closingAmt")}</th>
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
                        <td><span className="unit-pill">{row.unit}</span></td>
                        <td className="numeric">{row.opening.toLocaleString()}</td>
                        <td className="numeric inward">{row.inward.toLocaleString()}</td>
                        <td className="numeric outward">{row.outward.toLocaleString()}</td>
                        <td className="numeric closing-qty">{row.closingQty.toLocaleString()}</td>
                        <td className="numeric closing-amt">{"\u20B9"} {row.closingAmt.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</td>
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
