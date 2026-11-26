import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import * as services from "../api/services";
import "../styles/purchaseReturn.css";

const today = new Date();
const fyStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
const toDateInput = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const defaultFromDate = `${fyStartYear}-04-01`;
const defaultToDate = toDateInput(today);

export default function SalesReturnSummary() {
  const { collapsed } = useOutletContext();

  // State Management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [groupedData, setGroupedData] = useState([]);
  const [showConfigDropdown, setShowConfigDropdown] = useState(false);
  const configRef = useRef(null);
  const [filters, setFilters] = useState({
    groupBy: "Document",
    fromDate: defaultFromDate,
    toDate: defaultToDate,
  });

  // Column configuration state - Only for optional columns
  const [config, setConfig] = useState({
    typeOfSupply: false,
    showItems: false,
    showNarration: false,
    showGSTRate: true,
    showVoucherType: true,
    showVoucherNo: true,
    showGSTIN: false,
    showTaxes: true,
    showTDS: false,
    showOriginal: false,
    showCustomerAddress: false,
    showFromDate: true,
    showToDate: true,
  });


  // Group data by Document (Original view)
  const groupByDocument = (data) => {
    return data.map(item => ({
      type: "Document",
      docNo: item.docNo,
      docDate: item.docDate,
      customerName: item.customerName,
      taxableValue: item.taxableValue,
      totalGST: item.totalGST,
      totalAmount: item.totalAmount,
      createdBy: item.createdBy,
      createdDate: item.createdDate,
      gstRate: item.gstRate,
      taxes: item.taxes,
      tds: item.tds,
      gstin: item.gstin,
      originalDocNo: item.originalDocNo,
      customerAddress: item.customerAddress,
      items: item.items,
      narration: item.narration,
      typeOfSupply: item.typeOfSupply,
      fromDate: item.fromDate,
      toDate: item.toDate,
      hsnCode: item.hsnCode,
      quantity: item.quantity,
    }));
  };

  // Group data by HSN
  const groupByHSN = (data) => {
    const hsnMap = new Map();
    
    data.forEach(doc => {
      const lines = (doc.itemLines && doc.itemLines.length > 0) ? doc.itemLines : [];
      if (lines.length === 0) {
        const hsnKey = doc.hsnCode || "UNKNOWN";
        if (!hsnMap.has(hsnKey)) {
          hsnMap.set(hsnKey, {
            hsnCode: hsnKey,
            hsnDescription: doc.hsnDescription || "",
            totalQuantity: 0,
            taxableValue: 0,
            totalGST: 0,
            totalAmount: 0,
            gstRate: doc.gstRate || "18%",
            documents: [],
          });
        }
        const hsnGroup = hsnMap.get(hsnKey);
        hsnGroup.totalQuantity += doc.quantity || 0;
        hsnGroup.taxableValue += doc.taxableValue || 0;
        hsnGroup.totalGST += doc.totalGST || 0;
        hsnGroup.totalAmount += doc.totalAmount || 0;
        hsnGroup.documents.push(doc.docNo);
        return;
      }
      lines.forEach(it => {
        const hsnKey = it.hsn_code || it.hsn || "UNKNOWN";
        if (!hsnMap.has(hsnKey)) {
          hsnMap.set(hsnKey, {
            hsnCode: hsnKey,
            hsnDescription: it.hsn_description || it.hsn_desc || "",
            totalQuantity: 0,
            taxableValue: 0,
            totalGST: 0,
            totalAmount: 0,
            gstRate: it.gst_rate ? `${it.gst_rate}%` : doc.gstRate || "18%",
            documents: [],
          });
        }
        const hsnGroup = hsnMap.get(hsnKey);
        hsnGroup.totalQuantity += Number(it.quantity || 0);
        hsnGroup.taxableValue += Number(it.taxable_value || 0);
        hsnGroup.totalGST += Number(it.total_gst || 0);
        hsnGroup.totalAmount += Number(it.amount || 0);
        hsnGroup.documents.push(doc.docNo);
      });
    });
    
    return Array.from(hsnMap.values());
  };

  // Group data by Customer
  const groupByCustomer = (data) => {
    const customerMap = new Map();
    
    data.forEach(item => {
      const customerKey = item.customerCode || item.customerName || "Unknown";
      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          customerCode: item.customerCode || "",
          customerName: item.customerName,
          customerAddress: item.customerAddress,
          gstin: item.gstin,
          totalReturns: 0,
          taxableValue: 0,
          totalGST: 0,
          totalAmount: 0,
          documents: [],
          returnDetails: [],
        });
      }
      
      const customerGroup = customerMap.get(customerKey);
      customerGroup.totalReturns += 1;
      customerGroup.taxableValue += item.taxableValue;
      customerGroup.totalGST += item.totalGST;
      customerGroup.totalAmount += item.totalAmount;
      customerGroup.documents.push(item.docNo);
      customerGroup.returnDetails.push({
        docNo: item.docNo,
        docDate: item.docDate,
        amount: item.totalAmount,
      });
    });
    
    return Array.from(customerMap.values());
  };

  // Get grouped data based on selected groupBy option
  const getGroupedData = () => {
    switch(filters.groupBy) {
      case "HSN":
        return groupByHSN(salesData);
      case "Customer":
        return groupByCustomer(salesData);
      default:
        return groupByDocument(salesData);
    }
  };

  // Get column definitions based on groupBy
  const getColumnDefinitions = () => {
    switch(filters.groupBy) {
      case "HSN":
        return {
          fixedColumns: [
            { key: "hsnCode", label: "HSN Code", field: "hsnCode" },
            { key: "hsnDescription", label: "HSN Description", field: "hsnDescription" },
            { key: "totalQuantity", label: "Total Quantity", field: "totalQuantity" },
            { key: "taxableValue", label: "Taxable Value", field: "taxableValue" },
            { key: "totalGST", label: "Total GST", field: "totalGST" },
            { key: "totalAmount", label: "Total Amount", field: "totalAmount" },
            { key: "documents", label: "Reference Documents", field: "documents" },
          ],
          optionalColumns: [
            { key: "showGSTRate", label: "Show GST Rate", field: "gstRate" },
          ]
        };
        
      case "Customer":
        return {
          fixedColumns: [
            { key: "customerCode", label: "Customer Code", field: "customerCode" },
            { key: "customerName", label: "Vendor Name", field: "customerName" },
            { key: "customerAddress", label: "Customer Address", field: "customerAddress" },
            { key: "gstin", label: "GSTIN", field: "gstin" },
            { key: "totalReturns", label: "Total Returns", field: "totalReturns" },
            { key: "taxableValue", label: "Total Taxable Value", field: "taxableValue" },
            { key: "totalGST", label: "Total GST", field: "totalGST" },
            { key: "totalAmount", label: "Total Amount", field: "totalAmount" },
          ],
          optionalColumns: [
            { key: "showDocuments", label: "Show Document References", field: "documents" },
          ]
        };
        
      default: // Document view
        return {
          fixedColumns: [
            { key: "voucherNo", label: "Doc No", field: "docNo" },
            { key: "docDate", label: "Doc Date", field: "docDate" },
            { key: "customerName", label: "Vendor Name", field: "customerName" },
            { key: "taxableValue", label: "Taxable Value", field: "taxableValue" },
            { key: "totalGST", label: "Total GST", field: "totalGST" },
            { key: "totalAmount", label: "Total Amount", field: "totalAmount" },
            { key: "createdBy", label: "Created By", field: "createdBy" },
            { key: "createdDate", label: "Created Date", field: "createdDate" },
          ],
          optionalColumns: [
            { key: "showVoucherNo", label: "Show Voucher No", field: "docNo" },
            { key: "showVoucherType", label: "Show Voucher Type", field: "voucherType" },
            { key: "showGSTRate", label: "Show GST Rate", field: "gstRate" },
            { key: "showTaxes", label: "Show Taxes (CGST/SGST/UTGST)", field: "taxes" },
            { key: "showTDS", label: "Show TDS/TCS", field: "tds" },
            { key: "showGSTIN", label: "Show GSTIN", field: "gstin" },
            { key: "showOriginal", label: "Show Original Inv.no/Date", field: "originalDocNo" },
            { key: "showCustomerAddress", label: "Show Customer Address", field: "customerAddress" },
            { key: "showItems", label: "Show Items", field: "items" },
            { key: "showNarration", label: "Show Narration", field: "narration" },
            { key: "typeOfSupply", label: "Type of Supply", field: "typeOfSupply" },
            { key: "showFromDate", label: "Show From Date", field: "fromDate" },
            { key: "showToDate", label: "Show To Date", field: "toDate" },
          ]
        };
    }
  };

  // Fetch data from API
  const fetchSalesReturnData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await services.getPurchaseReturnSummaryRpt({
        from_date: filters.fromDate,
        to_date: filters.toDate,
      });
      const payload = res.data || {};
      const rows = payload.returns ?? (Array.isArray(payload) ? payload : payload.results ?? []);
      const mapped = rows.map((r, idx) => ({
        id: r.id || idx + 1,
        docNo: r.return_number || r.voucher_no || r.doc_no || r.id,
        docDate: r.date || r.created_at || "",
        customerName: r.party_name || r.vendor_name || r.supplier_name || "",
        customerCode: r.customer_code || r.party_name || "",
        voucherType: "Purchase Return",
        taxableValue: Number(r.taxable_value ?? r.taxable ?? 0),
        totalGST: Number(r.total_gst ?? r.gst ?? 0),
        totalAmount: Number(r.total_amount ?? r.total ?? 0),
        createdBy: r.created_by || "Admin",
        createdDate: r.created_at || r.date || "",
        gstRate: r.gst_rate ? `${r.gst_rate}%` : "18%",
        taxes: r.taxes || "",
        tds: r.tds || "",
        gstin: r.gstin || r.party_gstin || "",
        originalDocNo: r.bill_number || r.original_invoice_no || "",
        customerAddress: r.vendor_address || r.customer_address || r.billed_to?.address || "",
        items: (r.items || []).map(it => `${it.hsn_description || it.hsn_code || "Item"} (${it.quantity || 0} units)`).join(", ") || "",
        narration: r.reason || r.narration || "",
        typeOfSupply: r.supply_type || "Intra-State",
        fromDate: r.from_date || "",
        toDate: r.to_date || "",
        hsnCode: r.hsn_code || "",
        hsnDescription: r.hsn_description || "",
        quantity: r.quantity ?? 0,
        unitPrice: r.unit_price ?? 0,
        itemLines: r.items || [],
      }));
      setSalesData(mapped.length > 0 ? mapped : []);
    } catch {
      // keep empty state - no fallback data for returns
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReturnData();
  }, [filters.fromDate, filters.toDate]);

  // Update grouped data when salesData or groupBy changes
  useEffect(() => {
    const grouped = getGroupedData();
    setGroupedData(grouped);
  }, [salesData, filters.groupBy]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (configRef.current && !configRef.current.contains(event.target)) {
        setShowConfigDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCheck = (key) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetConfig = () => {
    setConfig({
      typeOfSupply: false,
      showItems: false,
      showNarration: false,
      showGSTRate: true,
      showVoucherType: true,
      showVoucherNo: true,
      showGSTIN: false,
      showTaxes: true,
      showTDS: false,
      showOriginal: false,
      showCustomerAddress: false,
      showFromDate: true,
      showToDate: true,
      showDocuments: true,
    });
  };

  // Get current column definitions
  const columnDefs = getColumnDefinitions();
  const fixedColumns = columnDefs.fixedColumns;
  const optionalColumns = columnDefs.optionalColumns;

  // Get visible columns
  const visibleColumns = [
    ...fixedColumns,
    ...optionalColumns.filter(col => config[col.key] !== undefined ? config[col.key] : true)
  ];

  // Calculate totals based on grouped data
  const calculateTotals = () => {
    if (groupedData.length === 0) return { taxableValue: 0, totalGST: 0, totalAmount: 0 };
    
    return groupedData.reduce(
      (acc, row) => ({
        taxableValue: acc.taxableValue + (row.taxableValue || 0),
        totalGST: acc.totalGST + (row.totalGST || 0),
        totalAmount: acc.totalAmount + (row.totalAmount || 0),
      }),
      { taxableValue: 0, totalGST: 0, totalAmount: 0 }
    );
  };

  const totals = calculateTotals();

  // Render cell value based on column type
  const renderCellValue = (row, col) => {
    const value = row[col.field];
    
    if (col.field === "documents" && Array.isArray(value)) {
      return value.join(", ");
    }
    
    if (col.field === "returnDetails" && Array.isArray(value)) {
      return `${value.length} returns (${value.map(v => v.docNo).join(", ")})`;
    }
    
    if (col.key === "taxableValue" || col.key === "totalGST" || col.key === "totalAmount") {
      return `₹${(value || 0).toLocaleString()}`;
    }
    
    if (col.key === "totalQuantity") {
      return (value || 0).toLocaleString();
    }
    
    return value || "-";
  };

  // Get report title
  const getReportTitle = () => {
    switch(filters.groupBy) {
      case "HSN": return "Sales Return Summary by HSN";
      case "Customer": return "Sales Return Summary by Customer";
      default: return "Sales Return Documents";
    }
  };

  return (
    <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
      <div className="sr-container">
        {/* HEADER */}
        <div className="sr-header">
          <div>
            <h2 className="sr-title">Purchase Return Summary</h2>
            <p className="sr-subtitle">Manage and track all Purchase return transactions</p>
          </div>
          <div className="sr-header-actions">
            <button className="sr-export-btn" onClick={() => console.log("Export clicked", groupedData)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Export
            </button>
            <button className="sr-print-btn" onClick={() => window.print()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V3h12v6M6 21h12v-6H6zM21 9H3v6h2v-4h14v4h2z"/>
              </svg>
              Print
            </button>
          </div>
        </div>

        {/* FILTER SECTION */}
        <div className="sr-filters-card">
          <div className="sr-filters">
            <div className="sr-filter-group">
              <label>Group By</label>
              <select 
                className="sr-select"
                value={filters.groupBy}
                onChange={(e) => handleFilterChange("groupBy", e.target.value)}
              >
                <option value="Document">Document</option>
                <option value="HSN">HSN</option>
                <option value="Customer">Vendor</option>
              </select>
            </div>

            <div className="sr-filter-group">
              <label>From Date</label>
              <input 
                type="date" 
                className="sr-date-input" 
                value={filters.fromDate}
                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
              />
            </div>

            <div className="sr-filter-group">
              <label>To Date</label>
              <input 
                type="date" 
                className="sr-date-input" 
                value={filters.toDate}
                onChange={(e) => handleFilterChange("toDate", e.target.value)}
              />
            </div>

            {/* Column Visibility Dropdown */}
            <div className="sr-filter-group sr-config-dropdown-wrapper" ref={configRef}>
              <label>Configuration</label>
              <button 
                className="sr-config-trigger"
                onClick={() => setShowConfigDropdown(!showConfigDropdown)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Select Columns
                <span className="sr-config-count">
                  {Object.values(config).filter(v => v === true).length}
                </span>
              </button>

              {showConfigDropdown && (
                <div className="sr-config-menu">
                  <div className="sr-config-menu-search">
                    <input
                      type="text"
                      placeholder="Search columns..."
                      className="sr-search-input"
                      onChange={(e) => {
                        const searchTerm = e.target.value.toLowerCase();
                        const items = document.querySelectorAll(".sr-config-menu-item");
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
                  <div className="sr-config-menu-items">
                    {optionalColumns.map((col) => (
                      <label key={col.key} className="sr-config-menu-item">
                        <input
                          type="checkbox"
                          checked={config[col.key] !== undefined ? config[col.key] : true}
                          onChange={() => handleCheck(col.key)}
                        />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="sr-config-menu-footer">
                    <button onClick={() => {
                      const newConfig = {};
                      optionalColumns.forEach((col) => {
                        newConfig[col.key] = true;
                      });
                      setConfig(prev => ({ ...prev, ...newConfig }));
                    }}>Show All</button>
                    <button onClick={() => {
                      const newConfig = {};
                      optionalColumns.forEach((col) => {
                        newConfig[col.key] = false;
                      });
                      setConfig(prev => ({ ...prev, ...newConfig }));
                    }}>Hide All</button>
                    <button onClick={resetConfig}>Reset to Default</button>
                  </div>
                </div>
              )}
            </div>

            {/* <button className="sr-apply-btn" onClick={fetchSalesReturnData}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              Apply Filters
            </button> */}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="sr-main">
          <div className="sr-table-card">
            <div className="sr-table-header">
              <h3>{getReportTitle()}</h3>
              <div className="sr-table-stats">
                <span className="sr-record-count">
                  {filters.groupBy === "Document" && `${groupedData.length} records found`}
                  {filters.groupBy === "HSN" && `${groupedData.length} HSN groups found`}
                  {filters.groupBy === "Customer" && `${groupedData.length} customers found`}
                </span>
                {groupedData.length > 0 && (
                  <div className="sr-totals">
                    <span>Total Amount: ₹{totals.totalAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="sr-loading">
                <div className="sr-spinner"></div>
                <p>Loading data...</p>
              </div>
            ) : error ? (
              <div className="sr-error">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>{error}</p>
                <button onClick={fetchSalesReturnData} className="sr-retry-btn">Retry</button>
              </div>
            ) : (
              <>
                <div className="sr-table-wrapper">
                  <table className="sr-data-table">
                    <thead>
                      <tr>
                        {visibleColumns.map((col) => (
                          <th key={col.key}>{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {groupedData.length === 0 ? (
                        <tr>
                          <td colSpan={visibleColumns.length} className="sr-no-data">
                            No data found for selected filters
                          </td>
                        </tr>
                      ) : (
                        groupedData.map((row, index) => (
                          <tr key={index}>
                            {visibleColumns.map((col) => (
                              <td key={col.key}>
                                {renderCellValue(row, col)}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="sr-pagination">
                  <button className="sr-page-btn" disabled>Previous</button>
                  <span className="sr-page-info">Page 1 of 1</span>
                  <button className="sr-page-btn" disabled>Next</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
