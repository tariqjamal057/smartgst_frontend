import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import "../styles/groupSecondary.css";
import * as services from "../api/services";

export default function GroupSecondary({ onClose, onSave }) {
    const { collapsed } = useOutletContext();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        name: "",
        alias: "",
        under: "Capital Account",
        subLedger: "No",
        netBalance: "No",
        usedForCalc: "No",
        method: "Not Applicable"
    });

    useEffect(() => {
        const fetchGroups = async () => {
            setLoading(true);
            try {
                const res = await services.getAccounts({ account_type: "group" });
                const data = res.data.results || res.data || [];
                setGroups(data);
            } catch {
                setGroups([]);
            } finally {
                setLoading(false);
            }
        };
        fetchGroups();
    }, []);

    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        try {
            await services.createAccount({
                name: form.name,
                alias: form.alias,
                group: form.under,
                sub_ledger: form.subLedger === "Yes",
                net_balance: form.netBalance === "Yes",
                used_for_calc: form.usedForCalc === "Yes",
                allocation_method: form.method,
                account_type: "group"
            });
            if (onSave) onSave(form);
        } catch {
            // keep form open
        }
    };

    return (
     <div className={`so-main-content ${collapsed ? "collapsed" : ""}`}>
        <div className="grp-sec-container">
        <div className="grp-sec-header">
            <h2>Group Creation (Secondary)</h2>
        </div>
        <div className="grp-sec-card">
            <div className="grp-sec-row">
            <label>Name</label>
            <input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
            />
            </div>
            <div className="grp-sec-row">
            <label>(Alias)</label>
            <input
                value={form.alias}
                onChange={(e) => handleChange("alias", e.target.value)}
            />
            </div>
            <div className="grp-sec-row">
            <label>Under</label>
            <select
                value={form.under}
                onChange={(e) => handleChange("under", e.target.value)}
            >
                <option>Capital Account</option>
                {loading && <option disabled>Loading...</option>}
                {!loading && groups.map((g) => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                ))}
            </select>
            </div>
            <div className="grp-sec-divider"></div>
            <div className="grp-sec-row">
            <label>Group behaves like a sub-ledger</label>
            <select
                value={form.subLedger}
                onChange={(e) => handleChange("subLedger", e.target.value)}
            >
                <option>No</option>
                <option>Yes</option>
            </select>
            </div>
            <div className="grp-sec-row">
            <label>Nett Debit/Credit Balances for Reporting</label>
            <select
                value={form.netBalance}
                onChange={(e) => handleChange("netBalance", e.target.value)}
            >
                <option>No</option>
                <option>Yes</option>
            </select>
            </div>
            <div className="grp-sec-row">
            <label>
                Used for calculation (taxes, discounts)
                <span className="grp-sec-subtext">
                (for sales invoice entries)
                </span>
            </label>
            <select
                value={form.usedForCalc}
                onChange={(e) => handleChange("usedForCalc", e.target.value)}
            >
                <option>No</option>
                <option>Yes</option>
            </select>
            </div>
            <div className="grp-sec-row">
            <label>Method to allocate (purchase invoice)</label>
            <select
                value={form.method}
                onChange={(e) => handleChange("method", e.target.value)}
            >
                <option>Not Applicable</option>
                <option>Appropriate by Quantity</option>
                <option>Appropriate by Value</option>
            </select>
            </div>
            <div className="grp-sec-actions">
            <button className="grp-sec-save" onClick={handleSave}>Save</button>
            <button className="grp-sec-cancel" onClick={onClose}>Cancel</button>
            </div>
        </div>
        </div>
    </div>
);
}
