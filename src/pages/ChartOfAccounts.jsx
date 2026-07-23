import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import * as services from "../api/services";

export default function ChartOfAccounts() {
  const { collapsed } = useOutletContext();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    account_type: "group",
    group: "",
    description: ""
  });

  const fetchAccounts = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filterType) params.account_type = filterType;
      const res = await services.getAccounts(params);
      setAccounts(res.data.results || res.data || []);
    } catch (err) {
      setError("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [filterType]);

  const toggleList = (el) => {
    const list = el.nextElementSibling;
    if (list) {
      list.style.display =
        list.style.display === "block" ? "none" : "block";
    }
  };

  const grouped = accounts.reduce((acc, acct) => {
    const group = acct.group || acct.account_type || "Other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(acct);
    return acc;
  }, {});

  const openCreate = () => {
    setEditId(null);
    setForm({ name: "", account_type: "group", group: "", description: "" });
    setShowModal(true);
  };

  const openEdit = (acct) => {
    setEditId(acct.id);
    setForm({
      name: acct.name || "",
      account_type: acct.account_type || "group",
      group: acct.group || "",
      description: acct.description || ""
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editId) {
        await services.updateAccount(editId, form);
      } else {
        await services.createAccount(form);
      }
      setShowModal(false);
      fetchAccounts();
    } catch (err) {
      setError("Failed to save account");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this account?")) return;
    try {
      await services.deleteAccount(id);
      fetchAccounts();
    } catch (err) {
      setError("Failed to delete account");
    }
  };

  const { collapsed: _ } = { collapsed };

  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>
      <div className="CHA-top-bar" style={{ display: "flex", gap: 12, padding: "16px 20px", alignItems: "center", flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, flex: 1 }}>Chart of Accounts</h2>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc" }}
        >
          <option value="">All Types</option>
          <option value="group">Groups</option>
          <option value="ledger">Ledgers</option>
        </select>
        <button
          onClick={openCreate}
          style={{ padding: "6px 16px", borderRadius: 6, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer" }}
        >
          + New Account
        </button>
      </div>

      {loading && <div style={{ padding: 20, textAlign: "center" }}>Loading accounts...</div>}
      {error && <div style={{ padding: 12, color: "red", textAlign: "center" }}>{error}</div>}
      {!loading && !error && accounts.length === 0 && (
        <div style={{ padding: 20, textAlign: "center", color: "#888" }}>No accounts found.</div>
      )}

      {!loading && !error && (
        <div className="CHA-ledger-grid">
          {Object.entries(grouped).map(([groupName, items]) => (
            <div className="CHA-ledger-card" key={groupName}>
              <div
                className="CHA-ledger-header"
                onClick={(e) => toggleList(e.currentTarget)}
              >
                <h3>{groupName}</h3>
                <i className="fa-solid fa-chevron-down"></i>
              </div>
              <div className="CHA-ledger-list">
                {items.map((acct) => (
                  <div className="CHA-ledger-item" key={acct.id}>
                    <span>{acct.name}</span>
                    <span className="CHA-actions">
                      <i className="fa-solid fa-pen" style={{ cursor: "pointer" }} onClick={() => openEdit(acct)}></i>
                      <i className="fa-solid fa-trash" style={{ cursor: "pointer" }} onClick={() => handleDelete(acct.id)}></i>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 24, width: 420, maxWidth: "90vw" }}>
            <h3 style={{ margin: "0 0 16px" }}>{editId ? "Edit Account" : "New Account"}</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Type</label>
              <select
                value={form.account_type}
                onChange={(e) => setForm({ ...form, account_type: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }}
              >
                <option value="group">Group</option>
                <option value="ledger">Ledger</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Under Group</label>
              <select
                value={form.group}
                onChange={(e) => setForm({ ...form, group: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }}
              >
                <option value="">None</option>
                {accounts.filter((a) => a.account_type === "group").map((g) => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: "8px 18px", borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{ padding: "8px 18px", borderRadius: 6, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer" }}
              >
                {editId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
