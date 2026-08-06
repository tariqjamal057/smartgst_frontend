import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import * as services from "../api/services";

import {
  Settings2,
  FileText,
  FolderCog,
  Hash,
  Printer,
  Receipt
} from "lucide-react";

import "../styles/InvoiceSettings.css";

const invoiceMenu = [
  { key: "default", label: "Default Settings", icon: <Settings2 size={16} /> },
  { key: "createBook", label: "Create Invoice Book", icon: <FileText size={16} /> },
  { key: "alterBook", label: "Alter / Delete Book", icon: <FolderCog size={16} /> },
  { key: "voucher", label: "Voucher Number", icon: <Hash size={16} /> },
  { key: "invoice-ref", label: "Invoice Ref Number", icon: <Receipt size={16} /> },
  { key: "printing", label: "Invoice Printing", icon: <Printer size={16} /> }
];

const DEFAULT_SETTINGS = {
  rcm: false, orderDetails: true, eco: false, dispatch: false,
  shippedTo: true, discount: true, taxColumn: true, salesman: false,
  narration: true, eway: false, dueDate: true, einvoice: false,
  roundOff: true, gstEnable: true
};

const PRINTING_SETTINGS = {
  invoiceTitle: "TAX INVOICE",
  pageSize: "A4",
  orientation: "Portrait",
  pageType: "Original",
  copies: 1,
  ewayCopies: 1,
  template: "Modern Blue",
  printer: "Default",
  companyName: true,
  companyAddress: true,
  companyLogo: true,
  contactPerson: true,
  contactNumber: true,
  companyEmail: true,
  website: true,
  stateCountry: true,
  partyName: true,
  partyAddress: true,
  partyPerson: true,
  partyPhone: true,
  partyEmail: true,
  partyGST: true,
  partySupply: true,
  qrCode: false,
  eInvoiceQR: false,
  eWayQR: false,
  dispatchDetails: false,
  terms: ""
};

const EMPTY_VOUCHER_CONFIG = { prefix: "Tax/2025-26", zero: "", start: 1, manual: false };

const extractError = (err, fallback) => {
  const data = err.response?.data;
  if (Array.isArray(data)) return data.join(", ");
  if (data && typeof data === "object" && data.detail) return data.detail;
  return fallback;
};

const buildNumber = (config) => {
  if (config.manual) return "Manual";
  const zeroCount = Number(config.zero) || 0;
  let num = String(config.start ?? 1);
  if (num.length > 4 - zeroCount) num = num.slice(0, 4 - zeroCount);
  return `${config.prefix}/${"0".repeat(zeroCount)}${num}`;
};

export default function InvoiceSettings() {
    const { collapsed } = useOutletContext();
    const [activeTab, setActiveTab] = useState("default");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [saveError, setSaveError] = useState("");
    const [preferencesId, setPreferencesId] = useState(null);

    const [defaultSettings, setDefaultSettings] = useState(DEFAULT_SETTINGS);
    const [printingSettings, setPrintingSettings] = useState(PRINTING_SETTINGS);
    const [voucherConfig, setVoucherConfig] = useState(EMPTY_VOUCHER_CONFIG);
    const [refConfig, setRefConfig] = useState(EMPTY_VOUCHER_CONFIG);

    const [books, setBooks] = useState([]);
    const [booksLoading, setBooksLoading] = useState(false);
    const [bookForm, setBookForm] = useState({ name: "", under: "sale" });
    const [editingBookId, setEditingBookId] = useState(null);
    const [bookSaving, setBookSaving] = useState(false);
    const [bookMessage, setBookMessage] = useState("");
    const [bookError, setBookError] = useState("");

    const handleDefaultToggle = (key) => {
      setDefaultSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePrintingChange = (key, value) => {
      setPrintingSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleToggle = (key) => {
      setPrintingSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const updateConfigField = (setter, key, value) => {
      setter((prev) => ({ ...prev, [key]: value }));
    };

    const fetchBooks = async () => {
      setBooksLoading(true);
      try {
        const res = await services.getInvoiceBooks();
        setBooks(res.data.results || res.data || []);
      } catch {
        setBooks([]);
      } finally {
        setBooksLoading(false);
      }
    };

    const fetchSettings = async () => {
      setLoading(true);
      setSaveMessage("");
      setSaveError("");
      try {
        const res = await services.getInvoicePreferences();
        const p = res.data || {};
        setPreferencesId(p.id || null);
        if (p.default_settings) setDefaultSettings((prev) => ({ ...prev, ...p.default_settings }));
        if (p.printing_settings) setPrintingSettings((prev) => ({ ...prev, ...p.printing_settings }));
        if (p.voucher_config) setVoucherConfig((prev) => ({ ...prev, ...p.voucher_config }));
        if (p.ref_config) setRefConfig((prev) => ({ ...prev, ...p.ref_config }));
      } catch (err) {
        setSaveError(extractError(err, "Failed to load settings."));
      } finally {
        setLoading(false);
      }
      fetchBooks();
    };

    useEffect(() => {
      fetchSettings();
    }, []);

    const persistPreferences = async (overrides = {}) => {
      const payload = {
        default_settings: defaultSettings,
        printing_settings: printingSettings,
        voucher_config: voucherConfig,
        ref_config: refConfig,
        ...overrides
      };
      let id = preferencesId;
      if (!id) {
        const res = await services.getInvoicePreferences();
        id = res.data?.id;
        setPreferencesId(id);
      }
      if (!id) throw new Error("Preferences record not available.");
      await services.updateInvoicePreferences(id, payload);
      return id;
    };

    const handleSave = async () => {
      setSaving(true);
      setSaveMessage("");
      setSaveError("");
      try {
        await persistPreferences();
        setSaveMessage("Settings saved successfully.");
      } catch (err) {
        setSaveError(extractError(err, "Failed to save settings."));
      } finally {
        setSaving(false);
      }
    };

    const handleCreateBook = async () => {
      if (!bookForm.name.trim()) {
        setBookError("Book name is required.");
        setBookMessage("");
        return;
      }
      setBookSaving(true);
      setBookMessage("");
      setBookError("");
      try {
        await services.createInvoiceBook({ name: bookForm.name.trim(), under: bookForm.under.trim() || "sale" });
        setBookForm({ name: "", under: "sale" });
        setBookMessage("Invoice book created.");
        await fetchBooks();
      } catch (err) {
        setBookError(extractError(err, "Failed to create invoice book."));
      } finally {
        setBookSaving(false);
      }
    };

    const handleSelectBook = (e) => {
      const id = Number(e.target.value);
      const book = books.find((b) => b.id === id);
      setEditingBookId(id || null);
      setBookMessage("");
      setBookError("");
      if (book) setBookForm({ name: book.name, under: book.under });
    };

    const handleAlterBook = async () => {
      if (!editingBookId) {
        setBookError("Select an invoice book first.");
        setBookMessage("");
        return;
      }
      if (!bookForm.name.trim()) {
        setBookError("Book name is required.");
        setBookMessage("");
        return;
      }
      setBookSaving(true);
      setBookMessage("");
      setBookError("");
      try {
        await services.updateInvoiceBook(editingBookId, {
          name: bookForm.name.trim(),
          under: bookForm.under.trim() || "sale"
        });
        setBookMessage("Invoice book updated.");
        await fetchBooks();
      } catch (err) {
        setBookError(extractError(err, "Failed to update invoice book."));
      } finally {
        setBookSaving(false);
      }
    };

    const handleDeleteBook = async () => {
      if (!editingBookId) {
        setBookError("Select an invoice book first.");
        setBookMessage("");
        return;
      }
      const book = books.find((b) => b.id === editingBookId);
      if (!window.confirm(`Delete invoice book "${book ? book.name : ""}"?`)) return;
      setBookSaving(true);
      setBookMessage("");
      setBookError("");
      try {
        await services.deleteInvoiceBook(editingBookId);
        setBookForm({ name: "", under: "sale" });
        setEditingBookId(null);
        setBookMessage("Invoice book deleted.");
        await fetchBooks();
      } catch (err) {
        setBookError(extractError(err, "Failed to delete invoice book."));
      } finally {
        setBookSaving(false);
      }
    };

    const saveNumberConfig = async (which) => {
      setSaving(true);
      setSaveMessage("");
      setSaveError("");
      try {
        const overrides = which === "voucher"
          ? { voucher_config: voucherConfig }
          : { ref_config: refConfig };
        await persistPreferences(overrides);
        setSaveMessage(
          which === "voucher" ? "Voucher number settings saved." : "Invoice ref number settings saved."
        );
        return true;
      } catch (err) {
        setSaveError(extractError(err, "Failed to save settings."));
        return false;
      } finally {
        setSaving(false);
      }
    };

    const validateNumberConfig = (config) => {
      if (!config.manual && (Number(config.zero) || 0) + String(config.start).length > 4) {
        alert("Zero + Start digits cannot exceed 4");
        return false;
      }
      return true;
    };

    const renderNumberFields = (config, setConfig, which) => (
      <>
        <div className="form-row">
          <div className="form-group">
            <label>Manual:</label>
            <div className="setting-popup-radio">
              <label>
                <input
                  type="radio"
                  checked={config.manual}
                  onChange={() => setConfig((prev) => ({ ...prev, manual: true }))}
                />
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  checked={!config.manual}
                  onChange={() => setConfig((prev) => ({ ...prev, manual: false }))}
                />
                No
              </label>
            </div>
          </div>
          {!config.manual && (
            <>
              <div className="form-group">
                <label>Prefix</label>
                <input
                  className="popup-input-box"
                  value={config.prefix}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (value.length > 11) value = value.slice(0, 11);
                    setConfig((prev) => ({ ...prev, prefix: value }));
                  }}
                />
              </div>
              <div className="form-group">
                <label>Zero Padding</label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={config.zero}
                  onChange={(e) => {
                    let val = Number(e.target.value) || 0;
                    if (val > 4) val = 4;
                    setConfig((prev) => ({ ...prev, zero: val }));
                  }}
                />
              </div>
              <div className="form-group">
                <label>Start No</label>
                <input
                  type="number"
                  value={config.start}
                  onChange={(e) => {
                    let val = Math.max(0, Number(e.target.value) || 0);
                    setConfig((prev) => ({ ...prev, start: val }));
                  }}
                />
              </div>
            </>
          )}
        </div>
        <div className="popup-actions">
          <button
            className="restore-btn"
            onClick={async () => {
              if (!validateNumberConfig(config)) return;
              await saveNumberConfig(which);
            }}
            disabled={saving}
          >
            Save
          </button>
        </div>
      </>
    );

  return (
<div className={`main ${collapsed ? "collapsed" : ""}`}>
    <div className="invoice-page">
      <div className="invoice-sidebar">
        <div className="invoice-sidebar-top">
          <h2>Invoice</h2>
          <p>Voucher settings</p>
        </div>
        <div className="invoice-menu">
          {invoiceMenu.map((item) => (
            <button
              key={item.key}
              className={`invoice-menu-btn ${activeTab === item.key ? "active" : ""}`}
              onClick={() => setActiveTab(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="invoice-content">
        <div className="invoice-header">
          <div>
            <h1>{invoiceMenu.find((m) => m.key === activeTab)?.label}</h1>
            <p>Manage invoice preferences</p>
          </div>
          <div className="invoice-header-actions">
            {saveMessage && <span className="invoice-save-message">{saveMessage}</span>}
            {saveError && <span className="invoice-save-error">{saveError}</span>}
            <button className="restore-btn" onClick={fetchSettings}>Restore</button>
            <button className="save-btn" onClick={handleSave} disabled={saving || loading}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {loading && <div style={{ padding: 20, textAlign: "center" }}>Loading settings...</div>}

        {!loading && (
        <div className="invoice-card">
          {/* DEFAULT SETTINGS */}
          {activeTab === "default" && (
            <div className="toggle-grid">
              {[
                ["RCM Enable", "rcm"],
                ["Order Details", "orderDetails"],
                ["ECO Enable", "eco"],
                ["Dispatch Details", "dispatch"],
                ["Shipped To", "shippedTo"],
                ["Discount Column", "discount"],
                ["Tax Column", "taxColumn"],
                ["Salesman", "salesman"],
                ["Narration", "narration"],
                ["E-Way Bill", "eway"],
                ["Due Date", "dueDate"],
                ["E-Invoice", "einvoice"],
                ["Round Off", "roundOff"],
                ["GST Enable", "gstEnable"]
              ].map(([label, key]) => (
                <div className="toggle-item" key={key}>
                  <span>{label}</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={!!defaultSettings[key]}
                      onChange={() => handleDefaultToggle(key)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* CREATE BOOK */}
          {activeTab === "createBook" && (
            <div className="compact-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    value={bookForm.name}
                    onChange={(e) => setBookForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. GST Invoice"
                  />
                </div>
                <div className="form-group">
                  <label>Under</label>
                  <input
                    value={bookForm.under}
                    onChange={(e) => setBookForm((prev) => ({ ...prev, under: e.target.value }))}
                    placeholder="sale"
                  />
                </div>
              </div>
              {bookMessage && <p className="invoice-save-message">{bookMessage}</p>}
              {bookError && <p className="invoice-save-error">{bookError}</p>}
              <div className="form-actions">
                <button className="save-btn" onClick={handleCreateBook} disabled={bookSaving}>
                  {bookSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
          {/* ALTER BOOK */}
          {activeTab === "alterBook" && (
            <div className="compact-form">
              <div className="form-group">
                <label>Select Invoice Book</label>
                <select value={editingBookId || ""} onChange={handleSelectBook}>
                  <option value="">Select a book</option>
                  {booksLoading && <option disabled>Loading...</option>}
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    value={bookForm.name}
                    onChange={(e) => setBookForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Book name"
                  />
                </div>
                <div className="form-group">
                  <label>Under</label>
                  <input
                    value={bookForm.under}
                    onChange={(e) => setBookForm((prev) => ({ ...prev, under: e.target.value }))}
                    placeholder="sale"
                  />
                </div>
              </div>
              {bookMessage && <p className="invoice-save-message">{bookMessage}</p>}
              {bookError && <p className="invoice-save-error">{bookError}</p>}
              <div className="form-actions">
                <button className="restore-btn" onClick={handleAlterBook} disabled={bookSaving}>
                  {bookSaving ? "Saving..." : "Alter"}
                </button>
                <button className="delete-btn" onClick={handleDeleteBook} disabled={bookSaving}>
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* VOUCHER */}
          {activeTab === "voucher" && (
            renderNumberFields(voucherConfig, setVoucherConfig, "voucher")
          )}
          {activeTab === "invoice-ref" && (
            renderNumberFields(refConfig, setRefConfig, "ref")
          )}

          {/* PRINTING */}
          {activeTab === "printing" && (
            <div className="printing-layout">
              <div className="printing-section">
                <div className="printing-title">
                  <h3>Page Settings</h3>
                </div>
                <div className="printing-grid">
                  <div className="printing-group">
                    <label>Invoice Title</label>
                    <select
                      value={printingSettings.invoiceTitle}
                      onChange={(e) =>
                        handlePrintingChange("invoiceTitle", e.target.value)
                      }
                    >
                      <option>TAX INVOICE</option>
                      <option>GST INVOICE</option>
                      <option>INVOICE</option>
                      <option>MANNUAL</option>
                    </select>
                  </div>
                  <div className="printing-group">
                    <label>Page Size</label>
                    <select
                      value={printingSettings.pageSize}
                      onChange={(e) =>
                        handlePrintingChange("pageSize", e.target.value)
                      }
                    >
                      <option>A4</option>
                      <option>A5</option>
                      <option>Legal</option>
                    </select>
                  </div>
                  <div className="printing-group">
                    <label>Orientation</label>
                    <select
                      value={printingSettings.orientation}
                      onChange={(e) =>
                        handlePrintingChange("orientation", e.target.value)
                      }
                    >
                      <option>Portrait</option>
                      <option>Landscape</option>
                    </select>
                  </div>
                  <div className="printing-group">
                    <label>No. Of Pages</label>
                    <input
                      type="number"
                      min="1"
                      value={printingSettings.copies}
                      onChange={(e) =>
                        handlePrintingChange("copies", Math.max(1, Number(e.target.value) || 1))
                      }
                    />
                  </div>
                  <div className="printing-group">
                    <label>Type Of Pages</label>
                    <select
                      value={printingSettings.pageType}
                      onChange={(e) =>
                        handlePrintingChange("pageType", e.target.value)
                      }
                    >
                      <option>Not Applicable</option>
                      <option>Original</option>
                      <option>Duplicate</option>
                      <option>Triplicate copy</option>
                      <option>Extra copy</option>
                    </select>
                  </div>
                  <div className="printing-group">
                    <label>E-way Bill Copy</label>
                    <input
                      type="number"
                      min="1"
                      value={printingSettings.ewayCopies}
                      onChange={(e) =>
                        handlePrintingChange("ewayCopies", Math.max(1, Number(e.target.value) || 1))
                      }
                    />
                  </div>
                  <div className="printing-group">
                    <label>Invoice Template</label>
                    <select
                      value={printingSettings.template}
                      onChange={(e) =>
                        handlePrintingChange("template", e.target.value)
                      }
                    >
                      <option>Modern Blue</option>
                      <option>Classic</option>
                    </select>
                  </div>
                  <div className="printing-group">
                    <label>Select Printer</label>
                    <select
                      value={printingSettings.printer}
                      onChange={(e) =>
                        handlePrintingChange("printer", e.target.value)
                      }
                    >
                      <option>Default</option>
                      <option>Draft</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="printing-section">
                <div className="printing-title">
                  <h3>Company Details</h3>
                </div>
                <div className="printing-toggle-grid">
                  {[
                    ["Company Name", "companyName"],
                    ["Company Address", "companyAddress"],
                    ["Company Logo", "companyLogo"],
                    ["Contact Person", "contactPerson"],
                    ["Contact Number", "contactNumber"],
                    ["Company Email", "companyEmail"],
                    ["Website", "website"],
                    ["State / Country", "stateCountry"]
                  ].map(([label, key]) => (
                    <div className="printing-toggle-item" key={label}>
                      <span>{key}</span>
                      <label className="mini-switch">
                        <input
                          type="checkbox"
                          checked={!!printingSettings[key]}
                          onChange={() => handleToggle(key)}
                        />
                        <span className="mini-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="printing-section">
                <div className="printing-title">
                  <h3>Party Details</h3>
                </div>
                <div className="printing-toggle-grid">
                  {[
                    ["Party Name", "partyName"],
                    ["Party Address", "partyAddress"],
                    ["Contact Person", "partyPerson"],
                    ["Phone Number", "partyPhone"],
                    ["Email ID", "partyEmail"],
                    ["GSTIN / PAN", "partyGST"],
                    ["Place Of Supply", "partySupply"]
                  ].map(([label, key]) => (
                    <div className="printing-toggle-item" key={key}>
                      <span>{label}</span>
                      <label className="mini-switch">
                        <input
                          type="checkbox"
                          checked={!!printingSettings[key]}
                          onChange={() => handleToggle(key)}
                        />
                        <span className="mini-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="printing-section">
                <div className="printing-title">
                  <h3>Advanced Settings</h3>
                </div>
                <div className="printing-toggle-grid">
                  {[
                    ["QR Code", "qrCode"],
                    ["E-Invoice QR Print", "eInvoiceQR"],
                    ["E-Way Bill QR", "eWayQR"],
                    ["Dispatch Details", "dispatchDetails"]
                  ].map(([label, key]) => (
                    <div className="printing-toggle-item" key={key}>
                      <span>{label}</span>
                      <label className="mini-switch">
                        <input
                          type="checkbox"
                          checked={!!printingSettings[key]}
                          onChange={() => handleToggle(key)}
                        />
                        <span className="mini-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="printing-textarea">
                  <label>Terms & Conditions</label>
                  <textarea
                    rows="3"
                    value={printingSettings.terms}
                    onChange={(e) =>
                      handlePrintingChange("terms", e.target.value)
                    }
                    placeholder="Enter invoice terms & conditions..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
      {/* PREVIEW */}
      <div className="preview-panel">
        <div className="preview-top">
          <h3>Preview</h3>
          <span>Live</span>
        </div>
        <div className={`preview-card ${String(printingSettings.orientation).toLowerCase()}`}>
          <div className="preview-company-header">
            <div className="preview-company-left">
              {printingSettings.companyName && (
                <h2>TaxMate GST Pvt Ltd</h2>
              )}
              {printingSettings.companyAddress && (
                <p>265/2 F Kuti Choraha, Meerut</p>
              )}
              {printingSettings.companyEmail && (
                <p>support@taxmate.com</p>
              )}
              {printingSettings.contactNumber && (
                <p>+91 9876543210</p>
              )}
            </div>
            {printingSettings.companyLogo && (
              <div className="preview-company-logo">LOGO</div>
            )}
          </div>
          <div className="preview-line"></div>
          <div className="preview-bill">
            <div>
              <h4>Billed To</h4>
              {printingSettings.partyName && <p>Salvia Graphics</p>}
              {printingSettings.partyAddress && <p>Delhi, India</p>}
              {printingSettings.partyPhone && <p>+91 9988776655</p>}
              {printingSettings.partyGST && <p>GSTIN: 09ABCDE1234F1Z5</p>}
            </div>
            <div>
              <h4>{printingSettings.invoiceTitle}</h4>
              <p>{buildNumber(voucherConfig) || "#INV-001"}</p>
            </div>
          </div>
          {defaultSettings.rcm && <div className="preview-tag">RCM Applicable</div>}
          {defaultSettings.eco && <div className="preview-tag">ECO Enabled</div>}
          {defaultSettings.einvoice && <div className="preview-tag success">E-Invoice Enabled</div>}
          {defaultSettings.eway && <div className="preview-tag warning">E-Way Bill Attached</div>}
          {defaultSettings.salesman && (
            <div className="preview-salesman">Salesman: <strong> Rahul Sharma</strong></div>
          )}
          {defaultSettings.orderDetails && (
            <div className="preview-order-info">
              <div><span>Order No</span><p>#ORD-001</p></div>
              <div><span>Order Date</span><p>24 Apr 2026</p></div>
            </div>
          )}
          {defaultSettings.dispatch && (
            <div className="preview-dispatch">
              <h4>Dispatch Details</h4>
              <div className="preview-dispatch-grid">
                <div><span>Transport</span><p>Self</p></div>
                <div><span>Vehicle No</span><p>UP15AB1234</p></div>
                <div><span>LR No</span><p>LR0012</p></div>
              </div>
            </div>
          )}
          {defaultSettings.shippedTo && (
            <div className="preview-ship">
              <h4>Shipped To</h4>
              <p>Noida Warehouse</p>
              <p>Uttar Pradesh</p>
            </div>
          )}
          <div className="preview-table">
            <div className={`preview-head ${defaultSettings.taxColumn ? "with-tax" : ""}`}>
              <span>Item</span>
              <span>Qty</span>
              {defaultSettings.discount && <span>Disc</span>}
              {defaultSettings.taxColumn && <span>GST</span>}
              <span>Amount</span>
            </div>
            <div className={`preview-row ${defaultSettings.taxColumn ? "with-tax" : ""}`}>
              <span>Product</span>
              <span>2</span>
              {defaultSettings.discount && <span>₹100</span>}
              {defaultSettings.taxColumn && <span>18%</span>}
              <span>₹2500</span>
            </div>
          </div>
          {printingSettings.qrCode && <div className="preview-qr">QR CODE</div>}
          {printingSettings.terms && (
            <div className="preview-terms">
              <h4>Terms & Conditions</h4>
              <p>{printingSettings.terms}</p>
            </div>
          )}
          {defaultSettings.narration && (
            <div className="preview-narration">Thank you for your business.</div>
          )}
          <div className="preview-total">
            <span>Total</span>
            <div>
              {defaultSettings.roundOff && <p className="roundoff-text">Round Off: ₹0.50</p>}
              <h2>₹2950</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
</div>
  );
}
