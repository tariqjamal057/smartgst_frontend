import { useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";

export default function Order() {
  const { collapsed } = useOutletContext();
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/SaleOrder");
  }, [navigate]);

  return (
    <div className={`main ${collapsed ? "collapsed" : ""}`}>
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Redirecting to Sale Orders...</h2>
        <p>If you are not redirected automatically, click below:</p>
        <button
          onClick={() => navigate("/SaleOrder")}
          style={{
            padding: "10px 24px",
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            marginTop: "12px",
          }}
        >
          Go to Sale Orders
        </button>
      </div>
    </div>
  );
}
