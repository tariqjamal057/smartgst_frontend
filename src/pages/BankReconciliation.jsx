import React, { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import * as services from "../api/services";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip
);

export default function BankReconciliation() {
  const { collapsed } = useOutletContext();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await services.getBankReconciliations();
      const results = res.data.results || res.data || [];
      setReconciliations(Array.isArray(results) ? results : []);
    } catch (err) {
      console.error("Failed to fetch bank reconciliations:", err);
      setError("Failed to load bank reconciliation data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group reconciliations by month
  const yearlyData = useMemo(() => {
    const grouped = {};
    reconciliations.forEach((item) => {
      const date = new Date(item.date || item.reconciliation_date || item.created_at);
      const year = date.getFullYear().toString();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthName = monthNames[date.getMonth()];

      if (!grouped[year]) grouped[year] = {};
      if (!grouped[year][monthName]) grouped[year][monthName] = { income: 0, expense: 0 };

      const amount = Number(item.amount || 0);
      if (item.type === "income" || item.status === "reconciled") {
        grouped[year][monthName].income += amount;
      } else {
        grouped[year][monthName].expense += amount;
      }
    });

    // Convert to array format
    const result = {};
    Object.entries(grouped).forEach(([year, months]) => {
      result[year] = Object.entries(months).map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
      }));
    });

    return result;
  }, [reconciliations]);

  const data = hasData ? yearlyData[selectedYear] : [];

  const calculated = useMemo(() => {
    const totalIncome = data.reduce((a, b) => a + b.income, 0);
    const totalExpense = data.reduce((a, b) => a + b.expense, 0);
    const netProfit = totalIncome - totalExpense;
    const receivables = reconciliations.reduce(
      (sum, item) => sum + (Number(item.receivable ?? item.receivables) || 0),
      0
    );
    const payables = reconciliations.reduce(
      (sum, item) => sum + (Number(item.payable ?? item.payables) || 0),
      0
    );

    return {
      totalIncome,
      totalExpense,
      netProfit,
      receivables,
      payables,
      netPosition: receivables - payables
    };
  }, [data, reconciliations]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    elements: { point: { radius: 0 } }
  };

  const createDataset = (values, color) => ({
    labels: data.map(d => d.month),
    datasets: [
      {
        data: values,
        borderColor: color,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, color + "66");
          gradient.addColorStop(1, color + "05");
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2
      }
    ]
  });

  return <div className={`main ${collapsed ? "collapsed" : ""}`}>

    {loading && <div style={{ textAlign: "center", padding: "40px" }}>Loading bank reconciliation data...</div>}
    {error && <div style={{ textAlign: "center", padding: "20px", color: "red" }}>{error}</div>}

    {!loading && !error && (
      <div className="BankReconciliation-dashboard-container">
        {/* KPI GRID */}
        <div className="BankReconciliation-kpi-grid">
          {[
            { title: "Total Income", value: calculated.totalIncome, data: data.map(d => d.income), color: "#34d399" },
            { title: "Total Expenses", value: calculated.totalExpense, data: data.map(d => d.expense), color: "#fb923c" },
            { title: "Net Profit", value: calculated.netProfit, data: data.map(d => d.income - d.expense), color: "#60a5fa" },
            { title: "Receivables", value: calculated.receivables, data: data.map(() => 0), color: "#34d399" },
            { title: "Payables", value: calculated.payables, data: data.map(() => 0), color: "#fb923c" }
          ].map((item, i) => (
            <div className="BankReconciliation-kpi-card" key={i}>
              <div className="BankReconciliation-chart-bg">
                <Line
                  data={createDataset(item.data, item.color)}
                  options={chartOptions}
                />
              </div>
              <div className="BankReconciliation-kpi-content">
                <h4>{item.title}</h4>
                <h2>₹ {item.value.toLocaleString()}</h2>
              </div>
            </div>
          ))}
        </div>

        {/* SPLIT SECTION */}
        <div className="BankReconciliation-split">
          <div className="BankReconciliation-card">
            <div className="BankReconciliation-card-header">
              <h3>Monthly Accounting Trend</h3>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {Object.keys(yearlyData).length > 0 ? (
                  Object.keys(yearlyData).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))
                ) : (
                  <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                )}
              </select>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Income</th>
                  <th>Expense</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center" }}>No bank reconciliation data available.</td>
                  </tr>
                )}
                {data.map((item, i) => (
                  <tr key={i}>
                    <td>{item.month}</td>
                    <td>₹ {item.income.toLocaleString()}</td>
                    <td>₹ {item.expense.toLocaleString()}</td>
                    <td className="BankReconciliation-profit">
                      ₹ {(item.income - item.expense).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="BankReconciliation-card">
            <h3>Outstanding Snapshot ({selectedYear})</h3>

            <div className="BankReconciliation-snapshot-row">
              <span>Customer Receivables</span>
              <span className="BankReconciliation-green">
                ₹ {calculated.receivables.toLocaleString()}
              </span>
            </div>

            <div className="BankReconciliation-snapshot-row">
              <span>Vendor Payables</span>
              <span className="BankReconciliation-orange">
                ₹ {calculated.payables.toLocaleString()}
              </span>
            </div>

            <div className="BankReconciliation-snapshot-row total">
              <span>Net Position</span>
              <span>₹ {calculated.netPosition.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>;
}
