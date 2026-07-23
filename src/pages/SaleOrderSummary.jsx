import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import * as services from "../api/services";
import {
  Search,
  Download,
  Eye,
  FileText,
  Calendar,
  Truck,
  Package,
  ArrowUpDown,
  CheckCircle,
  Clock,
  MoreVertical,
  Plus,
  X,
  Settings
} from "lucide-react";
import "../styles/salesOrder.css";

export default function SalesOrderSummary() {
  const { collapsed } = useOutletContext();
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    supplyType: "all",
    config: "Customer"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "refNo", direction: "asc" });
  const [selectedRows, setSelectedRows] = useState([]);
  const [showConfigDropdown, setShowConfigDropdown] = useState(false);
  const configRef = useRef(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [columnConfig, setColumnConfig] = useState({
    showCustomerDetails: true,
    showItemDetails: false,
    showTransportDetails: false,
    showBilledToShippedTo: false,
    showNarration: false,
    showGSTDetails: false,
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await services.getSaleOrders({
          from_date: filters.fromDate,
          to_date: filters.toDate,
        });
        const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        setData(rows.map(r => ({
          refNo: r.voucher_no || r.order_no || r.doc_no || "",
          date: r.date || r.order_date || "",
          displayDate: r.date || r.order_date || "",
          customer: r.party_name || r.customer_name || r.billed_to?.name || "",
          customerGSTIN: r.gstin || r.party_gstin || "",
          taxable: r.taxable_value ?? r.taxable ?? 0,
          gst: r.total_gst ?? r.gst ?? 0,
          total: r.total_amount ?? r.total ?? 0,
          status: r.status || "Pending",
          type: r.supply_type || r.voucher_type || "Regular",
          items: r.item_count ?? 0,
          itemsList: r.items_summary || "",
          transportDetails: r.transport_details || "",
          billingAddress: r.billing_address || r.billed_to?.address || "",
          shippingAddress: r.shipping_address || "",
          narration: r.narration || "",
          gstRate: r.gst_rate || "18%",
          cgst: r.cgst ?? 0,
          sgst: r.sgst ?? 0,
          igst: r.igst ?? 0,
          customerDetails: `${r.party_name || r.customer_name || ""} | GST: ${r.gstin || r.party_gstin || ""}`,
        })));
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters.fromDate, filters.toDate]);

  const getStatusConfig = (status) => {
    switch(status) {
      case "Pending": return { icon: Clock, class: "so-status-pending", text: "Pending" };
      case "Complete": return { icon: CheckCircle, class: "so-status-complete", text: "Completed" };
      case "Processing": return { icon: Package, class: "so-status-processing", text: "Processing" };
      default: return { icon: Clock, class: "so-status-pending", text: status };
    }
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc"
    });
  };

  const handleSelectRow = (refNo) => {
    setSelectedRows(prev =>
      prev.includes(refNo) ? prev.filter(r => r !== refNo) : [...prev, refNo]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === filteredData.length) setSelectedRows([]);
    else setSelectedRows(filteredData.map(row => row.refNo));
  };

  const handleDateChange = (type, value) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  const clearDateFilter = () => {
    setFilters(prev => ({ ...prev, fromDate: "", toDate: "" }));
  };

  const handleColumnToggle = (column) => {
    setColumnConfig(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const resetColumnConfig = () => {
    setColumnConfig({ showCustomerDetails: true, showItemDetails: false, showTransportDetails: false, showBilledToShippedTo: false, showNarration: false, showGSTDetails: false });
  };

  const showAllColumns = () => {
    setColumnConfig({ showCustomerDetails: true, showItemDetails: true, showTransportDetails: true, showBilledToShippedTo: true, showNarration: true, showGSTDetails: true });
  };

  const hideAllColumns = () => {
    setColumnConfig({ showCustomerDetails: false, showItemDetails: false, showTransportDetails: false, showBilledToShippedTo: false, showNarration: false, showGSTDetails: false });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (configRef.current && !configRef.current.contains(event.target)) setShowConfigDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getFilteredData = () => {
    let filtered = [...data];
    if (filters.fromDate && filters.toDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        const fromDate = new Date(filters.fromDate);
        const toDate = new Date(filters.toDate);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        return itemDate >= fromDate && itemDate <= toDate;
      });
    } else if (filters.fromDate) {
      filtered = filtered.filter(item => new Date(item.date) >= new Date(filters.fromDate));
    } else if (filters.toDate) {
      filtered = filtered.filter(item => new Date(item.date) <= new Date(filters.toDate));
    }
    if (filters.supplyType !== "all") {
      filtered = filtered.filter(item => item.type === filters.supplyType);
    }
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.refNo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  const filteredData = getFilteredData();

  const sortedData = [...filteredData].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    if (sortConfig.key === "date") { aValue = new Date(aValue); bValue = new Date(bValue); }
    if (sortConfig.direction === "asc") return aValue > bValue ? 1 : -1;
    return aValue < bValue ? 1 : -1;
  });

  const clearAllFilters = () => {
    setFilters({ fromDate: "", toDate: "", supplyType: "all", config: "Customer" });
    setSearchTerm("");
    setSelectedRows([]);
  };

  const hasActiveFilters = filters.fromDate || filters.toDate || filters.supplyType !== "all" || searchTerm;

  const permanentColumns = [
    { key: "refNo", label: "Ref no", field: "refNo", sortable: true },
    { key: "refDate", label: "Ref date", field: "displayDate", sortable: true },
    { key: "customerName", label: "Customer name", field: "customer", sortable: true },
    { key: "totalTaxable", label: "Total Taxable", field: "taxable", sortable: false },
    { key: "totalGst", label: "Total Gst", field: "gst", sortable: false },
    { key: "totalValue", label: "Total Value", field: "total", sortable: false },
  ];

  const selectableColumns = [
    { key: "showCustomerDetails", label: "Customer", field: "customerDetails", sortable: false },
    { key: "showItemDetails", label: "Item Details", field: "itemsList", sortable: false },
    { key: "showTransportDetails", label: "Transport Details", field: "transportDetails", sortable: false },
    { key: "showBilledToShippedTo", label: "Billed to shipped to", field: "billingAddress", sortable: false,
      render: (row) => (<div><div><strong>Billed To:</strong> {row.billingAddress}</div><div><strong>Shipped To:</strong> {row.shippingAddress}</div></div>)
    },
    { key: "showNarration", label: "Show Narration", field: "narration", sortable: false },
    { key: "showGSTDetails", label: "GST Details (IGST/CGST,SGST/UTGST) & GST Rate", field: "gstDetails", sortable: false,
      render: (row) => (
        <div>
          <div><strong>GST Rate:</strong> {row.gstRate}</div>
          {row.igst > 0 && <div><strong>IGST:</strong> {"\u20B9"}{row.igst.toLocaleString()}</div>}
          {row.cgst > 0 && <div><strong>CGST:</strong> {"\u20B9"}{row.cgst.toLocaleString()}</div>}
          {row.sgst > 0 && <div><strong>SGST/UTGST:</strong> {"\u20B9"}{row.sgst.toLocaleString()}</div>}
        </div>
      )
    },
  ];

  const visibleSelectableColumns = selectableColumns.filter(col => columnConfig[col.key]);
  const allVisibleColumns = [...permanentColumns, ...visibleSelectableColumns];

  return (
    <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
      <div className="so-sales-container">
        <div className="so-sales-header">
          <div className="so-sales-title-section">
            <div className="so-sales-icon-wrapper"><FileText size={28} /></div>
            <div>
              <h1>Sales Orders</h1>
              <p>Manage and track all your sales orders</p>
            </div>
          </div>
        </div>

        <div className="so-sales-filters">
          <div className="so-sales-filters-grid">
            <div className="so-sales-filter-group">
              <label><Calendar size={16} /> Date Range</label>
              <div className="so-sales-date-range">
                <input type="date" className="so-sales-date-input" value={filters.fromDate} onChange={(e) => handleDateChange("fromDate", e.target.value)} />
                <span className="so-sales-date-separator">to</span>
                <input type="date" className="so-sales-date-input" value={filters.toDate} onChange={(e) => handleDateChange("toDate", e.target.value)} />
                {(filters.fromDate || filters.toDate) && (
                  <button className="so-sales-clear-date" onClick={clearDateFilter} title="Clear dates"><X size={14} /></button>
                )}
              </div>
            </div>

            <div className="so-sales-filter-group">
              <label><Truck size={16} /> Supply Type</label>
              <select value={filters.supplyType} onChange={(e) => setFilters(prev => ({ ...prev, supplyType: e.target.value }))}>
                <option value="all">All Types</option>
                <option value="Regular">Regular</option>
                <option value="Export with Payment">Export with Payment</option>
                <option value="Export without Payment">Export without Payment</option>
                <option value="SEZ Supply">SEZ Supply</option>
              </select>
            </div>

            <div className="so-sales-filter-group">
              <label><Settings size={16} /> Configuration</label>
              <div className="so-sales-config-wrapper" ref={configRef}>
                <button className="so-sales-config-trigger" onClick={() => setShowConfigDropdown(!showConfigDropdown)}>
                  Select Columns
                  <span className="so-sales-config-count">{Object.values(columnConfig).filter(v => v === true).length}</span>
                </button>
                {showConfigDropdown && (
                  <div className="so-sales-config-dropdown">
                    <div className="so-sales-config-header">
                      <span>Choose Optional Columns to Display</span>
                      <div className="so-sales-config-actions">
                        <button onClick={showAllColumns} className="so-sales-config-action-btn">Show All</button>
                        <button onClick={hideAllColumns} className="so-sales-config-action-btn">Hide All</button>
                        <button onClick={resetColumnConfig} className="so-sales-config-action-btn">Reset</button>
                      </div>
                    </div>
                    <div className="so-sales-config-items">
                      {selectableColumns.map((col) => (
                        <label key={col.key} className="so-sales-config-item">
                          <input type="checkbox" checked={columnConfig[col.key]} onChange={() => handleColumnToggle(col.key)} />
                          <span>{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="so-sales-filter-actions">
              <button className="so-sales-btn-outline"><Download size={16} /> Export</button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="so-sales-active-filters">
              <span className="so-sales-active-filters-label">Active Filters:</span>
              {filters.fromDate && <span className="so-sales-filter-tag">From: {new Date(filters.fromDate).toLocaleDateString()}<button onClick={() => handleDateChange("fromDate", "")}>x</button></span>}
              {filters.toDate && <span className="so-sales-filter-tag">To: {new Date(filters.toDate).toLocaleDateString()}<button onClick={() => handleDateChange("toDate", "")}>x</button></span>}
              {filters.supplyType !== "all" && <span className="so-sales-filter-tag">Type: {filters.supplyType}<button onClick={() => setFilters(prev => ({ ...prev, supplyType: "all" }))}>x</button></span>}
              {searchTerm && <span className="so-sales-filter-tag">Search: {searchTerm}<button onClick={() => setSearchTerm("")}>x</button></span>}
              <button className="so-sales-clear-all" onClick={clearAllFilters}>Clear All</button>
            </div>
          )}
        </div>

        <div className="so-sales-stats-grid">
          <div className="so-sales-stat-card">
            <div className="so-sales-stat-icon so-sales-stat-icon-blue"><Package size={20} /></div>
            <div><h3>Total Orders</h3><p>{filteredData.length}</p></div>
          </div>
          <div className="so-sales-stat-card">
            <div className="so-sales-stat-icon so-sales-stat-icon-green"><CheckCircle size={20} /></div>
            <div><h3>Completed</h3><p>{filteredData.filter(d => d.status === "Complete").length}</p></div>
          </div>
          <div className="so-sales-stat-card">
            <div className="so-sales-stat-icon so-sales-stat-icon-orange"><Clock size={20} /></div>
            <div><h3>Pending</h3><p>{filteredData.filter(d => d.status === "Pending").length}</p></div>
          </div>
          <div className="so-sales-stat-card">
            <div className="so-sales-stat-icon so-sales-stat-icon-purple"><FileText size={20} /></div>
            <div><h3>Total Value</h3><p>{"\u20B9"} {filteredData.reduce((sum, d) => sum + d.total, 0).toLocaleString()}</p></div>
          </div>
        </div>

        <div className="so-sales-table-toolbar">
          <div className="so-sales-search-wrapper">
            <Search size={18} />
            <input type="text" placeholder="Search by order ID or customer name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="so-sales-table-search" />
            {searchTerm && <button className="so-sales-clear-search-btn" onClick={() => setSearchTerm("")}><X size={14} /></button>}
          </div>
          <div className="so-sales-table-info"><span>{filteredData.length} orders found</span></div>
        </div>

        {loading ? (
          <div className="so-sales-empty-state"><Package size={48} /><p>Loading data...</p></div>
        ) : (
          <>
            <div className="so-sales-table-wrapper">
              <table className="so-sales-table">
                <thead>
                  <tr>
                    <th className="so-sales-checkbox-col"><input type="checkbox" checked={selectedRows.length === filteredData.length && filteredData.length > 0} onChange={handleSelectAll} /></th>
                    {allVisibleColumns.map((col) => (
                      <th key={col.key} onClick={() => col.sortable && handleSort(col.field)} className={col.sortable ? "so-sales-sortable" : ""}>
                        {col.label} {col.sortable && <ArrowUpDown size={14} />}
                      </th>
                    ))}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((row) => {
                    const StatusIcon = getStatusConfig(row.status).icon;
                    return (
                      <tr key={row.refNo} className={selectedRows.includes(row.refNo) ? "so-sales-selected" : ""}>
                        <td className="so-sales-checkbox-col"><input type="checkbox" checked={selectedRows.includes(row.refNo)} onChange={() => handleSelectRow(row.refNo)} /></td>
                        {allVisibleColumns.map((col) => {
                          if (col.render) return <td key={col.key}>{col.render(row)}</td>;
                          let displayValue = row[col.field];
                          if (col.field === "taxable" || col.field === "gst" || col.field === "total") displayValue = `{"\u20B9"} ${displayValue?.toLocaleString()}`;
                          if (col.field === "status") return <td key={col.key}><span className={`so-sales-status-badge ${getStatusConfig(row.status).class}`}><StatusIcon size={12} />{getStatusConfig(row.status).text}</span></td>;
                          return <td key={col.key} className={col.field === "refNo" ? "so-sales-ref-no" : ""}>{displayValue || "-"}</td>;
                        })}
                        <td>
                          <div className="so-sales-action-buttons">
                            <button className="so-sales-icon-btn" title="View Details"><Eye size={16} /></button>
                            {row.status === "Pending" && <button className="so-sales-invoice-btn"><FileText size={14} /> Create Invoice</button>}
                            <button className="so-sales-icon-btn" title="More Options"><MoreVertical size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {sortedData.length === 0 && (
                <div className="so-sales-empty-state">
                  <Package size={48} />
                  <p>No orders found</p>
                  <button className="so-sales-btn-outline" onClick={clearAllFilters}>Clear All Filters</button>
                </div>
              )}
            </div>
            {sortedData.length > 0 && (
              <div className="so-sales-pagination">
                <div className="so-sales-pagination-info">Showing {sortedData.length} of {filteredData.length} orders</div>
                <div className="so-sales-pagination-controls">
                  <button disabled>Previous</button>
                  <button className="so-sales-active">1</button>
                  <button>2</button>
                  <button>3</button>
                  <button>Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
