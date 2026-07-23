import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { FaDownload, FaTrash, FaUpload, FaFileAlt, FaFileImage, FaFilePdf } from "react-icons/fa";
import * as services from "../api/services";

export default function Documents() {
  const { collapsed } = useOutletContext();
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    type: "invoice",
    file: null,
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await services.getDocuments();
      setDocuments(res.data.results || res.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = documents.filter(
    (doc) =>
      doc.name?.toLowerCase().includes(search.toLowerCase()) ||
      doc.type?.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm((prev) => ({
        ...prev,
        file,
        name: prev.name || file.name,
      }));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) {
      alert("Please select a file");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("name", uploadForm.name);
      formData.append("type", uploadForm.type);

      await services.createDocument(formData);
      alert("Document uploaded successfully!");
      setShowUploadModal(false);
      setUploadForm({ name: "", type: "invoice", file: null });
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchDocuments();
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await services.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      alert("Document deleted successfully!");
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDownload = (doc) => {
    if (doc.file || doc.file_url) {
      window.open(doc.file || doc.file_url, "_blank");
    } else {
      alert("Download link not available");
    }
  };

  const getFileIcon = (type) => {
    if (!type) return <FaFileAlt />;
    const t = type.toLowerCase();
    if (t.includes("image") || t.includes("jpg") || t.includes("png")) return <FaFileImage />;
    if (t.includes("pdf")) return <FaFilePdf />;
    return <FaFileAlt />;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>
      {/* HEADER */}
      <div className="page-header">
        <h2>Documents</h2>
        <div className="header-actions">
          <button className="add-btn" onClick={() => setShowUploadModal(true)}>
            <FaUpload /> Upload Document
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search by name or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* LOADING */}
      {loading && <p style={{ padding: "20px", textAlign: "center" }}>Loading documents...</p>}

      {/* ERROR */}
      {error && <p style={{ padding: "20px", color: "red", textAlign: "center" }}>{error}</p>}

      {/* TABLE */}
      {!loading && (
        <div className="table-box">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Type</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc, index) => (
                  <tr key={doc.id}>
                    <td>{index + 1}</td>
                    <td style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "#6366f1" }}>{getFileIcon(doc.type)}</span>
                      {doc.name || "Untitled"}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "2px 10px",
                          borderRadius: "12px",
                          background: "#eef2ff",
                          color: "#4f46e5",
                          fontSize: "12px",
                        }}
                      >
                        {doc.type || "General"}
                      </span>
                    </td>
                    <td>{formatDate(doc.upload_date || doc.created_at)}</td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="add-btn"
                          style={{ padding: "4px 10px", fontSize: "12px" }}
                          onClick={() => handleDownload(doc)}
                          title="Download"
                        >
                          <FaDownload /> Download
                        </button>
                        <button
                          className="File_updoad"
                          style={{ padding: "4px 10px", fontSize: "12px", color: "#ef4444" }}
                          onClick={() => handleDelete(doc.id)}
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
                  <td colSpan="5" className="no-data">
                    No documents found. Upload your first document!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="purchase_modal">
          <form className="modal-content" onSubmit={handleUpload}>
            <h3>Upload Document</h3>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                Document Name
              </label>
              <input
                type="text"
                placeholder="Enter document name"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                required
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                Document Type
              </label>
              <select
                value={uploadForm.type}
                onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
              >
                <option value="invoice">Invoice</option>
                <option value="receipt">Receipt</option>
                <option value="contract">Contract</option>
                <option value="certificate">Certificate</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                Select File
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                required
                style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "6px", width: "100%" }}
              />
            </div>

            <div className="modal-actions">
              <button className="save-btn" type="submit" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </button>
              <button
                className="cancel-btn"
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadForm({ name: "", type: "invoice", file: null });
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
