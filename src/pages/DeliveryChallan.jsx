import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import DatePicker from "react-datepicker";
import * as services from "../api/services";
import { FaTrash ,FaSearch,FaUniversity,FaTruck,FaPen,FaSave,
  FaPaperPlane,
  FaPrint,
  FaTimes } from "react-icons/fa";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/DeliveryChallan.css";

export default function DeliveryChallan() {
  const { collapsed } = useOutletContext();

  /* ================= PART 1 ================= */
  const DC_PREFIX = "DC/2025-26";
  const [challanNo, setChallanNo] = useState("");
  const [currentCount, setCurrentCount] = useState(1);
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [date, setDate] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [docNo, setDocNo] = useState("");
  const [transporterGST, setTransporterGST] = useState("");
  const [gstData, setGstData] = useState(null);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstError, setGstError] = useState("");
  const [name, setName] = useState("");
  const [lrNo, setLrNo] = useState("");
  const [dispatchDate, setDispatchDate] = useState(new Date());
  const [challanType, setChallanType] = useState("");
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [ewayBillDate, setEwayBillDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
   const [customer,setCustomer] = useState({});
   const [showCustomerPopup, setShowCustomerPopup] = useState(false);
    const [editBilled, setEditBilled] = useState(false);
    const [editShipped, setEditShipped] = useState(false);
    const [invoiceType, setInvoiceType] = useState("item");
   const states = [
     "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
     "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand",
     "Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
     "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
     "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
     "Uttarakhand","West Bengal"
   ];
   const [openStateDropdown, setOpenStateDropdown] = useState(false);
   const [selectedState, setSelectedState] = useState("");

  /* ================= PART 2 ================= */
  const blankAddress = () => ({
    name: "", address: "", city: "", contact: "", mobile: "", pan: "", gstin: "", pos: ""
  });

  const [billedTo, setBilledTo] = useState(blankAddress());

      const [shippedTo, setShippedTo] = useState(blankAddress());
  const [address, setAddress] = useState("");

  /* ================= DATA & LOGIC ================= */
  const pad4 = (n) => String(n).padStart(4, "0");
  const generateVoucher = () => `${DC_PREFIX}/${pad4(currentCount)}`;

  useEffect(() => {
    (async () => {
      try {
        const [custRes, itemRes, chlRes] = await Promise.all([
          services.getParties({ type: "customer" }),
          services.getItems({}),
          services.getDeliveryChallans({})
        ]);
        const custs = Array.isArray(custRes.data) ? custRes.data : custRes.data?.results ?? [];
        setCustomers(custs);
        setItemsList(Array.isArray(itemRes.data) ? itemRes.data : itemRes.data?.results ?? []);
        const chls = Array.isArray(chlRes.data) ? chlRes.data : chlRes.data?.results ?? [];
        const nums = chls
          .map((c) => c.challan_number || "")
          .filter((v) => v.startsWith(DC_PREFIX + "/"))
          .map((v) => Number(v.replace(DC_PREFIX + "/", "").replace(/\D/g, "")) || 0);
        const max = nums.length ? Math.max(...nums) : 0;
        setCurrentCount(max + 1);
      } catch (e) {
        console.error("Failed to load delivery challan data:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setChallanNo(generateVoucher());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCount]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.gstin || "").toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const selectCustomer = (cust) => {
    setCustomer(cust);
    setCustomerSearch(cust.name);
    setSelectedParty(cust);
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
    setShippedTo({ ...billed });
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
      setCustomers((prev) => [...prev, created]);
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

  const mapChallanType = (t) => (t === "Job Work" ? "JOB_WORK" : "SALES");

  const fmtDate = (d) => (d ? new Date(d).toISOString().split("T")[0] : "");

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
    setTransporterGST(value);
    if (value.length === 15) {
      validateGST(value);
    } else {
      setGstData(null);
      setGstError("");
    }
  };

  const resetForm = () => {
    setItems([{ id: Date.now() + Math.random(), itemId: null, product: "", description: "", hsn: "", qty: "", rate: "", tax: "0" }]);
    setCustomer({});
    setCustomerSearch("");
    setSelectedParty(null);
    setShowCustomerDropdown(false);
    setBilledTo(blankAddress());
    setShippedTo(blankAddress());
    setVehicleNo("");
    setDocNo("");
    setTransporterGST("");
    setGstData(null);
    setGstError("");
    setName("");
    setLrNo("");
    setDispatchDate(new Date());
    setChallanType("");
    setEwayBillNo("");
    setEwayBillDate("");
  };

  const handleSave = async (mode = "save") => {
    const r2 = (n) => Math.round(n * 100) / 100;
    const lines = items.map((i) => {
      const qty = Number(i.qty) || 0;
      const rate = Number(i.rate) || 0;
      const tax = Number(i.tax) || 0;
      const base = qty * rate;
      const gst = (base * tax) / 100;
      return {
        item: i.itemId || null,
        quantity: qty,
        unit: "NONE",
        rate: r2(rate),
        taxable_value: r2(base),
        gst_rate: tax,
        cgst: r2(gst / 2),
        sgst: r2(gst / 2),
        igst: 0,
        cess: 0,
        amount: r2(base + gst)
      };
    });

    if (!lines.length) { alert("Add at least one item line."); return; }
    if (lines.some((l) => !l.item)) { alert("Select a product for every item line."); return; }

    const payload = {
      challan_number: challanNo || generateVoucher(),
      date: fmtDate(invoiceDate),
      challan_type: mapChallanType(challanType),
      status: "DRAFT",
      party: selectedParty?.id || null,
      billing_address: [billedTo?.name, billedTo?.address, billedTo?.city].filter(Boolean).join(", "),
      shipping_address: [shippedTo?.name, shippedTo?.address, shippedTo?.city].filter(Boolean).join(", "),
      state_of_supply: billedTo?.pos || "",
      transporter_name: name,
      vehicle_no: vehicleNo,
      lr_rr_no: lrNo,
      narration: "",
      total_amount: r2(total),
      eway_bill_no: ewayBillNo,
      items: lines
    };

    setSaving(true);
    try {
      await services.createDeliveryChallan(payload);
      alert("Delivery Challan saved successfully!");
      setCurrentCount((prev) => prev + 1);
      resetForm();
      if (mode === "print") window.print();
    } catch (err) {
      const data = err?.response?.data || err;
      const msg =
        (typeof data === "string" && data) ||
        (Array.isArray(data) && data[0]) ||
        data?.detail ||
        data?.non_field_errors?.[0] ||
        JSON.stringify(data);
      alert(msg || "Failed to save Delivery Challan");
    } finally {
      setSaving(false);
    }
  };

  /* ================= PART 3 ================= */
  const [items, setItems] = useState([
  {
    id: Date.now() + Math.random(),
    itemId: null,
    product: "",
    description: "",
    hsn: "",
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
    product: "",
    description: "",
    hsn: "",
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

  /* ================= CALCULATIONS ================= */
  const subtotal = items.reduce((sum, i) => {
    const qty = Number(i.qty) || 0;
    const rate = Number(i.rate) || 0;
    return sum + qty * rate;
  }, 0);

  const totalTax = items.reduce((sum, i) => {
    const qty = Number(i.qty) || 0;
    const rate = Number(i.rate) || 0;
    const tax = Number(i.tax) || 0;
    return sum + ((qty * rate) * tax) / 100;
  }, 0);

  const total = subtotal + totalTax;

  return (
    <div className="delivery-challan-app">
      <div className={`dc-main-content ${collapsed ? "collapsed" : ""}`}>
        <div className="dc-wrapper">
          {/* <h2>Delivery Challan</h2> */}
          {/* ================= PART 1 ================= */}
          <div className="dc-card">
            <div className="dc-header-row">
              <div className="dc-title-section">
                <div className="dc-icon-box">
                  <i className="fas fa-truck"></i>
                </div>
                <div>
                  <h2>Delivery Challan</h2>
                  <div className="dc-voucher-row">
                    <label>Voucher No:</label>
                    <span className="dc-voucher-badge">
                      {generateVoucher()}
                    </span>
                  </div>
                </div>
              </div>
              {/* <div className="pur-voucher-row">
                  <label>Voucher No:</label>
                  <span className="voucher-value">{generateVoucher()}</span>
                </div> */}
              <div className="dc-form-group">
                <label>Challan Type</label>
                <select
                  className="dc-select"
                  onChange={(e) => setChallanType(e.target.value)}
                >
                  <option>Select</option>
                  <option>Job Work</option>
                  <option>Approval Basis</option>
                  <option>Stock Transfer</option>
                  <option>To Exhibition</option>
                  <option>From Exhibition</option>
                </select>
              </div>
              <div className="dc-form-group">
                <label>Date</label>
                <DatePicker
                  selected={invoiceDate}
                  onChange={(date) => setInvoiceDate(date)}
                  dateFormat="dd/MM/yyyy"
                  maxDate={new Date()}   // prevent future date
                  className="dc-date-input"
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
            <div className="dc-cust-details">
              <div className="dc-cust-icon">
                <i className="fas fa-shipping-fast"></i>
              </div>
              <h3>Dispatch Details</h3>
            </div>
            {/* <h3>Dispatch details</h3> */}
            <div className="dc-grid-3">
              <div className="dc-form-group">
                <label>Vehicle No</label>
                <input className="dc-input" onChange={(e) => setVehicleNo(e.target.value)} />
              </div>
              <div className="dc-form-group">
                <label>Doc No</label>
                <input className="dc-input" onChange={(e) => setDocNo(e.target.value)} />
              </div>
              <div className="dc-form-group">
                <label>Transporter GSTIN</label>
                <input
                  className="dc-input"
                  value={transporterGST}
                  onChange={handleGSTChange}
                  placeholder="Transport GSTIN"
                />
                {gstLoading && <div className="dc-gst-status">Validating...</div>}
                {gstError && <div className="dc-gst-error">{gstError}</div>}
                {gstData && (
                  <div className="dc-gst-result-box">
                    <p><strong>{gstData.name}</strong></p>
                    <p>{gstData.state}</p>
                    <p>Status: {gstData.status}</p>
                  </div>
                )}
              </div>
              <div className="dc-form-group">
                <label>Name</label>
                <input className="dc-input" onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="dc-form-group">
                <label>LR / RR No</label>
                <input className="dc-input" onChange={(e) => setLrNo(e.target.value)} />
              </div>
              <div className="dc-form-group">
                <label>Dispatch Date</label>
                <DatePicker
                  selected={dispatchDate}
                  onChange={(d) => setDispatchDate(d)}
                  dateFormat="dd/MM/yyyy"
                  maxDate={new Date()}   // prevent future date
                  className="dc-date-input"
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
          </div>

          {/* ================= PART 2 ================= */}
          <div className="dc-section-card">
              <div className="dc-customer-title">
                <div className="dc-customer-icon">
                  <i className="fas fa-user-friends"></i>
                </div>
                <h2>Customer Details</h2>
              </div>
              <div className="search-customer">
                <label>Search Customer Name</label>
                <div className="search-box">
                  <div className="debit-search-input-wrapper">
                    <FaSearch className="sale-search-icon" />
                    <input
                      type="text"
                      placeholder="Search customer..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 150)}
                    />
                  </div>
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div className="dc-customer-search-dropdown">
                      {filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          className="dc-customer-search-option"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectCustomer(c)}
                        >
                          <div className="dc-customer-search-name">{c.name}</div>
                          <div className="dc-customer-search-type">{c.gstin || ""}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    className="dc-new-customer-btn"
                    onClick={() => setShowCustomerPopup(true)}
                  >
                    + New Customer
                  </button>
                 {showCustomerPopup && (
                  <div
                    className="cust-overlay"
                    onClick={() => setShowCustomerPopup(false)}   // 🔥 outside click close
                  >

                    <div
                      className="cust-popup"
                      onClick={(e) => e.stopPropagation()}        // 🔥 prevent inside click close
                    >

                      {/* HEADER */}
                      <div className="cust-header">
                        <h3>Add New Customer</h3>

                        <button
                          className="cust-close-btn"
                          onClick={() => setShowCustomerPopup(false)}
                        >
                          ✕
                        </button>
                      </div>

                      <div className="cust-form-wrapper">

                        {/* LEFT */}
                        <div className="cust-left">

                          {/* GST ROW */}
                          <div className="cust-gst-row">
                            <input
                              className="cust-input"
                              placeholder="GSTIN / URP"
                              onChange={(e)=>setCustomer({...customer,gstin:e.target.value})}
                            />

                            <button className="cust-get-btn" onClick={fetchGstForCustomer}>Get Data</button>
                          </div>

                          <input className="cust-input" placeholder="Party Name"
                            onChange={(e)=>setCustomer({...customer,name:e.target.value})}
                          />

                          <input className="cust-input" placeholder="Billing Address 1"
                            onChange={(e)=>setCustomer({...customer,address1:e.target.value})}
                          />

                          <input className="cust-input" placeholder="Billing Address 2"
                            onChange={(e)=>setCustomer({...customer,address2:e.target.value})}
                          />

                          <input className="cust-input" placeholder="Pin"
                            onChange={(e)=>setCustomer({...customer,pin:e.target.value})}
                          />

                          <div className="cust-select">

                          <div
                            className="cust-select-box"
                            onClick={() => setOpenStateDropdown(!openStateDropdown)}
                          >
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
                                    setCustomer({...customer, state});
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
                            onChange={(e)=>setCustomer({...customer,contact:e.target.value})}
                          />

                          <input className="cust-input" placeholder="Email ID"
                            onChange={(e)=>setCustomer({...customer,email:e.target.value})}
                          />

                          <input className="cust-input" placeholder="PAN"
                            onChange={(e)=>setCustomer({...customer,pan:e.target.value})}
                          />

                          <div className="cust-row">
                            <input className="cust-input" placeholder="Opening Balance"
                              onChange={(e)=>setCustomer({...customer,balance:e.target.value})}
                            />

                            <select className="cust-input"
                              onChange={(e)=>setCustomer({...customer,drcr:e.target.value})}
                            >
                              <option>Dr</option>
                              <option>Cr</option>
                            </select>
                          </div>

                        </div>

                        {/* RIGHT */}
                        <div className="cust-right">

                          <label>Registration Type</label>

                          <select className="sale-cust-input"
                            onChange={(e)=>setCustomer({...customer,registration:e.target.value})}
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

                      {/* ACTIONS */}
                      <div className="cust-actions">
                        <button className="cust-save-btn" onClick={saveCustomer}>Save Customer</button>
                      </div>

                    </div>

                  </div>
                )}
                </div>
              </div>
              {/* Billed To and Shipped To */}
              <div className="customer-details-container">         
                {/* Billed To */}
                <div className="customer-card">
                  <div className="dc-customer-card-header">
                   <h3 className="dc-customer-card-title">
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
                        Contact: {billedTo.contact} (Mobile - {billedTo.mobile})
                      </p>
                      <p className="customer-tax">
                        PAN: {billedTo.pan}
                      </p>
                      <p className="customer-tax">
                        GSTIN: {billedTo.gstin}
                      </p>
                      <p className="customer-pos">
                        Place of Supply: {billedTo.pos}
                      </p>
                    </div>
                  )}
                </div>

                {/* Shipped To */}
                {invoiceType !== "accounting" && (
                <div className="customer-card">
                  <div className="dc-customer-card-header">
                    <h3 className="dc-customer-card-title">
                    <FaTruck />
                    Shipped To:
                  </h3>
                    <button 
                      className="dc-edit-btn"
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
                        Contact: {shippedTo.contact} (Mobile - {shippedTo.mobile})
                      </p>
                      <p className="customer-tax">
                        PAN: {shippedTo.pan}
                      </p>
                      <p className="customer-tax">
                        GSTIN: {shippedTo.gstin}
                      </p>
                      <p className="customer-pos">
                        Place of Supply: {shippedTo.pos}
                      </p>
                    </div>
                  )}
                </div>
                )}
              </div>
            </div>

          {/* ================= PART 3 ================= */}
          <div className="dc-card">
            <div className="dc-cost-details">
              <div className="dc-cust-icon">
                  <i className="fas fa-boxes"></i>
                </div>
              <h3>Product Details</h3>
            </div>
            <table className="dc-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Product</th>
                  <th>Description</th>
                  <th>HSN</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Tax %</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, i) => {
                  const qty = Number(item.qty) || 0;
                  const rate = Number(item.rate) || 0;
                  const tax = Number(item.tax) || 0;
                  const amount = qty * rate + (qty * rate * tax) / 100;

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
                      <td>
                        <select
                          className="dc-select"
                          value={item.product || ""}
                          onChange={(e) => {
                            const d = [...items];
                            const val = e.target.value;
                            const match = itemsList.find((it) => String(it.id) === val);
                            if (match) {
                              d[i].product = match.name;
                              d[i].itemId = match.id;
                              d[i].description = match.description || match.name || "";
                              d[i].hsn = match.hsn_code || "";
                            } else {
                              d[i].product = "";
                              d[i].itemId = null;
                              d[i].description = "";
                              d[i].hsn = "";
                            }
                            setItems(d);
                          }}
                        >
                          <option value="">Select Product</option>
                          {itemsList.map((it) => (
                            <option key={it.id} value={it.id}>{it.name}</option>
                          ))}
                        </select>
                      </td>
                      <td><input className="dc-input" value={item.description} onChange={(e) => handleChange(i, "description", e.target.value)} /></td>
                      <td><input className="dc-input" value={item.hsn} onChange={(e) => handleChange(i, "hsn", e.target.value)} /></td>
                      <td><input className="dc-input" type="number" onChange={(e) => handleChange(i, "qty", e.target.value)} /></td>
                      <td><input className="dc-input" type="number" onChange={(e) => handleChange(i, "rate", e.target.value)} /></td>
                      <td>
                        <select className="dc-select" onChange={(e) => handleChange(i, "tax", e.target.value)}>
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                        </select>
                      </td>
                      <td><input className="dc-input" value={amount.toFixed(2)} readOnly /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button className="dc-add-btn" onClick={addRow}>
              + Add Item
            </button>
          </div>
          <div className="eway-wrapper">

            {/* LEFT SIDE */}
            <div className="eway-left">
              <div className="eway-container">
                <div className="eway-header">
                  <button className="eway-btn">Create E-way Bill</button>
                </div>

                <div className="eway-form">
                  <div className="eway-field">
                    <label>E-way Bill No</label>
                    <input
                      type="text"
                      placeholder="Enter E-way Bill No"
                      value={ewayBillNo}
                      onChange={(e) => setEwayBillNo(e.target.value)}
                    />
                  </div>

                  <div className="eway-field">
                    <label>E-way Bill Date</label>
                    <input
                      type="date"
                      value={ewayBillDate}
                      onChange={(e) => setEwayBillDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="eway-right">
              <div className="dc-summary-box">
                <div>Subtotal: ₹ {subtotal.toFixed(2)}</div>
                <div>Tax: ₹ {totalTax.toFixed(2)}</div>
                <div className="dc-total">Total: ₹ {total.toFixed(2)}</div>
              </div>

              <div className="dc-footer-actions">
                <button disabled={saving} onClick={() => handleSave("save")}>Save</button>
                <button disabled={saving} onClick={() => handleSave("print")}>Save & Print</button>
                <button onClick={resetForm}>Cancel</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}