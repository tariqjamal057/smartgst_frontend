import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/ReceiptInvoice.css";
import * as services from "../api/services";

const VOUCHER_PREFIX = "REC/2025-26";

const states = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand",
  "Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal"
];

export default function Receipt() {
  const { collapsed } = useOutletContext();
  const navigate = useNavigate();

  const [voucherNo, setVoucherNo] = useState("");
  const [againstType, setAgainstType] = useState("invoice");
  const [reciptDate, setReciptDate] = useState(new Date());
  const [ledger, setLedger] = useState("");
  const [currentCount, setCurrentCount] = useState(1);
  const [parties, setParties] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState([]);
  const [narration, setNarration] = useState("");
  const [invoices, setInvoices] = useState([]);

  const [customer, setCustomer] = useState({});
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [openStateDropdown, setOpenStateDropdown] = useState(false);
  const [selectedState, setSelectedState] = useState("");

  const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const generateVoucherNo = (count) => {
    const number = String(count).padStart(4, "0");
    return `${VOUCHER_PREFIX}/${number}`;
  };

  useEffect(() => {
    setVoucherNo(generateVoucherNo(currentCount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCount]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [partiesRes, accountsRes, vouchersRes, invoicesRes] = await Promise.all([
          services.getParties({ type: "customer" }),
          services.getAccounts(),
          services.getReceiptVouchers({}),
          services.getSalesInvoices({})
        ]);
        setParties(Array.isArray(partiesRes.data) ? partiesRes.data : partiesRes.data?.results ?? []);
        setAccounts(Array.isArray(accountsRes.data) ? accountsRes.data : accountsRes.data?.results ?? []);
        setInvoices(Array.isArray(invoicesRes.data) ? invoicesRes.data : invoicesRes.data?.results ?? []);
        const vouchers = Array.isArray(vouchersRes.data) ? vouchersRes.data : vouchersRes.data?.results ?? [];
        const nums = vouchers
          .map((v) => v.voucher_number || "")
          .filter((x) => x.startsWith(VOUCHER_PREFIX + "/"))
          .map((x) => Number(x.replace(VOUCHER_PREFIX + "/", "").replace(/\D/g, "")) || 0);
        setCurrentCount((nums.length ? Math.max(...nums) : 0) + 1);
      } catch (e) {
        console.error("Failed to load receipt data:", e);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return parties;
    return parties.filter((c) =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.gstin || "").toLowerCase().includes(q)
    );
  }, [parties, customerSearch]);

  const selectCustomer = (cust) => {
    setCustomerSearch(cust.name);
    setShowCustomerDropdown(false);
    setRows((prev) => [...prev, { name: cust.name, party_id: cust.id, ref: "", against: "", amount: "" }]);
  };

  const isValidGST = (gst) => {
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
    return regex.test(gst);
  };

  const mapRegistrationToGstType = (reg) => {
    const r = (reg || "").toLowerCase();
    if (r.includes("composition")) return "REGISTERED_BUSINESS_COMPOSITION";
    if (r.includes("regular") || r.includes("sez") || r.includes("export") || r.includes("e-commerce") || r.includes("distributor")) return "REGISTERED_BUSINESS_REGULAR";
    return "UNREGISTERED";
  };

  const fetchGstForCustomer = async () => {
    const gstin = (customer.gstin || "").trim().toUpperCase();
    if (!isValidGST(gstin)) { alert("Invalid GSTIN"); return; }
    try {
      const res = await services.lookupGst(gstin);
      const data = res.data;
      if (data.success) {
        setCustomer((prev) => ({
          ...prev,
          gstin: data.gstin || gstin,
          name: data.company_name || prev.name,
          address1: data.address || prev.address1,
          address2: data.branch_address || prev.address2,
          email: data.email || prev.email,
          contact: data.contact_person || prev.contact,
          mobile: data.contact_no || prev.mobile,
          state: data.state || prev.state
        }));
        if (data.state) setSelectedState(data.state);
      } else {
        alert("GST not found");
      }
    } catch (error) {
      console.error(error);
      alert("GST lookup failed: " + (error.response?.data?.detail || error.message));
    }
  };

  const saveCustomer = async () => {
    if (!customer.name || !customer.name.trim()) { alert("Party Name required"); return; }
    const pan = (customer.pan || "").trim().toUpperCase();
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) { alert("Invalid PAN: must be 10 characters (e.g. ABCDE1234F)"); return; }
    const gstin = (customer.gstin || "").trim().toUpperCase();
    if (gstin && !isValidGST(gstin)) { alert("Invalid GSTIN"); return; }
    try {
      const res = await services.createParty({
        name: customer.name.trim(),
        party_type: "CUSTOMER",
        gstin,
        phone: customer.contact || "",
        email: customer.email || "",
        pan,
        state: customer.state || "",
        billing_address: [customer.address1, customer.address2, customer.pin].filter(Boolean).join(", "),
        gst_type: mapRegistrationToGstType(customer.registration)
      });
      const created = res.data;
      setParties((prev) => [...prev, created]);
      selectCustomer(created);
      setShowCustomerPopup(false);
      alert("Customer created successfully!");
    } catch (err) {
      const data = err.response?.data;
      const msg =
        (typeof data === "string" && data) ||
        (Array.isArray(data) && data[0]) ||
        data?.detail ||
        data?.name?.[0] ||
        err.message ||
        "Failed to save customer";
      alert(msg);
    }
  };

  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const addRow = () => {
    setRows([...rows, { name: "", party_id: "", ref: "", against: "", amount: "" }]);
  };

  const resetForm = () => {
    setRows([]);
    setNarration("");
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };

  const handleSave = async (mode = "save") => {
    const validRows = rows.filter((r) => r.party_id && Number(r.amount) > 0);
    if (validRows.length === 0) { alert("Add at least one row with party and amount"); return; }
    if (!ledger) { alert("Please select a Receipt To account"); return; }
    setSaving(true);
    try {
      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        const amount = Math.round((Number(row.amount) || 0) * 100) / 100;
        const res = await services.createReceiptVoucher({
          voucher_number: generateVoucherNo(currentCount + i),
          date: reciptDate.toISOString().split("T")[0],
          party: row.party_id,
          received_in: Number(ledger),
          amount,
          narration: narration
        });
        if (mode === "send" && res.data && res.data.id) {
          await services.postReceiptVoucher(res.data.id);
        }
      }
      setCurrentCount((c) => c + validRows.length);
      setRows([]);
      setNarration("");
      alert(mode === "send" ? "Receipt vouchers posted successfully" : "Receipt vouchers saved successfully");
    } catch (err) {
      const data = err.response?.data;
      const msg =
        (typeof data === "string" && data) ||
        data?.detail ||
        (Array.isArray(data) && data[0]) ||
        JSON.stringify(data) ||
        err.message ||
        "Failed to save receipt vouchers";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const bankAccounts = accounts.filter(
    (a) => (a.name || "").toLowerCase().includes("bank") || (a.name || "").toLowerCase().includes("cash")
  );

  return (
  <div className="receipt-app">
    <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
      <div className="receipt-page">

        <div className="receipt-card">

          {/* Header */}
          <div className="receipt-top-header">

            <div className="receipt-title-section">
              <div className="receipt-icon-box">
                <i className="fas fa-receipt"></i>
              </div>

              <div>
                <h2>Receipt</h2>

                <div className="receipt-voucher-row">
                  <span>Voucher No:</span>
                  <span className="receipt-voucher-badge">
                    {voucherNo}
                  </span>
                </div>
              </div>
            </div>

            <div className="receipt-date-box">
              <label>Receipt Date:</label>

              <DatePicker
                selected={reciptDate}
                onChange={(date) => setReciptDate(date)}
                dateFormat="dd/MM/yyyy"
                minDate={
                  new Date(
                    new Date().setFullYear(
                      new Date().getFullYear() - 1
                    )
                  )
                }
                className="receipt-date-input"
                onChangeRaw={(e) => {
                  if (!e || !e.target) return;

                  let value = e.target.value || "";

                  value = value.replace(/[^0-9/]/g, "");

                  if (value.length === 2 || value.length === 5) {
                    if (!value.endsWith("/")) value += "/";
                  }

                  if (value.length > 10) {
                    value = value.slice(0, 10);
                  }

                  const parts = value.split("/");

                  if (parts[0] && Number(parts[0]) > 31)
                    parts[0] = "31";

                  if (parts[1] && Number(parts[1]) > 12)
                    parts[1] = "12";

                  if (
                    parts[2] &&
                    parts[2].length > 4
                  ) {
                    parts[2] = parts[2].slice(0, 4);
                  }

                  value = parts.join("/");
                  e.target.value = value;
                }}
              />
            </div>
          </div>

          {/* Receipt To */}
          <div className="receipt-filter-row">

            <div className="receipt-left-controls">

              <div className="receipt-filter-group">
                <label>Receipt To</label>

                <select
                  value={ledger}
                  onChange={(e) =>
                    setLedger(e.target.value)
                  }
                >
                  <option value="">Select</option>
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <button
                className="receipt-ledger-btn"
                onClick={() =>
                  navigate("/Ledger", {
                    state: {
                      defaultGroup:
                        "Bank Accounts",
                    },
                  })
                }
              >
                + New Ledger
              </button>

              <div className="receipt-filter-group">
                <label>Against Type</label>

                <select
                  value={againstType}
                  onChange={(e) =>
                    setAgainstType(
                      e.target.value
                    )
                  }
                >
                  <option value="invoice">
                    Invoice
                  </option>
                  <option value="advance">
                    Advance
                  </option>
                  <option value="on_account">
                    On Account
                  </option>
                </select>
              </div>

            </div>
          </div>

          {/* Search */}
          <div className="receipt-search-row">
            <div className="receipt-search-box">
              <div className="credit-search-input-wrapper">
                <FaSearch className="sale-search-icon" />
                <input
                  type="text"
                  placeholder="Search Customer Name..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                />
              </div>
              {showCustomerDropdown && (
                <div className="customer-search-dropdown">
                  {filteredCustomers.length === 0 && (
                    <div className="customer-search-empty">No customers found</div>
                  )}
                  {filteredCustomers.map((cust) => (
                    <div
                      key={cust.id}
                      className="customer-search-option"
                      onClick={() => selectCustomer(cust)}
                    >
                      <div className="customer-search-name">{cust.name}</div>
                      <div className="customer-search-gstin">{cust.gstin || ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="receipt-new-customer-btn" onClick={() => setShowCustomerPopup(true)}>+ New Customer</button>
          </div>

          {loadingData && <div style={{ padding: 20, textAlign: "center" }}>Loading parties & accounts...</div>}

          {/* Table */}
          <div className="receipt-table-wrapper">
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Chq no / Ref. No</th>

                  {againstType ===
                    "invoice" && (
                    <th>Against To</th>
                  )}

                  <th>Amount (₹)</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td className="receipt-customer-name">
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
                        onChange={(e) =>
                          handleChange(
                            i,
                            "ref",
                            e.target.value
                          )
                        }
                      />
                    </td>

                    {againstType === "invoice" && (
                      <td>
                        <select
                          value={row.against || ""}
                          onChange={(e) => handleChange(i, "against", e.target.value)}
                          style={{ width: "100%", padding: "6px 8px" }}
                        >
                          <option value="">Select Invoice</option>
                          {invoices.map((inv) => (
                            <option key={inv.id} value={inv.voucher_number}>{inv.voucher_number}</option>
                          ))}
                        </select>
                      </td>
                    )}

                    <td>
                      <input
                        value={row.amount}
                        placeholder="0.00"
                        onChange={(e) =>
                          handleChange(
                            i,
                            "amount",
                            e.target.value
                          )
                        }
                      />
                    </td>

                    <td className="receipt-delete-cell">
                      <button
                        className="receipt-del-btn"
                        onClick={() => {
                          setRows(rows.filter((_, index) => index !== i));
                        }}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Row */}
          <button
            className="receipt-add-row-btn"
            onClick={addRow}
          >
            + Add Row
          </button>

          {/* Total */}
          <div className="receipt-total-wrapper">
            <div className="receipt-total-box">
              <span>TOTAL</span>

              <strong>
                ₹{" "}
                {total.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </strong>
            </div>
          </div>

          {/* Narration */}
          <div className="receipt-narration-box">
            <label>
              Voucher Narration
            </label>

            <textarea
              value={narration}
              placeholder="Enter narration for this voucher..."
              onChange={(e) =>
                setNarration(
                  e.target.value
                )
              }
            />
          </div>

          {/* Actions */}
          <div className="receipt-action-buttons">
            <button className="receipt-save-btn" onClick={() => handleSave("save")} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>

            <button className="receipt-send-btn" onClick={() => handleSave("send")} disabled={saving}>
              {saving ? "Saving..." : "Save & Send"}
            </button>

            <button className="receipt-print-btn" onClick={() => window.print()}>
              Print
            </button>

            <button className="receipt-cancel-btn" onClick={resetForm}>
              Cancel
            </button>
          </div>

          {/* New Customer Popup */}
          {showCustomerPopup && (
            <div className="cust-overlay" onClick={() => setShowCustomerPopup(false)}>
              <div className="cust-popup" onClick={(e) => e.stopPropagation()}>
                <div className="cust-header">
                  <h3>Add New Customer</h3>
                  <button className="cust-close-btn" onClick={() => setShowCustomerPopup(false)}>✕</button>
                </div>
                <div className="cust-form-wrapper">
                  <div className="cust-left">
                    <div className="cust-gst-row">
                      <input
                        className="cust-input"
                        placeholder="GSTIN / URP"
                        onChange={(e) => setCustomer({ ...customer, gstin: e.target.value })}
                      />
                      <button className="cust-get-btn" onClick={fetchGstForCustomer}>Get Data</button>
                    </div>
                    <input className="cust-input" placeholder="Party Name"
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    />
                    <input className="cust-input" placeholder="Billing Address 1"
                      onChange={(e) => setCustomer({ ...customer, address1: e.target.value })}
                    />
                    <input className="cust-input" placeholder="Billing Address 2"
                      onChange={(e) => setCustomer({ ...customer, address2: e.target.value })}
                    />
                    <input className="cust-input" placeholder="Pin"
                      onChange={(e) => setCustomer({ ...customer, pin: e.target.value })}
                    />
                    <div className="cust-select">
                      <div className="cust-select-box" onClick={() => setOpenStateDropdown(!openStateDropdown)}>
                        {selectedState || "Select State"}
                        <span className="arrow">▼</span>
                      </div>
                      {openStateDropdown && (
                        <div className="cust-select-dropdown">
                          {states.map((state) => (
                            <div
                              key={state}
                              className="cust-option"
                              onClick={() => {
                                setSelectedState(state);
                                setCustomer({ ...customer, state });
                                setOpenStateDropdown(false);
                              }}
                            >
                              {state}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <input className="cust-input" placeholder="Contact No"
                      onChange={(e) => setCustomer({ ...customer, contact: e.target.value })}
                    />
                    <input className="cust-input" placeholder="Email ID"
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    />
                    <input className="cust-input" placeholder="PAN"
                      onChange={(e) => setCustomer({ ...customer, pan: e.target.value })}
                    />
                    <div className="cust-row">
                      <input className="cust-input" placeholder="Opening Balance"
                        onChange={(e) => setCustomer({ ...customer, balance: e.target.value })}
                      />
                      <select className="cust-input"
                        onChange={(e) => setCustomer({ ...customer, drcr: e.target.value })}
                      >
                        <option>Dr</option>
                        <option>Cr</option>
                      </select>
                    </div>
                  </div>
                  <div className="cust-right">
                    <label>Registration Type</label>
                    <select className="sale-cust-input"
                      onChange={(e) => setCustomer({ ...customer, registration: e.target.value })}
                    >
                      <option>Select</option>
                      <option>Composition</option>
                      <option>Regular</option>
                      <option>Unregistered / Consumer</option>
                      <option>Government Entity / TDS</option>
                      <option>Regular - SEZ</option>
                      <option>Regular - Exports (EOU)</option>
                      <option>E-Commerce Operator</option>
                      <option>Input Service Distributor</option>
                      <option>Embassy / UN Body</option>
                      <option>Non Resident Taxpayer</option>
                    </select>
                  </div>
                </div>
                <div className="cust-actions">
                  <button className="cust-save-btn" onClick={saveCustomer}>Save Customer</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  </div>
);
}
