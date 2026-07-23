import { useOutletContext } from "react-router-dom";
import { FaInfoCircle, FaGithub, FaEnvelope, FaGlobe } from "react-icons/fa";

export default function About() {
  const { collapsed } = useOutletContext();

  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "24px" }}>
        {/* APP INFO CARD */}
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "#fff",
              fontSize: "32px",
              fontWeight: "bold",
            }}
          >
            SG
          </div>

          <h1 style={{ margin: "0 0 4px", fontSize: "24px", color: "#1f2937" }}>
            SmartGST
          </h1>
          <p style={{ margin: "0 0 16px", color: "#6b7280", fontSize: "14px" }}>
            GST Accounting & Billing Software
          </p>

          <div
            style={{
              display: "inline-block",
              padding: "4px 16px",
              borderRadius: "20px",
              background: "#d1fae5",
              color: "#065f46",
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "24px",
            }}
          >
            Version 1.0.0
          </div>

          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              paddingTop: "20px",
              marginTop: "8px",
              textAlign: "left",
            }}
          >
            <h3 style={{ fontSize: "16px", color: "#374151", marginBottom: "12px" }}>
              Features
            </h3>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              {[
                "Sales Invoices",
                "Purchase Bills",
                "GST Returns (GSTR-1/2/3B)",
                "Journal & Ledger",
                "Party Management",
                "Items & Services",
                "Financial Reports",
                "Bank Reconciliation",
                "Delivery Challans",
                "Sale & Purchase Orders",
                "Credit & Debit Notes",
                "E-Way Bill Support",
              ].map((feature) => (
                <li
                  key={feature}
                  style={{
                    padding: "6px 10px",
                    background: "#f9fafb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    color: "#374151",
                  }}
                >
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              paddingTop: "20px",
              marginTop: "20px",
              textAlign: "left",
            }}
          >
            <h3 style={{ fontSize: "16px", color: "#374151", marginBottom: "12px" }}>
              About
            </h3>
            <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.6", margin: 0 }}>
              SmartGST is a comprehensive GST-compliant accounting solution designed for
              small and medium businesses in India. It handles invoicing, purchase management,
              inventory, tax calculations, and generates GST-ready reports for seamless
              compliance.
            </p>
          </div>

          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              paddingTop: "20px",
              marginTop: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#6b7280" }}>
                <FaGlobe /> smartgst.com
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#6b7280" }}>
                <FaEnvelope /> support@smartgst.com
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#6b7280" }}>
                <FaGithub /> smartgst
              </div>
            </div>
          </div>

          <p style={{ marginTop: "24px", fontSize: "12px", color: "#9ca3af" }}>
            &copy; 2025 SmartGST. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
