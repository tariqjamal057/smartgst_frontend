import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/Contra.css";
import * as services from "../api/services";

export default function Contra() {
  const { collapsed } = useOutletContext();
  const [invoiceDate, setInvoiceDate] = useState(new Date());

  /* ================= VOUCHER NUMBER ================= */
  const VOUCHER_PREFIX = "CON/2025-26";
  const [currentCount, setCurrentCount] = useState(1);
  const [voucherNo, setVoucherNo] = useState(`${VOUCHER_PREFIX}/0001`);
  useEffect(() => {
    setVoucherNo(`${VOUCHER_PREFIX}/${String(currentCount).padStart(4, "0")}`);
  }, [currentCount]);

  const [mode, setMode] = useState("deposit");

  const [accounts, setAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState(null);
  const [fromSearch, setFromSearch] = useState("");
  const [fromOpen, setFromOpen] = useState(false);
  const [toAccount, setToAccount] = useState(null);
  const [toSearch, setToSearch] = useState("");
  const [toOpen, setToOpen] = useState(false);

  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState(null);
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [accRes, conRes] = await Promise.all([
          services.getAccounts({}),
          services.getContraVouchers({})
        ]);
        const acc = Array.isArray(accRes.data) ? accRes.data : accRes.data?.results ?? [];
        setAccounts(acc);
        const contras = Array.isArray(conRes.data) ? conRes.data : conRes.data?.results ?? [];
        const pfx = VOUCHER_PREFIX + "/";
        const max = contras.reduce((m, c) => {
          const n = Number(String(c.voucher_number || "").replace(pfx, "").replace(/\D/g, ""));
          return n > m ? n : m;
        }, 0);
        if (max > 0) setCurrentCount(max + 1);
      } catch (e) {
        console.error("Failed to load contra data:", e);
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

  const findCashAccount = () =>
    accounts.find((a) => (a.name || "").toLowerCase().includes("cash"));
  const findBankAccount = () =>
    accounts.find((a) => (a.name || "").toLowerCase().includes("bank"));

  // AUTO LOGIC
  const handleModeChange = (value) => {
    setMode(value);
    setFromAccount(null);
    setFromSearch("");
    setToAccount(null);
    setToSearch("");

    const cash = findCashAccount();
    const bank = findBankAccount();

    if (value === "deposit" && cash && bank) {
      setFromAccount(cash);
      setFromSearch(cash.name);
      setToAccount(bank);
      setToSearch(bank.name);
    } else if (value === "withdraw" && cash && bank) {
      setFromAccount(bank);
      setFromSearch(bank.name);
      setToAccount(cash);
      setToSearch(cash.name);
    }
  };

  const selectFromAccount = (account) => {
    setFromAccount(account);
    setFromSearch(account.name);
    setFromOpen(false);
  };

  const selectToAccount = (account) => {
    setToAccount(account);
    setToSearch(account.name);
    setToOpen(false);
  };

  const resetForm = () => {
    setMode("deposit");
    setFromAccount(null);
    setFromSearch("");
    setToAccount(null);
    setToSearch("");
    setChequeNo("");
    setChequeDate(null);
    setAmount("");
    setNarration("");
  };

  const handleSave = async (action = "save") => {
    const r2 = (n) => Math.round(n * 100) / 100;
    if (!fromAccount?.id) { alert("Select the From account."); return; }
    if (!toAccount?.id) { alert("Select the To account."); return; }
    if (fromAccount.id === toAccount.id) { alert("From and To accounts must be different."); return; }
    if ((Number(amount) || 0) <= 0) { alert("Enter a valid amount."); return; }

    const payload = {
      voucher_number: voucherNo,
      date: invoiceDate.toISOString().split("T")[0],
      contra_type: mode.toUpperCase(),
      from_account: fromAccount.id,
      to_account: toAccount.id,
      amount: r2(Number(amount) || 0),
      cheque_no: chequeNo || "",
      cheque_date: chequeDate ? chequeDate.toISOString().split("T")[0] : null,
      narration: narration,
    };
    try {
      setSaving(true);
      const res = await services.createContraVoucher(payload);
      setCurrentCount((prev) => prev + 1);
      if (action === "post") {
        await services.postContraVoucher(res.data.id);
      }
      alert(action === "post" ? "Contra saved and posted successfully!" : "Contra saved successfully!");
      resetForm();
    } catch (err) {
      const data = err.response?.data;
      const detail =
        (typeof data === "string" && data) ||
        (Array.isArray(data) && data[0]) ||
        data?.detail ||
        data?.voucher_number?.[0] ||
        data?.financial_year?.[0] ||
        JSON.stringify(data) ||
        err.message;
      alert("Failed to save Contra: " + detail);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="contra-app">
      <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
        <div className="contra-wrapper">

          {/* HEADER */}
          <div className="contra-header">
            <div className="contra-title-section">
              <div className="contra-icon-box">
                <i className="fas fa-exchange-alt"></i>
              </div>
              <div>
                <h2>Contra</h2>
                <div className="contra-voucher-row">
                  <span>Voucher No:</span>

                  <span className="contra-voucher-badge">
                    {voucherNo}
                  </span>
                </div>
              </div>

            </div>

            <div className="contra-date">
              <label>Date:</label>
              <DatePicker
                  selected={invoiceDate}
                  onChange={(date) => setInvoiceDate(date)}
                  dateFormat="dd/MM/yyyy"
                  maxDate={new Date()}   // prevent future date
                  className="date-input"

                  onChangeRaw={(e) => {
                    if (!e || !e.target) return;
                    let value = e.target.value || "";

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
          </div>

          {/* MODE */}
          <div className="contra-mode-card">
            <div className="contra-section-title">
              <div className="contra-section-icon">
                <i className="fas fa-random"></i>
              </div>
              <h3>Transaction Mode</h3>
            </div>
            <select
              value={mode}
              onChange={(e) => handleModeChange(e.target.value)}
            >
              <option value="deposit">Cash Deposit</option>
              <option value="withdraw">Cash Withdrawal</option>
              <option value="transfer">Bank to Bank</option>
            </select>

          </div>

          <hr />

          {/* LEDGER SECTION */}
          <div className="contra-ledger-title">
            <div className="contra-section-icon">
              <i className="fas fa-university"></i>
            </div>
            <h3>Ledger Details</h3>
          </div>
          <div className="contra-ledger">

            <div className="contra-row">
              <label>From</label>
              <div className="contra-search-box">
                <input
                  placeholder="Select From Account"
                  value={fromSearch}
                  onFocus={() => setFromOpen(true)}
                  onBlur={() =>
                    setTimeout(() => setFromOpen((cur) => (cur ? false : cur)), 150)
                  }
                  onChange={(e) => {
                    setFromSearch(e.target.value);
                    setFromAccount(null);
                  }}
                />
                {fromOpen && (
                  <div className="contra-search-dropdown">
                    {filterAccounts(fromSearch).length === 0 && (
                      <div className="contra-search-empty">No accounts found</div>
                    )}
                    {filterAccounts(fromSearch).map((a) => (
                      <div
                        key={a.id}
                        className="contra-search-option"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectFromAccount(a)}
                      >
                        <div className="contra-search-name">{a.name}</div>
                        <div className="contra-search-type">{a.account_type}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="contra-row">
              <label>To</label>
              <div className="contra-search-box">
                <input
                  placeholder="Select To Account"
                  value={toSearch}
                  onFocus={() => setToOpen(true)}
                  onBlur={() =>
                    setTimeout(() => setToOpen((cur) => (cur ? false : cur)), 150)
                  }
                  onChange={(e) => {
                    setToSearch(e.target.value);
                    setToAccount(null);
                  }}
                />
                {toOpen && (
                  <div className="contra-search-dropdown">
                    {filterAccounts(toSearch).length === 0 && (
                      <div className="contra-search-empty">No accounts found</div>
                    )}
                    {filterAccounts(toSearch).map((a) => (
                      <div
                        key={a.id}
                        className="contra-search-option"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectToAccount(a)}
                      >
                        <div className="contra-search-name">{a.name}</div>
                        <div className="contra-search-type">{a.account_type}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* CHEQUE DETAILS */}
          <div className="contra-cheque-title">
            <div className="contra-section-icon">
              <i className="fas fa-money-check"></i>
            </div>
            <h3>Cheque / Transaction Details</h3>
          </div>
          <div className="contra-extra">
            <div className="contra-row">
              <label>Chq No/Transcation No/URR No</label>
              <input
                value={chequeNo}
                onChange={(e) => setChequeNo(e.target.value)}
              />
            </div>
            <div className="contra-row">
              <label>Chq Date</label>
              <DatePicker
                  selected={chequeDate}
                  onChange={(date) => setChequeDate(date)}
                  dateFormat="dd/MM/yyyy"
                  maxDate={new Date()}   // prevent future date
                  className="date-input"

                  onChangeRaw={(e) => {
                    if (!e || !e.target) return;
                    let value = e.target.value || "";

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

            <div className="contra-row">
              <label>Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

          </div>

          <hr />

          {/* TOTAL */}
          <div className="contra-total-wrapper">
            <div className="contra-total-box">
              <span>TOTAL</span>
              <strong>
                ₹ {(Number(amount) || 0).toFixed(2)}
              </strong>
            </div>
          </div>

          {/* NARRATION */}
          <div className="contra-narration-box">
            <div className="contra-narration-title">
              <i className="fas fa-file-alt"></i>
              <span>Voucher Narration</span>
            </div>
            <textarea
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
            />
          </div>

          {/* ACTION */}
          <div className="contra-actions">
            <button className="cont-cancel-btn" onClick={resetForm}>
              <i className="fas fa-times"></i>
              Cancel
            </button>
            <button className="cont-save-btn" disabled={saving} onClick={() => handleSave("save")}>
              <i className="fas fa-save"></i>
              Save
            </button>
            <button className="cont-save-btn" disabled={saving} onClick={() => handleSave("post")}>
              <i className="fas fa-paper-plane"></i>
              Save & Post
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
