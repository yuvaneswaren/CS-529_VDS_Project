// src/components/StackedSectorBar.jsx
import React, {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useMemo,
} from "react";
import Papa from "papaparse";
import {
  Box,
  useTheme,
  Typography,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import { tokens } from "../theme";

// d3 imports
import { scaleBand, scaleLinear } from "d3-scale";
import { max } from "d3-array";

// ---------------- NTEE Descriptions + short label helper ----------------
const NTEE_DESCRIPTIONS = {
  A: "Arts, Culture and Humanities",
  B: "Educational Institutions and Related Activities",
  C: "Environmental Quality, Protection and Beautification",
  D: "Animal-Related",
  E: "Health – General and Rehabilitative",
  F: "Mental Health, Crisis Intervention",
  G: "Diseases, Disorders, Medical Disciplines",
  H: "Medical Research",
  I: "Crime, Legal-Related",
  J: "Employment, Job-Related",
  K: "Food, Agriculture and Nutrition",
  L: "Housing, Shelter",
  M: "Public Safety, Disaster Preparedness and Relief",
  N: "Recreation, Sports, Leisure, Athletics",
  O: "Youth Development",
  P: "Human Services – Multipurpose and Other",
  Q: "International, Foreign Affairs and National Security",
  R: "Civil Rights, Social Action, Advocacy",
  S: "Community Improvement, Capacity Building",
  T: "Philanthropy, Voluntarism and Grantmaking Foundations",
  U: "Science and Technology Research Institutes, Services",
  V: "Social Science Research Institutes, Services",
  W: "Public, Society Benefit – Multipurpose and Other",
  X: "Religion-Related, Spiritual Development",
  Y: "Mutual/Membership Benefit Organizations, Other",
  Z: "Unknown",
};

const getShortLabel = (letter) => {
  const full = NTEE_DESCRIPTIONS[letter] || "Unknown";

  const firstWord = full
    .split(/[\s–-]+/)[0]     // take only first word
    .replace(/[,.:-]+$/, ""); // remove trailing comma/colon/dot/hyphen

  return `${letter} (${firstWord})`;
};


// ---------------- Number parsing + formatting ----------------
const parseNumber = (val) => {
  if (val == null || val === "") return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/[^0-9.-]+/g, "");
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
};

const formatMoney = (num) => {
  if (num >= 1e12) return (num / 1e12).toFixed(1) + "T"; // trillions
  if (num >= 1e9) return (num / 1e9).toFixed(1) + "B"; // billions
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M"; // millions
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K"; // thousands
  return num.toFixed(0);
};

const StackedSectorBar = ({ csvUrl = "/il_nonprofits_orgs.csv" }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 550, height: 600 });
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [sectorTotals, setSectorTotals] = useState(null);
  const [selectedSector, setSelectedSector] = useState("");
  const [hoverInfo, setHoverInfo] = useState(null);

  // measure chart container (responsive)
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      const width = Math.max(rect.width, 300);
      const height = Math.max(rect.height, 250);
      setSize({ width, height });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // load + aggregate data by NTEE sector (letter)
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

          const sectors = Object.keys(totals).sort();

          setSectorTotals({ sectors, totals });
          if (sectors.length > 0) {
            // default selection: first sector
            setSelectedSector((prev) => prev || sectors[0]);
          }

          setStatus("ready");
        } catch (err) {
          console.error(err);
          setError("Failed to process CSV data for bar chart.");
          setStatus("error");
        }
      },
      error: (err) => {
        console.error(err);
        setError("Failed to load CSV file for bar chart.");
        setStatus("error");
      },
    });
  }, [csvUrl]);

  // chart layout margins
  const margin = { top: 20, right: 20, bottom: 45, left: 100 };

  const chart = useMemo(() => {
    if (
      !sectorTotals ||
      !sectorTotals.sectors.length ||
      !selectedSector ||
      !sectorTotals.totals[selectedSector]
    ) {
      return null;
    }

    const metrics = ["Assets", "Income", "Revenue"];
    const metricKeys = ["assets", "income", "revenue"];
    const { totals } = sectorTotals;

    const values = metricKeys.map(
      (key) => totals[selectedSector][key] || 0
    );

    const maxValue = max(values) || 0;
    if (maxValue <= 0) {
      return { empty: true };
    }

    const innerWidth = Math.max(size.width - margin.left - margin.right, 10);
    const innerHeight = Math.max(
      size.height - margin.top - margin.bottom,
      10
    );

    const xScale = scaleBand()
      .domain(metrics)
      .range([margin.left, margin.left + innerWidth])
      .padding(0.4);

    const yScale = scaleLinear()
      .domain([0, maxValue])
      .nice()
      .range([margin.top + innerHeight, margin.top]); // bottom → top

    const yTicks = yScale.ticks(4);

    return {
      empty: false,
      xScale,
      yScale,
      metrics,
      metricKeys,
      values,
      yTicks,
      maxValue,
    };
  }, [
    sectorTotals,
    selectedSector,
    size,
    margin.left,
    margin.right,
    margin.top,
    margin.bottom,
  ]);

  const getRelativePosition = (e) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const bounds = container.getBoundingClientRect();
    return {
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    };
  };

  if (status === "loading") {
    return (
      <Typography variant="body2" color={colors.grey[100]} sx={{ p: 1 }}>
        Loading bar chart...
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
        No financial data available for selected sector.
      </Typography>
    );
  }

  const { xScale, yScale, metrics, metricKeys, values, yTicks } = chart;

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Dropdown row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mb: 1,
        }}
      >
        <FormControl
          size="small"
          sx={{
            minWidth: 160,
            "& .MuiInputBase-root": {
              backgroundColor: colors.primary[500],
              color: colors.grey[100],
            },
            "& .MuiSvgIcon-root": {
              color: colors.grey[100],
            },
          }}
        >
          <Select
            value={selectedSector || ""}
            onChange={(e) => setSelectedSector(e.target.value)}
            displayEmpty
          >
            {sectorTotals?.sectors.map((s) => (
              <MenuItem key={s} value={s}>
                {getShortLabel(s)} {/* 👈 A (Arts), B (Educat...), etc */}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Chart container */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
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
                    stroke={colors.grey[100]}
                    strokeWidth={0.5}
                  />
                  <text
                    x={margin.left - 8}
                    y={y}
                    dy="0.32em"
                    textAnchor="end"
                    fontSize={27}
                    fill={colors.grey[100]}
                    fontWeight={t === 0 ? 600 : 400}
                  >
                    {formatMoney(t)}
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
              const y = size.height - margin.bottom + 40;
              return (
                <text
                  key={m}
                  x={cx}
                  y={y}
                  textAnchor="middle"
                  fontSize={27}
                  fill={colors.grey[100]}
                >
                  {m}
                </text>
              );
            })}
          </g>

          {/* y-axis title (left side – you can move to right if you want) */}
          <text
            x={margin.left - 45}
            y={
              margin.top +
              (size.height - margin.top - margin.bottom) * 1.35
            }
            textAnchor="middle"
            transform={`rotate(-90 ${
              margin.left - 45
            }, ${
              margin.top +
              (size.height - margin.top - margin.bottom) / 2
            })`}
            fontSize={22}
            fill={colors.grey[100]}
          >
            Total Amount (USD)
          </text>

          {/* Bars: 3 metrics for selected sector */}
          <g>
            {metrics.map((metricLabel, idx) => {
              const value = values[idx];
              const key = metricKeys[idx];

              const x = xScale(metricLabel);
              if (x == null) return null;

              const barWidth = xScale.bandwidth();
              const y0 = yScale(0);
              const y1 = yScale(value);
              const h = y0 - y1;

              if (h <= 0) return null;

              // Slightly different color per metric using theme accents
              const fill =
                key === "assets"
                  ? colors.greenAccent[400]
                  : key === "income"
                  ? colors.blueAccent[400]
                  : colors.redAccent[400];

              return (
                <rect
                  key={metricLabel}
                  x={x}
                  y={y1}
                  width={barWidth}
                  height={h}
                  fill={fill}
                  opacity={0.9}
                  stroke={colors.primary[900]}
                  strokeWidth={0.6}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    const pos = getRelativePosition(e);
                    setHoverInfo({
                      x: pos.x,
                      y: pos.y,
                      metricLabel,
                      sector: selectedSector,
                      value,
                    });
                  }}
                  onMouseMove={(e) => {
                    const pos = getRelativePosition(e);
                    setHoverInfo((prev) =>
                      prev ? { ...prev, x: pos.x, y: pos.y } : prev
                    );
                  }}
                  onMouseLeave={() => setHoverInfo(null)}
                />
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
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
              zIndex: 10,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {getShortLabel(hoverInfo.sector)}
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
      </Box>
    </Box>
  );
};

export default StackedSectorBar;
