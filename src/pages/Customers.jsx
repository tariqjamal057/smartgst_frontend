import { useMemo, useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
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
  ReceiptText
} from "lucide-react";
import {
  previewLedgerReport,
  printLedgerReport,
  exportLedgerExcel,
  exportLedgerPDF
} from "../utils/ledgerReport";
import "../styles/VendorLedger.css";


const VendorLedger = () => {

  const [search, setSearch] = useState("");
  const { collapsed } = useOutletContext();
  const navigate = useNavigate();

  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await services.getParties({ type: "customer" });
        const data = res.data.results || res.data || [];
        const list = Array.isArray(data) ? data : [];
        setParties(list);
        if (list.length > 0) {
          setSelectedParty(list[0]);
        } else {
          setSelectedParty(null);
        }
      } catch {
        setParties([]);
        setSelectedParty(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const account = selectedParty?.account;
    if (!account) {
      setEntries([]);
      return undefined;
    }
    (async () => {
      try {
        const res = await services.getLedgerEntries({ account });
        if (cancelled) return;
        const data = Array.isArray(res.data) ? res.data : [];
        setEntries(data.map((e) => ({
          date: e.date,
          ledger: e.account,
          narration: e.narration || "",
          voucherType: e.voucher_type || "",
          voucherNo: e.voucher_no || "",
          invoiceNo: e.invoice_no || "",
          dr: e.debit || 0,
          cr: e.credit || 0,
          balance: e.balance || 0,
        })));
      } catch {
        if (!cancelled) setEntries([]);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedParty]);

  const [config, setConfig] = useState({
    showVoucherNo: true,
    showInvoiceNo: true,
    showNarration: true,
    showBillWise: false,
    showBalance: true,
    hideStripe: false,
    hideTableLine: false,
    showDetails: true,

    showCompanyAddress: true,
    showGSTIN: true,
    showContactPerson: true,
    showContactNumber: true,
    showEmail: true
  });
  const [showConfig, setShowConfig] =
  useState(false);

const [showPrinting, setShowPrinting] =
  useState(false);

  /* ======================================
      FILTER PARTY
  ====================================== */

  const filteredParties = useMemo(() => {

    return parties.filter((party) =>
      party.name
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  }, [search, parties]);

  /* ======================================
      TOGGLE
  ====================================== */

  const toggleSetting = (key) => {

    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));

  };

  /* ======================================
      TOTALS
  ====================================== */

  const totalDr = entries.reduce(
    (acc, item) => acc + item.dr,
    0
  );

  const totalCr = entries.reduce(
    (acc, item) => acc + item.cr,
    0
  );

  const safePartyName = (selectedParty?.name || "Party")
    .replace(/[^A-Za-z0-9\s-]/g, "")
    .replace(/\s+/g, "_");

  const preview = () => previewLedgerReport({
    title: "Customer Ledger",
    party: selectedParty,
    entries,
    config,
    totalDr,
    totalCr
  });

  const print = () => printLedgerReport({
    title: "Customer Ledger",
    party: selectedParty,
    entries,
    config,
    totalDr,
    totalCr
  });

  const excel = () => exportLedgerExcel({
    filename: `${safePartyName}_Ledger.xlsx`,
    entries,
    config,
    totalDr,
    totalCr
  });

  const pdf = () => exportLedgerPDF({
    filename: `${safePartyName}_Ledger.pdf`,
    title: "Customer Ledger",
    party: selectedParty,
    entries,
    config,
    totalDr,
    totalCr
  });

  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>

    <div className="vendor-ledger-page">

      {/* ===================================
          HEADER
      =================================== */}

      <div className="vendor-header">

        <div className="vendor-header-left">

          <div className="vendor-header-icon">
            <ReceiptText size={28} />
          </div>

          <div>

            <h1>
              Customer Ledger
            </h1>

            <p>
              Manage party ledgers,
              balances and transactions
            </p>

          </div>

        </div>

        <div >

         <button className="vendor-btn" onClick={() => navigate("/Ledger",{state: { defaultGroup: "Sundry Debtors" } })}> + Create Customer</button>

        </div>

      </div>

      {/* ===================================
          MAIN LAYOUT
      =================================== */}

      <div className="vendor-layout">

        {/* ===================================
            LEFT PANEL
        =================================== */}

        <div className="vendor-sidebar">

          {/* SEARCH */}

          <div className="vendor-search">

            <Search size={16} />

            <input
              placeholder="Search party..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          {/* PARTY LIST */}

          <div className="vendor-party-list">

            {filteredParties.map((party) => (

              <div
                key={party.id}
                  className={`vendor-party-card ${
                    selectedParty && selectedParty.id === party.id
                      ? "active"
                      : ""
                  }`}
                onClick={() =>
                  setSelectedParty(party)
                }
              >

                <div>

                  <h4>{party.name}</h4>

                  <p>
                    GSTIN:
                    {" "}
                    {party.gstin}
                  </p>

                </div>

                <div
                  className={`vendor-balance ${
                    (party.balance ?? 0) >= 0
                      ? "positive"
                      : "negative"
                  }`}
                >

                  ₹
                  {Math.abs(
                    party.balance ?? 0
                  ).toLocaleString()}

                </div>

              </div>

            ))}

          </div>

        </div>

        {/* ===================================
            RIGHT CONTENT
        =================================== */}

        <div className="vendor-content">

          {/* ===================================
              TOP FILTERS
          =================================== */}

          <div className="vendor-toolbar">
            <div className="vendor-toolbar-left">
              <div className="vendor-filter">
                <CalendarDays size={16} />
                <input type="date" />
              </div>
              <div className="vendor-filter">
                <CalendarDays size={16} />
                <input type="date" />
              </div>
            </div>
            <div className="vendor-toolbar-right">
              {/* CONFIGURATION */}
              <div className="vendor-dropdown-wrapper">
                <button
                  className="vendor-toolbar-btn"
                  onClick={() =>{
                    setShowConfig(!showConfig);
                    setShowPrinting(false);
                  }}
                >
                  <Settings2 size={15} />
                  Configuration
                </button>
                {showConfig && (
                  <div className="vendor-dropdown-panel">
                    <div className="vendor-dropdown-title">
                      Ledger Configuration
                    </div>
                    {[
                      ["Voucher No", "showVoucherNo"],
                      ["Invoice No", "showInvoiceNo"],
                      ["Narration", "showNarration"],
                      ["Balance", "showBalance"],
                      ["Hide Stripe", "hideStripe"],
                      ["Hide Table Line", "hideTableLine"],
                      ["Show Details", "showDetails"]
                    ].map(([label, key]) => (
                      <label
                        key={key}
                        className="vendor-toggle"
                      >
                        <input
                          type="checkbox"
                          checked={config[key]}
                          onChange={() =>
                            toggleSetting(key)
                          }
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {/* PRINT SETTINGS */}
              <div className="vendor-dropdown-wrapper">
                <button
                  className="vendor-toolbar-btn"
                  onClick={() =>{
                    setShowPrinting(!showPrinting);
                    setShowConfig(false);
                  }}
                >
                  <Printer size={15} />
                  Printing
                </button>
                {showPrinting && (
                  <div className="vendor-dropdown-panel">
                    <div className="vendor-dropdown-title">
                      Printing Settings
                    </div>
                    {[
                      ["Company Address", "showCompanyAddress"],
                      ["GSTIN", "showGSTIN"],
                      ["Contact Number", "showContactNumber"],
                      ["Email", "showEmail"]
                    ].map(([label, key]) => (
                      <label
                        key={key}
                        className="vendor-toggle"
                      >
                        <input
                          type="checkbox"
                          checked={config[key]}
                          onChange={() =>
                            toggleSetting(key)
                          }
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* ===================================
              CONFIGURATION
          =================================== */}
          {/* <div className="vendor-config-grid">
            {[
              ["Voucher No", "showVoucherNo"],
              ["Invoice No", "showInvoiceNo"],
              ["Narration", "showNarration"],
              ["Balance", "showBalance"],
              ["Hide Stripe", "hideStripe"],
              ["Hide Table Line", "hideTableLine"],
              ["Show Details", "showDetails"],
              ["Company Address", "showCompanyAddress"],
              ["GSTIN", "showGSTIN"],
              ["Contact Number", "showContactNumber"],
              ["Email", "showEmail"]
            ].map(([label, key]) => (
              <label
                key={key}
                className="vendor-toggle"
              >
                <input
                  type="checkbox"
                  checked={config[key]}
                  onChange={() =>
                    toggleSetting(key)
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </div> */}
          {/* ===================================
              PREVIEW CARD
          =================================== */}
          {loading ? (
            <div className="vendor-preview-card">
              <p style={{ padding: 24, textAlign: "center", color: "#888" }}>
                Loading...
              </p>
            </div>
          ) : !selectedParty ? (
            <div className="vendor-preview-card">
              <p style={{ padding: 24, textAlign: "center", color: "#888" }}>
                No customers found. Create one to get started.
              </p>
            </div>
          ) : (
          <div className="vendor-preview-card">
            {/* HEADER */}
            <div className="vendor-preview-header">
              <div>
                <h2>
                  {selectedParty.name}
                </h2>
                {config.showGSTIN && (
                  <p>
                    GSTIN:
                    {" "}
                    {selectedParty.gstin}
                  </p>
                )}
                {config.showCompanyAddress && (
                  <p>
                    {selectedParty.address}
                  </p>
                )}
                {config.showContactNumber && (
                  <p>
                    Contact:
                    {" "}
                    {selectedParty.contact}
                  </p>
                )}
                {config.showEmail && (
                  <p>
                    Email:
                    {" "}
                    {selectedParty.email}
                  </p>
                )}
              </div>
              <div className="vendor-preview-balance">
                <BadgeIndianRupee size={18} />
                ₹
                {(selectedParty.balance ?? 0).toLocaleString()}
              </div>
            </div>
            {/* TABLE */}
            <div className="vendor-table-wrapper">
              <table
                className={`vendor-table ${
                  config.hideTableLine
                    ? "hide-lines"
                    : ""
                } ${
                  config.hideStripe
                    ? "hide-stripe"
                    : ""
                }`}
              >
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Ledger</th>
                    {config.showNarration && (
                      <th>Narration</th>
                    )}
                    <th>Voucher Type</th>
                    {config.showVoucherNo && (
                      <th>Voucher No</th>
                    )}
                    {config.showInvoiceNo && (
                      <th>Invoice No</th>
                    )}
                    <th>Amount Dr</th>
                    <th>Amount Cr</th>
                    {config.showBalance && (
                      <th>Balance</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {entries.map(
                    (entry, index) => (

                      <tr key={index}>

                        <td>{entry.date}</td>

                        <td>{entry.ledger}</td>

                        {config.showNarration && (
                          <td>
                            {entry.narration}
                          </td>
                        )}

                        <td>
                          {entry.voucherType}
                        </td>

                        {config.showVoucherNo && (
                          <td>
                            {entry.voucherNo}
                          </td>
                        )}

                        {config.showInvoiceNo && (
                          <td>
                            {entry.invoiceNo}
                          </td>
                        )}

                        <td>
                          ₹
                          {entry.dr.toLocaleString()}
                        </td>

                        <td>
                          ₹
                          {entry.cr.toLocaleString()}
                        </td>

                        {config.showBalance && (
                          <td>
                            ₹
                            {entry.balance.toLocaleString()}
                          </td>
                        )}

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

            {/* TOTALS */}

            <div className="vendor-footer-summary">

              <div>

                <span>
                  Current Total Dr
                </span>

                <strong>
                  ₹
                  {totalDr.toLocaleString()}
                </strong>

              </div>

              <div>

                <span>
                  Current Total Cr
                </span>

                <strong>
                  ₹
                  {totalCr.toLocaleString()}
                </strong>

              </div>

              <div>

                <span>
                  Closing Balance
                </span>

                <strong>
                  ₹
                  {(
                    totalDr - totalCr
                  ).toLocaleString()}
                </strong>

              </div>

            </div>

            {/* ACTIONS */}

            <div className="vendor-actions">

              <button onClick={preview}>
                <Eye size={15} />
                Preview
              </button>

              <button onClick={excel}>
                <FileSpreadsheet size={15} />
                Excel
              </button>

              <button onClick={pdf}>
                <FileText size={15} />
                PDF
              </button>

              <button onClick={print}>
                <Printer size={15} />
                Print
              </button>

            </div>

          </div>
          )}

        </div>

      </div>

    </div>
    </div>
  );
};

export default VendorLedger;