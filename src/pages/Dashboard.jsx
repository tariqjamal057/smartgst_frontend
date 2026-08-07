import React, { useEffect, useState, useMemo } from "react";
import {useOutletContext,useNavigate} from "react-router-dom";
import * as services from "../api/services";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";

// import { Line } from "react-chartjs-2";
import { Bar } from "react-chartjs-2";
import { FaTruck, FaFileInvoice } from "react-icons/fa";
// import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  ShoppingCart,
  ReceiptText,
  Wallet,
  TrendingUp,
  Landmark,
  Scale,
  Boxes,
  IndianRupee,
  Bell,
  UserRound,
  BadgeDollarSign,
  BanknoteArrowUp,
  PackageSearch,
  ClipboardList,
  FileSpreadsheet,
  ChartColumnBig,
  CircleDollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock3,
} from "lucide-react";
import "../styles/MainDashboard.css";
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const { collapsed } = useOutletContext();
  const navigate = useNavigate();

  // Guard: no tenant selected → redirect to company selection
  useEffect(() => {
    const tid = localStorage.getItem("tenant_id");
    if (!tid) {
      navigate("/select-company", { replace: true });
    }
  }, [navigate]);

  const [company, setCompany] = useState({companyName: "",
    gstin: "",
    contactPerson: "",
    contactNo: "",
    financialYear: ""});
  const [view, setView] = useState("daily");
  const [summaryData, setSummaryData] = useState({
    totalSales: "—",
    totalPurchase: "—",
    directExp: "—",
    indirectExp: "—",
    netProfit: "—",
    totalReceipts: "—",
    totalPayments: "—",
    pendingReceipts: "—",
    pendingPayments: "—",
    cash: "—",
    bank: "—",
    assets: "—",
    liabilities: "—",
    stockBalance: "—",
    stockIn: "—",
    stockOut: "—",
  });

  const [recentEntries, setRecentEntries] = useState([]);
  const [gstData, setGstData] = useState({
    netOutput: { igst: "—", cgst: "—", sgst: "—", cess: "—", total: "—" },
    lessInput: { igst: "—", cgst: "—", sgst: "—", cess: "—", total: "—" },
    itcPayable: { igst: "—", cgst: "—", sgst: "—", cess: "—", total: "—" },
  });
  const [ewbStatus, setEwbStatus] = useState({ generated: "—", sales: "—" });
  const [einvoiceStatus, setEinvoiceStatus] = useState({ generated: "—", sales: "—", pending: "—" });
  const [trendStats, setTrendStats] = useState({
    highestSales: "—", highestSalesMonth: "—",
    lowestSales: "—", lowestSalesMonth: "—",
    avgMonthlySales: "—",
    avgProfitMargin: "—",
  });
  const [pendingReceipts, setPendingReceipts] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [chartRaw, setChartRaw] = useState(null);

  useEffect(() => {
    const selectedCompany = localStorage.getItem("company_name") || localStorage.getItem("company") || "";
    setCompany(prev => ({ ...prev, companyName: selectedCompany }));

    (async () => {
      let hasRecentEntries = false;

      try {
        const res = await services.getCompanySettings({});
        const list = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        const cs = list[0] || res.data || {};
        if (cs.company_name || cs.gstin) {
          setCompany(prev => ({
            ...prev,
            companyName: cs.company_name || prev.companyName,
            gstin: cs.gstin || "",
            contactPerson: cs.contact_person || "",
            contactNo: cs.phone || "",
            financialYear: cs.financial_year || "",
          }));
        }
      } catch {
        // keep localStorage company name only
      }

      try {
        const res = await services.getDashboardSummary({});
        const d = res.data || {};
        setSummaryData({
          totalSales: d.total_sales ?? "—",
          totalPurchase: d.total_purchases ?? "—",
          directExp: d.direct_expenses ?? "—",
          indirectExp: d.indirect_expenses ?? "—",
          netProfit: d.net_profit ?? "—",
          totalReceipts: d.total_receipts ?? "—",
          totalPayments: d.total_payments ?? "—",
          pendingReceipts: d.pending_receivables ?? "—",
          pendingPayments: d.pending_payables ?? "—",
          cash: d.cash ?? "—",
          bank: d.bank ?? "—",
          assets: d.assets ?? "—",
          liabilities: d.liabilities ?? "—",
          stockBalance: d.stock_balance ?? "—",
          stockIn: d.stock_in ?? "—",
          stockOut: d.stock_out ?? "—",
        });
        setChartRaw(d.chart_data || null);
        if (d.gst_data) setGstData(d.gst_data);
        if (d.ewb_status) setEwbStatus(d.ewb_status);
        if (d.einvoice_status) setEinvoiceStatus(d.einvoice_status);
        if (d.trend_stats) setTrendStats(d.trend_stats);
        if (Array.isArray(d.pending_receipts)) setPendingReceipts(d.pending_receipts);
        if (Array.isArray(d.pending_payments)) setPendingPayments(d.pending_payments);
        if (Array.isArray(d.recent_entries) && d.recent_entries.length > 0) {
          setRecentEntries(d.recent_entries.map(r => ({
            date: r.date || "",
            party: r.party || "",
            voucherType: r.voucher_type || "",
            voucherNo: r.voucher_no || "",
            amountCr: r.amount_cr || "",
            amountDr: r.amount_dr || "",
          })));
          hasRecentEntries = true;
        }
      } catch {
        setSummaryData({
          totalSales: "—", totalPurchase: "—", directExp: "—", indirectExp: "—",
          netProfit: "—", totalReceipts: "—", totalPayments: "—",
          pendingReceipts: "—", pendingPayments: "—",
          cash: "—", bank: "—", assets: "—", liabilities: "—",
          stockBalance: "—", stockIn: "—", stockOut: "—",
        });
      }

      if (hasRecentEntries) return;

      try {
        const res = await services.getTransactions({});
        const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        if (rows.length > 0) {
          const mapped = rows.map(r => ({
            date: r.date || r.transaction_date || "",
            party: r.party_name || r.party || "",
            voucherType: r.voucher_type || r.transaction_type || "",
            voucherNo: r.receipt_no || r.voucher_no || r.number || "",
            amountCr: r.received_amount || r.amount_cr || r.credit || "",
            amountDr: r.paid_amount || r.amount_dr || r.debit || "",
          }));
          setRecentEntries(mapped);
        }
      } catch {
        // entries unavailable
      }
    })();
  }, []);
  
  const shutCompany = () => {
    localStorage.removeItem("company");
    localStorage.removeItem("tenant_id");
    localStorage.removeItem("company_name");
    navigate("/select-company", { replace: true });
  };

  /* ================================
      SUMMARY CARDS
  ================================= */
 const summaryCards = [

  {
    title: "Total Sales",
    amount: summaryData.totalSales,
    icon: <ShoppingCart size={23} />,
    bg: "linear-gradient(135deg,#2563eb,#60a5fa)"
  },

  {
    title: "Total Purchase",
    amount: summaryData.totalPurchase,
    icon: <ReceiptText size={23} />,
    bg: "linear-gradient(135deg,#16a34a,#4ade80)"
  },

  {
    title: "Total Expenses",
    amount: (
    <div className="dual-amount">
      <span>Direct Exp :<strong> {summaryData.directExp}</strong></span>
      <span>Indirect Exp :<strong> {summaryData.indirectExp}</strong></span>
    </div>
  ),
    icon: <Wallet size={23} />,
    bg: "linear-gradient(135deg,#dc2626,#fb7185)"
  },

  {
    title: "Net Profit",
    amount: summaryData.netProfit,
    icon: <TrendingUp size={23} />,
    bg: "linear-gradient(135deg,#f59e0b,#facc15)"
  },
  {
    title: "Total Receipts",
    amount: summaryData.totalReceipts,
    icon: <ArrowDownCircle size={23} />,
    bg: "linear-gradient(135deg,#059669,#34d399)"
  },
  {
    title: "Total Payments",
    amount: summaryData.totalPayments,
    icon: <ArrowUpCircle size={23} />,
    bg: "linear-gradient(135deg,#dc2626,#fb7185)"
  },
  {
    title: "Pending Receipts",
    amount: summaryData.pendingReceipts,
    icon: <Clock3  size={23} />,
    bg: "linear-gradient(135deg,#4f46e5,#818cf8)"
  },
  {
    title: "Pending Payments",
    amount: summaryData.pendingPayments,
    icon: <CircleDollarSign  size={23} />,
    bg: "linear-gradient(135deg,#0f766e,#2dd4bf)"
  },

  {
    title: "Cash/Bank",
    amount: (
    <div className="dual-amount">
      <span>Cash :<strong> {summaryData.cash}</strong></span>
      <span>Bank :<strong> {summaryData.bank}</strong></span>
    </div>
  ),
    icon: <Landmark size={23} />,
    bg: "linear-gradient(135deg,#0891b2,#22d3ee)"
  },

  {
    title: "Assets & Liabilities",
    amount: (
    <div className="dual-amount">
      <span>Assets :<strong> {summaryData.assets}</strong></span>
      <span>Liabilities :<strong> {summaryData.liabilities}</strong></span>
    </div>
  ),
    icon: <Scale size={23} />,
    bg: "linear-gradient(135deg,#7c3aed,#c084fc)"
  },

  {
    title: "Stock Balance",
    amount: summaryData.stockBalance,
    icon: <Boxes size={23} />,
    bg: "linear-gradient(135deg,#db2777,#f472b6)"
  },

  {
    title: "Stock",
    amount: (
    <div className="dual-amount">
      <span>In :<strong> {summaryData.stockIn}</strong></span>
      <span>out :<strong> {summaryData.stockOut}</strong></span>
    </div>
  ),
    icon: <IndianRupee size={23} />,
    bg: "linear-gradient(135deg,#059669,#34d399)"
  }

];

  /* ================================
      CHART DATA
  ================================= */
/* =========================================
    PREMIUM CHART DATA
========================================= */

// const createGradient = (context, startColor) => {
//   const chart = context.chart;
//   const { ctx, chartArea } = chart;

//   if (!chartArea) return null;

//   const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
//   gradient.addColorStop(0, startColor);
//   gradient.addColorStop(0.35, startColor.replace("1)", "0.15)"));
//   gradient.addColorStop(0.50, "rgba(255, 255, 255, 0)");

//   return gradient;
// };

// const commonDataset = (label, data, borderColor, gradientColor) => ({
//   label,
//   data,
//   borderColor,
//   backgroundColor: (context) => createGradient(context, gradientColor),
//   fill: true,
//   tension: 0.45,
//   borderWidth: 3,
//   pointRadius: 0,
//   pointHoverRadius: 6,
//   pointHoverBackgroundColor: "#ffffff",
//   pointHoverBorderWidth: 4,
//   cubicInterpolationMode: "monotone"
// });

// const chartData = useMemo(() => {
//   return {
//     daily: {
//       labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
//       datasets: [
//         commonDataset("Sales", [32, 38, 42, 39, 47, 44, 52], "#2563eb", "rgba(37, 99, 235, 1)"),
//         commonDataset("Purchase", [18, 24, 28, 25, 30, 27, 36], "#64748b", "rgba(100, 116, 139, 1)"),
//         commonDataset("Expenses", [10, 15, 14, 13, 18, 16, 20], "#f97316", "rgba(249, 115, 22, 1)"),
//         commonDataset("Profit", [4, 8, 7, 7, 10, 8, 12], "#65a30d", "rgba(101, 163, 13, 1)")
//       ]
//     },
//     monthly: {
//       labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
//       datasets: [
//         commonDataset("Sales", [28, 35, 41, 38, 49, 40, 45, 52, 47, 58, 50, 63], "#2563eb", "rgba(37, 99, 235, 1)"),
//         commonDataset("Purchase", [18, 24, 29, 25, 31, 27, 25, 30, 27, 33, 29, 37], "#64748b", "rgba(100, 116, 139, 1)"),
//         commonDataset("Expenses", [9, 14, 13, 12, 16, 15, 14, 17, 16, 21, 19, 24], "#f97316", "rgba(249, 115, 22, 1)"),
//         commonDataset("Profit", [3, 8, 7, 7, 9, 8, 7, 10, 8, 12, 10, 14], "#65a30d", "rgba(101, 163, 13, 1)")
//       ]
//     },
//     quarterly: {
//       labels: ["Q1", "Q2", "Q3", "Q4"],
//       datasets: [
//         commonDataset("Sales", [120, 145, 138, 170], "#2563eb", "rgba(37, 99, 235, 1)"),
//         commonDataset("Purchase", [70, 82, 78, 96], "#64748b", "rgba(100, 116, 139, 1)"),
//         commonDataset("Expenses", [42, 50, 46, 60], "#f97316", "rgba(249, 115, 22, 1)"),
//         commonDataset("Profit", [18, 25, 22, 32], "#65a30d", "rgba(101, 163, 13, 1)")
//       ]
//     },
//     yearly: {
//       labels: ["2022", "2023", "2024", "2025"],
//       datasets: [
//         commonDataset("Sales", [280, 340, 410, 520], "#2563eb", "rgba(37, 99, 235, 1)"),
//         commonDataset("Purchase", [170, 210, 250, 320], "#64748b", "rgba(100, 116, 139, 1)"),
//         commonDataset("Expenses", [90, 120, 145, 180], "#f97316", "rgba(249, 115, 22, 1)"),
//         commonDataset("Profit", [42, 58, 75, 120], "#65a30d", "rgba(101, 163, 13, 1)")
//       ]
//     }
//   };
// }, []);
//     const chartOptions = {
//   responsive: true,
//   maintainAspectRatio: false,
//   interaction: {
//     mode: "index",
//     intersect: false
//   },
//   plugins: {
//     legend: {
//       position: "top",
//       align: "center",
//       labels: {
//         usePointStyle: true,
//         pointStyle: "circle",
//         padding: 30, // Increased padding for breathing room
//         color: "#1e293b", // Slate-800 instead of harsh true black
//         boxWidth: 10,
//         boxHeight: 10,
//         font: {
//           size: 14,
//           weight: "600", // Semi-bold looks cleaner than ultra-thick 700
//           family: "'Inter', sans-serif"
//         }
//       }
//     },
//     tooltip: {
//       backgroundColor: "rgba(17, 24, 39, 0.95)", // Slightly translucent dark glass
//       titleColor: "#ffffff",
//       bodyColor: "#f3f4f6",
//       padding: 12,
//       cornerRadius: 12,
//       boxPadding: 6, // Adds premium spacing inside tooltips
//       usePointStyle: true // Uses the circular icons in the tooltip matching the legend
//     }
//   },
//   scales: {
//     x: {
//       grid: {
//         display: false
//       },
//       ticks: {
//         color: "#94a3b8", // Subdued gray text so chart curves stand out
//         padding: 10,
//         font: {
//           size: 12,
//           weight: "600",
//           family: "'Inter', sans-serif"
//         }
//       },
//       border: {
//         display: false // Removes the harsh bottom line axis line
//       }
//     },
//     y: {
//       beginAtZero: true,
//       suggestedMax: 60, // Gives the chart top headroom exactly like the image
//       grid: {
//         color: "rgba(226, 232, 240, 0.4)", // Very soft slate divider lines
//         drawTicks: false
//       },
//       border: {
//         display: false
//       },
//       ticks: {
//         color: "#94a3b8",
//         padding: 12,
//         font: {
//           size: 12,
//           weight: "500",
//           family: "'Inter', sans-serif"
//         },
//         callback: (value) => value + "L"
//       }
//     }
//   }
// };
const createBarGradient = (
  context,
  color1,
  color2
) => {

  const chart = context.chart;
  const { ctx, chartArea } = chart;
  if (!chartArea) return null;
  const gradient =
    ctx.createLinearGradient(
      0,
      chartArea.top,
      0,
      chartArea.bottom
    );
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  gradient.addColorStop(
    1,
    "rgba(255,255,255,0.12)"
  );
  return gradient;
};


const chartData = useMemo(() => {
  const salesColor = "#084ee5";
  const salesGradient = "#a6ceff";
  const purchaseColor = "#032a34";
  const purchaseGradient = "#4de4f8";
  const expenseColor = "#f91511";
  const expenseGradient = "#fcc670";
  const profitColor = "#05571197";
  const profitGradient = "#80f4a1";

  const makeDataset = (label, data, c1, c2) => ({
    label,
    data,
    backgroundColor: (context) => createBarGradient(context, c1, c2),
    borderRadius: 4,
  });

  if (chartRaw && typeof chartRaw === "object") {
    const pick = (key, fallback) =>
      Array.isArray(chartRaw[key]) ? chartRaw[key] : fallback;
    return {
      daily: {
        labels: pick("daily_labels", ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]),
        datasets: [
          makeDataset("Sales", pick("daily_sales", [0,0,0,0,0,0,0]), salesColor, salesGradient),
          makeDataset("Purchase", pick("daily_purchase", [0,0,0,0,0,0,0]), purchaseColor, purchaseGradient),
          makeDataset("Expenses", pick("daily_expenses", [0,0,0,0,0,0,0]), expenseColor, expenseGradient),
          makeDataset("Profit", pick("daily_profit", [0,0,0,0,0,0,0]), profitColor, profitGradient),
        ],
      },
      monthly: {
        labels: pick("monthly_labels", ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]),
        datasets: [
          makeDataset("Sales", pick("monthly_sales", [0,0,0,0,0,0,0,0,0,0,0,0]), salesColor, salesGradient),
          makeDataset("Purchase", pick("monthly_purchase", [0,0,0,0,0,0,0,0,0,0,0,0]), purchaseColor, purchaseGradient),
          makeDataset("Expenses", pick("monthly_expenses", [0,0,0,0,0,0,0,0,0,0,0,0]), expenseColor, expenseGradient),
          makeDataset("Profit", pick("monthly_profit", [0,0,0,0,0,0,0,0,0,0,0,0]), profitColor, profitGradient),
        ],
      },
      quarterly: {
        labels: pick("quarterly_labels", ["Q1","Q2","Q3","Q4"]),
        datasets: [
          makeDataset("Sales", pick("quarterly_sales", [0,0,0,0]), salesColor, salesGradient),
          makeDataset("Purchase", pick("quarterly_purchase", [0,0,0,0]), purchaseColor, purchaseGradient),
          makeDataset("Expenses", pick("quarterly_expenses", [0,0,0,0]), expenseColor, expenseGradient),
          makeDataset("Profit", pick("quarterly_profit", [0,0,0,0]), profitColor, profitGradient),
        ],
      },
      yearly: {
        labels: pick("yearly_labels", ["2022","2023","2024","2025"]),
        datasets: [
          makeDataset("Sales", pick("yearly_sales", [0,0,0,0]), salesColor, salesGradient),
          makeDataset("Purchase", pick("yearly_purchase", [0,0,0,0]), purchaseColor, purchaseGradient),
          makeDataset("Expenses", pick("yearly_expenses", [0,0,0,0]), expenseColor, expenseGradient),
          makeDataset("Profit", pick("yearly_profit", [0,0,0,0]), profitColor, profitGradient),
        ],
      },
    };
  }

  return {
    daily: {
      labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
      datasets: [
        makeDataset("Sales", [0,0,0,0,0,0,0], salesColor, salesGradient),
        makeDataset("Purchase", [0,0,0,0,0,0,0], purchaseColor, purchaseGradient),
        makeDataset("Expenses", [0,0,0,0,0,0,0], expenseColor, expenseGradient),
        makeDataset("Profit", [0,0,0,0,0,0,0], profitColor, profitGradient),
      ],
    },
    monthly: {
      labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
      datasets: [
        makeDataset("Sales", [0,0,0,0,0,0,0,0,0,0,0,0], salesColor, salesGradient),
        makeDataset("Purchase", [0,0,0,0,0,0,0,0,0,0,0,0], purchaseColor, purchaseGradient),
        makeDataset("Expenses", [0,0,0,0,0,0,0,0,0,0,0,0], expenseColor, expenseGradient),
        makeDataset("Profit", [0,0,0,0,0,0,0,0,0,0,0,0], profitColor, profitGradient),
      ],
    },
    quarterly: {
      labels: ["Q1","Q2","Q3","Q4"],
      datasets: [
        makeDataset("Sales", [0,0,0,0], salesColor, salesGradient),
        makeDataset("Purchase", [0,0,0,0], purchaseColor, purchaseGradient),
        makeDataset("Expenses", [0,0,0,0], expenseColor, expenseGradient),
        makeDataset("Profit", [0,0,0,0], profitColor, profitGradient),
      ],
    },
    yearly: {
      labels: ["2022","2023","2024","2025"],
      datasets: [
        makeDataset("Sales", [0,0,0,0], salesColor, salesGradient),
        makeDataset("Purchase", [0,0,0,0], purchaseColor, purchaseGradient),
        makeDataset("Expenses", [0,0,0,0], expenseColor, expenseGradient),
        makeDataset("Profit", [0,0,0,0], profitColor, profitGradient),
      ],
    },
  };
}, [chartRaw]);
const chartOptions = {
  responsive: true,
  datasets: {
    bar: {
      categoryPercentage: 0.5,
      barPercentage: 0.6
    }
  },

  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: {
        usePointStyle: true,
        pointStyle: "circle",
        boxWidth: 8,
        boxHeight: 8,
        padding: 30,
        color: "#334155",
        font: {
          size: 12,
          weight: "600"
        }
      }
    },
    
    datalabels: {
    anchor: "end",
    align: "top",
    color: "#475569",
    font: {
      size: 10,
      weight: "600"
    },
    formatter: (value) =>
      `${value} Cr`

  }

  },

  scales: {
    x: {
      stacked: false,
      grid: { display: false},
      ticks: {
        color: "#64748B",
        font: {
          weight: "600"
        }
      }
    },
    y: {
      beginAtZero: true,
      max: 25,
      grid: {
        color: "#EEF2F7",
        drawBorder: false
      },
      ticks: {
        stepSize: 5,
        color: "#94A3B8",
        callback: (value) =>
          `${value} Cr`
      }
    }
  }
};
  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>
      <div className="dashboard-page">
        {/* ================================
            TOP HEADER
        ================================= */}
        <div className="dashboard-header">
          {/* =========================================
              LEFT SECTION
          ========================================= */}
          <div className="header-left">
            <div className="company-top-row">
              {/* LOGO */}
              <div className="company-logo">
                TM
              </div>

              {/* COMPANY INFO */}
              <div className="company-info">
                {/* COMPANY NAME */}
                <h1 className="company-name">
                  {company.companyName}
                </h1>

                {/* COMPANY DETAILS */}
                <div className="company-details">
                  <div>
                    <span>
                      GSTIN: {company.gstin}
                    </span>
                  </div>
                  {/* <span className="dot">•</span> */}
                  <div className="dash-span">
                    <span>
                      Contact Person: {company.contactPerson}
                    </span>
                    <span>Contact No: {company.contactNo}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================
              RIGHT SECTION
          ========================================= */}
          <div className="header-right">
            {/* FY */}
            <div className="fy-box">
              <span className="fy-label">F.Y.</span>
              <span className="fy-value">
                {company.financialYear}
              </span>
            </div>

            {/* DATE */}
            <div className="date-box">
              <span className="fy-label">Current Date</span>
              <span className="fy-value">
                {new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })}
              </span>
            </div>

            {/* NOTIFICATION */}
            <div className="header-icon">
              <Bell />
            </div>

            {/* BUTTON */}
            <button className="shut-btn" onClick={shutCompany}>
              Shut Company
            </button>
          </div>
        </div>
        {/* ================================
            SUMMARY CARDS
        ================================= */}

        <div className="summary-grid">
          {summaryCards.map(
            (card, index) => (
            <div
              className="summary-card"
              key={index}
            >

              <div
                className="das-card-icon"
                style={{
                  background: card.bg
                }}
              >
                {card.icon}
              </div>
              <div>
                <h4>{card.title}</h4>
                <h2>{card.amount}</h2>
              </div>
            </div>
          ))}
        </div>

        {/* ================================
            GST + SIDE TABLES
        ================================= */}

        <div className="middle-grid">

          {/* GST TABLE */}
          <div className="gst-card">

            <div className="gst-top-header">

              <div className="section-title">
                GST Status
              </div>

              <div className="gst-filter">

                <span>
                  Month
                </span>

                <select className="gst-select">

                  <option>
                    Current Month
                  </option>

                  <option>
                    April
                  </option>

                  <option>
                    May
                  </option>

                  <option>
                    June
                  </option>

                </select>

              </div>

            </div>

            <table className="gst-table">

              <thead>

                <tr>

                  <th className="part-head">Particulars</th>

                  <th className="igst-head">
                    IGST
                  </th>

                  <th className="cgst-head">
                    CGST
                  </th>

                  <th className="sgst-head">
                    SGST
                  </th>

                  <th className="cess-head">
                    CESS
                  </th>

                  <th className="total-head">
                    Total GST
                  </th>

                </tr>

              </thead>

              <tbody>

                {/* NET OUTPUT */}

                <tr className="output-row">

                  <td className="row-title output-title">
                    Net Outputs
                  </td>

                  <td className="output-value">
                    {gstData.netOutput.igst}
                  </td>

                  <td className="output-value">
                    {gstData.netOutput.cgst}
                  </td>

                  <td className="output-value">
                    {gstData.netOutput.sgst}
                  </td>

                  <td className="output-value">
                    {gstData.netOutput.cess}
                  </td>

                  <td className="total-output">
                    {gstData.netOutput.total}
                  </td>

                </tr>

                {/* LESS INPUT */}

                <tr className="input-row">
                  <td className="row-title input-title">
                    Less Inputs
                  </td>
                  <td className="input-value">
                    {gstData.lessInput.igst}
                  </td>
                  <td className="input-value">
                    {gstData.lessInput.cgst}
                  </td>
                  <td className="input-value">
                    {gstData.lessInput.sgst}
                  </td>
                  <td className="input-value">
                    {gstData.lessInput.cess}
                  </td>
                  <td className="total-input">
                    {gstData.lessInput.total}
                  </td>
                </tr>
                {/* ITC PAYABLE */}
                <tr className="payable-row">
                  <td className="row-title payable-title">
                    <span className="itc-text">
                      ITC
                    </span>
                    <span className="slash-text">
                      /
                    </span>
                    <span className="payable-text">
                      Payable
                    </span>
                  </td>
                  <td className={parseFloat(gstData.itcPayable.igst) < 0 ? "negative-cell" : "positive-cell"}>
                    {gstData.itcPayable.igst}
                  </td>
                  <td className={parseFloat(gstData.itcPayable.cgst) < 0 ? "negative-cell" : "positive-cell"}>
                    {gstData.itcPayable.cgst}
                  </td>
                  <td className={parseFloat(gstData.itcPayable.sgst) < 0 ? "negative-cell" : "positive-cell"}>
                    {gstData.itcPayable.sgst}
                  </td>
                  <td className={parseFloat(gstData.itcPayable.cess) < 0 ? "negative-cell" : "positive-cell"}>
                    {gstData.itcPayable.cess}
                  </td>
                  <td className={parseFloat(gstData.itcPayable.total) < 0 ? "negative-total" : "positive-cell"}>
                    {gstData.itcPayable.total}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* RIGHT SIDE */}

          <div className="side-cards">

            <div className="mini-card green">
              <div className="card-icon">
                <FaTruck />
              </div>

              <div className="card-content">
                <h4>E-Way Bill Status</h4>
                <div className="card-status-row">
                  <span >Generated </span>
                   <span className="separator">:</span>
                  <span className="value">{ewbStatus.generated}</span>
                </div>
                <div className="card-status-row">
                  <span >Sales </span>
                   <span className="separator">:</span>
                  <span className="value">{ewbStatus.sales}</span>
                </div>
              </div>
            </div>

            <div className="mini-card blue">
              <div className="card-icon">
                <FaFileInvoice />
              </div>

              <div className="card-content">
                <h4>E-Invoice Status</h4>
                <div className="status-row">
                  <span>Generated</span>
                  <span className="separator">:</span>
                  <span className="value">{einvoiceStatus.generated}</span>
                </div>

                <div className="status-row">
                  <span>Sales</span>
                  <span className="separator">:</span>
                  <span className="value">{einvoiceStatus.sales}</span>
                </div>

                <div className="status-row">
                  <span>Pending </span>
                  <span className="separator">:</span>
                  <span className="pending-value">{einvoiceStatus.pending}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ================================
            CHART + PENDING TABLES
        ================================= */}

        <div className="chart-grid">

          {/* CHART */}
          <div className="chart-card">
            {/* HEADER */}
            <div className="chart-header">
              <h3>
                Business Graph
              </h3>
              <select
                value={view}
                onChange={(e)=>
                  setView(e.target.value)
                }
                className="graph-select"
              >

                <option value="daily">
                  Daily
                </option>

                <option value="monthly">
                  Month Wise
                </option>

                <option value="quarterly">
                  Quarter Wise
                </option>

                <option value="yearly">
                  Year Wise
                </option>
              </select>
            </div>
            {/* CHART */}
            <div className="chart-wrapper">
              {/* <Line
                data={chartData[view]}
                options={chartOptions}
              /> */}
              <Bar
                data={chartData[view]}
                options={chartOptions}
              />
            </div>
            {/* TREND STATS */}
            <div className="trend-stats">
              {/* CARD 1 */}
              <div className="trend-box">
                <div className="trend-icon blue">
                  ↑
                </div>
                <div className="trend-content">
                  <p>
                    Highest Sales
                  </p>
                  <h4>
                    ₹{trendStats.highestSales}
                  </h4>
                  <span>
                    {trendStats.highestSalesMonth ? `in ${trendStats.highestSalesMonth}` : "—"}
                  </span>
                </div>
              </div>
              {/* CARD 2 */}
              <div className="trend-box">
                <div className="trend-icon gray">
                  ↓
                </div>
                <div className="trend-content">
                  <p>
                    Lowest Sales
                  </p>
                  <h4>
                    ₹{trendStats.lowestSales}
                  </h4>
                  <span>
                    {trendStats.lowestSalesMonth ? `in ${trendStats.lowestSalesMonth}` : "—"}
                  </span>
                </div>
              </div>
              {/* CARD 3 */}
              <div className="trend-box">
                <div className="trend-icon orange">
                  ⟳
                </div>
                <div className="trend-content">
                  <p>
                    Avg. Monthly Sales
                  </p>
                  <h4>
                    ₹{trendStats.avgMonthlySales}
                  </h4>
                  <span>
                    12 Months Avg.
                  </span>
                </div>
              </div>
              {/* CARD 4 */}
              <div className="trend-box">
                <div className="trend-icon green">
                  %
                </div>
                <div className="trend-content">
                  <p>
                    Avg. Profit Margin
                  </p>
                  <h4>
                    {trendStats.avgProfitMargin}
                  </h4>
                  <span>
                    12 Months Avg.
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* SIDE TABLES */}

          <div className="pending-section">

            <div className="pending-card">

              <div className="section-title">
                Pending Receipts
              </div>

              <table>

                <thead>

                  <tr>
                    <th>Party</th>
                    <th>Amount</th>
                    <th>Due Days</th>
                    <th>Reminders</th>
                    <th>Action</th>
                  </tr>

                </thead>

                <tbody>

                  {pendingReceipts.length > 0 ? pendingReceipts.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.party || "—"}</td>
                      <td>{item.amount || "—"}</td>
                      <td>{item.due_days || "—"}</td>
                      <td>
                        <div className="whatsapp-icon">
                          <i className="ri-whatsapp-line"></i>
                        </div>
                      </td>
                      <td>
                        <span className="voucher receipt">
                          Receipt Voucher
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", color: "#94a3b8" }}>No pending receipts</td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

            <div className="pending-card">

              <div className="section-title">
                Pending Payments
              </div>

              <table>

                <thead>

                  <tr>
                    <th>Party</th>
                    <th>Amount</th>
                    <th>Due Days</th>
                    <th>Action</th>
                  </tr>

                </thead>

                <tbody>

                  {pendingPayments.length > 0 ? pendingPayments.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.party || "—"}</td>
                      <td>{item.amount || "—"}</td>
                      <td>{item.due_days || "—"}</td>
                       <td>
                        <span className="voucher payment">
                          Payment Voucher
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", color: "#94a3b8" }}>No pending payments</td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

        {/* ================================
            LAST ENTRIES
        ================================= */}

        <div className="last-entry-card">

          <div className="section-title">
            Last Entries Of The Day
          </div>

          <table>

            <thead>

              <tr>
                <th>Date</th>
                <th>Party</th>
                <th>Voucher Type</th>
                <th>Voucher No</th>
                <th>Amount cr</th>
                <th>Amount dr</th>
              </tr>

            </thead>

            <tbody>

              {recentEntries.length > 0 ? recentEntries.map((entry, i) => (
                <tr key={i}>
                  <td>{entry.date}</td>
                  <td>{entry.party}</td>
                  <td>{entry.voucherType}</td>
                  <td>{entry.voucherNo}</td>
                  <td>{entry.amountCr}</td>
                  <td>{entry.amountDr}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", color: "#94a3b8" }}>No entries found</td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

}
