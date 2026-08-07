import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import * as services from "../api/services";
import { 
  Search, 
  Filter, 
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
  Edit,
  Printer,
  X,
  Settings
} from "lucide-react";
import "../styles/deliveryChallanSummary.css";

export default function DeliveryChallanSummary() {
  const { collapsed } = useOutletContext();
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    challanType: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "docNo", direction: "asc" });
  const [selectedRows, setSelectedRows] = useState([]);
  const [showConfigDropdown, setShowConfigDropdown] = useState(false);
  const configRef = useRef(null);

  // Column visibility configuration for selectable columns
  const [columnConfig, setColumnConfig] = useState({
    showItemDetails: false,
    showBilledShipped: false,
    showTransportDetails: false,
    showGSTRate: false,
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (d) => {
    if (!d) return "-";
    const parts = String(d).split("T")[0].split("-");
    if (parts.length !== 3) return d;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await services.getDeliveryChallanSummaryRpt({});
        const payload = res.data || {};
        const rows = Array.isArray(payload) ? payload : payload.challans ?? payload.results ?? [];
        setData(rows.map(r => ({
          ...r,
          docNo: r.challan_number || r.docNo || "",
          docDate: r.date || r.docDate || "",
          displayDate: r.date ? formatDate(r.date) : "-",
          customer: r.party_name || r.customer || "-",
          customerGSTIN: r.customer_gstin || "",
          billingAddress: r.billing_address || "",
          shippingAddress: r.shipping_address || "",
          voucherType: r.challan_type || "Sales",
          voucherNo: r.challan_number || "",
          taxable: r.taxable_value ?? 0,
          gst: r.total_gst ?? 0,
          total: r.total_amount ?? r.total ?? 0,
          status: r.status || "Pending",
          items: r.item_count ?? 0,
          itemsList: r.itemsList || "",
          transportDetails: r.transport_details || "",
          gstRate: r.gst_rate != null ? `${r.gst_rate}%` : "0%",
          cgst: r.total_cgst ?? 0,
          sgst: r.total_sgst ?? 0,
          igst: r.total_igst ?? 0,
          transporter: r.transporter_name || "",
          vehicleNo: r.vehicle_no || "",
          lrNo: r.lr_rr_no || "",
        })));
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getStatusConfig = (status) => {
    switch(status) {
      case "Pending":
        return { icon: Clock, class: "status-pending", text: "Pending" };
      case "Complete":
        return { icon: CheckCircle, class: "status-complete", text: "Completed" };
      case "Processing":
        return { icon: Package, class: "status-processing", text: "Processing" };
      default:
        return { icon: Clock, class: "status-pending", text: status };
    }
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc"
    });
  };

  const handleSelectRow = (docNo) => {
    setSelectedRows(prev => 
      prev.includes(docNo) ? prev.filter(r => r !== docNo) : [...prev, docNo]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === filteredData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredData.map(row => row.docNo));
    }
  };

  const handleDateChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const clearDateFilter = () => {
    setFilters(prev => ({
      ...prev,
      fromDate: "",
      toDate: ""
    }));
  };

  const handleColumnToggle = (column) => {
    setColumnConfig(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const resetColumnConfig = () => {
    setColumnConfig({
      showItemDetails: false,
      showBilledShipped: false,
      showTransportDetails: false,
      showGSTRate: false,
    });
  };

  const showAllColumns = () => {
    setColumnConfig({
      showItemDetails: true,
      showBilledShipped: true,
      showTransportDetails: true,
      showGSTRate: true,
    });
  };

  const hideAllColumns = () => {
    setColumnConfig({
      showItemDetails: false,
      showBilledShipped: false,
      showTransportDetails: false,
      showGSTRate: false,
    });
  };

  // Click outside handler for config dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (configRef.current && !configRef.current.contains(event.target)) {
        setShowConfigDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Apply all filters
  const getFilteredData = () => {
    let filtered = [...data];
    
    // Date range filter
    if (filters.fromDate && filters.toDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.docDate);
        const fromDate = new Date(filters.fromDate);
        const toDate = new Date(filters.toDate);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        return itemDate >= fromDate && itemDate <= toDate;
      });
    } else if (filters.fromDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.docDate);
        const fromDate = new Date(filters.fromDate);
        fromDate.setHours(0, 0, 0, 0);
        return itemDate >= fromDate;
      });
    } else if (filters.toDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.docDate);
        const toDate = new Date(filters.toDate);
        toDate.setHours(23, 59, 59, 999);
        return itemDate <= toDate;
      });
    }
    
    // Challan type filter
    if (filters.challanType && filters.challanType !== "all") {
      filtered = filtered.filter(item => item.voucherType === filters.challanType);
    }
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.docNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.voucherNo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredData = getFilteredData();
  
  // Sort the filtered data
  const sortedData = [...filteredData].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    
    if (sortConfig.key === "displayDate" || sortConfig.key === "docDate") {
      aValue = new Date(a.docDate || a[sortConfig.key]);
      bValue = new Date(b.docDate || b[sortConfig.key]);
    }
    
    if (sortConfig.direction === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getChallanTypeIcon = (type) => {
    switch(type) {
      case "Job Work": return "🔧";
      case "Purchase Return": return "↩️";
      case "Free": return "🎁";
      case "Sales": return "📄";
      default: return "📄";
    }
  };

  const clearAllFilters = () => {
    setFilters({
      fromDate: "",
      toDate: "",
      challanType: "all",
    });
    setSearchTerm("");
    setSelectedRows([]);
  };

  const hasActiveFilters = filters.fromDate || filters.toDate || (filters.challanType !== "all") || searchTerm;

  // Define permanent columns (always visible)
  const permanentColumns = [
    { key: "docNo", label: "Doc No", field: "docNo", sortable: true },
    { key: "date", label: "Date", field: "displayDate", sortable: true },
    { key: "customer", label: "Customer", field: "customer", sortable: true },
    { key: "voucherType", label: "Voucher Type", field: "voucherType", sortable: false },
    { key: "voucherNo", label: "Voucher No", field: "voucherNo", sortable: false },
    { key: "taxable", label: "Taxable", field: "taxable", sortable: false },
    { key: "gst", label: "GST", field: "gst", sortable: false },
    { key: "total", label: "Total", field: "total", sortable: false },
    { key: "status", label: "Status", field: "status", sortable: false },
  ];

  // Define selectable columns (can be toggled)
  const selectableColumns = [
    { 
      key: "showItemDetails", 
      label: "Item Details", 
      field: "itemsList", 
      sortable: false,
      render: (row) => (
        <div>
          {row.itemsList ? <><strong>Items:</strong> {row.itemsList}</> : <><strong>Items:</strong> {row.items} units</>}
          <div><strong>Quantity:</strong> {row.items} units</div>
        </div>
      )
    },
    { 
      key: "showBilledShipped", 
      label: "Billed-Shipped", 
      field: "billingAddress", 
      sortable: false,
      render: (row) => (
        <div>
          <div><strong>Billed To:</strong></div>
          <div className="address-text">{row.billingAddress}</div>
          <div><strong>Shipped To:</strong></div>
          <div className="address-text">{row.shippingAddress}</div>
        </div>
      )
    },
    { 
      key: "showTransportDetails", 
      label: "Transport Details", 
      field: "transportDetails", 
      sortable: false,
      render: (row) => (
        <div>
          {row.transporter && <div><strong>Transporter:</strong> {row.transporter}</div>}
          {row.vehicleNo && <div><strong>Vehicle No:</strong> {row.vehicleNo}</div>}
          {row.lrNo && <div><strong>LR/Ref No:</strong> {row.lrNo}</div>}
          {!row.transporter && !row.vehicleNo && !row.lrNo && <div>No transport details</div>}
        </div>
      )
    },
    { 
      key: "showGSTRate", 
      label: "GST Rate", 
      field: "gstRate", 
      sortable: false,
      render: (row) => (
        <div>
          <div><strong>GST Rate:</strong> {row.gstRate}</div>
          {row.igst > 0 && <div><strong>IGST:</strong> ₹{row.igst.toLocaleString()}</div>}
          {row.cgst > 0 && <div><strong>CGST:</strong> ₹{row.cgst.toLocaleString()}</div>}
          {row.sgst > 0 && <div><strong>SGST/UTGST:</strong> ₹{row.sgst.toLocaleString()}</div>}
        </div>
      )
    },
  ];

  // Get visible selectable columns based on configuration
  const visibleSelectableColumns = selectableColumns.filter(col => columnConfig[col.key]);

  // Combine permanent and selectable columns for display
  const allVisibleColumns = [...permanentColumns, ...visibleSelectableColumns];

  return (
    <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
      <div className="dc-container-modern">

        {/* Premium Header */}
        <div className="dc-header-modern">
          <div className="dc-title-section">
            <div className="dc-icon-wrapper">
              <FileText size={28} />
            </div>
            <div>
              <h1>Delivery Challan</h1>
              <p>Manage and track all delivery challans</p>
            </div>
          </div>
        </div>

        {/* Enhanced Filters Section */}
        <div className="dc-filters-modern">
          <div className="filters-grid">
            <div className="filter-group">
              <label>
                <Calendar size={16} />
                Date Range
              </label>
              <div className="date-range">
                <input
                  type="date"
                  className="date-input"
                  value={filters.fromDate}
                  onChange={(e) => handleDateChange("fromDate", e.target.value)} 
                  placeholder="From Date"
                />
                <span className="date-separator">to</span>
                <input
                  type="date"
                  className="date-input"
                  value={filters.toDate}
                  onChange={(e) => handleDateChange("toDate", e.target.value)}
                  placeholder="To Date"
                />
                {(filters.fromDate || filters.toDate) && (
                  <button className="clear-date-btn" onClick={clearDateFilter} title="Clear dates">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="filter-group">
              <label>
                <Truck size={16} />
                Challan Type
              </label>
              <select 
                value={filters.challanType}
                onChange={(e) => setFilters(prev => ({ ...prev, challanType: e.target.value }))}
              >
                <option value="all">All Types</option>
                <option value="Sales">Sales</option>
                <option value="Job Work">Job Work</option>
                <option value="Purchase Return">Purchase Return</option>
                <option value="Free">Free</option>
              </select>
            </div>

            <div className="filter-group search-group">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search by challan, customer or voucher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="active-filters">
              <span className="active-filters-label">Active Filters:</span>
              {filters.fromDate && (
                <span className="filter-tag">
                  From: {new Date(filters.fromDate).toLocaleDateString()}
                  <button onClick={() => handleDateChange("fromDate", "")}>×</button>
                </span>
              )}
              {filters.toDate && (
                <span className="filter-tag">
                  To: {new Date(filters.toDate).toLocaleDateString()}
                  <button onClick={() => handleDateChange("toDate", "")}>×</button>
                </span>
              )}
              {filters.challanType !== "all" && (
                <span className="filter-tag">
                  Type: {filters.challanType}
                  <button onClick={() => setFilters(prev => ({ ...prev, challanType: "all" }))}>×</button>
                </span>
              )}
              {searchTerm && (
                <span className="filter-tag">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm("")}>×</button>
                </span>
              )}
              <button className="clear-all-btn" onClick={clearAllFilters}>
                Clear All
              </button>
            </div>
          )}

          <div className="filter-group config-group">
            <label>
              <Settings size={16} />
              Configuration
            </label>
            <div className="dc-config-wrapper" ref={configRef}>
              <button 
                className="dc-config-trigger"
                onClick={() => setShowConfigDropdown(!showConfigDropdown)}
              >
                Select Columns
                <span className="dc-config-count">
                  {Object.values(columnConfig).filter(v => v === true).length}
                </span>
              </button>

              {showConfigDropdown && (
                <div className="dc-config-dropdown">
                  <div className="dc-config-header">
                    <span>Choose Optional Columns to Display</span>
                    <div className="dc-config-actions">
                      <button onClick={showAllColumns} className="dc-config-action-btn">Show All</button>
                      <button onClick={hideAllColumns} className="dc-config-action-btn">Hide All</button>
                      <button onClick={resetColumnConfig} className="dc-config-action-btn">Reset</button>
                    </div>
                  </div>
                  
                  <div className="dc-config-search">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Search columns..."
                      onChange={(e) => {
                        const searchTerm = e.target.value.toLowerCase();
                        const items = document.querySelectorAll(".dc-config-item");
                        items.forEach((item) => {
                          const label = item.querySelector("span")?.innerText.toLowerCase();
                          if (label?.includes(searchTerm)) {
                            item.style.display = "flex";
                          } else {
                            item.style.display = "none";
                          }
                        });
                      }}
                    />
                  </div>

                  <div className="dc-config-items">
                    {selectableColumns.map((col) => (
                      <label key={col.key} className="dc-config-item">
                        <input
                          type="checkbox"
                          checked={columnConfig[col.key]}
                          onChange={() => handleColumnToggle(col.key)}
                        />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="filter-actions">
            <button className="btn-outline-modern">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <FileText size={20} />
            </div>
            <div>
              <h3>Total Challans</h3>
              <p>{filteredData.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <CheckCircle size={20} />
            </div>
            <div>
              <h3>Completed</h3>
              <p>{filteredData.filter(d => d.status === "Complete").length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">
              <Clock size={20} />
            </div>
            <div>
              <h3>Pending</h3>
              <p>{filteredData.filter(d => d.status === "Pending").length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">
              <Package size={20} />
            </div>
            <div>
              <h3>Total Items</h3>
              <p>{filteredData.reduce((sum, d) => sum + d.items, 0)}</p>
            </div>
          </div>
        </div>

        {/* Search Bar - Top of Table */}
        <div className="dc-table-toolbar">
          <div className="dc-search-wrapper">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by challan, customer or voucher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dc-table-search"
            />
            {searchTerm && (
              <button className="dc-clear-search-btn" onClick={() => setSearchTerm("")}>
                <X size={14} />
              </button>
            )}
          </div>
          <div className="dc-table-info">
            <span>{filteredData.length} challans found</span>
          </div>
        </div>

        {/* Premium Table with Dynamic Columns */}
        <div className="dc-table-wrapper-modern">
          <table className="dc-table-modern">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input 
                    type="checkbox" 
                    checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                {allVisibleColumns.map((col) => (
                  <th 
                    key={col.key} 
                    onClick={() => col.sortable && handleSort(col.field)}
                    className={col.sortable ? "dc-sortable" : ""}
                  >
                    {col.label}
                    {col.sortable && <ArrowUpDown size={14} />}
                  </th>
                ))}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row) => {
                const StatusIcon = getStatusConfig(row.status).icon;
                return (
                  <tr key={row.docNo} className={selectedRows.includes(row.docNo) ? "selected" : ""}>
                    <td className="checkbox-col">
                      <input 
                        type="checkbox" 
                        checked={selectedRows.includes(row.docNo)}
                        onChange={() => handleSelectRow(row.docNo)}
                      />
                    </td>
                    {allVisibleColumns.map((col) => {
                      // Check if column has custom render function
                      if (col.render) {
                        return (
                          <td key={col.key}>
                            {col.render(row)}
                          </td>
                        );
                      }
                      
                      let displayValue = row[col.field];
                      
                      // Special formatting for amount fields
                      if (col.field === "taxable" || col.field === "gst" || col.field === "total") {
                        displayValue = `₹ ${displayValue?.toLocaleString()}`;
                      }
                      
                      // Special formatting for voucher type with icon
                      if (col.field === "voucherType") {
                        return (
                          <td key={col.key}>
                            <span className="voucher-type-badge">
                              {getChallanTypeIcon(displayValue)} {displayValue}
                            </span>
                          </td>
                        );
                      }
                      
                      // Special formatting for status
                      if (col.field === "status") {
                        return (
                          <td key={col.key}>
                            <span className={`status-badge ${getStatusConfig(row.status).class}`}>
                              <StatusIcon size={12} />
                              {getStatusConfig(row.status).text}
                            </span>
                          </td>
                        );
                      }
                      
                      return (
                        <td key={col.key} className={col.field === "docNo" ? "doc-no" : ""}>
                          {displayValue || "-"}
                        </td>
                      );
                    })}
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn" title="View Details">
                          <Eye size={16} />
                        </button>
                        {row.status === "Pending" && (
                          <>
                            <button className="icon-btn" title="Edit">
                              <Edit size={16} />
                            </button>
                            <button className="invoice-btn-modern">
                              <Printer size={14} />
                              Print
                            </button>
                          </>
                        )}
                        <button className="icon-btn" title="More Options">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {sortedData.length === 0 && (
            <div className="empty-state">
              <Package size={48} />
              <p>No delivery challans found</p>
              <button className="btn-outline-modern" onClick={clearAllFilters}>
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {sortedData.length > 0 && (
          <div className="pagination-modern">
            <div className="pagination-info">
              Showing {sortedData.length} of {filteredData.length} challans
            </div>
            <div className="pagination-controls">
              <button disabled>Previous</button>
              <button className="active">1</button>
              <button>2</button>
              <button>3</button>
              <button>Next</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}