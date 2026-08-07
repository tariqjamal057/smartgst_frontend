import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import * as services from "../api/services";
import "../styles/salesummary.css";

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

export default function GeneralReports() {
  const { collapsed } = useOutletContext();
  const [showConfig, setShowConfig] = useState(false);
  const configRef = useRef(null);

  const [filters, setFilters] = useState({
    fromDate: defaultFromDate,
    toDate: defaultToDate,
    by: "Invoice"
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const [config, setConfig] = useState({
    typeOfSupply: false,
    showItems: false,
    showNarration: false,
    showGSTRate: true,
    showVoucherType: true,
    showVoucherNo: true,
    showGSTIN: true,
    showCustomerAddress: false,
    showTaxes: true,
    showTDS: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [invoiceData, setInvoiceData] = useState([]);
  const [hsnData, setHsnData] = useState([]);
  const [customerData, setCustomerData] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await services.getSaleSummary({
        from_date: filters.fromDate,
        to_date: filters.toDate,
      });
      const payload = res.data || {};
      const rows = payload.sales ?? (Array.isArray(payload) ? payload : payload.results ?? []);
      const mapped = rows.map((r, idx) => ({
        id: r.id || idx + 1,
        invNo: r.voucher_number || r.invoice_no || r.bill_id || r.doc_no || "",
        invDate: r.date || r.invoice_date || "",
        displayDate: r.date || r.invoice_date || "",
        customerName: r.party_name || r.customer_name || r.billed_to?.name || "",
        voucherType: r.voucher_type || "Sales",
        taxableValue: Number(r.total_taxable_amount ?? r.taxable_value ?? r.taxable ?? 0),
        totalGST: Number(r.total_gst ?? ((Number(r.total_cgst) || 0) + (Number(r.total_sgst) || 0) + (Number(r.total_igst) || 0))),
        invValue: Number(r.total_amount ?? r.total ?? 0),
        gstRate: r.gst_rate ? `${r.gst_rate}%` : "18%",
        gstin: r.gstin || r.party_gstin || "",
        address: r.address || r.customer_address || r.billed_to?.address || "",
        narration: r.narration || "",
        supplyType: r.supply_type || "Intra-State",
        hsnCode: "",
        description: "",
      }));
      setInvoiceData(mapped);
      const hsnRows = payload.hsn ?? [];
      setHsnData(hsnRows.map((h, idx) => ({
        id: idx + 1,
        hsnCode: h.hsn_code || "",
        taxableValue: Number(h.taxable_value || 0),
        totalGST: Number(h.total_gst || 0),
        description: h.description || "",
        gstRate: h.gst_rate ? `${h.gst_rate}%` : "18%",
        invDate: "",
      })));
      setCustomerData(mapped.map((r, idx) => ({
        id: idx + 1,
        customerName: r.customerName,
        invDate: r.invDate,
        displayDate: r.displayDate,
        voucherType: r.voucherType,
        gstRate: r.gstRate,
        taxableValue: r.taxableValue,
        totalGST: r.totalGST,
        invValue: r.invValue,
        gstin: r.gstin,
        address: r.address,
      })));
    } catch {
      setInvoiceData([]);
      setHsnData([]);
      setCustomerData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.fromDate, filters.toDate]);

  const filterDataByDate = (data) => {
    if (!filters.fromDate && !filters.toDate) return data;
    return data.filter(item => {
      const itemDate = new Date(item.invDate);
      const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
      const toDate = filters.toDate ? new Date(filters.toDate) : null;
      if (fromDate) fromDate.setHours(0, 0, 0, 0);
      if (toDate) toDate.setHours(23, 59, 59, 999);
      if (fromDate && toDate) return itemDate >= fromDate && itemDate <= toDate;
      if (fromDate) return itemDate >= fromDate;
      if (toDate) return itemDate <= toDate;
      return true;
    });
  };

  const getCurrentData = () => {
    let data;
    switch(filters.by) {
      case "Invoice": data = [...invoiceData]; break;
      case "HSN": return [...hsnData];
      case "Customer": data = [...customerData]; break;
      default: data = [...invoiceData];
    }
    return filterDataByDate(data);
  };

  const currentData = getCurrentData();
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = currentData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(currentData.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (configRef.current && !configRef.current.contains(event.target)) setShowConfig(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { setCurrentPage(1); }, [filters.by, filters.fromDate, filters.toDate]);

  const formatLabel = (key) => key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
  const handleCheck = (key) => setConfig({ ...config, [key]: !config[key] });
  const handleFilterChange = (key, value) => { setFilters(prev => ({ ...prev, [key]: value })); setCurrentPage(1); };

  const calculateTotals = () => currentData.reduce((acc, row) => ({
    taxableValue: acc.taxableValue + (row.taxableValue || 0),
    totalGST: acc.totalGST + (row.totalGST || 0),
    invValue: acc.invValue + (row.invValue || 0),
  }), { taxableValue: 0, totalGST: 0, invValue: 0 });

  const totals = calculateTotals();

  const renderInvoiceTable = () => (
    <div className="table-section">
      <div className="table-header">
        <h3>Invoice Summary</h3>
        <div className="table-stats">
          <span>Total Records: {currentData.length}</span>
          <span>Page {currentPage} of {totalPages || 1}</span>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Inv No</th>
              <th>Inv Date</th>
              <th>Customer Name</th>
              {config.showVoucherType && <th>Voucher Type</th>}
              {config.showGSTIN && <th>GSTIN</th>}
              {config.showCustomerAddress && <th>Address</th>}
              <th>Taxable Value</th>
              {config.showGSTRate && <th>GST Rate</th>}
              {config.showTaxes && <th>Total GST</th>}
              <th>Inv Value</th>
              {config.showTDS && <th>TDS</th>}
              {config.showItems && <th>Items</th>}
              {config.showNarration && <th>Narration</th>}
              {config.typeOfSupply && <th>Type of Supply</th>}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, idx) => (
              <tr key={row.id}>
                <td>{indexOfFirstRow + idx + 1}</td>
                <td>{row.invNo}</td>
                <td>{row.displayDate || row.invDate}</td>
                <td>{row.customerName}</td>
                {config.showVoucherType && <td>{row.voucherType}</td>}
                {config.showGSTIN && <td>{row.gstin || "-"}</td>}
                {config.showCustomerAddress && <td>{row.address || "-"}</td>}
                <td>{"\u20B9"}{row.taxableValue.toLocaleString()}</td>
                {config.showGSTRate && <td>{row.gstRate || "18%"}</td>}
                {config.showTaxes && <td>{"\u20B9"}{row.totalGST.toLocaleString()}</td>}
                <td>{"\u20B9"}{row.invValue.toLocaleString()}</td>
                {config.showTDS && <td>-</td>}
                {config.showItems && <td>-</td>}
                {config.showNarration && <td>{row.narration || "-"}</td>}
                {config.typeOfSupply && <td>{row.supplyType}</td>}
              </tr>
            ))}
          </tbody>
          {currentData.length > 0 && (
            <tfoot>
              <tr className="total-row">
                <td colSpan={4 + (config.showVoucherType ? 1 : 0) + (config.showGSTIN ? 1 : 0) + (config.showCustomerAddress ? 1 : 0)}>
                  <strong>Total:</strong>
                </td>
                <td><strong>{"\u20B9"}{totals.taxableValue.toLocaleString()}</strong></td>
                {config.showGSTRate && <td></td>}
                {config.showTaxes && <td><strong>{"\u20B9"}{totals.totalGST.toLocaleString()}</strong></td>}
                <td><strong>{"\u20B9"}{totals.invValue.toLocaleString()}</strong></td>
                {(config.showTDS || config.showItems || config.showNarration || config.typeOfSupply) &&
                  Array(4).fill().map((_, i) => <td key={i}></td>)
                }
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={prevPage} disabled={currentPage === 1}>Previous</button>
          {[...Array(Math.min(totalPages, 5))].map((_, i) => {
            let pageNum;
            if (totalPages <= 5) pageNum = i + 1;
            else if (currentPage <= 3) pageNum = i + 1;
            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
            else pageNum = currentPage - 2 + i;
            return (
              <button key={pageNum} onClick={() => paginate(pageNum)} className={currentPage === pageNum ? "active" : ""}>{pageNum}</button>
            );
          })}
          <button onClick={nextPage} disabled={currentPage === totalPages}>Next</button>
        </div>
      )}
    </div>
  );

  const renderHSNTable = () => (
    <div className="table-section">
      <div className="table-header">
        <h3>HSN Summary</h3>
        <div className="table-stats">
          <span>Total Records: {currentData.length}</span>
          <span>Page {currentPage} of {totalPages || 1}</span>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>HSN/SAC Code</th>
              <th>Description</th>
              <th>Taxable Value</th>
              {config.showGSTRate && <th>GST Rate</th>}
              {config.showTaxes && <th>Total GST</th>}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, idx) => (
              <tr key={row.id}>
                <td>{indexOfFirstRow + idx + 1}</td>
                <td>{row.hsnCode}</td>
                <td>{row.description}</td>
                <td>{"\u20B9"}{row.taxableValue.toLocaleString()}</td>
                {config.showGSTRate && <td>{row.gstRate}</td>}
                {config.showTaxes && <td>{"\u20B9"}{row.totalGST.toLocaleString()}</td>}
              </tr>
            ))}
          </tbody>
          {currentData.length > 0 && (
            <tfoot>
              <tr className="total-row">
                <td colSpan={3}><strong>Total:</strong></td>
                <td><strong>{"\u20B9"}{totals.taxableValue.toLocaleString()}</strong></td>
                {config.showGSTRate && <td></td>}
                {config.showTaxes && <td><strong>{"\u20B9"}{totals.totalGST.toLocaleString()}</strong></td>}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={prevPage} disabled={currentPage === 1}>Previous</button>
          {[...Array(Math.min(totalPages, 5))].map((_, i) => {
            let pageNum;
            if (totalPages <= 5) pageNum = i + 1;
            else if (currentPage <= 3) pageNum = i + 1;
            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
            else pageNum = currentPage - 2 + i;
            return (
              <button key={pageNum} onClick={() => paginate(pageNum)} className={currentPage === pageNum ? "active" : ""}>{pageNum}</button>
            );
          })}
          <button onClick={nextPage} disabled={currentPage === totalPages}>Next</button>
        </div>
      )}
    </div>
  );

  const renderCustomerTable = () => (
    <div className="table-section">
      <div className="table-header">
        <h3>Customer Summary</h3>
        <div className="table-stats">
          <span>Total Records: {currentData.length}</span>
          <span>Page {currentPage} of {totalPages || 1}</span>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Customer Name</th>
              <th>Inv Date</th>
              {config.showVoucherType && <th>Voucher Type</th>}
              {config.showGSTIN && <th>GSTIN</th>}
              {config.showCustomerAddress && <th>Address</th>}
              <th>Taxable Value</th>
              {config.showGSTRate && <th>GST Rate</th>}
              {config.showTaxes && <th>Total GST</th>}
              <th>Inv Value</th>
              {config.showTDS && <th>TDS</th>}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, idx) => (
              <tr key={row.id}>
                <td>{indexOfFirstRow + idx + 1}</td>
                <td>{row.customerName}</td>
                <td>{row.displayDate || row.invDate}</td>
                {config.showVoucherType && <td>{row.voucherType}</td>}
                {config.showGSTIN && <td>{row.gstin || "-"}</td>}
                {config.showCustomerAddress && <td>{row.address || "-"}</td>}
                <td>{"\u20B9"}{row.taxableValue.toLocaleString()}</td>
                {config.showGSTRate && <td>{row.gstRate}</td>}
                {config.showTaxes && <td>{"\u20B9"}{row.totalGST.toLocaleString()}</td>}
                <td>{"\u20B9"}{row.invValue.toLocaleString()}</td>
                {config.showTDS && <td>-</td>}
              </tr>
            ))}
          </tbody>
          {currentData.length > 0 && (
            <tfoot>
              <tr className="total-row">
                <td colSpan={4 + (config.showVoucherType ? 1 : 0) + (config.showGSTIN ? 1 : 0) + (config.showCustomerAddress ? 1 : 0)}>
                  <strong>Total:</strong>
                </td>
                <td><strong>{"\u20B9"}{totals.taxableValue.toLocaleString()}</strong></td>
                {config.showGSTRate && <td></td>}
                {config.showTaxes && <td><strong>{"\u20B9"}{totals.totalGST.toLocaleString()}</strong></td>}
                <td><strong>{"\u20B9"}{totals.invValue.toLocaleString()}</strong></td>
                {config.showTDS && <td></td>}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={prevPage} disabled={currentPage === 1}>Previous</button>
          {[...Array(Math.min(totalPages, 5))].map((_, i) => {
            let pageNum;
            if (totalPages <= 5) pageNum = i + 1;
            else if (currentPage <= 3) pageNum = i + 1;
            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
            else pageNum = currentPage - 2 + i;
            return (
              <button key={pageNum} onClick={() => paginate(pageNum)} className={currentPage === pageNum ? "active" : ""}>{pageNum}</button>
            );
          })}
          <button onClick={nextPage} disabled={currentPage === totalPages}>Next</button>
        </div>
      )}
    </div>
  );

  return (
    <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
      <div className="report-container">
        <div className="report-header">
          <h2 className="report-title">Sale Summary</h2>
          <div className="header-actions">
            <button className="export-btn">Export</button>
            <button className="print-btn">Print</button>
          </div>
        </div>

        <div className="filters-card">
          <div className="filters">
            <div className="filter-group">
              <label>From Date</label>
              <input type="date" value={filters.fromDate} onChange={(e) => handleFilterChange("fromDate", e.target.value)} />
            </div>
            <div className="filter-group">
              <label>To Date</label>
              <input type="date" value={filters.toDate} onChange={(e) => handleFilterChange("toDate", e.target.value)} />
            </div>
            <div className="filter-group">
              <label>Group By</label>
              <select value={filters.by} onChange={(e) => handleFilterChange("by", e.target.value)}>
                <option>Invoice</option>
                <option>HSN</option>
                <option>Customer</option>
              </select>
            </div>

            <div className="config-dropdown-wrapper" ref={configRef}>
              <button className="config-btn" onClick={() => setShowConfig(!showConfig)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Columns
                <span className="config-count">{Object.values(config).filter(v => v === true).length}</span>
              </button>
              {showConfig && (
                <div className="config-menu">
                  <div className="config-menu-header">
                    <span>Toggle Columns</span>
                    <button onClick={() => setConfig({ typeOfSupply: false, showItems: false, showNarration: false, showGSTRate: true, showVoucherType: true, showVoucherNo: true, showGSTIN: true, showCustomerAddress: false, showTaxes: true, showTDS: false })} className="config-reset">Reset</button>
                  </div>
                  <div className="config-menu-items">
                    {Object.keys(config).map((key) => (
                      <label key={key} className="config-item">
                        <input type="checkbox" checked={config[key]} onChange={() => handleCheck(key)} />
                        {formatLabel(key)}
                      </label>
                    ))}
                  </div>
                  <div className="config-menu-footer">
                    <button onClick={() => { const newConfig = {}; Object.keys(config).forEach(key => newConfig[key] = true); setConfig(newConfig); }}>Show All</button>
                    <button onClick={() => { const newConfig = {}; Object.keys(config).forEach(key => newConfig[key] = false); setConfig(newConfig); }}>Hide All</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="no-data-message"><p>Loading data...</p></div>
        ) : error ? (
          <div className="no-data-message"><p>{error}</p></div>
        ) : currentData.length === 0 ? (
          <div className="no-data-message"><p>No records found for the selected date range.</p></div>
        ) : (
          <>
            {filters.by === "Invoice" && renderInvoiceTable()}
            {filters.by === "HSN" && renderHSNTable()}
            {filters.by === "Customer" && renderCustomerTable()}
          </>
        )}
      </div>
    </div>
  );
}
