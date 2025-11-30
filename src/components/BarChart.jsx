// src/components/StackedSectorBar.jsx
import React, {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useMemo,
} from "react";
import Papa from "papaparse";
import { useTheme, Typography } from "@mui/material";
import { tokens } from "../theme";

// d3 imports
import { format as d3format } from "d3-format";
import { scaleBand, scaleLinear, scaleOrdinal } from "d3-scale";
import { max } from "d3-array";
import { schemeTableau10 } from "d3-scale-chromatic";

const parseNumber = (val) => {
  if (val == null || val === "") return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/[^0-9.-]+/g, "");
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
};

const StackedSectorBar = ({ csvUrl = "/il_nonprofits_orgs.csv" }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 900, height: 1000 });
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [sectorTotals, setSectorTotals] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  // measure container (responsive)
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      const width = Math.max(rect.width, 300);
      const height = Math.max(rect.height, 200);
      setSize({ width, height });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // load + aggregate data
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
          const totals = {}; // sector -> { assets, income, revenue }

          rows.forEach((row) => {
            const sectorRaw = row.ntee_letter || row.NTEE_LETTER;
            const sector = (sectorRaw || "").trim().toUpperCase();
            if (!sector) return;

            const assetsRaw =
              row.asset_amount || row.ASSET_AMOUNT || row.assets;
            const incomeRaw =
              row.income_amount || row.INCOME_AMOUNT || row.income;
            const revenueRaw =
              row.revenue_amount ||
              row.REVENUE_AMOUNT ||
              row.revenue ||
              row.REVENUE;

            const assets = parseNumber(assetsRaw);
            const income = parseNumber(incomeRaw);
            const revenue = parseNumber(revenueRaw);

            if (!totals[sector]) {
              totals[sector] = { assets: 0, income: 0, revenue: 0 };
            }
            totals[sector].assets += assets;
            totals[sector].income += income;
            totals[sector].revenue += revenue;
          });

          const sectors = Object.keys(totals);
          if (sectors.length === 0) {
            setStatus("ready");
            setSectorTotals({ sectors: [], totals: {} });
            return;
          }

          setSectorTotals({ sectors, totals });
          setStatus("ready");
        } catch (err) {
          console.error(err);
          setError("Failed to process CSV data for stacked bar chart.");
          setStatus("error");
        }
      },
      error: (err) => {
        console.error(err);
        setError("Failed to load CSV file for stacked bar chart.");
        setStatus("error");
      },
    });
  }, [csvUrl]);

  const margin = { top: 20, right: 20, bottom: 60, left: 70 };

  const chart = useMemo(() => {
    if (!sectorTotals || !sectorTotals.sectors.length) {
      return null;
    }

    const { sectors, totals } = sectorTotals;

    const metrics = ["Assets", "Income", "Revenue"];
    const metricKeys = ["assets", "income", "revenue"];

    // total per bar (sum over sectors)
    const barTotals = metricKeys.map((key) =>
      sectors.reduce((sum, s) => sum + (totals[s][key] || 0), 0)
    );

    const maxTotal = max(barTotals) || 0;

    if (maxTotal <= 0) {
      return { empty: true };
    }

    const innerWidth = Math.max(size.width - margin.left - margin.right, 10);
    const innerHeight = Math.max(size.height - margin.top - margin.bottom, 10);

    const xScale = scaleBand()
      .domain(metrics)
      .range([margin.left, margin.left + innerWidth])
      .padding(0.3);

    const yScale = scaleLinear()
      .domain([0, maxTotal])
      .nice()
      .range([margin.top + innerHeight, margin.top]);

    // color per sector (D3 ordinal scale)
    const colorScale = scaleOrdinal()
      .domain(sectors)
      .range(schemeTableau10);

    // build stacked segments: metric -> list of { sector, y0, y1, value }
    const stacks = metrics.map((metricLabel, idx) => {
      const key = metricKeys[idx];
      let yAccumulator = 0;
      const segments = sectors.map((sector) => {
        const value = totals[sector][key] || 0;
        const y0 = yAccumulator;
        const y1 = yAccumulator + value;
        yAccumulator = y1;
        return { sector, metricLabel, key, value, y0, y1 };
      });
      return { metricLabel, segments };
    });

    const yTicks = yScale.ticks(4);

    return {
      empty: false,
      xScale,
      yScale,
      colorScale,
      stacks,
      metrics,
      yTicks,
      maxTotal,
    };
  }, [sectorTotals, size, margin.left, margin.right, margin.top, margin.bottom]);

  const getRelativePosition = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const bounds = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    };
  };

  if (status === "loading") {
    return (
      <Typography variant="body2" color={colors.grey[100]} sx={{ p: 1 }}>
        Loading stacked bar chart...
      </Typography>
    );
  }

  if (status === "error") {
    return (
      <Typography variant="body2" color="error.main" sx={{ p: 1 }}>
        {error}
      </Typography>
    );
  }

  if (!chart || chart.empty) {
    return (
      <Typography variant="body2" color={colors.grey[100]} sx={{ p: 1 }}>
        No financial data available for stacked bar chart.
      </Typography>
    );
  }

  const { xScale, yScale, colorScale, stacks, metrics, yTicks } = chart;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <svg
        viewBox={`0 0 ${size.width} ${size.height}`}
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
          display: "block",
        }}
      >
        {/* y-axis gridlines + labels */}
        <g>
          {yTicks.map((t) => {
            const y = yScale(t);
            return (
              <g key={t}>
                <line
                  x1={margin.left}
                  x2={size.width - margin.right}
                  y1={y}
                  y2={y}
                  stroke={colors.primary[500]}
                  strokeWidth={0.5}
                />
                <text
                  x={margin.left - 8}
                  y={y}
                  dy="0.32em"
                  textAnchor="end"
                  fontSize={22}
                  fill={colors.grey[300]}
                >
                  {/* {t.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })} */}
                  {d3format(".2s")(t)}  {/* turns 20000000 → 20M */}
                </text>
              </g>
            );
          })}
        </g>

        {/* x-axis labels */}
        <g>
          {metrics.map((m) => {
            const x = xScale(m);
            if (x == null) return null;
            const cx = x + xScale.bandwidth() / 2;
            const y = size.height - margin.bottom + 30;
            return (
              <text
                key={m}
                x={cx}
                y={y}
                textAnchor="middle"
                fontSize={22}
                fill={colors.grey[200]}
              >
                {m}
              </text>
            );
          })}
        </g>

        {/* y-axis title */}
        <text
          x={margin.left - 45}
          y={margin.top + (size.height - margin.top - margin.bottom) / 2}
          textAnchor="middle"
          transform={`rotate(-90 ${
            margin.left - 45
          }, ${
            margin.top + (size.height - margin.top - margin.bottom) / 2
          })`}
          fontSize={11}
          fill={colors.grey[300]}
        >
          Total Amount (USD)
        </text>

        {/* bars (stacked segments) */}
        <g>
          {stacks.map((stack) => {
            const x = xScale(stack.metricLabel);
            if (x == null) return null;
            const barWidth = xScale.bandwidth();

            return (
              <g key={stack.metricLabel}>
                {stack.segments.map((seg, i) => {
                  if (seg.value <= 0) return null;
                  const y0 = yScale(seg.y0);
                  const y1 = yScale(seg.y1);
                  const h = y0 - y1;
                  const fill = colorScale(seg.sector);

                  return (
                    <rect
                      key={`${stack.metricLabel}-${seg.sector}-${i}`}
                      x={x}
                      y={y1}
                      width={barWidth}
                      height={h}
                      fill={fill}
                      opacity={0.9}
                      stroke={colors.primary[900]}
                      strokeWidth={0.4}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={(e) => {
                        const pos = getRelativePosition(e);
                        setHoverInfo({
                          x: pos.x,
                          y: pos.y,
                          metricLabel: seg.metricLabel,
                          sector: seg.sector,
                          value: seg.value,
                        });
                      }}
                      onMouseMove={(e) => {
                        const pos = getRelativePosition(e);
                        setHoverInfo((prev) =>
                          prev
                            ? { ...prev, x: pos.x, y: pos.y }
                            : prev
                        );
                      }}
                      onMouseLeave={() => setHoverInfo(null)}
                    />
                  );
                })}
              </g>
            );
          })}
        </g>
      </svg>

      {/* tooltip */}
      {hoverInfo && (
        <div
          style={{
            position: "absolute",
            left: hoverInfo.x + 12,
            top: hoverInfo.y + 12,
            background: colors.primary[600],
            color: colors.grey[100],
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            boxShadow: "0 8px 18px rgba(0,0,0,0.45)",
            pointerEvents: "none",
            maxWidth: 260,
            lineHeight: 1.4,
            border: `1px solid ${colors.greenAccent[500]}`,
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            Sector {hoverInfo.sector}
          </div>
          <div>{hoverInfo.metricLabel}</div>
          <div>
            Amount:{" "}
            {hoverInfo.value.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StackedSectorBar;
