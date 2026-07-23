import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../styles/selectCompany.css";
import logo from "../assets/logo_app.jpeg";
import {
  Building2,
  BadgeCheck,
  Clock,
  Users
} from "lucide-react";
import * as services from "../api/services";
import api from "../api/axios";

export default function SelectCompany({ onClose, onSave }) {

  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("company");
  const [showStateList, setShowStateList] = useState(false);
  const [showGstStateList, setShowGstStateList] = useState(false);
  const [showRegType, setShowRegType] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [gstin, setGstin] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [country, setCountry] = useState("India");
  const dropdownRef = useRef(null);
  
  // GST Details
  const [financialYear, setFinancialYear] = useState("2024-25");
  const [bookBeginning, setBookBeginning] = useState("");
  const [returnType, setReturnType] = useState("Monthly");
  const [registrationType, setRegistrationType] = useState("Regular");
  const [useInventory, setUseInventory] = useState("No");
  
  // Other Details
  const [ewayBill, setEwayBill] = useState("No");
  const [threshold, setThreshold] = useState("50000");
  const [eInvoice, setEInvoice] = useState("No");
  const [ewbLoginId, setEwbLoginId] = useState("");
  const [ewbPassword, setEwbPassword] = useState("");
  const [einvoiceLoginId, setEinvoiceLoginId] = useState("");
  const [einvoicePassword, setEinvoicePassword] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh"
];

  const regTypes = ["Regular", "Composition", "Regular - SEZ"];

  const [selectedState, setSelectedState] = useState("");
  const [selectedgstState, setgstSelectedState] = useState("");
  const [selectedregState, setregSelectedState] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("Active");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

const avatarColors = [
  "purple",
  "blue",
  "green",
  "orange",
  "pink",
  "cyan"
];

  useEffect(() => {
    services.getCompanySettings({}).then(res => {
      const list = res.data?.results || res.data || [];
      setCompanies(Array.isArray(list) ? list : []);
    }).catch(() => {
      setCompanies([]);
    }).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("company");
    localStorage.removeItem("tenant_id");
    localStorage.removeItem("company_name");
    navigate("/");
  };

  const selectCompany = (company) => {
    localStorage.setItem("company", company);
    // Save tenant_id and company_name for X-Tenant-ID header
    if (typeof company === "object" && company.uuid) {
      localStorage.setItem("tenant_id", company.uuid);
      localStorage.setItem("company_name", company.company_name || "");
    } else {
      localStorage.setItem("tenant_id", "default");
      localStorage.setItem("company_name", company);
    }
    navigate("/dashboard");
  };
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("Monthly");

  const createCompany = () => {
    setIsCreating(true);
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setFormErrors({});
    if (!newCompanyName.trim()) return;
    try {
      const res = await services.createCompanySetting({
        company_name: newCompanyName.trim(),
        gstin,
        address: registeredAddress,
        branch_address: branchAddress,
        state: selectedState,
        country,
        email,
        website: website && !website.startsWith("http") ? "https://" + website : website,
        phone: contactNo,
        contact_person: contactPerson,
        financial_year: financialYear,
        book_beginning: bookBeginning || null,
        return_type: returnType,
        registration_type: registrationType,
        use_inventory: useInventory,
        eway_bill: ewayBill,
        eway_bill_threshold: threshold,
        ewb_login_id: ewbLoginId,
        ewb_password: ewbPassword,
        e_invoice: eInvoice,
        einvoice_login_id: einvoiceLoginId,
        einvoice_password: einvoicePassword,
      });
      const newCompany = res.data;
      setCompanies(prev => [newCompany, ...prev]);
      setNewCompanyName("");
      setIsCreating(false);
      setActiveTab("company");
      setShowStateList(false);
      setShowRegType(false);
      if (onClose) onClose();
    } catch (err) {
      const data = err.response?.data || {};
      if (typeof data === "object" && !data.detail) {
        const fieldErrors = {};
        Object.entries(data).forEach(([field, msgs]) => {
          fieldErrors[field] = Array.isArray(msgs) ? msgs.join(". ") : msgs;
        });
        setFormErrors(fieldErrors);
        const firstMsg = Object.values(fieldErrors).find(Boolean);
        if (firstMsg) alert(firstMsg);
      } else {
        alert("Failed to create company: " + (data.detail || err.message));
      }
    }
  };

  const filtered = companies.filter(c => {
    const name = c.company_name || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });
  useEffect(() => {
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowStateList(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);
  const isValidGST = (gst) => {
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
  return regex.test(gst);
};
const handleGetGST = async () => {
  if (!isValidGST(gstin)) {
    alert("Invalid GSTIN");
    return;
  }

  try {
    const res = await api.get(`/accounting/gst/${gstin}/`);
    const data = res.data;

    if (data.success) {
      setNewCompanyName(data.company_name || "");
      setRegisteredAddress(data.address || "");
      setBranchAddress(data.branch_address || "");
      setSelectedState(data.state || "");
      setEmail(data.email || "");
      setWebsite(data.website || "");
      setContactPerson(data.contact_person || "");
      setContactNo(data.contact_no || "");
    } else {
      alert("GST not found");
    }

  } catch (error) {
    console.error(error);
    alert("GST lookup failed: " + (error.response?.data?.detail || error.message));
  }
};
  


  return (
    <div className="company-page">

  {/* BACKGROUND EFFECTS */}

  <div className="gradient-bg"></div>

  <div className="floating-shapes">
    <div className="shape shape-1"></div>
    <div className="shape shape-2"></div>
    <div className="shape shape-3"></div>
  </div>

  

    {/* =========================
        TOPBAR
    ========================== */}

    <div className="select-company-topbar">
      <div className="topbar-left">
        <img
          src={logo}
          alt="Logo"
          className="top-logo"
        />
      </div>
      <div className="topbar-right">
        <button className="notification-btn">
          🔔
          <span>0</span>
        </button>
        <div className="profile-wrapper">
          <div
            className="admin-profile"
            onClick={() =>
              setShowProfileMenu(!showProfileMenu)
            }
          >
            <div className="admin-avatar">
              A
            </div>
            <span>Admin</span>
          </div>
          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-user">
                Admin
              </div>
              <button
                className="logout-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* =========================
        HERO SECTION
    ========================== */}
    <div className="company-container">

    <div className="hero-section">

      {/* LEFT SIDE */}

      <div className="hero-left">

        <span className="welcome-text">
          👋 Welcome back, <b>Admin!</b> 👋
        </span>

        <h1>
          Select a Company to Get Started
        </h1>

        <p>
          Access and manage all your companies from one place.
        </p>

      </div>

      {/* RIGHT SIDE */}

      <div className="hero-right">

        <button
          className="hero-create-btn"
          onClick={createCompany}
        >
          ＋ Create New Company
        </button>

        {/* HERO IMAGE */}

        <div className="hero-image-wrapper">

          <img
            src={require("../assets/ct.png")}
            alt="ERP Illustration"
            className="hero-image"
          />

        </div>

      </div>

    </div>

    {/* =========================
        STATS GRID
    ========================== */}

    <div className="company-stats-grid">

      {/* TOTAL */}

      <div className="company-stat-card purple">

        <div className="stat-icon">
          <Building2 size={24} />
        </div>

        <div>
          <h2>{companies.length}</h2>
          <p>Total Companies</p>
        </div>

      </div>

      {/* ACTIVE */}

      <div className="company-stat-card green">

        <div className="stat-icon">
          <BadgeCheck size={24} />
        </div>

        <div>
          <h2>{companies.filter(c => c.is_active !== false).length}</h2>
          <p>Active Companies</p>
        </div>

      </div>

      {/* INACTIVE */}

      <div className="company-stat-card orange">

        <div className="stat-icon">
          <Clock size={24} />
        </div>

        <div>
          <h2>{companies.filter(c => c.is_active === false).length}</h2>
          <p>Inactive Companies</p>
        </div>

      </div>

      {/* USERS */}

      <div className="company-stat-card blue">

        <div className="stat-icon">
          <Users size={24} />
        </div>

        <div>
          <h2>&mdash;</h2>
          <p>Users</p>
        </div>

      </div>

    </div>

    {/* =========================
        TOOLBAR
    ========================== */}

    <div className="company-toolbar">

      {/* SEARCH */}

      <div className="search-wrapper">

        <svg
          className="select-search-icon"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="11"
            cy="11"
            r="8"
            stroke="currentColor"
            strokeWidth="2"
          />

          <path
            d="m21 21-4.35-4.35"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>

        <input
          className="company-search"
          placeholder="Search companies by name or ID..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </div>

      {/* RIGHT FILTERS */}

      {/* <div className="toolbar-right">

        <select className="sort-select">

          <option>
            Recently Added
          </option>

          <option>
            Company Name
          </option>

        </select>

        <button className="view-btn active">
          ☰
        </button>

        <button className="view-btn">
          ⊞
        </button>

      </div> */}

    </div>

    {/* =========================
        COMPANY TABLE
    ========================== */}

    <div className="modern-company-table">

      {/* TABLE HEADER */}

      <div className="select-table-header">

        <div>Company</div>
        <div>Type</div>
        <div>Added On</div>
        <div>Status</div>
        <div>Last Accessed</div>
        <div>Action</div>

      </div>

      {/* TABLE BODY */}

      {filtered.map((company, i) => {
        const companyName = company.company_name || "Unknown";
        const companyId = company.company_id || company.uuid || `C00${i + 1}`;
        return (
        <div
          key={i}
          className="select-table-row"
        >

          {/* COMPANY CELL */}

          <div className="company-cell">

            <div
              className={`table-avatar ${
                avatarColors[i % avatarColors.length]
              }`}
            >
              {companyName.charAt(0)}
            </div>

            <div>

              <h4>{companyName}</h4>

              <span>
                ID: {companyId}
              </span>

            </div>

          </div>

          {/* TYPE */}

          <div>
            {company.registration_type || "—"}
          </div>

          {/* DATE */}

          <div>
            {company.created_at ? new Date(company.created_at).toLocaleDateString("en-IN") : "—"}
          </div>

          {/* STATUS */}

          <div>

            <span className={`status-badge ${company.is_active !== false ? "active" : "inactive"}`}>
              ● {company.is_active !== false ? "Active" : "Inactive"}
            </span>

          </div>

          {/* LAST ACCESSED */}

          <div>
            {company.updated_at ? new Date(company.updated_at).toLocaleDateString("en-IN") : "0"}
          </div>

          {/* ACTION */}

          <div className="action-cell">

            <button
              className="select-company-btn"
              onClick={() =>
                selectCompany(company)
              }
            >
              Select Company
            </button>

          </div>

        </div>)})}
    </div>

    {/* =========================
        SECURITY FOOTER
    ========================== */}

    <div className="security-footer">

      <div className="security-left">

        <div className="security-icon">
          🛡
        </div>

        <div>

          <h4>
            Secure. Reliable. Always Here.
          </h4>

          <p>
            Your data is safe with us.
            We use enterprise-grade
            security to protect your business.
          </p>

        </div>

      </div>

      <div className="security-right">

        <span>
          🔒 Encrypted Data
        </span>

        <span>
          ☁ Regular Backups
        </span>

        <span>
          🛡 Secure Access
        </span>

      </div>

    </div>

 
        {isCreating && (
          <div className="create-popup-overlay">
              <div className="create-popup-modal">
                {/* HEADER */}
                <div className="popup-header">
                  <h3>Create Company</h3>
                  <button onClick={() => setIsCreating(false)} className="close-btn">✖</button>
                </div>

                {/* 3-COLUMN LAYOUT */}
                <div className="popup-three-columns">
                  
                  {/* COLUMN 1: COMPANY DETAILS */}
                  <div className="popup-column">
                    <div className="column-header">
                      <span className="column-icon">🏢</span>
                      <h4>Company Details</h4>
                    </div>
                    
                    <div className="popup-field">
                      <label>GSTIN</label>
                      <div className="sel-gst-row">
                        <input 
                          maxLength={15} 
                          value={gstin}
                          onChange={(e) => setGstin(e.target.value)}
                          placeholder="22AAAAA0000A1Z"
                        />
                        <button className="sel-gst-btn" onClick={handleGetGST}>
                          Get GST
                        </button>
                      </div>
                    </div>

                    <div className="popup-field">
                      <label>Company Name</label>
                      <input 
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        placeholder="Enter company name"
                      />
                    </div>

                    <div className="popup-field">
                      <label>Registered Address</label>
                      <textarea 
                        rows="2"
                        value={registeredAddress}
                        onChange={(e) => setRegisteredAddress(e.target.value)}
                        placeholder="Plot No, Street, City, PIN"
                      />
                    </div>

                    <div className="popup-field">
                      <label>Branch Address</label>
                      <textarea 
                        rows="2"
                        value={branchAddress}
                        onChange={(e) => setBranchAddress(e.target.value)}
                        placeholder="Branch location (optional)"
                      />
                    </div>

                    <div className="popup-field">
                      <label>State</label>

                      <div className="dropdown-box" ref={dropdownRef}>
                        <input
                          value={selectedState}
                          placeholder="Search or select state"
                          onChange={(e) => {
                            setSelectedState(e.target.value);
                            setShowStateList(true);
                          }}
                          onClick={() => setShowStateList(true)}
                        />

                        {showStateList && (
                          <div className="dropdown-panel">
                            {states.filter((state) =>state.toLowerCase().startsWith(selectedState.toLowerCase()))
                              .map((state, i) => (
                                <div
                                  key={i}
                                  className="dropdown-item"
                                  onClick={() => {
                                    setSelectedState(state);
                                    setShowStateList(false);
                                  }}
                                >
                                  {state}
                                </div>
                              ))}

                            {/* If no match */}
                            {states.filter((s) =>
                              s.toLowerCase().includes(selectedState.toLowerCase())
                            ).length === 0 && (
                              <div className="dropdown-item no-data">
                                No state found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="popup-field">
                      <label>Country</label>
                      <input value="India" readOnly />
                    </div>

                    <div className="popup-field">
                      <label>Email</label>
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contact@company.com"
                      />
                    </div>

                    <div className="popup-field">
                      <label>Website</label>
                      <input 
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="popup-field">
                      <label>Contact Person</label>
                      <input 
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="Full name"
                      />
                    </div>

                    <div className="popup-field">
                      <label>Contact No</label>
                      <input 
                        value={contactNo}
                        onChange={(e) => setContactNo(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  {/* COLUMN 2: GST DETAILS */}
                  <div className="popup-column">
                    <div className="column-header">
                      <span className="column-icon">📑</span>
                      <h4>GST Details</h4>
                    </div>

                    <div className="popup-field">
                      <label>Financial Year</label>
                      <input 
                        placeholder="2024-25"
                        value={financialYear}
                        onChange={(e) => setFinancialYear(e.target.value)}
                      />
                    </div>

                    <div className="popup-field">
                      <label>Book Beginning</label>
                      <input 
                        type="date"
                        value={bookBeginning}
                        onChange={(e) => setBookBeginning(e.target.value)}
                      />
                    </div>

                    <div className="popup-field">
                      <label>Return Type</label>
                      <select 
                        value={returnType}
                        onChange={(e) => setReturnType(e.target.value)}
                      >
                        <option>Monthly</option>
                        <option>Quarterly</option>
                      </select>
                    </div>

                    <div className="popup-field">
                      <label>Registration Type</label>
                      <select 
                        value={registrationType}
                        onChange={(e) => setRegistrationType(e.target.value)}
                      >
                        <option>Regular</option>
                        <option>Composition</option>
                        <option>Regular SEZ</option>
                      </select>
                    </div>

                    <div className="popup-field">
                      <label>Use Inventory</label>
                      <div className="radio-group">
                        <label>
                          <input 
                            type="radio" 
                            name="inventory" 
                            checked={useInventory === "Yes"}
                            onChange={() => setUseInventory("Yes")}
                          /> Yes
                        </label>
                        <label>
                          <input 
                            type="radio" 
                            name="inventory"
                            checked={useInventory === "No"}
                            onChange={() => setUseInventory("No")}
                          /> No
                        </label>
                      </div>
                    </div>

                    {/* <div className="popup-field">
                      <label>GST Filing Status</label>
                      <select defaultValue="Active">
                        <option>Active</option>
                        <option>Suspended</option>
                      </select>
                    </div>

                    <div className="popup-field">
                      <label>Annual Turnover</label>
                      <input placeholder="Enter turnover amount" />
                    </div> */}
                  </div>

                  {/* COLUMN 3: OTHER DETAILS */}
                  <div className="popup-column">
                    <div className="column-header">
                      <span className="column-icon">⚙️</span>
                      <h4>Other Details</h4>
                    </div>

                    {/* ================= E-WAY BILL ================= */}
                    <div className="popup-field">
                      <label>E-Way Bill Applicable</label>
                      <div className="radio-group">
                        <label>
                          <input 
                            type="radio" 
                            name="eway" 
                            checked={ewayBill === "Yes"}
                            onChange={() => setEwayBill("Yes")}
                          /> Yes
                        </label>
                        <label>
                          <input 
                            type="radio" 
                            name="eway"
                            checked={ewayBill === "No"}
                            onChange={() => setEwayBill("No")}
                          /> No
                        </label>
                      </div>
                    </div>

                    {/* ✅ SHOW ONLY IF YES */}
                    {ewayBill === "Yes" && (
                      <>
                        <div className="popup-field">
                          <label>Threshold (₹)</label>
                          <input 
                            placeholder="50000"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                          />
                        </div>

                        <div className="popup-field">
                          <label>EWB Login ID</label>
                          <input 
                            value={ewbLoginId}
                            onChange={(e) => setEwbLoginId(e.target.value)}
                            placeholder="Username / API login"
                          />
                        </div>

                        <div className="popup-field">
                          <label>Password</label>
                          <input 
                            type="password"
                            value={ewbPassword}
                            onChange={(e) => setEwbPassword(e.target.value)}
                            placeholder="••••••"
                          />
                        </div>
                      </>
                    )}

                    {/* ================= E-INVOICE ================= */}
                    <div className="popup-field">
                      <label>E-Invoice Applicable</label>
                      <div className="radio-group">
                        <label>
                          <input 
                            type="radio" 
                            name="einvoice"
                            checked={eInvoice === "Yes"}
                            onChange={() => setEInvoice("Yes")}
                          /> Yes
                        </label>
                        <label>
                          <input 
                            type="radio" 
                            name="einvoice"
                            checked={eInvoice === "No"}
                            onChange={() => setEInvoice("No")}
                          /> No
                        </label>
                      </div>
                    </div>

                    {/* ✅ SHOW ONLY IF YES */}
                    {eInvoice === "Yes" && (
                      <>
                        <div className="popup-field">
                          <label>Invoice Login ID</label>
                          <input placeholder="Invoice Username" value={einvoiceLoginId} onChange={(e) => setEinvoiceLoginId(e.target.value)} />
                        </div>

                        <div className="popup-field">
                          <label>Invoice Password</label>
                          <input type="password" placeholder="••••••" value={einvoicePassword} onChange={(e) => setEinvoicePassword(e.target.value)} />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* FOOTER */}
                <div className="popup-footer">
                  <button onClick={handleCreateCompany} className="save-btn">Save Company</button>
                </div>
              </div>
            </div>
        )}
      </div>
    </div>
      
  );
}