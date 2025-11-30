// src/components/CityFinancialGlyphGrid.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useMemo,
} from "react";
import Papa from "papaparse";
import { useTheme, Typography } from "@mui/material";
import { tokens } from "../theme";

import { scaleLinear } from "d3-scale";

const parseNumber = (val) => {
  if (val == null || val === "") return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/[^0-9.-]+/g, "");
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
};

const CityFinancialGlyphGrid = ({ csvUrl = "/il_nonprofits_orgs.csv" }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [cities, setCities] = useState([]);

  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 600, height: 260 });

  const [hoverInfo, setHoverInfo] = useState(null);

  const margin = { top: 28, right: 16, bottom: 16, left: 16 };

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      const width = Math.max(rect.width, 320);
      const height = Math.max(rect.height, 220);
      setSize({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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
          const cityStats = {}; // city -> { assets, income, revenue }

          rows.forEach((row) => {
            const cityRaw = row.city || row.mailing_city || row.city_name;
            const city = (cityRaw || "").trim();
            if (!city) return;

            const assets =
              parseNumber(row.asset_amount || row.ASSET_AMOUNT || row.assets);
            const income =
              parseNumber(row.income_amount || row.INCOME_AMOUNT || row.income);
            const revenue = parseNumber(
              row.revenue_amount ||
                row.REVENUE_AMOUNT ||
                row.revenue ||
                row.REVENUE
            );

            if (!cityStats[city]) {
              cityStats[city] = { assets: 0, income: 0, revenue: 0 };
            }
            cityStats[city].assets += assets;
            cityStats[city].income += income;
            cityStats[city].revenue += revenue;
          });

          const arr = Object.entries(cityStats).map(([city, vals]) => ({
            city,
            assets: vals.assets,
            income: vals.income,
            revenue: vals.revenue,
            total: vals.assets + vals.income + vals.revenue,
          }));

          // Top 12 cities by total
          const topCities = arr
            .sort((a, b) => b.total - a.total)
            .slice(0, 12);

          setCities(topCities);
          setStatus("ready");
        } catch (e) {
          console.error(e);
          setError("Failed to process CSV data for city glyphs.");
          setStatus("error");
        }
      },
      error: (err) => {
        console.error(err);
        setError("Failed to load CSV file for city glyphs.");
        setStatus("error");
      },
    });
  }, [csvUrl]);

  const {
    chartWidth,
    chartHeight,
    nCols,
    nRows,
    cellWidth,
    cellHeight,
    valueScale,
  } = useMemo(() => {
    const chartWidth = Math.max(size.width - margin.left - margin.right, 10);
    const chartHeight = Math.max(size.height - margin.top - margin.bottom, 10);

    if (!cities || !cities.length) {
      return {
        chartWidth,
        chartHeight,
        nCols: 1,
        nRows: 1,
        cellWidth: chartWidth,
        cellHeight: chartHeight,
        valueScale: (v) => 0,
      };
    }

    // Layout grid ~ 4 columns
    const nCols = Math.min(4, cities.length);
    const nRows = Math.ceil(cities.length / nCols);

    const cellWidth = chartWidth / nCols;
    const cellHeight = chartHeight / nRows;

    const maxVal = Math.max(
      ...cities.flatMap((c) => [c.assets, c.income, c.revenue]),
      1
    );

    const valueScale = scaleLinear()
      .domain([0, maxVal])
      .range([0, cellHeight * 0.6]);

    return {
      chartWidth,
      chartHeight,
      nCols,
      nRows,
      cellWidth,
      cellHeight,
      valueScale,
    };
  }, [
    cities,
    size.width,
    size.height,
    margin.left,
    margin.right,
    margin.top,
    margin.bottom,
  ]);

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
        Loading city glyphs...
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

  if (!cities || !cities.length) {
    return (
      <Typography variant="body2" color={colors.grey[100]} sx={{ p: 1 }}>
        No city data available.
      </Typography>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "relative" }}
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
        {/* Title */}
        <text
          x={margin.left + 4}
          y={margin.top - 10}
          textAnchor="start"
          fontSize={13}
          fill={colors.grey[100]}
          fontWeight={600}
        >
          City Financial Glyphs (Assets / Income / Revenue)
        </text>

        {/* Glyphs grid */}
        <g>
          {cities.map((c, idx) => {
            const col = idx % nCols;
            const row = Math.floor(idx / nCols);

            const x0 = margin.left + col * cellWidth;
            const y0 = margin.top + row * cellHeight;

            const barGroupWidth = cellWidth * 0.5;
            const barWidth = barGroupWidth / 3;
            const cx = x0 + cellWidth / 2;
            const baseY = y0 + cellHeight * 0.75;

            const hAssets = valueScale(c.assets);
            const hIncome = valueScale(c.income);
            const hRevenue = valueScale(c.revenue);

            const bars = [
              {
                key: "assets",
                label: "Assets",
                x: cx - barGroupWidth / 2,
                height: hAssets,
                color: colors.blueAccent[400],
              },
              {
                key: "income",
                label: "Income",
                x: cx - barGroupWidth / 2 + barWidth,
                height: hIncome,
                color: colors.greenAccent[400],
              },
              {
                key: "revenue",
                label: "Revenue",
                x: cx - barGroupWidth / 2 + 2 * barWidth,
                height: hRevenue,
                color: colors.greenAccent[600],
              },
            ];

            return (
              <g key={c.city}>
                {/* subtle cell boundary */}
                <rect
                  x={x0 + 2}
                  y={y0 + 2}
                  width={cellWidth - 4}
                  height={cellHeight - 4}
                  fill="none"
                  stroke={colors.primary[500]}
                  strokeWidth={0.5}
                  rx={6}
                />

                {/* city name */}
                <text
                  x={cx}
                  y={y0 + 16}
                  textAnchor="middle"
                  fontSize={10}
                  fill={colors.grey[100]}
                >
                  {c.city.length > 15 ? c.city.slice(0, 13) + "…" : c.city}
                </text>

                {/* bars as composite glyph */}
                {bars.map((b) => (
                  <rect
                    key={b.key}
                    x={b.x}
                    y={baseY - b.height}
                    width={barWidth * 0.9}
                    height={b.height}
                    fill={b.color}
                    rx={2}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => {
                      const pos = getRelativePosition(e);
                      setHoverInfo({
                        x: pos.x,
                        y: pos.y,
                        city: c.city,
                        type: b.label,
                        value:
                          b.key === "assets"
                            ? c.assets
                            : b.key === "income"
                            ? c.income
                            : c.revenue,
                        totals: c,
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
                ))}
              </g>
            );
          })}
        </g>

        {/* Legend at bottom-left */}
        <g>
          constLegend
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
            boxShadow: "0 8px 18px rgba(0,0,0,0.45)",
            pointerEvents: "none",
            maxWidth: 260,
            lineHeight: 1.4,
            border: `1px solid ${colors.greenAccent[500]}`,
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {hoverInfo.city}
          </div>
          <div style={{ marginBottom: 4 }}>{hoverInfo.type}</div>
          <div>
            {hoverInfo.type}:{" "}
            {hoverInfo.value.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </div>
          <div style={{ marginTop: 4, fontSize: 11, opacity: 0.85 }}>
            Assets:{" "}
            {hoverInfo.totals.assets.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}{" "}
            · Income:{" "}
            {hoverInfo.totals.income.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}{" "}
            · Revenue:{" "}
            {hoverInfo.totals.revenue.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CityFinancialGlyphGrid;
