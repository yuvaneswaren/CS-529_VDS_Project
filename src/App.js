import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import MainPage from "./pages/MainPage";
import SummaryPage from "./pages/SummaryPage";
import ComparePage from "./pages/ComparePage";

function RouteRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isHome = location.pathname === "/";
    if (!isHome) navigate("/", { replace: true });
  }, []);

  return null;
}

function App() {
  return (
    <Router>
      <RouteRedirect />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/summary" element={<SummaryPage />} />
        <Route path="/compare" element={<ComparePage />} />
      </Routes>
    </Router>
  );
}

export default App;
