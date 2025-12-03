// src/components/MissionMomentumChart.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";
import * as d3 from "d3";
import Papa from "papaparse";
import OrganizationPopup from "./OrganizationPopup";

const DEFAULT_MISSION = "E";
const DEFAULT_CSV_URL = "/il_nonprofits_orgs.csv";

// Performance color constants
const IMPROVED_COLOR = "#4CAF50"; // Green for margin improvement
const DECLINED_COLOR = "#EF5350"; // Red for margin decline

function buildOrganizationDataForPopup(orgId, orgName, ntee_letter, city, rows) {
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
        totalAssets: totalAssets,
        totalLiabilities: totalLiabilities,
        netAssets: netAssets
      });
    }
  }

  years.sort((a, b) => b.year - a.year);

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
  highlightedEIN = null,
  onClearHighlight = null,
  onEINMissionDetected = null
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
  const [pinnedTooltip, setPinnedTooltip] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);
  
  // Zoom state
  const [zoomTransform, setZoomTransform] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Removed: magnifierData state - no longer using small magnifier tooltip

  const containerRef = useRef(null);
  const rawRowsRef = useRef([]);
  const zoomBehaviorRef = useRef(null);

  const missionLetter =
    (selectedMission && String(selectedMission).toUpperCase()) ||
    DEFAULT_MISSION;

  // Load CSV
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
          rawRowsRef.current = rows;
          
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

  const handleClosePopup = useCallback(() => {
    setSelectedOrg(null);
  }, []);

  // Store the organization's position for tooltip placement
  const highlightedOrgPositionRef = useRef(null);

  // FIX #1: Improved function to find organization by EIN or name
  const findOrganization = useCallback((query, trajList) => {
    if (!query || !trajList.length) return null;
    
    const normalizedQuery = String(query).trim().toLowerCase();
    
    // First try exact EIN match (convert both to string for comparison)
    let org = trajList.find(t => 
      String(t.orgId).trim().toLowerCase() === normalizedQuery
    );
    
    // If not found, try partial name match
    if (!org) {
      org = trajList.find(t => 
        t.orgName && t.orgName.toLowerCase().includes(normalizedQuery)
      );
    }
    
    return org;
  }, []);

  // When highlightedEIN changes, find and select the mission
  useEffect(() => {
    if (highlightedEIN && trajectories.length > 0) {
      const org = findOrganization(highlightedEIN, trajectories);
      if (org) {
        console.log("Found organization:", org.orgName, "Mission:", org.ntee_letter);
        if (org.ntee_letter && onEINMissionDetected) {
          onEINMissionDetected(org.ntee_letter);
        }
        
        // Store org info for use in the draw effect
        highlightedOrgPositionRef.current = org;
      } else {
        console.log("Organization not found:", highlightedEIN);
        highlightedOrgPositionRef.current = null;
      }
    } else {
      // Clear pinned tooltip when highlight is removed
      setPinnedTooltip(null);
      highlightedOrgPositionRef.current = null;
    }
  }, [highlightedEIN, trajectories, onEINMissionDetected, findOrganization]);

  // FIX #2: Reset zoom function - properly implemented
  const resetZoom = useCallback(() => {
    if (zoomBehaviorRef.current && containerRef.current) {
      const svg = d3.select(containerRef.current).select("svg");
      // First clear the state immediately to prevent re-rendering with old transform
      setZoomTransform(null);
      setIsZoomed(false);
      // Then reset the D3 zoom transform with a transition
      svg.transition()
        .duration(300)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity)
        .on("end", () => {
          // Ensure state is cleared after transition completes
          setZoomTransform(null);
          setIsZoomed(false);
        });
    }
  }, []);

  // Main draw effect
  useEffect(() => {
    if (status !== "ready") return;
    const host = containerRef.current;
    if (!host) return;

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

    const cohort = trajectories.filter(
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

    // Outlier filtering
    const allMargins = [];
    data.forEach((org) => {
      org.points.forEach((p) => {
        if (Number.isFinite(p.margin_pct)) allMargins.push(p.margin_pct);
      });
    });

    const medianMargin = d3.median(allMargins);
    const mad = d3.median(allMargins.map(v => Math.abs(v - medianMargin)));
    
    const k = 4;
    const lowerMargin = medianMargin - k * mad;
    const upperMargin = medianMargin + k * mad;

    const filteredData = data.filter((org) => {
      return org.points.every((p) => {
        return p.margin_pct >= lowerMargin && p.margin_pct <= upperMargin;
      });
    });

    const finalData = filteredData.length > 0 ? filteredData : data;

    // Calculate margin improvement for each organization
    finalData.forEach((org) => {
      const first = org.points[0];
      const last = org.points[org.points.length - 1];
      org.marginImproved = last.margin_pct > first.margin_pct;
      org.marginChange = last.margin_pct - first.margin_pct;
    });

    const allRevenues = [];
    const finalMargins = [];

    finalData.forEach((org) => {
      org.points.forEach((p) => {
        if (Number.isFinite(p.log_revenue)) allRevenues.push(p.log_revenue);
        if (Number.isFinite(p.margin_pct)) finalMargins.push(p.margin_pct);
      });
    });

    const revExtent = d3.extent(allRevenues);
    const revPadding = (revExtent[1] - revExtent[0]) * 0.05;

    const xBase = d3
      .scaleLinear()
      .domain([revExtent[0] - revPadding, revExtent[1] + revPadding])
      .nice()
      .range([margin.left, margin.left + innerWidth]);

    const margExtent = d3.extent(finalMargins);
    const margPadding = (margExtent[1] - margExtent[0]) * 0.1;

    const yBase = d3
      .scaleLinear()
      .domain([margExtent[0] - margPadding, margExtent[1] + margPadding])
      .nice()
      .range([margin.top + innerHeight, margin.top]);

    // Apply zoom transform if exists
    let x = xBase;
    let y = yBase;
    if (zoomTransform) {
      x = zoomTransform.rescaleX(xBase);
      y = zoomTransform.rescaleY(yBase);
    }

    const defs = svg.append("defs");

    // Create arrow markers for improved (green) and declined (red)
    defs
      .append("marker")
      .attr("id", "mm-arrow-improved")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("refX", 5)
      .attr("refY", 2.5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,0 L0,5 L5,2.5 Z")
      .attr("fill", IMPROVED_COLOR);

    defs
      .append("marker")
      .attr("id", "mm-arrow-declined")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("refX", 5)
      .attr("refY", 2.5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,0 L0,5 L5,2.5 Z")
      .attr("fill", DECLINED_COLOR);

    // Clip path for zooming
    defs
      .append("clipPath")
      .attr("id", "chart-clip")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", innerWidth)
      .attr("height", innerHeight);

    // Gridlines
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
        g.append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -(margin.top + innerHeight / 2))
          .attr("y", -45)
          .attr("fill", colors.grey[100])
          .attr("text-anchor", "middle")
          .attr("font-size", 11)
          .text("Operating margin");
      });

    const plot = svg.append("g").attr("clip-path", "url(#chart-clip)");

    const arcPath = (p0, p1) => {
      const sx = x(p0.log_revenue);
      const sy = y(p0.margin_pct);
      const tx = x(p1.log_revenue);
      const ty = y(p1.margin_pct);

      const mx = (sx + tx) / 2;
      const my = sy - Math.abs(tx - sx) * 0.22;

      return `M${sx},${sy} Q${mx},${my} ${tx},${ty}`;
    };

    // Find highlighted org for search
    const highlightedOrg = highlightedEIN ? findOrganization(highlightedEIN, finalData) : null;

    // Determine initial opacity based on highlightedEIN
    const getInitialOpacity = (d, type) => {
      if (!highlightedOrg) return type === 'arc' ? 0.85 : 1;
      return d.orgId === highlightedOrg.orgId ? (type === 'arc' ? 0.95 : 1) : 0.15;
    };

    // Arcs with performance-based coloring
    const arcs = plot
      .selectAll("path.mm-arc")
      .data(finalData)
      .join("path")
      .attr("class", "mm-arc")
      .attr("fill", "none")
      .attr("stroke-width", 1.7)
      .attr("stroke", (d) => d.marginImproved ? IMPROVED_COLOR : DECLINED_COLOR)
      .attr("marker-end", (d) => d.marginImproved ? "url(#mm-arrow-improved)" : "url(#mm-arrow-declined)")
      .attr("d", (d) => {
        const first = d.points[0];
        const last = d.points[d.points.length - 1];
        return arcPath(first, last);
      })
      .attr("opacity", d => getInitialOpacity(d, 'arc'))
      .style("cursor", "pointer");

    // Starting dots (always white)
    const dots = plot
      .selectAll("circle.mm-start")
      .data(finalData)
      .join("circle")
      .attr("class", "mm-start")
      .attr("r", 3)
      .attr("fill", colors.grey[200])
      .attr("stroke", "#111827")
      .attr("stroke-width", 0.8)
      .attr("cx", (d) => x(d.points[0].log_revenue))
      .attr("cy", (d) => y(d.points[0].margin_pct))
      .attr("opacity", d => getInitialOpacity(d, 'dot'))
      .style("cursor", "pointer");

    // Shared click handler for opening popup - works on dot, arc, or arrow
    const handleOrgClick = (event, d) => {
      event.stopPropagation();
      console.log("Organization clicked:", d.orgId, d.orgName);
      
      const popupData = buildOrganizationDataForPopup(
        d.orgId,
        d.orgName,
        d.ntee_letter,
        d.city,
        rawRowsRef.current
      );
      
      if (popupData && popupData.years && popupData.years.length > 0) {
        setSelectedOrg(popupData);
      }
    };

    // FIX #4: Updated hover handler to show only ONE tooltip - the detailed one
    const handleHoverEnter = (event, d) => {
      // CRITICAL: Don't show ANY hover effects if this org is already pinned from search
      if (highlightedOrg && d.orgId === highlightedOrg.orgId) {
        // Just highlight, but don't show any tooltip
        arcs.attr("opacity", (other) => {
          if (other.orgId === d.orgId) return 0.95;
          return 0.15;
        });
        dots.attr("opacity", (other) => {
          if (other.orgId === d.orgId) return 1;
          return 0.15;
        });
        return; // Exit early - no tooltip
      }
      
      // Highlight this org
      arcs.attr("opacity", (other) => {
        if (other.orgId === d.orgId) return 0.95;
        if (highlightedOrg && other.orgId === highlightedOrg.orgId) return 0.95;
        return 0.15;
      });
      dots.attr("opacity", (other) => {
        if (other.orgId === d.orgId) return 1;
        if (highlightedOrg && other.orgId === highlightedOrg.orgId) return 1;
        return 0.15;
      });
      
      const first = d.points[0];
      const last = d.points[d.points.length - 1];
      
      // REMOVED: setMagnifierData - no longer showing small magnifier tooltip
      
      // Show ONLY the main hover tooltip with full details
      setHover({
        x: event.clientX,
        y: event.clientY,
        org: d.orgName || d.orgId,
        ein: d.orgId,
        startRev: first.log_revenue,
        endRev: last.log_revenue,
        startMargin: first.margin_pct,
        endMargin: last.margin_pct,
        marginImproved: d.marginImproved,
      });
    };

    const handleHoverMove = (event, d) => {
      // CRITICAL: Don't update hover tooltip if this is the pinned org
      if (highlightedOrg && d.orgId === highlightedOrg.orgId) {
        return; // Exit early
      }
      
      const first = d.points[0];
      const last = d.points[d.points.length - 1];
      setHover({
        x: event.clientX,
        y: event.clientY,
        org: d.orgName || d.orgId,
        ein: d.orgId,
        startRev: first.log_revenue,
        endRev: last.log_revenue,
        startMargin: first.margin_pct,
        endMargin: last.margin_pct,
        marginImproved: d.marginImproved,
      });
    };

    const handleHoverLeave = () => {
      // Clear only the hover tooltip (magnifier is no longer used)
      setHover(null);
      
      if (highlightedOrg) {
        arcs.attr("opacity", (d) => d.orgId === highlightedOrg.orgId ? 0.95 : 0.15);
        dots.attr("opacity", (d) => d.orgId === highlightedOrg.orgId ? 1 : 0.15);
      } else {
        arcs.attr("opacity", 0.85);
        dots.attr("opacity", 1);
      }
    };

    // Arc event handlers - extended click behavior to full path
    arcs
      .on("mouseenter", handleHoverEnter)
      .on("mousemove", handleHoverMove)
      .on("mouseleave", handleHoverLeave)
      .on("click", handleOrgClick);

    // Dot event handlers
    dots
      .on("mouseenter", (event, d) => {
        handleHoverEnter(event, d);
        // Don't enlarge if it's the pinned org to avoid visual confusion
        if (!highlightedOrg || d.orgId !== highlightedOrg.orgId) {
          d3.select(event.currentTarget).attr("r", 5);
        }
      })
      .on("mousemove", handleHoverMove)
      .on("mouseleave", (event) => {
        handleHoverLeave();
        d3.select(event.currentTarget).attr("r", 3);
      })
      .on("click", handleOrgClick);

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[margin.left, margin.top], [margin.left + innerWidth, margin.top + innerHeight]])
      .extent([[margin.left, margin.top], [margin.left + innerWidth, margin.top + innerHeight]])
      .filter((event) => {
        // Allow zoom on wheel, or when shift key is not pressed
        return event.type === 'wheel' || event.type === 'dblclick' || !event.shiftKey;
      })
      .on("zoom", (event) => {
        if (event.sourceEvent && event.sourceEvent.type === "brush") return;
        setZoomTransform(event.transform);
        setIsZoomed(event.transform.k > 1 || Math.abs(event.transform.x) > 0.1 || Math.abs(event.transform.y) > 0.1);
      });

    zoomBehaviorRef.current = zoom;
    
    // Apply zoom to svg
    svg.call(zoom);
    
    // Don't reapply old transform - let it reset naturally if zoomTransform is null

    // Double-click to zoom in
    svg.on("dblclick.zoom", (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      const [mouseX, mouseY] = d3.pointer(event);
      
      // Only zoom if clicking in the plot area
      if (mouseX < margin.left || mouseX > margin.left + innerWidth ||
          mouseY < margin.top || mouseY > margin.top + innerHeight) {
        return;
      }
      
      const currentK = zoomTransform ? zoomTransform.k : 1;
      const newK = Math.min(currentK * 2, 10);
      
      // Calculate the point to center on
      const transform = d3.zoomIdentity
        .translate(svgWidth / 2, svgHeight / 2)
        .scale(newK)
        .translate(-mouseX, -mouseY);
      
      svg.transition().duration(300).call(zoom.transform, transform);
    });

    // Brush for rectangular selection zoom
    const brush = d3.brush()
      .extent([[margin.left, margin.top], [margin.left + innerWidth, margin.top + innerHeight]])
      .on("end", (event) => {
        if (!event.selection) return;
        
        const [[x0, y0], [x1, y1]] = event.selection;
        
        // Calculate zoom to fit selection
        const dx = x1 - x0;
        const dy = y1 - y0;
        const scale = Math.min(innerWidth / dx, innerHeight / dy, 10);
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        
        const transform = d3.zoomIdentity
          .translate(svgWidth / 2, svgHeight / 2)
          .scale(scale)
          .translate(-cx, -cy);
        
        // Clear brush
        svg.select(".brush").call(brush.move, null);
        
        // Apply zoom
        svg.transition().duration(500).call(zoom.transform, transform);
        
        // Auto-hide brush after use
        brushGroup.style("display", "none");
        svg.call(zoom); // Re-enable zoom
      });

    // Add brush group (hidden by default, shown with shift key)
    const brushGroup = svg.append("g")
      .attr("class", "brush")
      .style("display", "none")
      .call(brush);

    // Track shift key state
    let shiftPressed = false;

    // Show/hide brush on shift key
    const handleKeyDown = (event) => {
      if (event.key === "Shift" && !shiftPressed) {
        shiftPressed = true;
        brushGroup.style("display", null);
        svg.on(".zoom", null); // Disable zoom while brushing
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === "Shift") {
        shiftPressed = false;
        brushGroup.style("display", "none");
        svg.call(zoom); // Re-enable zoom
      }
    };

    // Handle window blur to reset brush if user switches windows while holding Shift
    const handleWindowBlur = () => {
      if (shiftPressed) {
        shiftPressed = false;
        brushGroup.style("display", "none");
        svg.call(zoom);
      }
    };

    // Handle click on chart to exit brush mode if stuck
    const handleChartClick = (event) => {
      // If brush is visible but shift is not pressed, hide it
      if (brushGroup.style("display") !== "none" && !event.shiftKey) {
        shiftPressed = false;
        brushGroup.style("display", "none");
        svg.call(zoom);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);
    svg.on("click.brush-reset", handleChartClick);

    // Add click handler to plot area to clear highlight
    svg.on("click", (event) => {
      // Handle brush reset first
      handleChartClick(event);
      
      // Don't clear if clicking on data elements
      if (event.target.tagName === 'circle' || event.target.tagName === 'path') return;
      
      if (highlightedEIN && onClearHighlight) {
        onClearHighlight();
      }
    });

    // Set tooltip position for highlighted EIN after scales are defined
    if (highlightedOrg) {
      const first = highlightedOrg.points[0];
      const last = highlightedOrg.points[highlightedOrg.points.length - 1];
      
      const svgRect = host.getBoundingClientRect();
      const endX = x(last.log_revenue);
      const endY = y(last.margin_pct);
      const pageX = svgRect.left + endX;
      const pageY = svgRect.top + endY;
      const tooltipX = pageX + 15;
      const tooltipY = pageY - 30;
      
      setPinnedTooltip({
        x: tooltipX,
        y: tooltipY,
        org: highlightedOrg.orgName || highlightedOrg.orgId,
        ein: highlightedOrg.orgId,
        startRev: first.log_revenue,
        endRev: last.log_revenue,
        startMargin: first.margin_pct,
        endMargin: last.margin_pct,
        marginImproved: highlightedOrg.marginImproved,
      });
    }

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
      
  }, [status, trajectories, missionLetter, colors, highlightedEIN, onClearHighlight, zoomTransform, findOrganization]);

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
        {/* Removed: Magnifier tooltip - no longer displaying small tooltip on chart */}

        {/* Pinned tooltip for searched org */}
        {pinnedTooltip && (
          <div
            style={{
              position: "fixed",
              left: pinnedTooltip.x + 12,
              top: pinnedTooltip.y + 12,
              zIndex: 11,
              background: colors.primary[500],
              color: colors.grey[100],
              border: `2px solid ${pinnedTooltip.marginImproved ? IMPROVED_COLOR : DECLINED_COLOR}`,
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 11,
              boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
              pointerEvents: "none",
              maxWidth: 280,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 2 }}>
              {pinnedTooltip.org}
            </div>
            <div style={{ fontSize: 10, color: colors.grey[300], marginBottom: 4 }}>
              EIN: {pinnedTooltip.ein}
            </div>
            <div>
              Log revenue: {pinnedTooltip.startRev.toFixed(2)} → {pinnedTooltip.endRev.toFixed(2)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>Margin: {(pinnedTooltip.startMargin * 100).toFixed(1)}% → {(pinnedTooltip.endMargin * 100).toFixed(1)}%</span>
              <span style={{
                color: pinnedTooltip.marginImproved ? IMPROVED_COLOR : DECLINED_COLOR,
                fontWeight: 600
              }}>
                {pinnedTooltip.marginImproved ? "▲" : "▼"}
              </span>
            </div>
          </div>
        )}
        
        {/* Hover tooltip - FIX #4: Only show when not hovering over pinned org */}
        {hover && (
          <div
            style={{
              position: "fixed",
              left: hover.x + 12,
              top: hover.y + 12,
              zIndex: 10,
              background: colors.primary[500],
              color: colors.grey[100],
              border: `2px solid ${hover.marginImproved ? IMPROVED_COLOR : DECLINED_COLOR}`,
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 11,
              boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
              pointerEvents: "none",
              maxWidth: 280,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 2 }}>
              {hover.org}
            </div>
            <div style={{ fontSize: 10, color: colors.grey[300], marginBottom: 4 }}>
              EIN: {hover.ein}
            </div>
            <div>
              Log revenue: {hover.startRev.toFixed(2)} → {hover.endRev.toFixed(2)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>Margin: {(hover.startMargin * 100).toFixed(1)}% → {(hover.endMargin * 100).toFixed(1)}%</span>
              <span style={{
                color: hover.marginImproved ? IMPROVED_COLOR : DECLINED_COLOR,
                fontWeight: 600
              }}>
                {hover.marginImproved ? "▲" : "▼"}
              </span>
            </div>
            <div style={{ 
              marginTop: 6, 
              fontSize: 9, 
              color: colors.grey[400],
              borderTop: `1px solid ${colors.grey[600]}`,
              paddingTop: 4
            }}>
              Click for full details
            </div>
          </div>
        )}

        {/* FIX #2: Reset Zoom button - now functional */}
        {isZoomed && (
          <button
            onClick={resetZoom}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: colors.primary[500],
              color: colors.grey[100],
              border: `1px solid ${colors.grey[600]}`,
              borderRadius: 4,
              padding: "6px 10px",
              fontSize: 10,
              fontWeight: 500,
              cursor: "pointer",
              zIndex: 10,
              height: "30px",
              minWidth: "100px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <strong style={{ color: colors[400] }}>Reset Zoom</strong>
          </button>
        )}

        {/* FIX #3: Zoom instructions repositioned to top right, near legends */}
        <div
          style={{
            position: "absolute",
            top: 8,
            right: isZoomed ? 116 : 8,
            fontSize: 10,
            color: colors.grey[100],
            background: colors.primary[500],
            padding: "6px 10px",
            borderRadius: 4,
            zIndex: 5,
            border: `1px solid ${colors.grey[600]}`,
            fontWeight: 500,
            height: "30px",
            display: "flex",
            alignItems: "center",
            whiteSpace: "nowrap",
          }}
        >
          <strong style={{ color: colors[400] }}>Scroll to zoom  • Double-click to zoom in</strong>
        </div>
      </div>
      
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