import { useState, useRef, useEffect } from 'react';
import { useOutletContext } from "react-router-dom";
import * as services from "../api/services";
import {
  Search,
  CalendarDays,
  Settings2,
  Printer,
  FileSpreadsheet,
  FileText,
  Eye,
  Building2,
  BadgeIndianRupee,
  ReceiptText,
  BookOpen
} from "lucide-react";
import '../styles/LedgerBook.css';

const LedgerBook = () => {
  const { collapsed } = useOutletContext();
  const [ledgers, setLedgers] = useState([]);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [isLedgerDropdownOpen, setIsLedgerDropdownOpen] = useState(false);
  const [fromDate, setFromDate] = useState('01-04-2025');
  const [toDate, setToDate] = useState('31-03-2026');
  const [showVancherNo, setShowVancherNo] = useState(true);
  const [showNarration, setShowNarration] = useState(false);
  const [showBillWise, setShowBillWise] = useState(false);
  const [showBalanceColumn, setShowBalanceColumn] = useState(true);
  const [hideStripeView, setHideStripeView] = useState(false);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [entryLoading, setEntryLoading] = useState(false);

  const dropdownRef = useRef(null);

  // Fetch ledger list (parties/accounts)
  const fetchLedgers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await services.getParties();
      const results = res.data.results || res.data || [];
      setLedgers(Array.isArray(results) ? results : []);
    } catch (err) {
      console.error("Failed to fetch ledgers:", err);
      setError("Failed to load ledgers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgers();
  }, []);

  // Fetch entries when ledger is selected
  const fetchLedgerEntries = async (ledger) => {
    try {
      setEntryLoading(true);
      const params = {
        account: ledger.id || ledger.account || ledger.name,
        from_date: fromDate,
        to_date: toDate,
      };
      const res = await services.getLedgerEntries(params);
      const entries = res.data.results || res.data || [];
      const entryArray = Array.isArray(entries) ? entries : [];

      setSelectedLedger({
        ...ledger,
        entries: entryArray.map((e, i) => ({
          id: e.id || i,
          date: e.date || e.transaction_date || "",
          vancherType: e.voucher_type || e.vancherType || "",
          vancherNo: e.voucher_no || e.vancherNo || "",
          narration: e.narration || "",
          amountDr: Number(e.amount_dr || e.debit || e.dr || 0),
          amountCr: Number(e.amount_cr || e.credit || e.cr || 0),
          balance: Number(e.balance || 0),
          mo: e.dr_cr || e.mo || (Number(e.amount_dr || e.debit || 0) > 0 ? "Dr" : "Cr"),
        })),
        openingBalance: Number(ledger.opening_balance || ledger.openingBalance || 0),
      });
    } catch (err) {
      console.error("Failed to fetch ledger entries:", err);
      setSelectedLedger({
        ...ledger,
        entries: [],
        openingBalance: Number(ledger.opening_balance || ledger.openingBalance || 0),
      });
    } finally {
      setEntryLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLedgerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calculateTotals = (entries) => {
    const totalDr = entries.reduce((sum, e) => sum + (e.amountDr || 0), 0);
    const totalCr = entries.reduce((sum, e) => sum + (e.amountCr || 0), 0);
    return { totalDr, totalCr };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const filteredLedgers = ledgers.filter((l) => {
    if (!ledgerSearch) return true;
    const name = l.name || l.ledger_name || "";
    return name.toLowerCase().includes(ledgerSearch.toLowerCase());
  });

  const renderLedgerTable = (ledger) => {
    const entries = ledger.entries || [];
    const { totalDr, totalCr } = calculateTotals(entries);
    const closingBalance = entries.length > 0
      ? entries[entries.length - 1].balance
      : ledger.openingBalance || 0;

    return (
      <div className="corporate-table-wrapper">
        <table className="corporate-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Ledger Name</th>
              {showVancherNo && <th>Voucher No</th>}
              <th>Voucher Type</th>
              <th>Dr/Cr</th>
              {showNarration && <th>Narration</th>}
              <th className="text-right">Debit (₹)</th>
              <th className="text-right">Credit (₹)</th>
              {showBalanceColumn && <th className="text-right">Balance (₹)</th>}
            </tr>
          </thead>
          <tbody>
            <tr className="opening-row">
              <td>{fromDate}</td>
              <td className="font-medium">{ledger.name || ledger.ledger_name || ""}</td>
              {showVancherNo && <td>-</td>}
              <td>Opening Balance</td>
              <td>{(ledger.openingBalance || 0) >= 0 ? 'Dr' : 'Cr'}</td>
              {showNarration && <td>Opening Balance</td>}
              <td className="text-right debit">
                {(ledger.openingBalance || 0) >= 0 ? formatCurrency(ledger.openingBalance || 0) : '-'}
              </td>
              <td className="text-right credit">
                {(ledger.openingBalance || 0) < 0 ? formatCurrency(Math.abs(ledger.openingBalance || 0)) : '-'}
              </td>
              {showBalanceColumn && (
                <td className="text-right balance">
                  {formatCurrency(ledger.openingBalance || 0)} {(ledger.openingBalance || 0) >= 0 ? 'Dr' : 'Cr'}
                </td>
              )}
            </tr>

            {entries.map((entry, idx) => (
              <tr key={entry.id} className={!hideStripeView && idx % 2 === 0 ? 'stripe-row' : ''}>
                <td>{entry.date}</td>
                <td className="font-medium">{ledger.name || ledger.ledger_name || ""}</td>
                {showVancherNo && <td>{entry.vancherNo}</td>}
                <td>{entry.vancherType}</td>
                <td>{entry.mo}</td>
                {showNarration && <td>{entry.narration}</td>}
                <td className="text-right debit">
                  {entry.amountDr > 0 ? formatCurrency(entry.amountDr) : '-'}
                </td>
                <td className="text-right credit">
                  {entry.amountCr > 0 ? formatCurrency(entry.amountCr) : '-'}
                </td>
                {showBalanceColumn && (
                  <td className="text-right balance">
                    {formatCurrency(entry.balance)} {entry.mo}
                  </td>
                )}
              </tr>
            ))}

            <tr className="total-row">
              <td colSpan={showVancherNo ? (showNarration ? 6 : 5) : (showNarration ? 5 : 4)} className="text-right">
                <strong>Current Total</strong>
              </td>
              <td className="text-right debit"><strong>{formatCurrency(totalDr)}</strong></td>
              <td className="text-right credit"><strong>{formatCurrency(totalCr)}</strong></td>
              {showBalanceColumn && <td></td>}
            </tr>

            <tr className="closing-row">
              <td colSpan={showVancherNo ? (showNarration ? 6 : 5) : (showNarration ? 5 : 4)} className="text-right">
                <strong>Closing Balance</strong>
              </td>
              <td className="text-right balance"><strong>{formatCurrency(closingBalance)}</strong></td>
              <td></td>
              {showBalanceColumn && <td></td>}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
      <div className="ledger-content">
        {/* Header Bar */}
        <div className="ledger-header-bar">
          <div className="header-title">
            <div className="led-book-hed-title">
              <div className="led-book-header-icon">
                <BookOpen size={24} />
              </div>
              <div className="led-book-title-content">
                <h2>Ledger Book</h2>
                <p className="header-subtitle">
                  View and manage ledger transactions
                </p>
              </div>
            </div>
          </div>
          <div className="led-book-header-actions">
            <button className="action-btn export-led-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Export
            </button>
            <button className="action-btn print-led-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 18"/>
                <path d="M6 14L18 14"/>
                <path d="M6 10L18 10"/>
                <path d="M6 6L18 6"/>
                <path d="M4 4L20 4"/>
              </svg>
              Print
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div className="filters-card">
          <div className="led-filters-grid">
            <div className="filter-field">
              <label className="filter-label">From Date</label>
              <div className="date-input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <input
                  type="text"
                  className="filter-input"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  placeholder="DD-MM-YYYY"
                />
              </div>
            </div>
            <div className="filter-field">
              <label className="filter-label">To Date</label>
              <div className="date-input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <input
                  type="text"
                  className="filter-input"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholder="DD-MM-YYYY"
                />
              </div>
            </div>
            <div className="filter-field" ref={dropdownRef}>
              <label className="filter-label">Select Ledger</label>
              <div className="ledger-select-wrapper">
                <button
                  onClick={() => setIsLedgerDropdownOpen(!isLedgerDropdownOpen)}
                  className="ledger-select-btn"
                >
                  <span className={selectedLedger ? 'selected-text' : 'placeholder-text'}>
                    {selectedLedger ? (selectedLedger.name || selectedLedger.ledger_name) : 'Choose a ledger...'}
                  </span>
                  <svg className={`dropdown-chevron ${isLedgerDropdownOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {isLedgerDropdownOpen && (
                  <div className="ledgerbook-dropdown-menu">
                    <div className="ledgerbook-search-wrapper">
                      <input
                        type="text"
                        className="ledgerbook-search-input"
                        placeholder="Search ledgers..."
                        value={ledgerSearch}
                        onChange={(e) => setLedgerSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    {loading ? (
                      <div className="ledgerbook-loading">Loading...</div>
                    ) : filteredLedgers.length === 0 ? (
                      <div className="ledgerbook-empty">No ledgers found</div>
                    ) : (
                      filteredLedgers.map((ledger, idx) => (
                        <button
                          key={ledger.id || idx}
                          onClick={() => {
                            setSelectedLedger(ledger);
                            setIsLedgerDropdownOpen(false);
                            setLedgerSearch("");
                            fetchLedgerEntries(ledger);
                          }}
                          className="ledger-option"
                        >
                          <div className="option-info">
                            <span className="option-name">{ledger.name || ledger.ledger_name}</span>
                            <span className="option-type">{ledger.party_type || ledger.type || "Account"}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="filter-field apply-field">
              <button className="apply-btn" onClick={() => selectedLedger && fetchLedgerEntries(selectedLedger)}>
                Apply Filters
              </button>
            </div>
          </div>

          {/* Display Options - Integrated */}
          <div className="display-options">
            <span className="options-label">Display Options:</span>
            <div className="options-group">
              <label className="option-checkbox">
                <input type="checkbox" checked={showVancherNo} onChange={(e) => setShowVancherNo(e.target.checked)} />
                <span>Voucher No</span>
              </label>
              <label className="option-checkbox">
                <input type="checkbox" checked={showNarration} onChange={(e) => setShowNarration(e.target.checked)} />
                <span>Narration</span>
              </label>
              <label className="option-checkbox">
                <input type="checkbox" checked={showBillWise} onChange={(e) => setShowBillWise(e.target.checked)} />
                <span>Bill Wise</span>
              </label>
              <label className="option-checkbox">
                <input type="checkbox" checked={showBalanceColumn} onChange={(e) => setShowBalanceColumn(e.target.checked)} />
                <span>Balance Column</span>
              </label>
              <label className="option-checkbox">
                <input type="checkbox" checked={hideStripeView} onChange={(e) => setHideStripeView(e.target.checked)} />
                <span>Disable Stripes</span>
              </label>
            </div>
          </div>
        </div>

        {/* Ledger Display Area */}
        {selectedLedger ? (
          <div className="ledger-display-area">
            {entryLoading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>Loading ledger entries...</div>
            ) : (
              <>
                <div className="ledger-header-info">
                  <div>
                    <h3>{selectedLedger.name || selectedLedger.ledger_name}</h3>
                    <div className="ledger-meta">
                      <span className="meta-badge">{selectedLedger.party_type || selectedLedger.type || "Account"}</span>
                      <span className="meta-text">Ledger Account</span>
                    </div>
                  </div>
                  <div className="date-range-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>{fromDate} - {toDate}</span>
                  </div>
                </div>
                {renderLedgerTable(selectedLedger)}
              </>
            )}
          </div>
        ) : (
          <div className="empty-ledger-state">
            <div className="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <h4>No Ledger Selected</h4>
            <p>Please select a ledger from the dropdown above to view transaction details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LedgerBook;
