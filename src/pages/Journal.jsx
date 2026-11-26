import { getFinancialYearLabel } from "../utils/financialYear";
  import { useState, useEffect } from "react";
  import { useOutletContext } from "react-router-dom";
  import DatePicker from "react-datepicker";
  import { FaTrash ,FaSearch,FaUniversity,FaTruck,FaPen,FaSave,
    FaPaperPlane,
    FaPrint,
    FaTimes } from "react-icons/fa";
  import "react-datepicker/dist/react-datepicker.css";
  import "../styles/Journal.css";
  import * as services from "../api/services";

  export default function Journal() {
    const { collapsed } = useOutletContext();
    const [invoiceDate, setInvoiceDate] = useState(new Date());

    const [narration, setNarration] = useState("");
    const [saving, setSaving] = useState(false);

    /* ================= VOUCHER NUMBER ================= */
    const VOUCHER_PREFIX = "JOU/" + getFinancialYearLabel();
    const [currentCount, setCurrentCount] = useState(1);
    const [voucherNo, setVoucherNo] = useState(`${VOUCHER_PREFIX}/0001`);
    useEffect(() => {
      setVoucherNo(`${VOUCHER_PREFIX}/${String(currentCount).padStart(4, "0")}`);
    }, [currentCount]);

    const [accounts, setAccounts] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [ledgerOpen, setLedgerOpen] = useState(null);

    const [rows, setRows] = useState([
  {
    type: "dr",
    account: null,
    ledger: "",
    adjust: "",
    invoice: "",
    amount: ""
  }
]);

  useEffect(() => {
    (async () => {
      try {
        const [accRes, invRes, jouRes] = await Promise.all([
          services.getAccounts({}),
          services.getSalesInvoices({}),
          services.getJournalVouchers({})
        ]);
        const acc = Array.isArray(accRes.data) ? accRes.data : accRes.data?.results ?? [];
        const inv = Array.isArray(invRes.data) ? invRes.data : invRes.data?.results ?? [];
        const journals = Array.isArray(jouRes.data) ? jouRes.data : jouRes.data?.results ?? [];
        setAccounts(acc);
        setInvoices(inv);
        const pfx = VOUCHER_PREFIX + "/";
        const max = journals.reduce((m, j) => {
          const n = Number(String(j.voucher_number || "").replace(pfx, "").replace(/\D/g, ""));
          return n > m ? n : m;
        }, 0);
        if (max > 0) setCurrentCount(max + 1);
      } catch (e) {
        console.error("Failed to load data:", e);
      }
    })();
  }, []);

  const filterAccounts = (search) => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        (a.name || "").toLowerCase().includes(q) ||
        (a.account_type || "").toLowerCase().includes(q)
    );
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const handleLedgerChange = (index, value) => {
    const updated = [...rows];
    updated[index].ledger = value;
    const match = accounts.find((a) => a.name === value);
    updated[index].account = match ? match.id : null;
    setRows(updated);
  };

  const selectLedger = (index, account) => {
    const updated = [...rows];
    updated[index].ledger = account.name;
    updated[index].account = account.id;
    setRows(updated);
    setLedgerOpen(null);
  };

  const resetForm = () => {
    setRows([
      {
        type: "dr",
        account: null,
        ledger: "",
        adjust: "",
        invoice: "",
        amount: ""
      }
    ]);
    setNarration("");
  };

    const handleSave = async (action = "save") => {
      const r2 = (n) => Math.round(n * 100) / 100;
      const rowsToSave = rows.filter(
        (r) => r.account && (Number(r.amount) || 0) > 0
      );
      if (rowsToSave.length === 0) {
        alert("Add at least one ledger entry with an amount.");
        return;
      }
      const missingAccount = rows.find(
        (r) => (Number(r.amount) || 0) > 0 && !r.account
      );
      if (missingAccount) {
        alert("Select a valid account from the ledger list for every entry.");
        return;
      }
      const entries = rowsToSave.map((r) => {
        const amount = r2(Number(r.amount) || 0);
        return {
          account: r.account,
          debit: r.type === "dr" ? amount : 0,
          credit: r.type === "cr" ? amount : 0
        };
      });
      const payload = {
        voucher_number: voucherNo,
        date: invoiceDate.toISOString().split("T")[0],
        narration: narration,
        entries: entries
      };
      try {
        setSaving(true);
        const res = await services.createJournalVoucher(payload);
        setCurrentCount((prev) => prev + 1);
        if (action === "send") {
          await services.postJournalVoucher(res.data.id);
        }
        alert(action === "send" ? "Journal saved and posted successfully!" : "Journal saved successfully!");
        resetForm();
      } catch (err) {
        const data = err.response?.data;
        const detail =
          (typeof data === "string" && data) ||
          (Array.isArray(data) && data[0]) ||
          data?.detail ||
          data?.voucher_number?.[0] ||
          data?.financial_year?.[0] ||
          data?.entries?.[0] ||
          JSON.stringify(data) ||
          err.message;
        alert("Failed to save Journal: " + detail);
      } finally {
        setSaving(false);
      }
    };
  const totalDr = rows.reduce(

  (sum, row) =>

    row.type === "dr"
      ? sum + (Number(row.amount) || 0)
      : sum,

  0

);

const totalCr = rows.reduce(

  (sum, row) =>

    row.type === "cr"
      ? sum + (Number(row.amount) || 0)
      : sum,

  0

);

    return (
      <div className="journal-app">
        <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
          <div className="journal-wrapper">

            {/* HEADER */}
            <div className="journal-header">
              <div className="journal-title-section">

                <div className="journal-icon-box">
                  <i className="fas fa-book"></i>
                </div>

                <div>
                  <h2>Journal</h2>

                  <div className="journal-voucher-row">
                    <span>Voucher No:</span>

                    <span className="journal-voucher-badge">
                      {voucherNo}
                    </span>
                  </div>
                </div>
              </div>
              <div className="journal-date">
                <label>Date:</label>
                <DatePicker
                    selected={invoiceDate}
                    onChange={(date) => setInvoiceDate(date)}
                    dateFormat="dd/MM/yyyy"
                    maxDate={new Date()}   // prevent future date
                    className="j-date-input"
    
                    onChangeRaw={(e) => {
                      let value = e.target.value;
    
                      // 🔥 limit total length (dd/MM/yyyy = 10 chars)
                      if (value.length > 10) {
                        value = value.slice(0, 10);
                      }
    
                      const parts = value.split("/");
    
                      // 🔥 restrict year to max 4 digits
                      if (parts[2] && parts[2].length > 4) {
                        parts[2] = parts[2].slice(0, 4);
                        value = parts.join("/");
                      }
    
                      e.target.value = value;
                    }}
                  />
              </div>
              {/* <div className="journal-mode">
                <label>Transaction Mode:</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="single">Single Entry</option>
                  <option value="double">Double Entry</option>
                </select>
              </div> */}
            </div>

            {/* LEDGER */}
            {/* <div className="ledger-select">
              <label>Ledger Name:</label>
              <select
                value={ledger}
                onChange={(e) => setLedger(e.target.value)}
              >
                <option>Select Bank / Cash ledger</option>
                <option>Cash</option>
                <option>Bank</option>
              </select>
            </div> */}

            <hr />

            {/* TABLE HEADER */}
            {/* {mode === "single" && (
            <>
              <div className="journal-table-head">
                <span>Ledger Name</span>
                <span className="right">Amount</span>
              </div>

              <div className="journal-row">
                <input placeholder="Ledger Name" />

                <input
                  className="amount-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </>
          )} */}
          {/* {mode === "double" && (
            <>
              <div className="journal-table-head">
                <span>Ledger</span>
                <span>Adjust</span>
                <span>Invoice No</span>
                <span>Dr Amount</span>
                <span>Cr Amount</span>
              </div>

              {rows.map((row, i) => (
                <div key={i} className="journal-row">

                  <input
                    className="col-ledger"
                    placeholder="Ledger"
                    onChange={(e) => {
                      const d = [...rows];
                      d[i].ledger = e.target.value;
                      setRows(d);
                    }}
                  />

                  <select
                    className="col-ledger"
                    value={row.adjust}
                    onChange={(e) => {
                      const d = [...rows];
                      d[i].adjust = e.target.value;
                      setRows(d);
                    }}
                  >
                    <option value="">Select</option>
                    <option value="invoice">Invoice</option>
                    <option value="on_account">On Account</option>
                  </select>

                  {row.adjust === "invoice" ? (
                    <select
                      className="col-invoice"
                      onChange={(e) => {
                        const d = [...rows];
                        d[i].invoice = e.target.value;
                        setRows(d);
                      }}
                    >
                      <option>Select Invoice</option>
                      <option>INV-001</option>
                    </select>
                  ) : (
                    <input className="col-invoice" disabled placeholder="N/A" />
                  )}

                  <input
                    className="col-dr"
                    placeholder="Dr"
                    onChange={(e) => {
                      const d = [...rows];
                      d[i].dr = e.target.value;
                      setRows(d);
                    }}
                  />

                  <input
                    className="col-dr"
                    placeholder="Cr"
                    onChange={(e) => {
                      const d = [...rows];
                      d[i].cr = e.target.value;
                      setRows(d);
                    }}
                  />

                </div>
              ))}
            </>
          )} */}
          <div className="journal-table-head">
            <span>Type</span>
            <span>Ledger Name</span>
            <span>Adjust To</span>
            <span>Invoice No</span>
            <span>Dr Amount</span>
            <span>Cr Amount</span>
          </div>
          {rows.map((row, i) => (
            <div key={i} className="journal-row">
              {/* TYPE */}
              <select
                className="col-type"
                value={row.type}
                onChange={(e) => {
                  const updated = [...rows];
                  updated[i].type = e.target.value;
                  updated[i].amount = "";
                  setRows(updated);
                }}
              >
                <option value="dr">DR</option>
                <option value="cr">CR</option>
              </select>
              {/* LEDGER */}
              <div className="ledger-search-box">
                <input
                  className="col-ledger"
                  placeholder="Ledger Name"
                  value={row.ledger}
                  onFocus={() => setLedgerOpen(i)}
                  onBlur={() =>
                    setTimeout(() => setLedgerOpen((cur) => (cur === i ? null : cur)), 150)
                  }
                  onChange={(e) => handleLedgerChange(i, e.target.value)}
                />
                {ledgerOpen === i && (
                  <div className="ledger-search-dropdown">
                    {filterAccounts(row.ledger).length === 0 && (
                      <div className="ledger-search-empty">No accounts found</div>
                    )}
                    {filterAccounts(row.ledger).map((a) => (
                      <div
                        key={a.id}
                        className="ledger-search-option"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectLedger(i, a)}
                      >
                        <div className="ledger-search-name">{a.name}</div>
                        <div className="ledger-search-type">{a.account_type}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* ADJUST */}
              <select
                className="col-adjust"
                value={row.adjust}
                onChange={(e) => {
                  const updated = [...rows];
                  updated[i].adjust = e.target.value;
                  setRows(updated);
                }}
              >
                <option value="">Select</option>
                <option value="invoice">
                  Invoice
                </option>
                <option value="on_account">
                  On Account
                </option>
              </select>
              {/* INVOICE */}

              {row.adjust === "invoice" ? (
                <select
                  className="col-invoice"
                  value={row.invoice}
                  onChange={(e) => handleRowChange(i, "invoice", e.target.value)}
                >
                  <option value="">Select Invoice</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.voucher_number}>
                      {inv.voucher_number}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="col-invoice disabled"
                  placeholder="N/A"
                  disabled
                />
              )}
              {/* DR */}
              <input
                className="col-dr"
                placeholder="0.00"
                disabled={row.type !== "dr"}
                value={row.type === "dr"
                  ? row.amount
                  : ""
                }
                onChange={(e) => {
                  const updated = [...rows];
                  updated[i].amount = e.target.value;
                  setRows(updated);
                  // AUTO ADD NEW ROW
                  if (
                    i === rows.length - 1 &&
                    updated[i].ledger &&
                    updated[i].amount
                  ) {
                    setRows([
                      ...updated,
                      {
                        type: "dr",
                        account: null,
                        ledger: "",
                        adjust: "",
                        invoice: "",
                        amount: ""
                      }
                    ]);
                  }
                }}
              />
              {/* CR */}
              <input
                className="col-cr"
                placeholder="0.00"
                disabled={row.type !== "cr"}
                value={row.type === "cr"
                  ? row.amount
                  : ""
                }
                onChange={(e) => {
                  const updated = [...rows];
                  updated[i].amount = e.target.value;
                  setRows(updated);
                  // AUTO ADD NEW ROW
                  if (
                    i === rows.length - 1 &&
                    updated[i].ledger &&
                    updated[i].amount
                  ) {
                    setRows([
                      ...updated,
                      {
                        type: "dr",
                        account: null,
                        ledger: "",
                        adjust: "",
                        invoice: "",
                        amount: ""
                      }
                    ]);
                  }
                }}
              />
            </div>
          ))}
            <hr />
            {/* TOTAL */}
            <div className="J-total-wrapper">
              <div className="J-total-box">
                <span>Total DR</span>
                <input
                  value={totalDr.toFixed(2)}
                  readOnly
                />
              </div>
              <div className="J-total-box-cr">
                <span>Total CR</span>
                <input
                  value={totalCr.toFixed(2)}
                  readOnly
                />
              </div>
              {/* <div className="J-total-box diff">
                <span>Difference</span>
                <input
                  value={Math.abs(
                    totalDr - totalCr
                  ).toFixed(2)}
                  readOnly
                />
              </div> */}
            </div>
            {/* NARRATION */}
            <div className="J-narration">
              <div className="journal-narration-title">
                <i className="fas fa-file-invoice"></i>
                <span>Voucher Narration</span>
              </div>
              <textarea
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
              />
            </div>
            {/* ACTIONS */}
            <div className="J-actions">
              <button className="J-save-btn" onClick={() => handleSave("save")} disabled={saving}><FaSave />{saving ? "Saving..." : "Save"}</button>
              <button className="J-save-btn" onClick={() => handleSave("send")} disabled={saving}><FaPaperPlane />Save & Post</button>
              <button className="j-cancel-btn" onClick={resetForm}><FaTimes />Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }