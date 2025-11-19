import React, { useState } from "react";
import Header from "../components/Header";
import NavBar from "../components/NavBar";
import PageWrapper from "../components/PageWrapper";
import "../layout.css";

function ComparePage() {
  const [submittedEins, setSubmittedEins] = useState([]);

  const handleSearch = (input) => {
    const einList = input
      .split(",")
      .map((ein) => ein.trim())
      .filter((ein) => ein !== "");
    setSubmittedEins(einList);
  };

  const handleClear = () => {
    setSubmittedEins([]);
  };

  return (
    <PageWrapper>
      <div className="page-container">
        <Header />
        <NavBar onSearch={handleSearch} onClear={handleClear} />

        {submittedEins.length === 0 ? (
          <div className="summary-placeholder-message">
            <p>
              Type the EINs in the search bar with a comma for separation to view
              the organization’s comparison details. You will see key metrics and
              charts for multiple organizations after you enter valid EINs.
            </p>
          </div>
        ) : (
          <div className="compare-content no-filter">
            <div className="compare-left">
              <div className="d3-placeholder">Parallel Sets (D3)</div>
              <div className="d3-placeholder">Beeswarm Chart (D3)</div>
              <div className="d3-placeholder">Chord Chart (D3)</div>
              <div className="d3-placeholder">Stacked Bar Chart (D3)</div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

export default ComparePage;
