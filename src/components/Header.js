import React from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  return (
    <div style={{ background: "#eee", padding: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h3 style={{ margin: 0 }}>Leadership Levers in Nonprofit Governance: Peer Benchmarks for Chicago Using Form 990 Data (Placeholder, Demo)</h3>

      <div style={{ display: "flex", gap: "15px" }}>
        <button onClick={() => navigate("/")}>Summary View</button>
        <button onClick={() => navigate("/compare")}>Comparative View</button>
      </div>
    </div>
  );
};

export default Header;
