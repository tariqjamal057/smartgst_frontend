import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { FaPlus, FaTrash, FaEye, FaEdit } from "react-icons/fa";
import { loadData, deleteData } from "../api/connector";
import * as services from "../api/services";

export default function JournalEntries() {
  const { collapsed } = useOutletContext();
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewEntry, setViewEntry] = useState(null);

  const rowsPerPage = 10;

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    await loadData(
      services.getJournalVouchers,
      {},
      (data) => {
        setEntries(Array.isArray(data) ? data : data.results || []);
      },
      setLoading,
      setError
    );
  };

  const filteredEntries = entries.filter(
    (entry) =>
      entry.voucher_number?.toLowerCase().includes(search.toLowerCase()) ||
      entry.narration?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEntries.length / rowsPerPage);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalDebit = entries.reduce(
    (sum, e) =>
      sum +
      (e.entries || []).reduce(
        (s, ent) => s + (ent.type === "DEBIT" ? Number(ent.amount || 0) : 0),
        0
      ),
    0
  );

  const totalCredit = entries.reduce(
    (sum, e) =>
      sum +
      (e.entries || []).reduce(
        (s, ent) => s + (ent.type === "CREDIT" ? Number(ent.amount || 0) : 0),
        0
      ),
    0
  );

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this journal entry?")) return;
    await deleteData(
      services.deleteJournalVoucher,
      id,
      () => {
        setEntries((prev) => prev.filter((e) => e.id !== id));
        alert("Journal entry deleted!");
      },
      (err) => alert("Delete failed: " + JSON.stringify(err))
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getTotalAmount = (entry) => {
    return (entry.entries || []).reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    );
  };

  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>
      {/* HEADER */}
      <div className="page-header">
        <h2>Journal Entries</h2>
        <div className="header-actions">
          <button className="add-btn" onClick={() => navigate("/Journal")}>
            <FaPlus /> New Entry
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search voucher number or narration..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* SUMMARY */}
      <div className="Purchase_summary">
        <div className="Purchase_card paid">Total Debit: ₹ {totalDebit.toFixed(2)}</div>
        <div className="Purchase_card unpaid">Total Credit: ₹ {totalCredit.toFixed(2)}</div>
        <div className="Purchase_card total">Entries: {entries.length}</div>
      </div>

      {/* LOADING */}
      {loading && <p style={{ padding: "20px", textAlign: "center" }}>Loading journal entries...</p>}

      {/* ERROR */}
      {error && <p style={{ padding: "20px", color: "red", textAlign: "center" }}>{error}</p>}

      {/* TABLE */}
      {!loading && (
        <div className="table-box">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Voucher No</th>
                <th>Date</th>
                <th>Narration</th>
                <th className="right">Total Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEntries.length > 0 ? (
                paginatedEntries.map((entry, index) => (
                  <tr key={entry.id}>
                    <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                    <td>
                      <span
                        style={{
                          padding: "2px 10px",
                          borderRadius: "12px",
                          background: "#eef2ff",
                          color: "#4f46e5",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        {entry.voucher_number || "N/A"}
                      </span>
                    </td>
                    <td>{formatDate(entry.date)}</td>
                    <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.narration || "-"}
                    </td>
                    <td className="right" style={{ fontWeight: "600" }}>
                      ₹ {getTotalAmount(entry).toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="add-btn"
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                          onClick={() => setViewEntry(entry)}
                          title="View Details"
                        >
                          <FaEye /> View
                        </button>
                        <button
                          className="File_updoad"
                          style={{ padding: "4px 8px", fontSize: "11px", color: "#ef4444" }}
                          onClick={() => handleDelete(entry.id)}
                          title="Delete"
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    No journal entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Prev
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={currentPage === i + 1 ? "active" : ""}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW ENTRY MODAL */}
      {viewEntry && (
        <div className="purchase_modal">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <h3>Journal Entry Details</h3>
            <div style={{ marginBottom: "12px" }}>
              <strong>Voucher No:</strong> {viewEntry.voucher_number}
            </div>
            <div style={{ marginBottom: "12px" }}>
              <strong>Date:</strong> {formatDate(viewEntry.date)}
            </div>
            <div style={{ marginBottom: "12px" }}>
              <strong>Narration:</strong> {viewEntry.narration || "-"}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  <th style={{ padding: "8px", textAlign: "left" }}>Type</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Ledger</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(viewEntry.entries || []).map((ent, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "8px" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "8px",
                          background: ent.type === "DEBIT" ? "#fef3c7" : "#d1fae5",
                          color: ent.type === "DEBIT" ? "#92400e" : "#065f46",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        {ent.type}
                      </span>
                    </td>
                    <td style={{ padding: "8px" }}>{ent.ledger_name || ent.ledger || "-"}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontWeight: "600" }}>
                      ₹ {Number(ent.amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="modal-actions" style={{ marginTop: "16px" }}>
              <button className="cancel-btn" onClick={() => setViewEntry(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
