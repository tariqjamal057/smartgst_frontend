import { useState, useRef, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import {
  Building2,
  Settings,
  Link2,
  Shield,
  DatabaseBackup,
  Download,
  Languages,
  SplitSquareVertical,
  Trash2
} from "lucide-react";

import "../styles/CompanySettings.css";
import * as services from "../api/services";

const sidebarOptions = [
  {
    key: "create",
    label: "Create Company",
    icon: <Building2 size={18} />
  },

  {
    key: "alter",
    label: "Alter Company",
    icon: <Settings size={18} />
  },

  {
    key: "connect",
    label: "Connect Company",
    icon: <Link2 size={18} />
  },

  {
    key: "security",
    label: "Security",
    icon: <Shield size={18} />
  },

  {
    key: "backup",
    label: "Backup & Restore",
    icon: <DatabaseBackup size={18} />
  },

  {
    key: "import",
    label: "Import Company",
    icon: <Download size={18} />
  },

  {
    key: "language",
    label: "Language",
    icon: <Languages size={18} />
  },

  {
    key: "split",
    label: "Split Company",
    icon: <SplitSquareVertical size={18} />
  },

  {
    key: "delete",
    label: "Delete Company",
    icon: <Trash2 size={18} />,
    danger: true
  }
];

const CompanySettings = ({onSave}) => {
  const { collapsed } = useOutletContext();
  const navigate = useNavigate();
   const [eInvoice, setEInvoice] = useState("No");
   const [ewayBill, setEwayBill] = useState("No");
  const [threshold, setThreshold] = useState("50000");
  const [ewbLoginId, setEwbLoginId] = useState("");
  const [ewbPassword, setEwbPassword] = useState("");
  const [einvoiceLoginId, setEinvoiceLoginId] = useState("");
  const [einvoicePassword, setEinvoicePassword] = useState("");
  const [financialYear, setFinancialYear] = useState("2024-25");
  const [bookBeginning, setBookBeginning] = useState("");
  const [returnType, setReturnType] = useState("Monthly");
  const [registrationType, setRegistrationType] = useState("Regular");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [gstin, setGstin] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [useInventory, setUseInventory] = useState("No");
  const dropdownRef = useRef(null);
  const [savedCompany, setSavedCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [connectEmail, setConnectEmail] = useState("");
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectMessage, setConnectMessage] = useState("");
  const [connectError, setConnectError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdMessage, setPwdMessage] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [sessions, setSessions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [sessionsMessage, setSessionsMessage] = useState("");
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");
  const [backupError, setBackupError] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [splitDate, setSplitDate] = useState("");
  const [splitLoading, setSplitLoading] = useState(false);
  const [splitMessage, setSplitMessage] = useState("");
  const [splitError, setSplitError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const restoreInputRef = useRef(null);
  const importInputRef = useRef(null);
   const [showStateList, setShowStateList] = useState(false);
    const resetForm = () => {
    setEInvoice("No");
    setEwayBill("No");
    setThreshold("50000");
    setEwbLoginId("");
    setEwbPassword("");
    setEinvoiceLoginId("");
    setEinvoicePassword("");
    setFinancialYear("2024-25");
    setBookBeginning("");
    setReturnType("Monthly");
    setRegistrationType("Regular");
    setNewCompanyName("");
    setGstin("");
    setRegisteredAddress("");
    setBranchAddress("");
    setEmail("");
    setWebsite("");
    setContactPerson("");
    setContactNo("");
    setSelectedState("");
    setUseInventory("No");
  };
    const handleSave = async () => {
    const websiteValue = website.trim();
    const normalizedWebsite =
      websiteValue && !/^https?:\/\//i.test(websiteValue)
        ? `https://${websiteValue}`
        : websiteValue;

    const companyData = {
      company_name: newCompanyName,
      gstin,
      address: registeredAddress,
      branch_address: branchAddress,
      state: selectedState,
      country: "India",
      email,
      website: normalizedWebsite,
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
    };

    try {
      const res = companyId
        ? await services.updateCompanySetting(companyId, companyData)
        : await services.createCompanySetting(companyData);
      const data = res.data;
      if (!companyId && data.tenant) {
        localStorage.setItem("tenant_id", data.tenant);
      }
      setCompanyId(data.id);
      setSavedCompany({
        id: data.id,
        companyName: data.company_name,
        gstin: data.gstin,
        registeredAddress: data.address,
        branchAddress: data.branch_address,
        state: data.state,
        country: data.country,
        email: data.email,
        website: data.website,
        contactPerson: data.contact_person,
        contactNo: data.phone,
        financialYear: data.financial_year,
        returnType: data.return_type,
        registrationType: data.registration_type,
        useInventory: data.use_inventory,
        ewayBill: data.eway_bill,
        threshold: data.eway_bill_threshold,
        eInvoice: data.e_invoice,
        ewbLoginId: data.ewb_login_id,
        ewbPassword: data.ewb_password,
      });
      if (onSave) onSave(data);
      alert(companyId ? "Company updated successfully." : "Company created successfully.");
      resetForm();
    } catch (err) { console.error(err); alert("Failed to save company: " + (err.response?.data?.detail || err.message)); }
  };
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

  const [activeTab, setActiveTab] = useState("create");
   const isValidGST = (gst) => {
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
  return regex.test(gst);
};
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

const applyCompanyData = (data) => {
  if (!data) return;
  setCompanyId(data.id);
  setNewCompanyName(data.company_name || "");
  setGstin(data.gstin || "");
  setRegisteredAddress(data.address || "");
  setBranchAddress(data.branch_address || "");
  setSelectedState(data.state || "");
  setEmail(data.email || "");
  setWebsite(data.website || "");
  setContactPerson(data.contact_person || "");
  setContactNo(data.phone || "");
  setFinancialYear(data.financial_year || "2024-25");
  setBookBeginning(data.book_beginning || "");
  setReturnType(data.return_type || "Monthly");
  setRegistrationType(data.registration_type || "Regular");
  setUseInventory(data.use_inventory || "No");
  setEwayBill(data.eway_bill || "No");
  setThreshold(data.eway_bill_threshold || "50000");
  setEInvoice(data.e_invoice || "No");
  setEwbLoginId(data.ewb_login_id || "");
  setEwbPassword(data.ewb_password || "");
  setEinvoiceLoginId(data.einvoice_login_id || "");
  setEinvoicePassword(data.einvoice_password || "");
  setSavedCompany({
    id: data.id,
    companyName: data.company_name,
    gstin: data.gstin,
    registeredAddress: data.address,
    branchAddress: data.branch_address,
    state: data.state,
    country: data.country,
    email: data.email,
    website: data.website,
    contactPerson: data.contact_person,
    contactNo: data.phone,
    financialYear: data.financial_year,
    returnType: data.return_type,
    registrationType: data.registration_type,
    useInventory: data.use_inventory,
    ewayBill: data.eway_bill,
    threshold: data.eway_bill_threshold,
    eInvoice: data.e_invoice,
    ewbLoginId: data.ewb_login_id,
    ewbPassword: data.ewb_password,
  });
};

useEffect(() => {
  const getCachedCompanyId = () => {
    const cached = localStorage.getItem("company");
    if (!cached) return null;
    try {
      const obj = JSON.parse(cached);
      return obj && obj.id ? obj.id : null;
    } catch (e) {
      console.error("Failed to parse cached company:", e);
      return null;
    }
  };

  const loadCompany = async () => {
    try {
      const cachedId = getCachedCompanyId();
      let data = null;
      if (cachedId) {
        const res = await services.getCompanySetting(cachedId);
        data = res.data;
      } else {
        const res = await services.getCompanySettings();
        data = Array.isArray(res.data) ? res.data[0] : res.data;
      }
      console.log("Fetched company data:", data);
      if (data) applyCompanyData(data);
    } catch (err) {
      console.error("Failed to load company settings:", err);
    }
  };
  loadCompany();
  loadConnectedUsers();
  loadSecurityData();
}, []);
const handleGetGST = async () => {
  if (!isValidGST(gstin)) {
    alert("Invalid GSTIN");
    return;
  }

  try {
    const res = await services.lookupGst(gstin);
    const data = res.data;

    if (data.success) {
      // ✅ Auto fill fields
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

const loadConnectedUsers = async () => {
  try {
    const res = await services.getConnectedUsers();
    setConnectedUsers(Array.isArray(res.data) ? res.data : []);
  } catch (err) {
    console.error("Failed to load connected users:", err);
    setConnectedUsers([]);
  }
};

const handleConnectCA = async () => {
  if (!connectEmail.trim()) {
    setConnectError("Enter a CA email");
    setConnectMessage("");
    return;
  }
  setConnectLoading(true);
  setConnectError("");
  setConnectMessage("");
  try {
    const res = await services.connectCA(connectEmail.trim());
    setConnectMessage(`Connected ${res.data.email} (${res.data.role}).`);
    setConnectEmail("");
    loadConnectedUsers();
  } catch (err) {
    setConnectError(err.response?.data?.detail || "Failed to connect. Try again.");
  } finally {
    setConnectLoading(false);
  }
};

const handleRemoveUser = async (id) => {
  try {
    await services.removeConnectedUser(id);
    loadConnectedUsers();
  } catch (err) {
    alert(err.response?.data?.detail || "Failed to remove user.");
  }
};

const loadSecurityData = async () => {
  try {
    const [sRes, aRes] = await Promise.all([
      services.getActiveSessions(),
      services.getLoginActivity(),
    ]);
    setSessions(Array.isArray(sRes.data) ? sRes.data : []);
    setActivity(Array.isArray(aRes.data) ? aRes.data : []);
  } catch (err) {
    console.error("Failed to load security data:", err);
  }
};

const handleChangePassword = async () => {
  setPwdMessage("");
  setPwdError("");
  if (newPassword !== confirmPassword) {
    setPwdError("New passwords do not match.");
    return;
  }
  try {
    const res = await services.changePassword({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    setPwdMessage(res.data.detail || "Password changed successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  } catch (err) {
    setPwdError(err.response?.data?.detail || "Failed to change password.");
  }
};

const handleRevokeSession = async (id) => {
  try {
    await services.revokeSession(id);
    setSessionsMessage("Session revoked.");
    loadSecurityData();
  } catch (err) {
    setSessionsMessage(err.response?.data?.detail || "Failed to revoke session.");
  }
};

const extractErrorMessage = (err, fallback) => {
  const data = err.response?.data;
  if (Array.isArray(data)) return data.join(", ");
  if (data && typeof data === "object" && data.detail) return data.detail;
  return fallback;
};

const handleCreateBackup = async () => {
  setBackupLoading(true);
  setBackupMessage("");
  setBackupError("");
  try {
    const res = await services.exportBackup();
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    const disposition = res.headers["content-disposition"] || "";
    const match = disposition.match(/filename="([^"]+)"/);
    link.download = match
      ? match[1]
      : `backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setBackupMessage("Backup downloaded successfully.");
  } catch (err) {
    setBackupError(extractErrorMessage(err, "Backup failed. Try again."));
  } finally {
    setBackupLoading(false);
  }
};

const handleRestoreBackup = async (file) => {
  if (!file) return;
  if (!window.confirm("Restore will replace all current company data. Continue?")) return;
  setBackupLoading(true);
  setBackupMessage("");
  setBackupError("");
  try {
    const res = await services.restoreBackup(file);
    setBackupMessage(res.data?.detail || "Backup restored successfully.");
  } catch (err) {
    setBackupError(extractErrorMessage(err, "Restore failed. Try again."));
  } finally {
    setBackupLoading(false);
  }
};

const handleImportFile = async (file) => {
  if (!file) return;
  setSelectedImportFile(file);
  setImportLoading(true);
  setImportMessage("");
  setImportError("");
  try {
    const res = await services.restoreBackup(file);
    setImportMessage(res.data?.detail || "Import completed successfully.");
  } catch (err) {
    setImportError(extractErrorMessage(err, "Import failed. Try again."));
  } finally {
    setImportLoading(false);
  }
};

const handleSplitCompany = async () => {
  if (!splitDate) {
    setSplitError("Select a split date.");
    setSplitMessage("");
    return;
  }
  if (!window.confirm(`Create a new company starting from ${splitDate}?`)) return;
  setSplitLoading(true);
  setSplitMessage("");
  setSplitError("");
  try {
    const res = await services.splitCompany(splitDate);
    setSplitMessage(
      `New company created: ${res.data.company_name} (${res.data.company_id}) for FY ${res.data.financial_year}.`
    );
    setSplitDate("");
  } catch (err) {
    setSplitError(extractErrorMessage(err, "Split failed. Try again."));
  } finally {
    setSplitLoading(false);
  }
};

const handleDeleteCompany = async () => {
  if (!companyId) {
    setDeleteError("No company selected to delete.");
    return;
  }
  if (!window.confirm("This will permanently delete the company and all its data. This cannot be undone. Continue?")) return;
  setDeleteLoading(true);
  setDeleteMessage("");
  setDeleteError("");
  try {
    await services.deleteCompanySetting(companyId);
    localStorage.removeItem("company");
    localStorage.removeItem("tenant_id");
    localStorage.removeItem("company_name");
    setDeleteMessage("Company deleted successfully.");
    navigate("/select-company", { replace: true });
  } catch (err) {
    setDeleteError(extractErrorMessage(err, "Delete failed. Try again."));
    setDeleteLoading(false);
  }
};

const handleRevokeAllSessions = async () => {
  if (!window.confirm("Revoke all other sessions?")) return;  try {
    await services.revokeAllSessions();
    setSessionsMessage("All other sessions revoked.");
    loadSecurityData();
  } catch (err) {
    setSessionsMessage(err.response?.data?.detail || "Failed to revoke sessions.");
  }
};

const formatSessionTime = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-IN");
  } catch (e) {
    return iso;
  }
};


  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>
      <div className="company-settings-wrapper">

        {/* ================= SIDEBAR ================= */}
        <div className="company-settings-sidebar">

          <div className="settings-sidebar-header">
            <h2>Settings</h2>
            <p>Manage company preferences</p>
          </div>

          <div className="settings-sidebar-menu">

            {sidebarOptions.map((item) => (

              <button
                key={item.key}
                className={`settings-menu-item 
                ${activeTab === item.key ? "active" : ""}
                ${item.danger ? "danger" : ""}`}
                onClick={() => setActiveTab(item.key)}
              >

                <span className="menu-icon">
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>

              </button>

            ))}

          </div>

        </div>

        {/* ================= CONTENT ================= */}
        <div className="company-settings-content">

          {/* CREATE COMPANY */}
          {/* {activeTab === "create" && (
            <div className="settings-content-card">

              <div className="content-header">
                <div>
                  <h2>Create Company</h2>
                  <p>Create a new company profile</p>
                </div>

                <button className="company-save-btn">
                  Save Company
                </button>
              </div>

              <div className="settings-form-grid">

                <div className="company-setting-form-group">
                  <label>Company Name</label>
                  <input type="text" placeholder="Enter company name" />
                </div>

                <div className="company-setting-form-group">
                  <label>GST Number</label>
                  <input type="text" placeholder="Enter GST number" />
                </div>

                <div className="company-setting-form-group full-width">
                  <label>Address</label>
                  <textarea placeholder="Enter company address" />
                </div>

                <div className="company-setting-form-group">
                  <label>Email</label>
                  <input type="email" placeholder="company@email.com" />
                </div>

                <div className="company-setting-form-group">
                  <label>Phone</label>
                  <input type="text" placeholder="+91 9876543210" />
                </div>

              </div>

            </div>
          )} */}
          {/* CREATE COMPANY */}
          {activeTab === "create" && (
            <div className="settings-content-card">
              {/* HEADER */}
              <div className="content-header">
                <div>
                  <h2>Create Company</h2>
                  <p>Create a new company profile</p>
                </div>
                <button onClick={handleSave} className="company-save-btn">Save Company</button>
              </div>

              {/* SIMPLE 2 COLUMN LAYOUT */}
              <div className="company-create-grid">
                {/* =========================================
                    SECTION 1: COMPANY DETAILS (Full width header)
                ========================================= */}
                <div className="company-create-section">
                  <h4>
                    <span>🏢</span> Company Details
                  </h4>
                </div>

                {/* GSTIN */}
                <div className="company-create-form-group">
                  <label>GSTIN</label>
                  <div className="company-create-gst-row">
                    {/* <input type="text" placeholder="22AAAAA0000A1Z" />
                    <button className="company-create-gst-btn">Get GST</button> */}
                    <input 
                          maxLength={15} 
                          value={gstin}
                          onChange={(e) => setGstin(e.target.value)}
                          placeholder="22AAAAA0000A1Z"
                        />
                        <button className="company-create-gst-btn" onClick={handleGetGST}>
                          Get GST
                        </button>
                  </div>
                </div>

                {/* Company Name */}
                <div className="company-create-form-group">
                  <label>Company Name</label>
                  {/* <input type="text" placeholder="Enter company name" /> */}
                  <input 
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        placeholder="Enter company name"
                      />
                </div>

                {/* Registered Address - Full Width */}
                <div className="company-create-form-group company-create-full-width">
                  <label>Registered Address</label>
                  {/* <textarea rows="3" placeholder="Plot No, Street, City, PIN" /> */}
                  <textarea 
                        rows="2"
                        value={registeredAddress}
                        onChange={(e) => setRegisteredAddress(e.target.value)}
                        placeholder="Plot No, Street, City, PIN"
                      />
                </div>

                {/* Branch Address - Full Width */}
                <div className="company-create-form-group company-create-full-width">
                  <label>Branch Address</label>
                  {/* <textarea rows="3" placeholder="Branch address" /> */}
                  <textarea 
                        rows="2"
                        value={branchAddress}
                        onChange={(e) => setBranchAddress(e.target.value)}
                        placeholder="Branch location (optional)"
                      />
                </div>

                {/* State */}
                <div className="company-create-form-group">
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

                {/* Country */}
                <div className="company-create-form-group">
                  <label>Country</label>
                  <input value="India" readOnly />
                </div>

                {/* Email */}
                <div className="company-create-form-group">
                  <label>Email</label>
                  {/* <input type="email" placeholder="company@email.com" /> */}
                  <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contact@company.com"
                      />
                </div>

                {/* Website */}
                <div className="company-create-form-group">
                  <label>Website</label>
                  <input 
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://example.com"
                      />
                </div>

                {/* Contact Person */}
                <div className="company-create-form-group">
                  <label>Contact Person</label>
                  <input 
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="Full name"
                      />
                </div>

                {/* Contact No */}
                <div className="company-create-form-group">
                  <label>Contact No</label>
                 <input 
                        value={contactNo}
                        onChange={(e) => setContactNo(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                </div>

                {/* =========================================
                    SECTION 2: GST DETAILS
                ========================================= */}
                <div className="company-create-section">
                  <h4>
                    <span>📑</span> GST Details
                  </h4>
                </div>

                {/* Financial Year */}
                <div className="company-create-form-group">
                  <label>Financial Year</label>
                  <input 
                        placeholder="2024-25"
                        value={financialYear}
                        onChange={(e) => setFinancialYear(e.target.value)}
                      />
                </div>

                {/* Book Beginning */}
                <div className="company-create-form-group">
                  <label>Book Beginning</label>
                  <input 
                        type="date"
                        value={bookBeginning}
                        onChange={(e) => setBookBeginning(e.target.value)}
                      />
                </div>

                {/* Return Type */}
                <div className="company-create-form-group">
                  <label>Return Type</label>
                 <select 
                        value={returnType}
                        onChange={(e) => setReturnType(e.target.value)}
                      >
                        <option>Monthly</option>
                        <option>Quarterly</option>
                      </select>
                </div>

                {/* Registration Type */}
                <div className="company-create-form-group">
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

                {/* Use Inventory */}
                <div className="company-create-form-group">
                  <label>Use Inventory</label>
                  <div className="company-create-radio-group">
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

                {/* =========================================
                    SECTION 3: OTHER DETAILS
                ========================================= */}
                <div className="company-create-section">
                  <h4>
                    <span>⚙️</span> Other Details
                  </h4>
                </div>

                {/* E-Way Bill Applicable */}
                <div className="company-create-form-group">
                  <label>E-Way Bill Applicable</label>
                  <div className="company-create-radio-group">
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

                {/* Threshold */}
                {/* <div className="company-create-form-group">
                  <label>Threshold (₹)</label>
                  <input type="text" placeholder="50000" />
                </div> */}

                {/* EWB Login ID */}
                {/* <div className="company-create-form-group">
                  <label>EWB Login ID</label>
                  <input type="text" placeholder="Username / API login" />
                </div>

                {/* Password */}
                {/* <div className="company-create-form-group">
                  <label>Password</label>
                  <input type="password" placeholder="••••••" />
                </div> */} 

                {/* E-Invoice Applicable */}
                <div className="company-create-form-group">
                  <label>E-Invoice Applicable</label>
                  <div className="company-create-radio-group">
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
                  {eInvoice === "Yes" && (
                      <>
                        <div className="popup-field">
                          <label>Invoice Login ID</label>
                          <input
                            value={einvoiceLoginId}
                            onChange={(e) => setEinvoiceLoginId(e.target.value)}
                            placeholder="Invoice Username"
                          />
                        </div>

                        <div className="popup-field">
                          <label>Invoice Password</label>
                          <input
                            type="password"
                            value={einvoicePassword}
                            onChange={(e) => setEinvoicePassword(e.target.value)}
                            placeholder="••••••"
                          />
                        </div>
                      </>
                    )}
                </div>

                {/* Invoice Login ID */}
                {/* <div className="company-create-form-group">
                  <label>Invoice Login ID</label>
                  <input type="text" placeholder="Invoice Username" />
                </div>

                {/* Invoice Password */}
                {/* <div className="company-create-form-group">
                  <label>Invoice Password</label>
                  <input type="password" placeholder="••••••" />
                </div> */} 
              </div>
            </div>
          )}

          {/* ALTER COMPANY */}
          {activeTab === "alter" && (
            <div className="settings-content-card">
              <div className="content-header">
                <div>
                  <h2>Alter Company</h2>
                  <p>Update editable company information</p>
                </div>
                <button
                  className="company-save-btn"
                  onClick={handleSave}
                >
                  Update Company
                </button>
              </div>
              {!savedCompany ? (
                <div className="no-company-data">
                  <p>
                    No company created yet.
                    Please create company first.
                  </p>
                </div>
              ) : (
                <div className="company-create-grid">
                  {/* IMMUTABLE SECTION */}
                  <div className="company-create-section">
                    <h4>
                      <span>🔒</span> Locked Information
                    </h4>
                  </div>
                  {/* GSTIN */}
                  <div className="company-create-form-group">
                    <label>GSTIN</label>
                    <input
                      value={savedCompany.gstin}
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                  {/* COMPANY NAME */}
                  <div className="company-create-form-group">
                    <label>Company Name</label>
                    <input
                      value={savedCompany.companyName}
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                  {/* REGISTERED ADDRESS */}
                  <div className="company-create-form-group company-create-full-width">
                    <label>Registered Address</label>
                    <textarea
                      rows="2"
                      value={savedCompany.registeredAddress}
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                  {/* STATE */}
                  <div className="company-create-form-group">
                    <label>State</label>
                    <input
                      value={savedCompany.state}
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                  {/* COUNTRY */}
                  <div className="company-create-form-group">
                    <label>Country</label>
                    <input
                      value="India"
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                  {/* ========================================= */}
                  <div className="company-create-section">
                    <h4>
                      <span>✏️</span> Editable Information
                    </h4>
                  </div>

                  {/* BRANCH ADDRESS */}
                  <div className="company-create-form-group company-create-full-width">
                    <label>Branch Address</label>
                    <textarea
                      rows="2"
                      value={branchAddress || savedCompany.branchAddress || ""}
                      onChange={(e) =>
                        setBranchAddress(e.target.value)
                      }
                    />
                  </div>
                  {/* EMAIL */}
                  <div className="company-create-form-group">
                    <label>Email</label>
                    <input
                      value={email || savedCompany.email || ""}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                    />
                  </div>
                  {/* WEBSITE */}
                  <div className="company-create-form-group">
                    <label>Website</label>
                    <input
                      value={website || savedCompany.website || ""}
                      onChange={(e) =>
                        setWebsite(e.target.value)
                      }
                    />
                  </div>
                  {/* CONTACT PERSON */}
                  <div className="company-create-form-group">
                    <label>Contact Person</label>
                    <input
                      value={contactPerson || savedCompany.contactPerson || ""}
                      onChange={(e) =>
                        setContactPerson(e.target.value)
                      }
                    />
                  </div>
                  {/* CONTACT */}
                  <div className="company-create-form-group">
                    <label>Contact No</label>
                    <input
                      value={contactNo || savedCompany.contactNo || ""}
                      onChange={(e) =>
                        setContactNo(e.target.value)
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONNECT COMPANY */}
          {activeTab === "connect" && (
            <div className="settings-content-card">

              <div className="content-header">
                <div>
                  <h2>Connect Company</h2>
                  <p>Connect with CA or accountant</p>
                </div>
              </div>

              <div className="connect-box">
                <input
                  type="email"
                  placeholder="Enter CA email"
                  value={connectEmail}
                  onChange={(e) => setConnectEmail(e.target.value)}
                />

                <button
                  className="connect-btn"
                  onClick={handleConnectCA}
                  disabled={connectLoading}
                >
                  {connectLoading ? "Connecting..." : "Connect"}
                </button>
              </div>

              {connectMessage && (
                <p style={{ color: "#16a34a", marginTop: 10 }}>{connectMessage}</p>
              )}
              {connectError && (
                <p style={{ color: "#dc2626", marginTop: 10 }}>{connectError}</p>
              )}

              <div className="connect-list">
                <h3 style={{ margin: "18px 0 10px", fontSize: 15 }}>
                  Connected Users
                </h3>
                {connectedUsers.length === 0 ? (
                  <p style={{ color: "#888" }}>No connected users yet.</p>
                ) : (
                  connectedUsers.map((u) => (
                    <div
                      key={u.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name || u.email}</div>
                        <div style={{ color: "#888", fontSize: 13 }}>{u.email}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            fontSize: 12,
                            color: "#4b5563",
                            background: "#f3f4f6",
                            padding: "3px 8px",
                            borderRadius: 999,
                          }}
                        >
                          {u.role}
                        </span>
                        {u.role !== "ADMIN" && (
                          <button
                            className="connect-btn"
                            style={{ background: "#dc2626" }}
                            onClick={() => handleRemoveUser(u.id)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* SECURITY */}
          {activeTab === "security" && (
            <div className="settings-content-card">
              <div className="content-header">
                <div>
                  <h2>Security Settings</h2>
                  <p>Manage your account security and authentication methods</p>
                </div>
              </div>

              <div className="security-settings-container">
                {/* =========================================
                    SECTION 1: CHANGE PASSWORD
                ========================================= */}
                <div className="security-section">
                  <div className="security-section-header">
                    <span className="security-section-icon">🔐</span>
                    <div>
                      <h3>Change Password</h3>
                      <p>Update your password regularly to keep your account secure</p>
                    </div>
                  </div>

                  <div className="security-form-group">
                    <label>Current Password</label>
                    <div className="password-input-wrapper">
                      <input 
                        type="password" 
                        id="currentPassword"
                        placeholder="Enter current password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                      <button 
                        type="button" 
                        className="password-toggle-btn"
                        onClick={(e) => {
                          const input = document.getElementById('currentPassword');
                          input.type = input.type === 'password' ? 'text' : 'password';
                        }}
                      >
                        👁️
                      </button>
                    </div>
                  </div>
                   <div className="password-strength">
                      <div className="strength-bar"></div>
                      <span className="strength-text">Use 8+ characters with letters, numbers & symbols</span>
                    </div>

                  <div className="security-form-group">
                    <label>New Password</label>
                    <div className="password-input-wrapper">
                      <input 
                        type="password" 
                        id="newPassword"
                        placeholder="Enter new password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button 
                        type="button" 
                        className="password-toggle-btn"
                        onClick={(e) => {
                          const input = document.getElementById('newPassword');
                          input.type = input.type === 'password' ? 'text' : 'password';
                        }}
                      >
                        👁️
                      </button>
                    </div>
                  </div>

                  <div className="security-form-group">
                    <label>Confirm New Password</label>
                    <div className="password-input-wrapper">
                      <input 
                        type="password" 
                        id="confirmPassword"
                        placeholder="Confirm new password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button 
                        type="button" 
                        className="password-toggle-btn"
                        onClick={(e) => {
                          const input = document.getElementById('confirmPassword');
                          input.type = input.type === 'password' ? 'text' : 'password';
                        }}
                      >
                        👁️
                      </button>
                    </div>
                  </div>

                  {pwdError && (
                    <p style={{ color: "#dc2626", marginBottom: 10 }}>{pwdError}</p>
                  )}
                  {pwdMessage && (
                    <p style={{ color: "#16a34a", marginBottom: 10 }}>{pwdMessage}</p>
                  )}

                  <button className="security-action-btn update-password-btn" onClick={handleChangePassword}>
                    Update Password
                  </button>
                </div>

                {/* =========================================
                    SECTION 2: TWO-FACTOR AUTHENTICATION (2FA)
                ========================================= */}
                <div className="security-section">
                  <div className="security-section-header">
                    <span className="security-section-icon">📱</span>
                    <div>
                      <h3>Two-Factor Authentication (2FA)</h3>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                  </div>

                  <div className="twofa-status">
                    <div className="status-info">
                      <span className="status-badge disabled">Disabled</span>
                      <p>Protect your account with 2FA. When enabled, you'll need a verification code from your authenticator app to sign in.</p>
                    </div>
                    <button className="security-action-btn setup-2fa-btn">
                      Set Up 2FA
                    </button>
                  </div>

                  <div className="twofa-methods">
                    <h4>Available Methods</h4>
                    <div className="method-list">
                      {/* <div className="method-item">
                        <span>📱 Authenticator App</span>
                        <span className="method-recommended">Recommended</span>
                      </div> */}
                      <div className="method-item">
                        <span>📧 Email Verification</span>
                        <span className="method-recommended">Recommended</span>
                      </div>
                      <div className="method-item">
                        <span>📞 SMS Verification</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* =========================================
                    SECTION 3: ACTIVE SESSIONS
                ========================================= */}
                <div className="security-section">
                  <div className="security-section-header">
                    <span className="security-section-icon">💻</span>
                    <div>
                      <h3>Active Sessions</h3>
                      <p>Manage devices where you're logged in</p>
                    </div>
                  </div>

                  <div className="sessions-list">
                    {sessionsMessage && (
                      <p style={{ color: "#4b5563", marginBottom: 10 }}>{sessionsMessage}</p>
                    )}
                    {sessions.length === 0 ? (
                      <p style={{ color: "#888" }}>No active sessions found.</p>
                    ) : (
                      sessions.map((s) => (
                        <div
                          key={s.id}
                          className={`session-item ${s.is_current ? "current-session" : ""}`}
                        >
                          <div className="session-device">
                            <span className="device-icon">
                              {s.device_type === "mobile" ? "📱" : "🖥️"}
                            </span>
                            <div>
                              <h4>{s.device}</h4>
                              <p>
                                Last active: {formatSessionTime(s.last_active_at)}
                                {s.ip_address ? ` • ${s.ip_address}` : ""}
                              </p>
                            </div>
                          </div>
                          {s.is_current ? (
                            <span className="session-badge current">Current</span>
                          ) : s.is_active ? (
                            <button className="revoke-btn" onClick={() => handleRevokeSession(s.id)}>
                              Revoke
                            </button>
                          ) : (
                            <span className="session-badge">Revoked</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <button className="revoke-all-btn" onClick={handleRevokeAllSessions}>
                    Revoke All Other Sessions
                  </button>
                </div>

                {/* =========================================
                    SECTION 4: LOGIN ACTIVITY
                ========================================= */}
                <div className="security-section">
                  <div className="security-section-header">
                    <span className="security-section-icon">📋</span>
                    <div>
                      <h3>Recent Login Activity</h3>
                      <p>Monitor access to your account</p>
                    </div>
                  </div>

                  <div className="activity-list">
                    {activity.length === 0 ? (
                      <p style={{ color: "#888" }}>No login activity recorded yet.</p>
                    ) : (
                      activity.map((a) => (
                        <div key={a.id} className="activity-item">
                          <div>
                            <span className="activity-location">
                              {a.device || "Unknown device"}
                              {a.ip_address ? ` • ${a.ip_address}` : ""}
                            </span>
                            <span className="activity-time">
                              {formatSessionTime(a.created_at)}
                            </span>
                          </div>
                          <span className={`activity-status ${a.success ? "success" : "warning"}`}>
                            {a.success ? "Successful" : "Failed Attempt"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* =========================================
                    SECTION 5: DANGER ZONE
                ========================================= */}
                <div className="security-section danger-zone">
                  <div className="security-section-header">
                    <span className="security-section-icon">⚠️</span>
                    <div>
                      <h3>Danger Zone</h3>
                      <p>Irreversible account actions</p>
                    </div>
                  </div>

                  <div className="danger-actions">
                    <div className="danger-action-item">
                      <div>
                        <h4>Delete Account</h4>
                        <p>Permanently delete your account and all associated data</p>
                      </div>
                      <button className="delete-account-btn">Delete Account</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BACKUP */}
          {activeTab === "backup" && (
            <div className="settings-content-card">

              <div className="content-header">
                <div>
                  <h2>Backup & Restore</h2>
                  <p>Secure your company data</p>
                </div>
              </div>

              <div className="backup-actions">

                <button
                  className="company-backup-btn"
                  onClick={handleCreateBackup}
                  disabled={backupLoading}
                >
                  {backupLoading ? "Creating..." : "Create Backup"}
                </button>

                <button
                  className="restore-btn"
                  onClick={() => restoreInputRef.current?.click()}
                  disabled={backupLoading}
                >
                  Restore Backup
                </button>

                <input
                  ref={restoreInputRef}
                  type="file"
                  accept=".json,application/json"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleRestoreBackup(file);
                    e.target.value = "";
                  }}
                />

              </div>

              {backupMessage && (
                <p style={{ color: "#16a34a", marginTop: 10 }}>{backupMessage}</p>
              )}
              {backupError && (
                <p style={{ color: "#dc2626", marginTop: 10 }}>{backupError}</p>
              )}

            </div>
          )}

          {/* IMPORT */}
          {activeTab === "import" && (
            <div className="settings-content-card">

              <div className="content-header">
                <div>
                  <h2>Import Company</h2>
                  <p>Import from Tally, Busy, Vyapar etc.</p>
                </div>
              </div>

              <div className="upload-box">
                <p>
                  {selectedImportFile
                    ? selectedImportFile.name
                    : "Drag & drop backup file here"}
                </p>

                <button
                  className="upload-btn"
                  onClick={() => importInputRef.current?.click()}
                  disabled={importLoading}
                >
                  {importLoading ? "Uploading..." : "Upload File"}
                </button>

                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json,application/json"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportFile(file);
                  }}
                />
              </div>

              {importMessage && (
                <p style={{ color: "#16a34a", marginTop: 10 }}>{importMessage}</p>
              )}
              {importError && (
                <p style={{ color: "#dc2626", marginTop: 10 }}>{importError}</p>
              )}

            </div>
          )}

          {/* LANGUAGE */}
          {activeTab === "language" && (
            <div className="settings-content-card">

              <div className="content-header">
                <div>
                  <h2>Language Settings</h2>
                  <p>Select preferred software language</p>
                </div>
              </div>

              <div className="company-setting-form-group language-select">
                <label>Language</label>

                <select>
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Punjabi</option>
                  <option>Gujarati</option>
                </select>
              </div>

            </div>
          )}

          {/* SPLIT */}
          {activeTab === "split" && (
            <div className="settings-content-card">

              <div className="content-header">
                <div>
                  <h2>Split Company</h2>
                  <p>Create next financial year company</p>
                </div>
              </div>

              <div className="split-company-box">

                <input
                  type="date"
                  value={splitDate}
                  onChange={(e) => setSplitDate(e.target.value)}
                />

                <button
                  className="split-btn"
                  onClick={handleSplitCompany}
                  disabled={splitLoading}
                >
                  {splitLoading ? "Splitting..." : "Split Company"}
                </button>

              </div>

              {splitMessage && (
                <p style={{ color: "#16a34a", marginTop: 10 }}>{splitMessage}</p>
              )}
              {splitError && (
                <p style={{ color: "#dc2626", marginTop: 10 }}>{splitError}</p>
              )}

            </div>
          )}

          {/* DELETE */}
          {activeTab === "delete" && (
            <div className="settings-content-card danger-card">

              <div className="content-header">
                <div>
                  <h2>Delete Company</h2>
                  <p>This action cannot be undone</p>
                </div>
              </div>

              <div className="delete-warning">

                <p>
                  Are you sure you want to permanently delete this company?
                </p>

                <button
                  className="delete-company-btn"
                  onClick={handleDeleteCompany}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Delete Permanently"}
                </button>

                {deleteMessage && <p className="delete-message">{deleteMessage}</p>}
                {deleteError && <p className="delete-error">{deleteError}</p>}

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default CompanySettings;