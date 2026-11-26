import { getFinancialYearLabel } from "../utils/financialYear";
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { FaSave, FaBuilding, FaCheck } from "react-icons/fa";
import * as services from "../api/services";

export default function Settings() {
  const { collapsed } = useOutletContext();

  const [settings, setSettings] = useState({
    company_name: "",
    gstin: "",
    address: "",
    state: "",
    email: "",
    phone: "",
    website: "",
    financial_year: "",
    registration_type: "Regular",
  });
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

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

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await services.getCompanySettings();
      const results = res.data.results || res.data;
      if (Array.isArray(results) && results.length > 0) {
        const s = results[0];
        setSettingsId(s.id);
        setSettings({
          company_name: s.company_name || "",
          gstin: s.gstin || "",
          address: s.address || "",
          state: s.state || "",
          email: s.email || "",
          phone: s.phone || "",
          website: s.website || "",
          financial_year: s.financial_year || "",
          registration_type: s.registration_type || "Regular",
        });
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setMessage({ type: "", text: "" });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      if (settingsId) {
        await services.updateCompanySetting(settingsId, settings);
      } else {
        const res = await services.createCompanySetting(settings);
        setSettingsId(res.data.id);
      }
      setMessage({ type: "success", text: "Settings saved successfully!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: "Failed to save: " + (err.response?.data?.detail || err.message),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>
      {/* HEADER */}
      <div className="page-header">
        <h2>
          <FaBuilding style={{ marginRight: "8px" }} />
          Company Settings
        </h2>
        <div className="header-actions">
          <button className="add-btn" onClick={handleSave} disabled={saving}>
            <FaSave /> {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* MESSAGE */}
      {message.text && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            marginBottom: "16px",
            background: message.type === "success" ? "#d1fae5" : "#fee2e2",
            color: message.type === "success" ? "#065f46" : "#991b1b",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FaCheck />
          {message.text}
        </div>
      )}

      {/* LOADING */}
      {loading && <p style={{ padding: "20px", textAlign: "center" }}>Loading settings...</p>}

      {/* SETTINGS FORM */}
      {!loading && (
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          {/* Company Details Section */}
          <h3
            style={{
              marginBottom: "16px",
              paddingBottom: "8px",
              borderBottom: "2px solid #e5e7eb",
              color: "#1f2937",
            }}
          >
            Company Details
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "13px" }}>
                Company Name
              </label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => handleChange("company_name", e.target.value)}
                placeholder="Enter company name"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "13px" }}>
                GSTIN
              </label>
              <input
                type="text"
                value={settings.gstin}
                onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z"
                maxLength={15}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "13px" }}>
                Registered Address
              </label>
              <textarea
                rows="2"
                value={settings.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Enter full address"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "13px" }}>
                State
              </label>
              <select
                value={settings.state}
                onChange={(e) => handleChange("state", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                <option value="">Select State</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "13px" }}>
                Registration Type
              </label>
              <select
                value={settings.registration_type}
                onChange={(e) => handleChange("registration_type", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                <option>Regular</option>
                <option>Composition</option>
                <option>Regular SEZ</option>
              </select>
            </div>
          </div>

          {/* Contact Details Section */}
          <h3
            style={{
              marginBottom: "16px",
              paddingBottom: "8px",
              borderBottom: "2px solid #e5e7eb",
              color: "#1f2937",
            }}
          >
            Contact & Financial Details
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "13px" }}>
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="company@email.com"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "13px" }}>
                Phone
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+91 98765 43210"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "13px" }}>
                Website
              </label>
              <input
                type="text"
                value={settings.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://example.com"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "13px" }}>
                Financial Year
              </label>
              <input
                type="text"
                value={settings.financial_year}
                onChange={(e) => handleChange("financial_year", e.target.value)}
                placeholder={getFinancialYearLabel()}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "10px 24px",
                background: "#4f46e5",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FaSave />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
