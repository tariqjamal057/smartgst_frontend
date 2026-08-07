import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { FaTrash ,FaSearch,FaUniversity,FaTruck,FaPen,FaSave,
  FaPaperPlane,
  FaPrint,
  FaTimes } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/Purchase.css";
import * as services from "../api/services";

export default function Purchase() {
  const { collapsed } = useOutletContext();
  const navigate = useNavigate();
  const [purdisDate, setPurdisDate] = useState(new Date());
  const [voucherMode, setVoucherMode] = useState("item");
  const [purchaseType, setPurchaseType] = useState("Goods");
const [invoiceRef, setInvoiceRef] = useState("");
const [invoiceRefDate, setInvoiceRefDate] = useState(new Date());
const [purchaseDate, setPurchaseDate] = useState(new Date());
const [shippingDate, setshippingDate] = useState(new Date());
const [gstin, setGstin] = useState("");
const [gstData, setGstData] = useState(null);
const [gstLoading, setGstLoading] = useState(false);
const [gstError, setGstError] = useState("");
const [editBilled, setEditBilled] = useState(false);
const [editShipped, setEditShipped] = useState(false);
const [shippedTo, setShippedTo] = useState({
    name: "",
    address: "",
    city: "",
    contact: "",
    mobile: "",
    pan: "",
    gstin: "",
    pos: ""
  });
const [billedTo, setBilledTo] = useState({
    name: "",
    address: "",
    city: "",
    contact: "",
    mobile: "",
    pan: "",
    gstin: "",
    pos: ""
  });
const [suppliers, setSuppliers] = useState([]);
const [customerSearch, setCustomerSearch] = useState("");
const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
const [selectedParty, setSelectedParty] = useState(null);
const [itemsList, setItemsList] = useState([]);
const [transporters, setTransporters] = useState([]);
const [transporter, setTransporter] = useState("");
const [dispatchDocNo, setDispatchDocNo] = useState("");
const [vehicleNo, setVehicleNo] = useState("");
const [lrRrNo, setLrRrNo] = useState("");
const [portOfExport, setPortOfExport] = useState("");
const [saving, setSaving] = useState(false);

/* ================= VOUCHER NUMBER ================= */
const VOUCHER_PREFIX = "PUR/2025-26";
const [currentCount, setCurrentCount] = useState(1);
const [voucherNo, setVoucherNo] = useState(`${VOUCHER_PREFIX}/0001`);
useEffect(() => {
  setVoucherNo(`${VOUCHER_PREFIX}/${String(currentCount).padStart(4, "0")}`);
}, [currentCount]);

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

  const [items, setItems] = useState([
  {
    id: Date.now(),
    itemId: null,
    desc: "",
    qty: "",
    rate: "",
    tax: "0"
  }
]);
  const addRow = () => {
    setItems([
      ...items,
      {
        id: Date.now() + Math.random(),
        itemId: null,
        desc: "",
        qty: "",
        rate: "",
        tax: "0"
      }
    ]);
  };

  const handleChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

 const [ledgers, setLedgers] = useState([
  {
    id: 1,
    ledger: "",
    tax: "",
    amount: ""
  }
]);

  const handleLedgerChange = (index, field, value) => {
    const updated = [...ledgers];
    updated[index][field] = value;
    setLedgers(updated);
  };

  const [narration, setNarration] = useState("");

  // ================= ITEM CALC =================
  const calculateAmount = (item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const tax = Number(item.tax) || 0;

    const base = qty * rate;
    return base + (base * tax) / 100;
  };

  const subtotal = items.reduce((sum, i) => {
    const qty = Number(i.qty) || 0;
    const rate = Number(i.rate) || 0;
    return sum + qty * rate;
  }, 0);

  const totalGST = items.reduce((sum, i) => {
    const qty = Number(i.qty) || 0;
    const rate = Number(i.rate) || 0;
    const tax = Number(i.tax) || 0;
    return sum + ((qty * rate) * tax) / 100;
  }, 0);

  const cgst = totalGST / 2;
  const sgst = totalGST / 2;

  const total =
    voucherMode === "item"
      ? subtotal + totalGST
      : ledgers.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  useEffect(() => {
    (async () => {
      try {
        const [suppRes, itemRes, vendRes, billRes] = await Promise.all([
          services.getParties({ type: "vendor" }),
          services.getItems({}),
          services.getParties({ type: "vendor" }),
          services.getPurchaseBills({})
        ]);
        const supp = Array.isArray(suppRes.data) ? suppRes.data : suppRes.data?.results ?? [];
        const itm = Array.isArray(itemRes.data) ? itemRes.data : itemRes.data?.results ?? [];
        const vend = Array.isArray(vendRes.data) ? vendRes.data : vendRes.data?.results ?? [];
        setSuppliers(supp);
        setItemsList(itm);
        setTransporters(vend);
        const bills = Array.isArray(billRes.data) ? billRes.data : billRes.data?.results ?? [];
        const pfx = VOUCHER_PREFIX + "/";
        const max = bills.reduce((m, b) => {
          const n = Number(String(b.voucher_number || "").replace(pfx, "").replace(/\D/g, ""));
          return n > m ? n : m;
        }, 0);
        if (max > 0) setCurrentCount(max + 1);
      } catch (e) {
        console.error("Failed to load data:", e);
      }
    })();
  }, []);

  const filteredSuppliers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((c) =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.gstin || "").toLowerCase().includes(q)
    );
  }, [suppliers, customerSearch]);

  const selectSupplier = (cust) => {
    setSelectedParty(cust);
    setCustomerSearch(cust.name);
    setShowCustomerDropdown(false);
    const billed = {
      name: cust.name || "",
      address: cust.billing_address || "",
      city: "",
      contact: cust.contact || "",
      mobile: cust.phone || "",
      pan: cust.pan || "",
      gstin: cust.gstin || "",
      pos: cust.state || ""
    };
    setBilledTo(billed);
    setShippedTo(billed);
  };

  const resetForm = () => {
    setItems([{ id: Date.now(), itemId: null, desc: "", qty: "", rate: "", tax: "0" }]);
    setLedgers([{ id: Date.now(), ledger: "", tax: "", amount: "" }]);
    setSelectedParty(null);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setBilledTo({ name: "", address: "", city: "", contact: "", mobile: "", pan: "", gstin: "", pos: "" });
    setShippedTo({ name: "", address: "", city: "", contact: "", mobile: "", pan: "", gstin: "", pos: "" });
    setInvoiceRef("");
    setTransporter("");
    setDispatchDocNo("");
    setVehicleNo("");
    setLrRrNo("");
    setPortOfExport("");
    setNarration("");
  };

  const handleSave = async (action = "save") => {
    const r2 = (n) => Math.round(n * 100) / 100;
    let lines;
    if (voucherMode === "accounting") {
      lines = ledgers.map((l) => {
        const amt = Number(l.amount) || 0;
        const tax = Number(l.tax) || 0;
        const gstAmt = (amt * tax) / 100;
        return {
          item: null,
          quantity: 1,
          unit: "NONE",
          price: r2(amt),
          discount_percentage: 0,
          discount_amount: 0,
          taxable_value: r2(amt),
          gst_rate: tax,
          cgst: r2(gstAmt / 2),
          sgst: r2(gstAmt / 2),
          igst: 0,
          cess: 0,
          amount: r2(amt + gstAmt)
        };
      });
    } else {
      lines = items.map((i) => {
        const qty = Number(i.qty) || 0;
        const rate = Number(i.rate) || 0;
        const tax = Number(i.tax) || 0;
        const taxable = qty * rate;
        const gstAmt = (taxable * tax) / 100;
        return {
          item: i.itemId || null,
          quantity: qty,
          unit: "NONE",
          price: r2(rate),
          discount_percentage: 0,
          discount_amount: 0,
          taxable_value: r2(taxable),
          gst_rate: tax,
          cgst: r2(gstAmt / 2),
          sgst: r2(gstAmt / 2),
          igst: 0,
          cess: 0,
          amount: r2(taxable + gstAmt)
        };
      });
    }
    const sub = lines.reduce((s, l) => s + l.taxable_value, 0);
    const totalGst = lines.reduce((s, l) => s + l.cgst + l.sgst, 0);
    const grandTotal = r2(sub + totalGst);
    const payload = {
      voucher_number: voucherNo,
      date: purchaseDate.toISOString().split("T")[0],
      party: selectedParty?.id || null,
      bill_id: invoiceRef,
      bill_date: invoiceRefDate.toISOString().split("T")[0],
      state_of_supply: billedTo.pos || selectedParty?.state || "",
      supply_type: "REGULAR",
      billing_address: [billedTo.name, billedTo.address, billedTo.city].filter(Boolean).join(", "),
      shipping_address: [shippedTo.name, shippedTo.address, shippedTo.city].filter(Boolean).join(", "),
      round_off_amount: 0,
      total_amount: grandTotal,
      total_taxable_amount: r2(sub),
      total_cgst: r2(totalGst / 2),
      total_sgst: r2(totalGst / 2),
      total_igst: 0,
      total_cess: 0,
      paid: 0,
      balance: grandTotal,
      description: narration,
      eway_bill_no: dispatchDocNo,
      transporter_name: transporter,
      vehicle_no: vehicleNo,
      lr_rr_no: lrRrNo,
      port_of_export: portOfExport,
      items: lines
    };
    try {
      setSaving(true);
      const res = await services.createPurchaseBill(payload);
      setCurrentCount((prev) => prev + 1);
      if (action === "send") {
        await services.postPurchaseBill(res.data.id);
      }
      alert(action === "send" ? "Purchase Bill saved and posted successfully!" : "Purchase Bill saved successfully!");
      if (action === "print") window.print();
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
      alert("Error saving Purchase Bill: " + detail);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="purchase-app">
      <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
        <div className="purchase-wrapper">
          <div className="header-cr">
            <div className="pur-header-grid">
              <div className="purchase-section-card">
                {/* Voucher Row */}
                 <div className="purchase-header-top">

                  <div className="purchase-icon">
                    <i className="fas fa-shopping-cart"></i>
                  </div>

                  <div className="purchase-header-info">
                    <h2>Purchase</h2>

                    <div className="purchase-voucher-row">
                      <label>Voucher No:</label>

                      <span className="purchase-voucher-value">
                        {voucherNo}
                      </span>
                    </div>
                  </div>

                </div>
                {/* Main Grid */}
                <div className="pur-header">
                  <div className="pur-form-group">
                    <label>Type of Purchase</label>
                    <select
                      value={purchaseType}
                      onChange={(e) => setPurchaseType(e.target.value)}
                    >
                      <option>Goods</option>
                      <option>Services</option>
                      <option>Capital Goods</option>
                    </select>
                  </div>
                  <div className="pur-form-group">
                    <label>Purchase Date</label>
                    <DatePicker
                      selected={purchaseDate}
                      onChange={(date) =>setPurchaseDate(date)}
                      dateFormat="dd/MM/yyyy"
                      minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))} // ✅ last 1 year
                      className="date-input"
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

                  <div className="pur-form-group">
                    <label>Invoice Ref No</label>
                    <input
                      value={invoiceRef}
                      onChange={(e) => setInvoiceRef(e.target.value)}
                    />
                  </div>

                  <div className="pur-form-group">
                    <label>Invoice Date</label>
                    <DatePicker
                      selected={invoiceRefDate}
                      onChange={(date) => setInvoiceRefDate(date)}
                      dateFormat="dd/MM/yyyy"
                      className="date-input"
                    />
                  </div>

                  <div className="pur-form-group">
                    <label>Voucher Mode</label>
                    <select value={voucherMode} onChange={(e) => setVoucherMode(e.target.value)}>
                      <option value="item">Item Invoice</option>
                      <option value="accounting">Accounting Invoice</option>
                    </select>
                  </div>

                </div>
              </div>
            </div>
          </div>
          <div className="section-card">
            <div className="dispatch-header">
            <div className="purchase-dispatch-title">
              <div className="purchase-dispatch-icon">
                <i className="fas fa-shipping-fast"></i>
              </div>
              <h3>Dispatch Details</h3>
            </div>
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
                    className="pur-transporter-create-btn"
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
                    <p><strong>{gstData.company_name || gstData.name}</strong></p>
                    <p>{gstData.state}</p>
                    <p>Status: {gstData.status}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="dispatch-grid">
              <div className="dis-container">
                <label>Dispatch Doc No</label>
                <input placeholder="Dispatch Doc No" value={dispatchDocNo} onChange={(e) => setDispatchDocNo(e.target.value)} />
              </div>
              <div className="veh-container">
                <label>Vehical No</label>
                <input placeholder="Vehicle No" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} />
              </div>
              {/* <input placeholder="Transport GSTIN" /> */}
              {/* <input placeholder="Agent Name" /> */}
              <div className="LR">
                <label>LR-RR No</label>
                <input placeholder="LR-RR No" value={lrRrNo} onChange={(e) => setLrRrNo(e.target.value)} />
              </div>
              <div className="date-container">
                <label>Date</label>
                <DatePicker
                  selected={purdisDate}
                  onChange={(date) => setPurdisDate(date)}
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))} // ✅ last 1 year
                  className="date-input"
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
                  className="date-input"
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

          {/* CUSTOMER / DISPATCH SECTION */}
          <div className="section-card">
            <div className="purchase-customer">
              <div className="pay-cust-details">
                <div className="purchase-cust-icon">
                  <i className="fas fa-users"></i>
                </div>

                <h2>Supplier Details</h2>
              </div>

              <div className="purchase-search-row">
                <input
                  placeholder="Search Supplier"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                />

                <button className="new-btn" onClick={() => navigate("/Ledger", { state: { defaultGroup: "Sundry Creditors" } })}>
                  + New Supplier
                </button>
              </div>
              {showCustomerDropdown && (
                <div className="purchase-customer-search-dropdown">
                  {filteredSuppliers.length === 0 && (
                    <div className="purchase-customer-search-empty">No suppliers found</div>
                  )}
                  {filteredSuppliers.map((cust) => (
                    <div
                      key={cust.id}
                      className="purchase-customer-search-option"
                      onClick={() => selectSupplier(cust)}
                    >
                      <div className="purchase-customer-search-name">{cust.name}</div>
                      <div className="purchase-customer-search-gstin">{cust.gstin || ""}</div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* ✅ NEW SECTION ADDED (NO REPLACEMENT) */}
            {/* ================= CUSTOMER DETAILS ================= */}
            <div className="purchase-customer-details">

              {/* BILLED TO */}
              <div className="purchase-customer-card">
                <div className="customer-card-header">
                  <h3 className="pay-customer-card-title">
                    <FaUniversity />
                    Billed To:
                  </h3>
                </div>

                {editBilled ? (
                  <div className="customer-edit-form">
                    <input 
                      type="text" 
                      value={billedTo.name}
                      onChange={(e) => setBilledTo({...billedTo, name: e.target.value})}
                      placeholder="Company Name"
                    />
                    <input 
                      type="text" 
                      value={billedTo.address}
                      onChange={(e) => setBilledTo({...billedTo, address: e.target.value})}
                      placeholder="Address"
                    />
                    <input 
                      type="text" 
                      value={billedTo.city}
                      onChange={(e) => setBilledTo({...billedTo, city: e.target.value})}
                      placeholder="City"
                    />
                    <div className="form-row">
                      <input 
                        type="text" 
                        value={billedTo.contact}
                        onChange={(e) => setBilledTo({...billedTo, contact: e.target.value})}
                        placeholder="Contact Person"
                      />
                      <input 
                        type="text" 
                        value={billedTo.mobile}
                        onChange={(e) => setBilledTo({...billedTo, mobile: e.target.value})}
                        placeholder="Mobile"
                      />
                    </div>
                    <div className="form-row">
                      <input 
                        type="text" 
                        value={billedTo.pan}
                        onChange={(e) => setBilledTo({...billedTo, pan: e.target.value})}
                        placeholder="PAN"
                      />
                      <input 
                        type="text" 
                        value={billedTo.gstin}
                        onChange={(e) => setBilledTo({...billedTo, gstin: e.target.value})}
                        placeholder="GSTIN"
                      />
                    </div>
                    <input 
                      type="text" 
                      value={billedTo.pos}
                      onChange={(e) => setBilledTo({...billedTo, pos: e.target.value})}
                      placeholder="Place of Supply"
                    />
                  </div>
                ) : (
                  <div className="customer-details">
                    <p className="customer-name">{billedTo.name}</p>
                    <p className="customer-address">{billedTo.address}</p>
                    <p className="customer-address">{billedTo.city}</p>
                    <p className="customer-contact">
                      Contact: {billedTo.contact || 'N/A'} (Mobile - {billedTo.mobile || 'N/A'})
                    </p>
                    <p className="customer-tax">
                      PAN: {billedTo.pan || 'N/A'}
                    </p>
                    <p className="customer-tax">
                      GSTIN: {billedTo.gstin}
                    </p>
                    <p className="customer-pos">
                      Place of Supply: {billedTo.pos || 'N/A'}
                    </p>
                  </div>
                )}
              </div>

              {/* SHIPPED TO */}
              <div className="purchase-customer-card">
                <div className="customer-card-header">
                  <h3 className="pay-customer-card-title">
                    <FaTruck />
                    Shipped To:
                  </h3>
                  <button 
                      className="pay-edit-btn"
                      onClick={() => setEditShipped(!editShipped)}
                    >
                      <FaPen />
                      {editShipped ? 'Save' : 'Edit'}
                    </button>
                </div>

                {editShipped ? (
                  <div className="customer-edit-form">
                    <input 
                      type="text" 
                      value={shippedTo.name}
                      onChange={(e) => setShippedTo({...shippedTo, name: e.target.value})}
                      placeholder="Company Name"
                    />
                    <input 
                      type="text" 
                      value={shippedTo.address}
                      onChange={(e) => setShippedTo({...shippedTo, address: e.target.value})}
                      placeholder="Address"
                    />
                    <input 
                      type="text" 
                      value={shippedTo.city}
                      onChange={(e) => setShippedTo({...shippedTo, city: e.target.value})}
                      placeholder="City"
                    />
                    <div className="form-row">
                      <input 
                        type="text" 
                        value={shippedTo.contact}
                        onChange={(e) => setShippedTo({...shippedTo, contact: e.target.value})}
                        placeholder="Contact Person"
                      />
                      <input 
                        type="text" 
                        value={shippedTo.mobile}
                        onChange={(e) => setShippedTo({...shippedTo, mobile: e.target.value})}
                        placeholder="Mobile"
                      />
                    </div>
                    <div className="form-row">
                      <input 
                        type="text" 
                        value={shippedTo.pan}
                        onChange={(e) => setShippedTo({...shippedTo, pan: e.target.value})}
                        placeholder="PAN"
                      />
                      <input 
                        type="text" 
                        value={shippedTo.gstin}
                        onChange={(e) => setShippedTo({...shippedTo, gstin: e.target.value})}
                        placeholder="GSTIN"
                      />
                    </div>
                    <input 
                      type="text" 
                      value={shippedTo.pos}
                      onChange={(e) => setShippedTo({...shippedTo, pos: e.target.value})}
                      placeholder="Place of Supply"
                    />
                  </div>
                ) : (
                  <div className="customer-details">
                    <p className="customer-name">{shippedTo.name}</p>
                    <p className="customer-address">{shippedTo.address}</p>
                    <p className="customer-address">{shippedTo.city}</p>
                    <p className="customer-contact">
                      Contact: {shippedTo.contact || 'N/A'} (Mobile - {shippedTo.mobile || 'N/A'})
                    </p>
                    <p className="customer-tax">
                      PAN: {shippedTo.pan || 'N/A'}
                    </p>
                    <p className="customer-tax">
                      GSTIN: {shippedTo.gstin}
                    </p>
                    <p className="customer-pos">
                      Place of Supply: {shippedTo.pos || 'N/A'}
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ================= TABLE ================= */}
            <div className="section-card">
              {voucherMode === "item" ? (
                
                <table className="purchase-table">
                  <datalist id="purchase-items-datalist">
                    {itemsList.map((it) => (
                      <option key={it.id} value={it.name} />
                    ))}
                  </datalist>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Tax %</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row, i) => {
                      const amount = calculateAmount(row);

                      return (
                        <tr key={row.id}>
                          <td>
                            <input
                              list="purchase-items-datalist"
                              value={row.desc}
                              onChange={(e) => {
                                const val = e.target.value;
                                const match = itemsList.find((it) => it.name === val);
                                handleChange(i, "desc", val);
                                handleChange(i, "itemId", match ? match.id : null);
                              }}
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              value={row.qty}
                              onChange={(e) => handleChange(i, "qty", e.target.value)}
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              value={row.rate}
                              onChange={(e) => handleChange(i, "rate", e.target.value)}
                            />
                          </td>

                          <td>
                            <select
                              value={row.tax}
                              onChange={(e) => handleChange(i, "tax", e.target.value)}
                            >
                              <option value="0">0</option>
                              <option value="5">5</option>
                              <option value="12">12</option>
                              <option value="18">18</option>
                            </select>
                          </td>

                          <td>
                            <input value={amount.toFixed(2)} readOnly />
                          </td>
                          <td className="purchase-delete-cell">
                            <button
                              className="purchase-del-btn"
                              onClick={() => {
                                setItems(
                                  items.filter(
                                    (item) => item.id !== row.id
                                  )
                                );
                              }}
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>Purchase Ledger</th>
                      <th>Tax Rate</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgers.map((row, i) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            placeholder="Purchase A/c"
                            value={row.ledger}
                            onChange={(e) => handleLedgerChange(i, "ledger", e.target.value)}
                          />
                        </td>

                        <td>
                          <select
                            value={row.tax}
                            onChange={(e) => handleLedgerChange(i, "tax", e.target.value)}
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                          </select>
                        </td>

                        <td>
                          <input
                            value={row.amount}
                            onChange={(e) => handleLedgerChange(i, "amount", e.target.value)}
                          />
                        </td>
                        <td className="purchase-delete-cell">
                          <button
                            className="purchase-del-btn"
                            onClick={() => {
                              setLedgers(
                                ledgers.filter(
                                  (ledger) => ledger.id !== row.id
                                )
                              );
                            }}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              

              <button
                className="add-btn"
                onClick={() => {
                  if (voucherMode === "item") {
                    addRow();
                  } else {
                    setLedgers([
                      ...ledgers,
                      {
                        id: Date.now(),
                        ledger: "",
                        tax: "0",
                        amount: ""
                      }
                    ]);
                  }
                }}
              >
                + Add Row
              </button>
            </div>

          <hr />

          {/* SUMMARY */}
          <div className="purchase-summary">
            <span>Total</span>
            <input value={total.toFixed(2)} readOnly />
          </div>

          {/* NARRATION */}
          <div className="purchase-narration">
            <label>Voucher Narration</label>
            <textarea
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
            />
          </div>

          {/* ACTION */}
          <div className="pur-actions">
            <button className="pur-save-btn" onClick={() => handleSave("save")} disabled={saving}>
              <i className="fas fa-save"></i>
              {saving ? "Saving..." : "Save"}
            </button>
            <button className="pur-save-btn" onClick={() => handleSave("send")} disabled={saving}>
              <i className="fas fa-paper-plane"></i>
              Save & Post
            </button>
            <button className="pur-cancel-btn" onClick={resetForm}>
              <i className="fas fa-times"></i>
              Cancel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
