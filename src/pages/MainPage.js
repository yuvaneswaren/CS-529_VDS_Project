import React, { useEffect } from "react";
import Header from "../components/Header";
import NavBar from "../components/NavBar";
import PageWrapper from "../components/PageWrapper";
import "../layout.css";

function MainPage() {
  useEffect(() => {
    document.body.setAttribute("data-page", "home");
    return () => document.body.removeAttribute("data-page");
  }, []);

  return (
    <PageWrapper>
      <div className="page-container">
        <Header />
        <NavBar />

        <div className="main-content no-filter">
          <div className="top-section single-column">
            <div className="treemap-container full-page">
              <div className="treemap-placeholder">
                Tree Map Placeholder (D3 Zoomable)
              </div>
            </div>
          </div>

          <div className="bottom-section full-row">
            <div className="d3-placeholder">Heatmap Placeholder (D3)</div>
            <div className="d3-placeholder">Sankey Diagram Placeholder (D3)</div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default MainPage;
