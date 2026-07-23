import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/PaymentInvoice.css";
import * as services from "../api/services";

export default function Payment() {
  const { collapsed } = useOutletContext();
  const navigate = useNavigate();

  const [paymentDate, setPaymentDate] = useState(new Date());
  const [ledger, setLedger] = useState("");
  const [voucherNo, setVoucherNo] = useState("PAY-01");
  const [parties, setParties] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  const [againstType, setAgainstType] = useState("invoice");
  const [rows, setRows] = useState([]);

  const [narration, setNarration] = useState("");

  const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [partiesRes, accountsRes] = await Promise.all([
          services.getParties(),
          services.getAccounts()
        ]);
        setParties(partiesRes.data.results || partiesRes.data || []);
        setAccounts(accountsRes.data.results || accountsRes.data || []);
      } catch {
        // use empty arrays
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const addRow = () => {
    setRows([...rows, { name: "", party_id: "", ref: "", against: "", amount: "" }]);
  };

  const removeRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (rows.length === 0) return;
    setSaving(true);
    try {
      for (const row of rows) {
        await services.createPaymentVoucher({
          date: paymentDate.toISOString().split("T")[0],
          voucher_no: voucherNo,
          payment_mode: ledger,
          party: row.party_id || null,
          party_name: row.name,
          reference_no: row.ref,
          against_type: againstType,
          against_reference: row.against,
          amount: Number(row.amount) || 0,
          narration: narration
        });
      }
      setRows([]);
      setNarration("");
      alert("Payment vouchers saved successfully");
    } catch {
      alert("Failed to save payment vouchers");
    } finally {
      setSaving(false);
    }
  };

  const bankAccounts = accounts.filter(
    (a) => a.account_type === "ledger" && (a.group === "Bank Accounts" || a.group === "Cash-in-Hand")
  );

  return (
  <div className="payment-app">
    <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
      <div className="payment-page">
        <div className="payment-card">
          <div className="payment-top-header">
            <div className="payment-title-section">
              <div className="payment-icon-box">
                <i className="fas fa-wallet"></i>
              </div>
              <div>
                <h2>Payment</h2>
                <div className="voucher-row">
                  <span>Voucher No:</span>
                  <span className="voucher-badge">{voucherNo}</span>
                </div>
              </div>
            </div>
            <div className="payment-date-box">
              <label>Payment Date:</label>
              <DatePicker
                selected={paymentDate}
                onChange={(date) => setPaymentDate(date)}
                dateFormat="dd/MM/yyyy"
                minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
                className="pay-date-input"
                onChangeRaw={(e) => {
                  if (!e || !e.target) return;
                  let value = e.target.value || "";
                  value = value.replace(/[^0-9/]/g, "");
                  if (value.length === 2 || value.length === 5) {
                    if (!value.endsWith("/")) value += "/";
                  }
                  if (value.length > 10) value = value.slice(0, 10);
                  const parts = value.split("/");
                  if (parts[0] && Number(parts[0]) > 31) parts[0] = "31";
                  if (parts[1] && Number(parts[1]) > 12) parts[1] = "12";
                  if (parts[2] && parts[2].length > 4) parts[2] = parts[2].slice(0, 4);
                  value = parts.join("/");
                  e.target.value = value;
                }}
              />
            </div>
          </div>

          <div className="payment-filter-row">
            <div className="payment-left-controls">
              <div className="pay-filter-group">
                <label>Payment by</label>
                <select value={ledger} onChange={(e) => setLedger(e.target.value)}>
                  <option value="">Select</option>
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
              <button
                className="new-ledger-btn"
                onClick={() => navigate("/Ledger", { state: { defaultGroup: "Bank Accounts" } })}
              >
                + New Ledger
              </button>
              <div className="pay-filter-group">
                <label>Against Type</label>
                <select value={againstType} onChange={(e) => setAgainstType(e.target.value)}>
                  <option value="invoice">Invoice</option>
                  <option value="advance">Advance</option>
                  <option value="on_account">On Account</option>
                </select>
              </div>
            </div>
          </div>

          <div className="customer-search-row">
            <input
              type="text"
              placeholder="Search Customer Name..."
            />
            <button className="pay-new-customer-btn">+ New Customer</button>
          </div>

          {loadingData && <div style={{ padding: 20, textAlign: "center" }}>Loading parties & accounts...</div>}

          <div className="payment-table-wrapper">
            <table className="payment-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Chq no / Ref. No</th>
                  {againstType === "invoice" && <th>Against to</th>}
                  <th>Amount (₹)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td className="customer-name">
                      <select
                        value={row.party_id || ""}
                        onChange={(e) => {
                          const partyId = e.target.value;
                          const party = parties.find((p) => String(p.id) === partyId);
                          handleChange(i, "party_id", partyId);
                          handleChange(i, "name", party ? party.name : "");
                        }}
                        style={{ width: "100%", padding: "6px 8px" }}
                      >
                        <option value="">Select Party</option>
                        {parties.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        value={row.ref}
                        placeholder="Enter Cheque / Reference No"
                        onChange={(e) => handleChange(i, "ref", e.target.value)}
                      />
                    </td>
                    {againstType === "invoice" && (
                      <td>
                        <input
                          type="text"
                          value={row.against}
                          placeholder="Enter Invoice"
                          onChange={(e) => handleChange(i, "against", e.target.value)}
                        />
                      </td>
                    )}
                    <td>
                      <input
                        value={row.amount}
                        placeholder="0.00"
                        onChange={(e) => handleChange(i, "amount", e.target.value)}
                      />
                    </td>
                    <td className="delete-cell">
                      <button className="pay-del-btn" onClick={() => removeRow(i)}>
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="add-row-btn" onClick={addRow}>+ Add Row</button>

          <div className="total-wrapper">
            <div className="total-box">
              <span>TOTAL</span>
              <strong>₹ {total.toFixed(2)}</strong>
            </div>
          </div>

          <div className="pay-narration-box">
            <label>Voucher Narration</label>
            <textarea
              value={narration}
              placeholder="Enter narration for this voucher..."
              onChange={(e) => setNarration(e.target.value)}
            />
          </div>

          <div className="action-buttons">
            <button className="save-btn-act" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button className="cancel-btn-act" onClick={() => { setRows([]); setNarration(""); }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
