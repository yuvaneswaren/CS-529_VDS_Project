import React, { useState } from "react";
import Header from "../components/Header";
import NavBar from "../components/NavBar";
import PageWrapper from "../components/PageWrapper";
import "../layout.css";

function SummaryPage() {
  const [submittedEin, setSubmittedEin] = useState("");

  const handleClearSearch = () => {
    setSubmittedEin("");
  };

  const handleSearchSubmit = (value) => {
    setSubmittedEin(value);
  };

  return (
    <PageWrapper>
      <div className="page-container">
        <Header />
        {/* Pass both handlers to NavBar */}
        <NavBar onSearch={handleSearchSubmit} onClear={handleClearSearch} />

        {!submittedEin ? (
          <div className="summary-placeholder-message">
            <p>
              Type the EIN in the search bar to view the organization’s summary.
              You will see key metrics, charts, and company details after you
              enter a valid EIN and press Enter.
            </p>
          </div>
        ) : (
          <div className="summary-layout">
            <div className="summary-left">
              <div className="d3-placeholder">Horizon Chart (D3)</div>
              <div className="d3-placeholder">Stacked Area Chart (D3)</div>
              <div className="d3-placeholder">Violin Chart (D3)</div>
              <div className="d3-placeholder">Area Chart (D3)</div>
            </div>

            <div className="summary-right">
              <div className="company-header">Company Details</div>
              <div className="company-info">
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

export default SummaryPage;
