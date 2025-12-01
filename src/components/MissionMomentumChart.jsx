// src/components/MissionMomentumChart.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";
import * as d3 from "d3";
import Papa from "papaparse";
import OrganizationPopup from "./OrganizationPopup";

const DEFAULT_MISSION = "E";         // default letter if nothing selected
const DEFAULT_CSV_URL = "/il_nonprofits_orgs.csv";

// Helper function to build organization data for popup from CSV row
function buildOrganizationDataForPopup(orgId, orgName, ntee_letter, city, rows) {
  // Find the full row data for this organization
  const orgRow = rows.find(row => (row.ein || row.EIN) === orgId);
  if (!orgRow) {
    console.log("Could not find org row for:", orgId);
    return null;
  }

  const years = [];
  
  for (let k = 1; k <= 5; k++) {
    const taxYear = orgRow[`yr${k}_tax_year`];
    const totalRevenue = orgRow[`yr${k}_totrevenue`];
    const totalExpenses = orgRow[`yr${k}_totfuncexpns`];
    const contributions = orgRow[`yr${k}_totcntrbs`];
    const programRevenue = orgRow[`yr${k}_prgmservrev`];
    const investmentIncome = orgRow[`yr${k}_invstmntinc`] || orgRow[`yr${k}_othrinvstinc`] || 0;
    const surplus = orgRow[`yr${k}_rev_minus_exp`];
    const marginPct = orgRow[`yr${k}_margin_pct`];
    
    // Asset-related fields for Asset Utilization Stream chart
    const totalAssets = orgRow[`yr${k}_totassetsend`] || 0;
    const totalLiabilities = orgRow[`yr${k}_totliabend`] || 0;
    const netAssets = orgRow[`yr${k}_totnetassetsend`] || 0;
    
    if (taxYear && totalRevenue) {
      years.push({
        year: taxYear,
        totalRevenue: totalRevenue || 0,
        totalExpenses: totalExpenses || 0,
        contributions: contributions || 0,
        programRevenue: programRevenue || 0,
        investmentIncome: investmentIncome || 0,
        surplus: surplus || 0,
        marginPct: marginPct || 0,
        // Asset fields
        totalAssets: totalAssets,
        totalLiabilities: totalLiabilities,
        netAssets: netAssets
      });
    }
  }

  // Sort years descending (most recent first)
  years.sort((a, b) => b.year - a.year);

  console.log("Built popup data:", { orgId, orgName, years: years.length });

  return {
    ein: orgId,
    name: orgName,
    ntee_letter: ntee_letter,
    city: city || orgRow.city || orgRow.CITY || "Chicago",
    years: years
  };
}

function buildTrajectories(rows) {
  const byOrg = new Map();
  let globalMinYear = Infinity;
  let globalMaxYear = -Infinity;

  rows.forEach((row) => {
    const orgId = row.ein || row.EIN;
    if (!orgId) return;

    const missionRaw = row.ntee_letter || row.NTEE_LETTER || "";
    const orgName = row.name || row.NAME || row.orgname || row.ORGNAME || "";
    const city = row.city || row.CITY || "";

    const points = [];
    for (let k = 1; k <= 5; k += 1) {
      const logRev = row[`yr${k}_log_revenue`];
      const margin = row[`yr${k}_margin_pct`];
      const taxYear = row[`yr${k}_tax_year`];

      if (
        !Number.isFinite(logRev) ||
        !Number.isFinite(margin) ||
        !Number.isFinite(taxYear)
      ) {
        continue;
      }

      globalMinYear = Math.min(globalMinYear, taxYear);
      globalMaxYear = Math.max(globalMaxYear, taxYear);

      points.push({
        tax_year: taxYear,
        log_revenue: logRev,
        margin_pct: margin,
      });
    }

    if (!points.length) return;

    points.sort((a, b) => a.tax_year - b.tax_year);

    byOrg.set(orgId, {
      orgId,
      orgName,
      city,
      ntee_letter: String(missionRaw || "U").trim().toUpperCase(),
      points,
    });
  });

  const trajectories = Array.from(byOrg.values()).filter(
    (d) => d.points.length >= 2
  );

  if (globalMinYear === Infinity || globalMaxYear === -Infinity) {
    return { trajectories, minYear: null, maxYear: null };
  }

  return {
    trajectories,
    minYear: globalMinYear,
    maxYear: globalMaxYear,
  };
}

const MissionMomentumChart = ({
  csvUrl = DEFAULT_CSV_URL,
  selectedMission,
}) => {
  const theme = useTheme();
  const themeMode = theme.palette.mode;
  const colors = useMemo(() => tokens(themeMode), [themeMode]);

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [trajectories, setTrajectories] = useState([]);
  const [firstYear, setFirstYear] = useState(null);
  const [lastYear, setLastYear] = useState(null);

  const [hover, setHover] = useState(null);
  
  // State for popup
  const [selectedOrg, setSelectedOrg] = useState(null);

  const containerRef = useRef(null);
  
  // Use ref to store rawRows for access in D3 callbacks
  const rawRowsRef = useRef([]);

  const missionLetter =
    (selectedMission && String(selectedMission).toUpperCase()) ||
    DEFAULT_MISSION;

  // Load CSV and preprocess once
  useEffect(() => {
    setStatus("loading");
    setError(null);

    Papa.parse(csvUrl, {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        try {
          const rows = results.data || [];
          rawRowsRef.current = rows; // Store in ref for D3 callbacks
          
          const { trajectories: traj, minYear, maxYear } =
            buildTrajectories(rows);

          setTrajectories(traj);
          setFirstYear(minYear);
          setLastYear(maxYear);
          setStatus("ready");
        } catch (e) {
          console.error(e);
          setError("Problem while processing momentum data.");
          setStatus("error");
        }
      },
      error: (err) => {
        console.error(err);
        setError("Problem while loading momentum CSV.");
        setStatus("error");
      },
    });
  }, [csvUrl]);

  // Close popup handler
  const handleClosePopup = useCallback(() => {
    setSelectedOrg(null);
  }, []);

  // Main draw effect, rerun when data or missionLetter changes
  useEffect(() => {
    if (status !== "ready") return;
    const host = containerRef.current;
    if (!host) return;

    // Reset hover state when mission changes
    setHover(null);

    const svgWidth = host.clientWidth || 800;
    const svgHeight = host.clientHeight || 360;

    const margin = { top: 45, right: 20, bottom: 55, left: 65 };
    const innerWidth = svgWidth - margin.left - margin.right;
    const innerHeight = svgHeight - margin.top - margin.bottom;

    const svg = d3
      .select(host)
      .selectAll("svg")
      .data([null])
      .join("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

    svg.selectAll("*").remove();

    const cohort =
      trajectories.filter(
        (d) => d.ntee_letter === missionLetter
      ) || [];

    const data = cohort.length > 0 ? cohort : trajectories;

    if (!data.length) {
      svg
        .append("text")
        .attr("x", svgWidth / 2)
        .attr("y", svgHeight / 2)
        .attr("text-anchor", "middle")
        .attr("fill", colors.grey[100])
        .attr("font-size", 14)
        .text("No data available for this mission.");
      return;
    }

    // Collect all margin values from the current cohort
    const allMargins = [];
    data.forEach((org) => {
      org.points.forEach((p) => {
        if (Number.isFinite(p.margin_pct)) allMargins.push(p.margin_pct);
      });
    });

    // Compute median and MAD for robust outlier detection
    const medianMargin = d3.median(allMargins);
    const mad = d3.median(allMargins.map(v => Math.abs(v - medianMargin)));
    
    // Define tight band around median using MAD
    const k = 4;
    const lowerMargin = medianMargin - k * mad;
    const upperMargin = medianMargin + k * mad;

    // Filter out organizations with any point outside the band
    const filteredData = data.filter((org) => {
      return org.points.every((p) => {
        return p.margin_pct >= lowerMargin && p.margin_pct <= upperMargin;
      });
    });

    // Fall back to original data if filtering removes everything
    const finalData = filteredData.length > 0 ? filteredData : data;

    const allRevenues = [];
    const finalMargins = [];

    finalData.forEach((org) => {
      org.points.forEach((p) => {
        if (Number.isFinite(p.log_revenue)) allRevenues.push(p.log_revenue);
        if (Number.isFinite(p.margin_pct)) finalMargins.push(p.margin_pct);
      });
    });

    // Add padding to the revenue domain for better spread
    const revExtent = d3.extent(allRevenues);
    const revPadding = (revExtent[1] - revExtent[0]) * 0.05;

    const x = d3
      .scaleLinear()
      .domain([revExtent[0] - revPadding, revExtent[1] + revPadding])
      .nice()
      .range([margin.left, margin.left + innerWidth]);

    // Use filtered margins for y scale domain
    const margExtent = d3.extent(finalMargins);
    const margPadding = (margExtent[1] - margExtent[0]) * 0.1;

    const y = d3
      .scaleLinear()
      .domain([margExtent[0] - margPadding, margExtent[1] + margPadding])
      .nice()
      .range([margin.top + innerHeight, margin.top]);

    const startColor = colors.greenAccent[500];
    const endColor = colors.redAccent[400];

    const defs = svg.append("defs");

    defs
      .append("marker")
      .attr("id", "mm-arrow")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("refX", 5)
      .attr("refY", 2.5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,0 L0,5 L5,2.5 Z")
      .attr("fill", endColor);

    const gradientStrength = d3
      .scaleLinear()
      .domain(d3.extent(finalData.map((d) => d.points.length)))
      .range([0.5, 1]);

    finalData.forEach((org, idx) => {
      const gradId = `mm-grad-${idx}`;
      const first = org.points[0];
      const last = org.points[org.points.length - 1];

      const g = defs
        .append("linearGradient")
        .attr("id", gradId)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", x(first.log_revenue))
        .attr("y1", y(first.margin_pct))
        .attr("x2", x(last.log_revenue))
        .attr("y2", y(last.margin_pct));

      g.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", startColor)
        .attr("stop-opacity", 0.5);

      g.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", endColor)
        .attr("stop-opacity", gradientStrength(org.points.length));

      org.gradientId = gradId;
    });

    // Gridlines - more visible
    const grid = svg
      .append("g")
      .attr("stroke", colors.grey[600])
      .attr("stroke-opacity", 0.5)
      .attr("stroke-dasharray", "3 4");

    grid
      .append("g")
      .selectAll("line")
      .data(x.ticks(6))
      .join("line")
      .attr("x1", (d) => x(d))
      .attr("x2", (d) => x(d))
      .attr("y1", margin.top)
      .attr("y2", margin.top + innerHeight);

    grid
      .append("g")
      .selectAll("line")
      .data(y.ticks(6))
      .join("line")
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d))
      .attr("x1", margin.left)
      .attr("x2", margin.left + innerWidth);

    const xAxis = d3
      .axisBottom(x)
      .ticks(6)
      .tickFormat((d) => d.toFixed(1));

    const yAxis = d3
      .axisLeft(y)
      .ticks(6)
      .tickFormat((d) => `${(d * 100).toFixed(1)}%`);

    svg
      .append("g")
      .attr("transform", `translate(0,${margin.top + innerHeight})`)
      .call(xAxis)
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .append("text")
          .attr("x", margin.left + innerWidth)
          .attr("y", 38)
          .attr("fill", colors.grey[100])
          .attr("text-anchor", "end")
          .attr("font-size", 11)
          .text("Log10 of total revenue (size)")
      );

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .call((g) => g.select(".domain").remove())
      .call((g) => {
        // Vertical y-axis label
        g.append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -(margin.top + innerHeight / 2))
          .attr("y", -45)
          .attr("fill", colors.grey[100])
          .attr("text-anchor", "middle")
          .attr("font-size", 11)
          .text("Operating margin");
      });

    const plot = svg.append("g");

    const arcPath = (p0, p1) => {
      const sx = x(p0.log_revenue);
      const sy = y(p0.margin_pct);
      const tx = x(p1.log_revenue);
      const ty = y(p1.margin_pct);

      const mx = (sx + tx) / 2;
      const my = sy - Math.abs(tx - sx) * 0.22;

      return `M${sx},${sy} Q${mx},${my} ${tx},${ty}`;
    };

    // Arcs, with event handlers for tooltip and highlighting
    const arcs = plot
      .selectAll("path.mm-arc")
      .data(finalData)
      .join("path")
      .attr("class", "mm-arc")
      .attr("fill", "none")
      .attr("stroke-width", 1.7)
      .attr("stroke", (d) => `url(#${d.gradientId})`)
      .attr("marker-end", "url(#mm-arrow)")
      .attr("d", (d) => {
        const first = d.points[0];
        const last = d.points[d.points.length - 1];
        return arcPath(first, last);
      })
      .attr("opacity", 0.95);

    // Starting dots - FIRST define, then add event handlers
    const dots = plot
      .selectAll("circle.mm-start")
      .data(finalData)
      .join("circle")
      .attr("class", "mm-start")
      .attr("r", 3) // Dot size
      .attr("fill", colors.grey[200])
      .attr("stroke", "#111827")
      .attr("stroke-width", 0.8)
      .attr("cx", (d) => x(d.points[0].log_revenue))
      .attr("cy", (d) => y(d.points[0].margin_pct))
      .attr("opacity", 1)
      .style("cursor", "pointer"); // Add pointer cursor to indicate clickable

    // Add arc event handlers
    arcs
      .on("mouseenter", (event, d) => {
        // Update opacity for all arcs and dots
        arcs.attr("opacity", (other) => other.orgId === d.orgId ? 0.95 : 0.15);
        dots.attr("opacity", (other) => other.orgId === d.orgId ? 1 : 0.15);
        
        const first = d.points[0];
        const last = d.points[d.points.length - 1];
        setHover({
          x: event.clientX,
          y: event.clientY,
          org: d.orgName || d.orgId,
          startRev: first.log_revenue,
          endRev: last.log_revenue,
          startMargin: first.margin_pct,
          endMargin: last.margin_pct,
        });
      })
      .on("mousemove", (event, d) => {
        const first = d.points[0];
        const last = d.points[d.points.length - 1];
        setHover({
          x: event.clientX,
          y: event.clientY,
          org: d.orgName || d.orgId,
          startRev: first.log_revenue,
          endRev: last.log_revenue,
          startMargin: first.margin_pct,
          endMargin: last.margin_pct,
        });
      })
      .on("mouseleave", () => {
        setHover(null);
        
        // Reset all to normal opacity
        arcs.attr("opacity", 0.95);
        dots.attr("opacity", 1);
      });

    // Add dot event handlers - including CLICK for popup
    dots
      .on("mouseenter", (event, d) => {
        // Update opacity for all arcs and dots
        arcs.attr("opacity", (other) => other.orgId === d.orgId ? 0.95 : 0.15);
        dots.attr("opacity", (other) => other.orgId === d.orgId ? 1 : 0.15);
        
        // Enlarge the hovered dot
        d3.select(event.currentTarget).attr("r", 5);
        
        const first = d.points[0];
        const last = d.points[d.points.length - 1];
        setHover({
          x: event.clientX,
          y: event.clientY,
          org: d.orgName || d.orgId,
          startRev: first.log_revenue,
          endRev: last.log_revenue,
          startMargin: first.margin_pct,
          endMargin: last.margin_pct,
        });
      })
      .on("mousemove", (event, d) => {
        const first = d.points[0];
        const last = d.points[d.points.length - 1];
        setHover({
          x: event.clientX,
          y: event.clientY,
          org: d.orgName || d.orgId,
          startRev: first.log_revenue,
          endRev: last.log_revenue,
          startMargin: first.margin_pct,
          endMargin: last.margin_pct,
        });
      })
      .on("mouseleave", (event) => {
        setHover(null);
        
        // Reset dot size
        d3.select(event.currentTarget).attr("r", 3);
        
        // Reset all to normal opacity
        arcs.attr("opacity", 0.95);
        dots.attr("opacity", 1);
      })
      // CLICK HANDLER FOR POPUP - Use rawRowsRef.current to get latest data
      .on("click", (event, d) => {
        event.stopPropagation();
        console.log("Dot clicked:", d.orgId, d.orgName);
        
        // Build popup data using ref (always has latest data)
        const popupData = buildOrganizationDataForPopup(
          d.orgId,
          d.orgName,
          d.ntee_letter,
          d.city,
          rawRowsRef.current
        );
        
        console.log("Popup data:", popupData);
        
        if (popupData && popupData.years && popupData.years.length > 0) {
          setSelectedOrg(popupData);
        } else {
          console.warn("No valid popup data for organization:", d.orgId);
        }
      });
      
  }, [status, trajectories, missionLetter, colors, firstYear, lastYear]);

  if (status === "loading") {
    return (
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", minHeight: 320 }}
      >
        <span style={{ color: colors.grey[100], padding: 8 }}>
          Loading momentum chart...
        </span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", minHeight: 320 }}
      >
        <span style={{ color: theme.palette.error.main, padding: 8 }}>
          {error}
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: 320,
          position: "relative",
        }}
      >
        {hover && (
          <div
            style={{
              position: "fixed",
              left: hover.x + 12,
              top: hover.y + 12,
              zIndex: 10,
              background: colors.primary[500],
              color: colors.grey[100],
              border: `1px solid ${colors.grey[400]}`,
              borderRadius: 4,
              padding: "6px 10px",
              fontSize: 11,
              boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
              pointerEvents: "none",
              maxWidth: 260,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 2 }}>
              {hover.org}
            </div>
            <div>
              Log revenue: {hover.startRev.toFixed(2)} →{" "}
              {hover.endRev.toFixed(2)}
            </div>
            <div>
              Margin: {(hover.startMargin * 100).toFixed(1)}% →{" "}
              {(hover.endMargin * 100).toFixed(1)}%
            </div>
            <div style={{ marginTop: 4, fontSize: 10, color: colors.greenAccent[400], fontStyle: 'italic' }}>

            </div>
          </div>
        )}
      </div>
      
      {/* Organization Popup - renders when selectedOrg is set */}
      {selectedOrg && (
        <OrganizationPopup
          organizationData={selectedOrg}
          onClose={handleClosePopup}
        />
      )}
    </>
  );
};

export default MissionMomentumChart;