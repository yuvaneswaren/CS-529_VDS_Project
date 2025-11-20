import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import NavBar from "../components/NavBar";
import PageWrapper from "../components/PageWrapper";
import "../layout.css";

const API_BASE_URL = "https://api-ashen-eight-15.vercel.app/nonprofit/";

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

  const fetchOrganizationData = async (ein) => {
    const response = await fetch(`${API_BASE_URL}${ein}`);
    const data = await response.json();
    return {
      ein: data.metadata.raw_ein,
      name: data.metadata.name,
      financials: data.financials,
    };
  };

  const renderCharts = async (orgList) => {
    const slots = document.querySelectorAll(".d3-placeholder");

    const [LineChartModule, StackedBarChartModule, ArcDiagramModule] = 
      await Promise.all([
        import("../charts/LineChart"),
        import("../charts/StackedBarChart"),
        import("../charts/ArcDiagram"),
      ]);

    LineChartModule.drawLineChart(orgList, slots[0]);
    StackedBarChartModule.drawStackedBarChart(orgList, slots[1]);
    ArcDiagramModule.drawArcDiagram(orgList, slots[2]);
  };

  useEffect(() => {
    if (submittedEins.length === 0) return;

    const fetchDataAndRenderCharts = async () => {
      try {
        const orgList = await Promise.all(
          submittedEins.map(fetchOrganizationData)
        );
        await renderCharts(orgList);
      } catch (error) {
        console.error("Error fetching organization data:", error);
      }
    };

    fetchDataAndRenderCharts();
  }, [submittedEins]);

  return (
    <PageWrapper>
      <div className="page-container">
        <Header />
        <NavBar onSearch={handleSearch} onClear={handleClear} />

        {submittedEins.length === 0 ? (
          <div className="summary-placeholder-message">
            <p>
              Type the EINs in the search bar with a comma for separation to
              view the organization's comparison details. You will see key
              metrics and charts for multiple organizations after you enter
              valid EINs.
            </p>
          </div>
        ) : (
          <div className="compare-content no-filter">
            <div className="compare-left">
              <div className="d3-placeholder" id="slot1"></div>
              <div className="d3-placeholder" id="slot2"></div>
              <div className="d3-placeholder" id="slot3"></div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

export default ComparePage;