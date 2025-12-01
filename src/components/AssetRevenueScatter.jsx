// src/components/AssetRevenueScatter.jsx
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

import { scaleLog, scaleOrdinal } from "d3-scale";
import { extent } from "d3-array";

const parseNumber = (val) => {
  if (val == null || val === "") return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/[^0-9.-]+/g, "");
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
};

const AssetRevenueScatter = ({ csvUrl = "/il_nonprofits_orgs.csv" }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [points, setPoints] = useState([]);

  // responsive container
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 600, height: 260 });

  // tooltip
  const [hoverInfo, setHoverInfo] = useState(null);

  const margin = { top: 24, right: 20, bottom: 60, left: 70 };

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      const width = Math.max(rect.width, 320);
      const height = Math.max(rect.height, 240);
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
          const pts = [];

          rows.forEach((row) => {
            const revenue = parseNumber(
              row.revenue_amount ||
                row.REVENUE_AMOUNT ||
                row.revenue ||
                row.REVENUE
            );
            const assets = parseNumber(
              row.asset_amount || row.ASSET_AMOUNT || row.assets
            );

            if (revenue <= 0 || assets <= 0) return;

            const letterRaw = row.ntee_letter || row.NTEE_LETTER;
            const ntee = (letterRaw || "").trim().toUpperCase() || "Unknown";

            const name =
              row.organization_name ||
              row.org_name ||
              row.name ||
              "Unnamed organization";

            const city =
              (row.city || row.mailing_city || row.city_name || "").trim();

            pts.push({
              revenue,
              assets,
              ntee,
              name,
              city,
            });
          });

          // Limit to avoid overplotting: take top 800 by revenue
          const top = pts
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 800);

          setPoints(top);
          setStatus("ready");
        } catch (e) {
          console.error(e);
          setError("Failed to process CSV data for scatterplot.");
          setStatus("error");
        }
      },
      error: (err) => {
        console.error(err);
        setError("Failed to load CSV file for scatterplot.");
        setStatus("error");
      },
    });
  }, [csvUrl]);

  const { xScale, yScale, colorScale, chartWidth, chartHeight } = useMemo(() => {
    const chartWidth = Math.max(size.width - margin.left - margin.right, 10);
    const chartHeight = Math.max(size.height - margin.top - margin.bottom, 10);

    if (!points || !points.length) {
      return {
        xScale: null,
        yScale: null,
        colorScale: () => colors.greenAccent[500],
        chartWidth,
        chartHeight,
      };
    }

    const [minRev, maxRev] = extent(points, (d) => d.revenue);
    const [minAss, maxAss] = extent(points, (d) => d.assets);

    const x = scaleLog()
      .domain([
        Math.max(1, minRev || 1),
        Math.max(10, maxRev || 10),
      ])
      .range([margin.left, margin.left + chartWidth])
      .nice();

    const y = scaleLog()
      .domain([
        Math.max(1, minAss || 1),
        Math.max(10, maxAss || 10),
      ])
      .range([margin.top + chartHeight, margin.top])
      .nice();

    const letters = Array.from(new Set(points.map((d) => d.ntee)));
    const palette = [
      colors.greenAccent[400],
      colors.blueAccent[400],
      colors.greenAccent[600],
      colors.blueAccent[600],
      colors.greenAccent[200],
      colors.blueAccent[200],
      colors.greenAccent[300],
      colors.blueAccent[300],
    ];

    const colorScale = scaleOrdinal()
      .domain(letters)
      .range(
        letters.map((_, i) => palette[i % palette.length])
      );

    return { xScale: x, yScale: y, colorScale, chartWidth, chartHeight };
  }, [
    points,
    size.width,
    size.height,
    margin.left,
    margin.right,
    margin.top,
    margin.bottom,
    colors.greenAccent,
    colors.blueAccent,
  ]);

  const getRelativePosition = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const bounds = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    };
  };

  // conditional rendering after hooks
  if (status === "loading") {
    return (
      <Typography variant="body2" color={colors.grey[100]} sx={{ p: 1 }}>
        Loading scatterplot...
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

  if (!points || !points.length || !xScale || !yScale) {
    return (
      <Typography variant="body2" color={colors.grey[100]} sx={{ p: 1 }}>
        No scatterplot data available.
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
        {/* Axes grid + labels */}
        <g>
          {xScale.ticks(4).map((t, i) => (
            <g key={`xtick-${i}`}>
              <line
                x1={xScale(t)}
                x2={xScale(t)}
                y1={margin.top}
                y2={margin.top + chartHeight}
                stroke={colors.primary[500]}
                strokeWidth={0.5}
              />
              <text
                x={xScale(t)}
                y={margin.top + chartHeight + 16}
                textAnchor="middle"
                fontSize={9}
                fill={colors.grey[300]}
              >
                {t.toLocaleString()}
              </text>
            </g>
          ))}

          {yScale.ticks(4).map((t, i) => (
            <g key={`ytick-${i}`}>
              <line
                x1={margin.left}
                x2={margin.left + chartWidth}
                y1={yScale(t)}
                y2={yScale(t)}
                stroke={colors.primary[500]}
                strokeWidth={0.5}
              />
              <text
                x={margin.left - 6}
                y={yScale(t)}
                textAnchor="end"
                dy="0.32em"
                fontSize={9}
                fill={colors.grey[300]}
              >
                {t.toLocaleString()}
              </text>
            </g>
          ))}

          {/* Axis titles */}
          <text
            x={margin.left + chartWidth / 2}
            y={margin.top + chartHeight + 34}
            textAnchor="middle"
            fontSize={11}
            fill={colors.grey[300]}
          >
            Revenue Amount (log scale)
          </text>

          <text
            x={margin.left - 50}
            y={margin.top + chartHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${margin.left - 50}, ${
              margin.top + chartHeight / 2
            })`}
            fontSize={11}
            fill={colors.grey[300]}
          >
            Asset Amount (log scale)
          </text>
        </g>

        {/* Diagonal reference line y = x (approx) */}
        <g>
          constLine
        </g>

        {/* Points */}
        <g>
          {points.map((d, i) => {
            const x = xScale(d.revenue);
            const y = yScale(d.assets);
            if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={2.5}
                fill={colorScale(d.ntee)}
                opacity={0.8}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => {
                  const pos = getRelativePosition(e);
                  setHoverInfo({
                    x: pos.x,
                    y: pos.y,
                    ...d,
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

        {/* Optional: diagonal line (using min/max domain) */}
        <line
          x1={xScale(xScale.domain()[0])}
          y1={yScale(xScale.domain()[0])}
          x2={xScale(xScale.domain()[1])}
          y2={yScale(xScale.domain()[1])}
          stroke={colors.grey[500]}
          strokeDasharray="4 3"
          strokeWidth={1}
          opacity={0.6}
        />

        {/* Small legend for sectors (max 8) */}
        <g>
          {Array.from(new Set(points.map((d) => d.ntee)))
            .slice(0, 8)
            .map((letter, i) => {
              const lx = margin.left + i * 70;
              const ly = margin.top - 8;
              return (
                <g key={letter}>
                  <rect
                    x={lx}
                    y={ly - 8}
                    width={10}
                    height={10}
                    fill={colorScale(letter)}
                    rx={2}
                  />
                  <text
                    x={lx + 14}
                    y={ly}
                    textAnchor="start"
                    fontSize={9}
                    fill={colors.grey[200]}
                  >
                    {letter}
                  </text>
                </g>
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
            boxShadow: "0 8px 18px rgba(0,0,0,0.45)",
            pointerEvents: "none",
            maxWidth: 260,
            lineHeight: 1.4,
            border: `1px solid ${colors.greenAccent[500]}`,
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {hoverInfo.name}
          </div>
          {hoverInfo.city && (
            <div style={{ marginBottom: 2 }}>{hoverInfo.city}</div>
          )}
          <div>Sector: {hoverInfo.ntee}</div>
          <div>
            Revenue:{" "}
            {hoverInfo.revenue.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </div>
          <div>
            Assets:{" "}
            {hoverInfo.assets.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetRevenueScatter;
