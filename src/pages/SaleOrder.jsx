import { useState,useEffect,useMemo } from "react";
import { useOutletContext,useNavigate } from "react-router-dom";
import { FaTrash ,FaSearch,FaUniversity,FaTruck,FaPen,FaSave,
  FaPaperPlane,
  FaPrint,
  FaTimes } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/SaleOrder.css";
import * as services from "../api/services";

export default function SaleOrder() {
  const { collapsed } = useOutletContext();

  /* ================= HEADER ================= */

  const [sodisDate, setSodisDate] = useState(new Date());
  const [soDate, setSoDate] = useState(new Date());
  const [soRef, setSoRef] = useState("");
  const navigate = useNavigate();
  const [soType, setSoType] = useState("");
  const [buyer, setBuyer] = useState("");


  /* ================= CUSTOMER ================= */
   const [billedTo, setBilledTo] = useState({
  name: "",
  address: "",
  contact: "",
  mobile: "",
  gstin: "",
  pos: ""
});
  const [shippedTo, setShippedTo] = useState({
  name: "",
  address: "",
  contact: "",
  mobile: "",
  gstin: "",
  pos: ""
});

  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [itemsList, setItemsList] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [transporter, setTransporter] = useState("");
  const [portOfExport, setPortOfExport] = useState("");
  const [narration, setNarration] = useState("");

  /* ================= TERMS ================= */
  const [paymentTerms, setPaymentTerms] = useState("");
  const [soTerms, setSoTerms] = useState("");

  /* ================= ITEMS ================= */
  const [items, setItems] = useState([
  {
    id: Date.now(),
    itemId: null,
    description: "",
    hsn: "",
    qty: "",
    price: "",
    gst: "0"
  }
]);

  const addRow = () => {
    setItems([
      ...items,
      {
        id: Date.now() + Math.random(),
        itemId: null,
        description: "",
        hsn: "",
        qty: "",
        price: "",
        gst: "0"
      }
    ]);
  };

  const handleChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  /* ================= CALCULATIONS ================= */
  const subtotal = items.reduce((sum, i) => {
    const qty = Number(i.qty) || 0;
    const price = Number(i.price) || 0;
    return sum + qty * price;
  }, 0);

  const totalGST = items.reduce((sum, i) => {
    const qty = Number(i.qty) || 0;
    const price = Number(i.price) || 0;
    const gst = Number(i.gst) || 0;
    return sum + ((qty * price) * gst) / 100;
  }, 0);

  const cgst = totalGST / 2;
  const sgst = totalGST / 2;

  const total = subtotal + totalGST;
  const [soNo, setSoNo] = useState("");
    const [manualEntry, setManualEntry] = useState(false);
    const [showInvoiceSettings, setShowInvoiceSettings] = useState(false);
    const [currentCount, setCurrentCount] = useState(1);
    const [crConfig, setCrConfig] = useState({
       prefix: "Tax/2025-26",
       zero: '',
       start: '',
       manual_pre: false
     });
     const generateInvoice = () => {
    const { prefix, zero } = crConfig;
    const zeroCount = Number(zero) || 0;
    let number = String(currentCount);
    // 🔥 final output ALWAYS 4 digit
    const totalLength = zeroCount + number.length;
    if (totalLength > 4) {
      // trim number from left
      number = number.slice(0, 4 - zeroCount);
    }
    // pad remaining
    const finalNumber = "0".repeat(zeroCount) + number;
    return `${prefix}/${finalNumber}`;
  };
  useEffect(() => {
     if (!manualEntry) {
       setSoNo(generateInvoice());
     }
   }, [currentCount, crConfig, manualEntry]);
  const [voucherCount, setVoucherCount] = useState(1);
  const generateVoucher = () => {
    const number = String(voucherCount).padStart(2, "0");
    return `SO-${number}`;
  };
  /* ============= Dispatch ======================= */
  const [shippingDate, setshippingDate] = useState(new Date());
  const [gstin, setGstin] = useState("");
  const [gstData, setGstData] = useState(null);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstError, setGstError] = useState("");
  const [saving, setSaving] = useState(false);
  const validateGST = async (value) => {
    if (value.length !== 15) return;
  
    try {
      setGstLoading(true);
      setGstError("");
      setGstData(null);
  
      const res = await services.lookupGst(value);
      setGstData(res.data);
    } catch (err) {
      setGstError("Error validating GSTIN");
    } finally {
      setGstLoading(false);
    }
  };
  const handleGSTChange = (e) => {
    const value = e.target.value.toUpperCase();
  
    setGstin(value);
  
    if (value.length === 15) {
      validateGST(value);
    } else {
      setGstData(null);
      setGstError("");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [custRes, itemRes, vendRes, ordRes] = await Promise.all([
          services.getParties({ type: "customer" }),
          services.getItems({}),
          services.getParties({ type: "vendor" }),
          services.getSaleOrders({})
        ]);
        const cust = Array.isArray(custRes.data) ? custRes.data : custRes.data?.results ?? [];
        const itm = Array.isArray(itemRes.data) ? itemRes.data : itemRes.data?.results ?? [];
        const vend = Array.isArray(vendRes.data) ? vendRes.data : vendRes.data?.results ?? [];
        setCustomers(cust);
        setItemsList(itm);
        setTransporters(vend);
        const orders = Array.isArray(ordRes.data) ? ordRes.data : ordRes.data?.results ?? [];
        const prefix = crConfig.prefix + "/";
        const nums = orders
          .map((o) => o.order_number || "")
          .filter((v) => v.startsWith(prefix))
          .map((v) => Number(v.replace(prefix, "").replace(/\D/g, "")) || 0);
        const max = nums.length ? Math.max(...nums) : 0;
        if (max > 0) setCurrentCount(max + 1);
      } catch (e) {
        console.error("Failed to load data:", e);
      }
    })();
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.gstin || "").toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const selectCustomer = (cust) => {
    setSelectedParty(cust);
    setCustomerSearch(cust.name);
    setShowCustomerDropdown(false);
    const billed = {
      name: cust.name || "",
      address: cust.billing_address || "",
      contact: cust.contact || "",
      mobile: cust.phone || "",
      gstin: cust.gstin || "",
      pos: cust.state || ""
    };
    setBilledTo(billed);
    setShippedTo(billed);
  };

  const resetForm = () => {
    setItems([{ id: Date.now(), itemId: null, description: "", hsn: "", qty: "", price: "", gst: "0" }]);
    setSelectedParty(null);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setBilledTo({ name: "", address: "", contact: "", mobile: "", gstin: "", pos: "" });
    setShippedTo({ name: "", address: "", contact: "", mobile: "", gstin: "", pos: "" });
    setTransporter("");
    setPortOfExport("");
    setNarration("");
    setPaymentTerms("");
    setSoTerms("");
  };
  

  const handleSave = async (mode = "save") => {
    const r2 = (n) => Math.round(n * 100) / 100;
    const line = (i) => {
      const qty = Number(i.qty) || 0;
      const price = Number(i.price) || 0;
      const gst = Number(i.gst) || 0;
      const taxable = qty * price;
      const gstAmt = (taxable * gst) / 100;
      return {
        item: i.itemId || null,
        quantity: qty,
        unit: "NONE",
        price: r2(price),
        discount_percentage: 0,
        discount_amount: 0,
        taxable_value: r2(taxable),
        gst_rate: gst,
        cgst: r2(gstAmt / 2),
        sgst: r2(gstAmt / 2),
        igst: 0,
        cess: 0,
        amount: r2(taxable + gstAmt)
      };
    };
    const lines = items.map(line);
    const sub = lines.reduce((s, l) => s + l.taxable_value, 0);
    const totalGst = lines.reduce((s, l) => s + l.cgst + l.sgst, 0);
    const total = r2(sub + totalGst);
    const payload = {
      order_number: soNo,
      date: soDate.toISOString().split("T")[0],
      party: selectedParty?.id || null,
      billing_address: [billedTo.name, billedTo.address].filter(Boolean).join(", "),
      shipping_address: [shippedTo.name, shippedTo.address].filter(Boolean).join(", "),
      state_of_supply: billedTo.pos || selectedParty?.state || "",
      supply_type: "REGULAR",
      narration,
      total_amount: total,
      round_off: 0,
      status: "PENDING",
      payment_terms: paymentTerms,
      delivery_date: shippingDate.toISOString().split("T")[0],
      items: lines
    };
    try {
      setSaving(true);
      const res = await services.createSaleOrder(payload);
      alert("Sale Order saved successfully!");
      setCurrentCount((prev) => prev + 1);
      if (mode === "print") window.print();
      if (mode === "send") alert("Sale Order saved! (send configured later)");
      resetForm();
    } catch (err) {
      const data = err.response?.data;
      const detail =
        (typeof data === "string" && data) ||
        (Array.isArray(data) && data[0]) ||
        data?.detail ||
        data?.order_number?.[0] ||
        data?.financial_year?.[0] ||
        JSON.stringify(data) ||
        err.message;
      alert("Error saving Sale Order: " + detail);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sale-order-app">
      <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
        <div className="so-wrapper">
           

          {/* ================= HEADER ================= */}
          <div className="so-card">
            <div className="so-header-row">
              <div className="so-title-section">
                <div className="so-icon-box">
                 <i className="fas fa-clipboard-check"></i>
                </div>
                <div>
                  <h2>Sale Order</h2>
                  <div className="so-voucher-row">
                    <label>Voucher No:</label>
                    <span className="so-voucher-badge">
                      {soNo}
                    </span>
                  </div>
                </div>
              </div>
              {/* <div className="pur-voucher-row">
                <label>Voucher No:</label>
                <span className="voucher-value">{generateVoucher()}</span>
              </div> */}
              <div className="so-header-date">
                <label>Date :</label>
                <DatePicker
                  selected={soDate}
                  onChange={(date) => setSoDate(date)}
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))} // ✅ last 1 year
                  className="so-date-input"
                  onChangeRaw={(e) => {
                    if (!e || !e.target) return;
                    let value = e.target.value || "";
                    // allow only numbers + /
                    value = value.replace(/[^0-9/]/g, "");
                    // auto format DD/MM/YYYY
                    if (value.length === 2 || value.length === 5) {
                      if (!value.endsWith("/")) value += "/";
                    }
                    // restrict length
                    if (value.length > 10) {
                      value = value.slice(0, 10);
                    }
                    const parts = value.split("/");
                    // day check
                    if (parts[0] && Number(parts[0]) > 31) parts[0] = "31";
                    // month check
                    if (parts[1] && Number(parts[1]) > 12) parts[1] = "12";
                    // year limit (4 digit)
                    if (parts[2] && parts[2].length > 4) {
                      parts[2] = parts[2].slice(0, 4);
                    }
                    value = parts.join("/");
                    e.target.value = value;
                  }}
                />
              </div>
             
            </div>
            <div className="so-grid-3">

                <div className="so-form-group">
                    <label>SO No</label>
                    <div className="cr-input-box">
                        <input
                          value={soNo}
                          readOnly={!manualEntry}
                          // placeholder="Tax/2025-26/0001"
                          maxLength={16}
                          onChange={(e) => {
                          let value = e.target.value;
                          // 🔥 MANUAL MODE → full freedom
                          if (manualEntry) {
                            setSoNo(value);
                            return;
                          }
                          // 🔥 AUTO MODE → prefix lock
                          const prefix = crConfig.prefix + "/";
                          if (!value.startsWith(prefix)) {
                            value = prefix;
                          }

                          let numberPart = value.replace(prefix, "");
                          numberPart = numberPart.replace(/\D/g, "");
                          numberPart = numberPart.slice(0, 4);

                          value = prefix + numberPart;
                          setSoNo(value);
                        }}
                        />

                        {/* ⚙️ SETTINGS ICON */}
                        <button
                          className="settings-btn"
                          onClick={() => setShowInvoiceSettings(true)}
                        >
                          ⚙️
                        </button>
                        {showInvoiceSettings && (
                          <div className="invoice-popup-overlay">
                            <div className="invoice-popup">
                              <h3>Invoice Settings</h3>

                              <div className="popup-group">
                                <label>Manual:</label>
                                <div className="popup-radio">
                                  <label>
                                    <input
                                      type="radio"
                                      checked={manualEntry}
                                      onChange={() => {
                                        setManualEntry(true);
                                        setSoNo("");   // 🔥 CLEAR INPUT
                                      }}
                                    />
                                    Yes
                                  </label>
                                  <label>
                                    <input
                                      type="radio"
                                      checked={!manualEntry}
                                      onChange={() => setManualEntry(false)}
                                    />
                                    No
                                  </label>
                                </div>
                              </div>
                              {/* 🔥 MAIN FIX: hide all when manual = true */}
                              {!manualEntry && (
                                <>
                                <div className="popup-group full">
                                  <label>Prefix</label>
                                  <input
                                    className="popup-input-box"
                                    value={crConfig.prefix}
                                    onChange={(e) => {
                                      let value = e.target.value;
                                      if (value.length > 11) value = value.slice(0, 11);

                                      setCrConfig({ ...crConfig, prefix: value });
                                    }}
                                  />
                                </div>

                                <div className="popup-group">
                                  <label>Zero Padding</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="4"
                                    value={crConfig.zero}
                                    onChange={(e) => {
                                      let val = Number(e.target.value) || 0;
                                      if (val > 4) val = 4;

                                      setCrConfig({ ...crConfig, zero: val });
                                    }}
                                  />
                                </div>

                                <div className="popup-group">
                                  <label>Start No</label>
                                  <input
                                    type="number"
                                    value={crConfig.start}
                                    onChange={(e) => {
                                      let val = Math.max(0, Number(e.target.value) || 0);
                                      setCrConfig({ ...crConfig, start: val });
                                      setCurrentCount(val);
                                    }}
                                  />
                                </div>
                                </>
                              )}

                              <div className="popup-actions">
                                <button onClick={() => setShowInvoiceSettings(false)}>Cancel</button>
                                <button
                                  onClick={() => {
                                    if (
                                      !manualEntry && 
                                      (Number(crConfig.zero) || 0) + String(crConfig.start).length > 4
                                    ) {
                                      alert("Zero + Start digits cannot exceed 4");
                                      return;
                                    }
                                    setShowInvoiceSettings(false);
                                  }}
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                </div>

                {/* <div className="so-form-group">
                    <label>SO Date</label>
                    <DatePicker
                  selected={invoiceDate}
                  onChange={(date) => setInvoiceDate(date)}
                  dateFormat="dd/MM/yyyy"
                  maxDate={new Date()}   // prevent future date
                  className="date-input"
  
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
                </div> */}

                {/* <div className="so-form-group">
                    <label>SO Ref No</label>
                    <input className="so-input" onChange={(e) => setSoRef(e.target.value)} />
                </div> */}

                <div className="so-form-group">
                    <label>Type of SO</label>
                    <select className="so-select" onChange={(e) => setSoType(e.target.value)}>
                    <option>Select</option>
                    <option>Goods</option>
                    <option>Service</option>
                    <option>Job Work</option>
                    </select>
                </div>

                <div className="so-form-group">
                    <label>Buyer</label>
                    <select className="so-select" onChange={(e) => setBuyer(e.target.value)}>
                    <option>Select</option>
                    <option>Self</option>
                    <option>Purchase Manager</option>
                    <option>Branch Buyer</option>
                    </select>
                </div>

            </div>
           
          </div>
          <div className="section-card">
            <div className="dispatch-header">
              <div className="so-ord-dispatch-title">
                <div className="so-ord-dispatch-icon">
                  <i className="fas fa-shipping-fast"></i>
                </div>
                <h3>Dispatch Details</h3>
              </div>
            {/* <h2>Dispatch Details</h2> */}
                <div className="transporter-box">
                <label>Transporter Name</label>
                <div className="transporter-row"> 
                  <select value={transporter} onChange={(e) => setTransporter(e.target.value)}>
                    <option value="">Select</option>
                    {transporters.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                  <button
                    className="so-transporter-create-btn"
                    onClick={() => navigate("/Ledger", { state: { defaultGroup: "Sundry Creditors" } })}
                  >
                    Create
                  </button>
                </div>
              </div>
              <div className="gstin-container">
                <label>Transport GSTIN</label>
                <input 
                  value={gstin}
                  onChange={handleGSTChange}
                  placeholder="Transport GSTIN"
                />

                {/* LOADING */}
                {gstLoading && <div className="gst-status">Validating...</div>}

                {/* ERROR */}
                {gstError && <div className="gst-error">{gstError}</div>}

                {/* SUCCESS */}
                {gstData && (
                  <div className="gst-result-box">
                    <p><strong>{gstData.company_name}</strong></p>
                    <p>{gstData.state}</p>
                    <p>Status: {gstData.status}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="dispatch-grid">
              <div className="dis-container">
                <label>Dispatch Doc No</label>
                <input placeholder="Dispatch Doc No" />
              </div>
              <div className="veh-container">
                <label>Vehical No</label>
                <input placeholder="Vehicle No" />
              </div>
              {/* <input placeholder="Transport GSTIN" /> */}
              {/* <input placeholder="Agent Name" /> */}
              <div className="LR">
                <label>LR-RR No</label>
                <input placeholder="LR-RR No" />
              </div>
              <div className="date-container">
                <label>Date</label>
                <DatePicker
                  selected={sodisDate}
                  onChange={(date) => setSodisDate(date)}
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))} // ✅ last 1 year
                  className="so-date-input"
                  onChangeRaw={(e) => {
                    if (!e || !e.target) return;
                    let value = e.target.value || "";
                    // allow only numbers + /
                    value = value.replace(/[^0-9/]/g, "");
                    // auto format DD/MM/YYYY
                    if (value.length === 2 || value.length === 5) {
                      if (!value.endsWith("/")) value += "/";
                    }
                    // restrict length
                    if (value.length > 10) {
                      value = value.slice(0, 10);
                    }
                    const parts = value.split("/");
                    // day check
                    if (parts[0] && Number(parts[0]) > 31) parts[0] = "31";
                    // month check
                    if (parts[1] && Number(parts[1]) > 12) parts[1] = "12";
                    // year limit (4 digit)
                    if (parts[2] && parts[2].length > 4) {
                      parts[2] = parts[2].slice(0, 4);
                    }
                    value = parts.join("/");
                    e.target.value = value;
                  }}
                  />
                </div>      
                  <>
                  <div className="port">
                    <label>Port of Export</label>
                    <input placeholder="Port No." value={portOfExport} onChange={(e) => setPortOfExport(e.target.value)} />
                  </div>
                  {/* <div className="country">
                    <label>Country Name</label>
                    <input placeholder="Country" />
                  </div> */}
                  <div className="ship-bill">
                    <label>Shipping Bill No</label>
                    <input placeholder="Shipping Bill No" />
                  </div>
                  <div className="ship-bill">
                    <label>Shipping date</label>
                      <DatePicker
                  selected={shippingDate}
                  onChange={(date) => setshippingDate(date)}
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))} // ✅ last 1 year
                  className="so-date-input"
                  onChangeRaw={(e) => {
                    if (!e || !e.target) return;
                    let value = e.target.value || "";
                    // allow only numbers + /
                    value = value.replace(/[^0-9/]/g, "");
                    // auto format DD/MM/YYYY
                    if (value.length === 2 || value.length === 5) {
                      if (!value.endsWith("/")) value += "/";
                    }
                    // restrict length
                    if (value.length > 10) {
                      value = value.slice(0, 10);
                    }
                    const parts = value.split("/");
                    // day check
                    if (parts[0] && Number(parts[0]) > 31) parts[0] = "31";
                    // month check
                    if (parts[1] && Number(parts[1]) > 12) parts[1] = "12";
                    // year limit (4 digit)
                    if (parts[2] && parts[2].length > 4) {
                      parts[2] = parts[2].slice(0, 4);
                    }
                    value = parts.join("/");
                    e.target.value = value;
                  }}
                  />
                  </div>
                    
                    
                  </>
              
            </div>
          </div>

          {/* ================= Supplier ================= */}
          <div className="so-card">
            <div className="so-cust-details">
              <div className="so-cust-icon">
                <i className="fas fa-users"></i>
              </div>
              <h3>Supplier Details</h3>
            </div>

            <div className="so-customer-container">
              <div className="so-supplier-card">
                <div className="so-card-header">
                  <h3 className="so-customer-card-title">
                    <FaUniversity />
                    Billed To
                  </h3>
                </div>
                <div className="so-supplier-row">
                  <input
                    className="so-input"
                    placeholder="Search Supplier"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                  />
                  <button className="so-add-btn" onClick={() => navigate("/Ledger", { state: { defaultGroup: "Sundry Debtors" } })}>
                    Add New
                  </button>
                </div>
                {showCustomerDropdown && (
                  <div className="so-customer-search-dropdown">
                    {filteredCustomers.length === 0 && (
                      <div className="so-customer-search-empty">No customers found</div>
                    )}
                    {filteredCustomers.map((cust) => (
                      <div
                        key={cust.id}
                        className="so-customer-search-option"
                        onClick={() => selectCustomer(cust)}
                      >
                        <div className="so-customer-search-name">{cust.name}</div>
                        <div className="so-customer-search-gstin">{cust.gstin || ""}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="so-party-details">
                  <div className="so-detail-row">
                    <span>Name :</span>
                    <p>{billedTo.name}</p>
                  </div>

                  <div className="so-detail-row">
                    <span>Address :</span>
                    <p>{billedTo.address}</p>
                  </div>

                  <div className="so-detail-row">
                    <span>Contact :</span>
                    <p>{billedTo.contact}</p>
                  </div>

                  <div className="so-detail-row">
                    <span>Mobile :</span>
                    <p>{billedTo.mobile}</p>
                  </div>

                  <div className="so-detail-row">
                    <span>GSTIN :</span>
                    <p>{billedTo.gstin}</p>
                  </div>

                  <div className="so-detail-row">
                    <span>POS :</span>
                    <p>{billedTo.pos}</p>
                  </div>

                </div>

              </div>
            <div className="so-supplier-card">
              <div className="so-card-header">
                <h3 className="so-customer-card-title">
                  <FaTruck />
                  Shipped To
                </h3>
              </div>

              <div className="so-supplier-row">
                <input
                    className="so-input"
                    placeholder="Search Supplier"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                  />
              </div>

              <div className="so-party-details">
                <div className="so-detail-row">
                  <span>Name :</span>
                  <p>{billedTo.name}</p>
                </div>

                <div className="so-detail-row">
                  <span>Address :</span>
                  <p>{shippedTo.address}</p>
                </div>

                <div className="so-detail-row">
                  <span>Contact :</span>
                  <p>{shippedTo.contact}</p>
                </div>

                <div className="so-detail-row">
                  <span>Mobile :</span>
                  <p>{shippedTo.mobile}</p>
                </div>

                <div className="so-detail-row">
                  <span>GSTIN :</span>
                  <p>{shippedTo.gstin}</p>
                </div>

                <div className="so-detail-row">
                  <span>POS :</span>
                  <p>{shippedTo.pos}</p>
                </div>

              </div>

            </div>
            </div>
          </div>

          {/* ================= TERMS ================= */}
          <div className="so-card">

            <div className="so-grid-2">

              <div className="so-form-group">
                <label>Terms & Conditions of Payment</label>
                <textarea className="so-textarea" onChange={(e) => setPaymentTerms(e.target.value)} />
              </div>

              <div className="so-form-group">
                <label>Terms & Conditions of SO</label>
                <textarea className="so-textarea" onChange={(e) => setSoTerms(e.target.value)} />
              </div>

            </div>
          </div>

          {/* ================= ITEMS ================= */}
          <div className="so-card">
            <div className="so-cost-details">
              <div className="so-cust-icon">
                  <i className="fas fa-boxes"></i>
                </div>
              <h3>Description of Goods</h3>
            </div>

            <table className="so-table">
              <datalist id="so-items-datalist">
                {itemsList.map((it) => (
                  <option key={it.id} value={it.name} />
                ))}
              </datalist>
              <thead>
                <tr>
                  <th></th>
                  <th>Description</th>
                  <th>HSN</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>GST %</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, i) => {
                  const qty = Number(item.qty) || 0;
                  const price = Number(item.price) || 0;
                  const gst = Number(item.gst) || 0;
                  const amount = qty * price + (qty * price * gst) / 100;

  return (
                    <tr key={item.id}>
                      <td>
                        <button
                          className="sale-delete-btn"
                          onClick={() => {
                            setItems(
                              items.filter(
                                (row) => row.id !== item.id
                              )
                            );
                          }}
                        >
                          <FaTrash />
                        </button>
                      </td>
                      <td><input className="so-input" list="so-items-datalist" value={item.description} onChange={(e) => {
                        const val = e.target.value;
                        const match = itemsList.find((it) => it.name === val);
                        handleChange(i, "description", val);
                        handleChange(i, "itemId", match ? match.id : null);
                        handleChange(i, "hsn", match ? match.hsn_code || "" : "");
                      }} /></td>
                      <td><input className="so-input" value={item.hsn} onChange={(e) => handleChange(i, "hsn", e.target.value)} /></td>
                      <td><input className="so-input" type="number" onChange={(e) => handleChange(i, "qty", e.target.value)} /></td>
                      <td><input className="so-input" type="number" onChange={(e) => handleChange(i, "price", e.target.value)} /></td>
                      <td>
                        <select className="so-select" onChange={(e) => handleChange(i, "gst", e.target.value)}>
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                        </select>
                      </td>
                      <td><input className="so-input" value={amount.toFixed(2)} readOnly /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button className="so-add-row-btn" onClick={addRow}>+ Add Item</button>
          </div>

          {/* ================= NOTES + SUMMARY ================= */}
          <div className="so-grid-2">

            <div className="so-notes">
              <label>Narration</label>
              <textarea className="so-textarea" value={narration} onChange={(e) => setNarration(e.target.value)} />
            </div>

            <div className="so-summary-box">

              <div className="so-summary-row">
                <span>Subtotal</span>
                <strong>₹ {subtotal.toFixed(2)}</strong>
              </div>

              <div className="so-summary-row">
                <span>CGST</span>
                <strong>₹ {cgst.toFixed(2)}</strong>
              </div>

              <div className="so-summary-row">
                <span>SGST</span>
                <strong>₹ {sgst.toFixed(2)}</strong>
              </div>

              <div className="so-summary-row">
                <span>Total GST</span>
                <strong>₹ {totalGST.toFixed(2)}</strong>
              </div>

              <div className="so-grand-total">
                <span>Grand Total</span>
                <strong>₹ {total.toFixed(2)}</strong>
              </div>

            </div>

          </div>

          {/* ================= ACTIONS ================= */}
          <div className="po-footer-actions">

            <button className="po-save-btn" onClick={() => handleSave("save")} disabled={saving}>
              <i className="fas fa-save"></i>
              {saving ? "Saving..." : "Save"}
            </button>

            <button className="po-print-btn" onClick={() => handleSave("print")}>
              <i className="fas fa-print"></i>
              Save & Print
            </button>

            <button className="po-send-btn" onClick={() => handleSave("send")}>
              <i className="fas fa-paper-plane"></i>
              Save & Send
            </button>

            <button className="po-cancel-btn" onClick={resetForm}>
              <i className="fas fa-times"></i>
              Cancel
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}