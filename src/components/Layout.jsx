import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../styles/dashboard.css";
import "../styles/style.css";

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const tenantId = localStorage.getItem("tenant_id");
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login", { replace: true });
    } else if (!tenantId && location.pathname !== "/select-company") {
      navigate("/select-company", { replace: true });
    }
  }, [navigate, location.pathname]);

  return (
    <>
      <Sidebar collapsed={collapsed} />
      <Topbar
        collapsed={collapsed}
        toggleSidebar={() => setCollapsed(!collapsed)}
      />
      <Outlet context={{ collapsed }} />
    </>
  );
}
