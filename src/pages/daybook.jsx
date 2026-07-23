import { useState, useEffect } from "react";
import { Calendar, FileText, Download } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import * as services from "../api/services";
import "../styles/DayBook.css";

const DayBook = () => {
    const { collapsed } = useOutletContext();
  const [voucherType, setVoucherType] = useState("all");
  const [fromDate, setFromDate] = useState("2024-04-01");
  const [toDate, setToDate] = useState("2025-03-31");

  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const rowsPerPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { from_date: fromDate, to_date: toDate };
      if (voucherType !== "all") params.voucher_type = voucherType;

      const res = await services.getTransactions(params);
      const results = res.data.results || res.data || [];
      const transactions = Array.isArray(results) ? results : [];

      const formatted = transactions.map((t) => ({
        date: t.date || t.transaction_date || "",
        ledger: t.ledger_name || t.party || t.particulars || "",
        type: t.voucher_type || t.type || "",
        voucherNo: t.voucher_no || "",
        invoice: t.invoice_no || t.invoice || "",
        dr: t.debit || t.dr || t.amount_dr || "",
        cr: t.credit || t.cr || t.amount_cr || "",
      }));

      setData(formatted);
    } catch (err) {
      console.error("Failed to fetch daybook transactions:", err);
      setError("Failed to load daybook data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilter = () => {
    setCurrentPage(1);
    fetchData();
  };

  // FILTER LOGIC (client-side for voucher type, API for dates)
  const filteredData =
    voucherType === "all"
      ? data
      : data.filter((d) => d.type.toLowerCase() === voucherType);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>
        <div className="db-container">

            {/* HEADER */}
            <div className="db-header">
                <h2>
                Day Book <span>Print</span>
                </h2>

                <div className="db-actions">
                <button className="db-download">
                    <Download size={16} /> PDF
                </button>
                <button className="db-download">
                    <Download size={16} /> Excel
                </button>
                </div>
            </div>

            {/* FILTER BAR */}
            <div className="db-filter">

                {/* VOUCHER TYPE */}
                <div className="db-field">
                <label>Voucher Type</label>
                <select
                    value={voucherType}
                    onChange={(e) => setVoucherType(e.target.value)}
                >
                    <option value="all">All</option>
                    <option value="sale">Sale</option>
                    <option value="purchase">Purchase</option>
                    <option value="credit note">Credit Note</option>
                    <option value="debit note">Debit Note</option>
                    <option value="payment">Payment</option>
                    <option value="receipt">Receipt</option>
                    <option value="contra">Contra</option>
                    <option value="journal">Journal</option>
                </select>
                </div>

                {/* DATE */}
                <div className="db-field">
                <label>Date Period</label>
                <div className="db-date">
                    <Calendar size={16} />
                    <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    />
                    <span>to</span>
                    <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    />
                </div>
                </div>

                {/* APPLY */}
                <div className="db-field">
                <button className="db-apply-btn" onClick={handleFilter}>Apply</button>
                </div>

                {/* CONFIG */}
                <div className="db-field">
                <label>Configuration</label>
                <button className="db-config">Configuration</button>
                </div>

            </div>

            {/* LOADING */}
            {loading && <div style={{ textAlign: "center", padding: "40px" }}>Loading daybook data...</div>}
            {error && <div style={{ textAlign: "center", padding: "20px", color: "red" }}>{error}</div>}

            {/* TABLE */}
            {!loading && !error && (
                <>
                <div className="db-table-wrapper">
                    <table className="db-table">

                    <thead>
                        <tr>
                        <th>Date</th>
                        <th>Ledger Name</th>
                        <th>Voucher Type</th>
                        <th>Voucher No.</th>
                        <th>Invoice No.</th>
                        <th>Amount Dr.</th>
                        <th>Amount Cr.</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedData.length === 0 ? (
                        <tr>
                            <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                            No entries found
                            </td>
                        </tr>
                        ) : (
                        paginatedData.map((row, i) => (
                        <tr key={i}>
                            <td>{row.date}</td>
                            <td>{row.ledger}</td>
                            <td>{row.type}</td>
                            <td>{row.voucherNo}</td>
                            <td>{row.invoice}</td>
                            <td className="dr">{row.dr || ""}</td>
                            <td className="cr">{row.cr || ""}</td>
                        </tr>
                        ))
                        )}
                    </tbody>

                    </table>
                </div>
                <div className="db-pagination">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        Prev
                    </button>

                    <span>
                        Page {currentPage} of {totalPages || 1}
                    </span>

                    <button
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        Next
                    </button>
                </div>
                </>
            )}

        </div>
    </div>
  );
};

export default DayBook;
