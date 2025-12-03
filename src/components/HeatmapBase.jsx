// src/components/HeatmapBase.jsx
import React, {
  useMemo,
  useRef,
  useLayoutEffect,
  useState,
  useEffect,
} from "react";
import { scaleBand } from "d3-scale";
import { max } from "d3-array";
import { interpolateGreens } from "d3-scale-chromatic";
import {
  useTheme,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { tokens } from "../theme";
import { interpolateRdYlGn } from "d3-scale-chromatic";

const PAGE_SIZE = 13; // 13 NTEE categories per page

const HeatmapBase = ({
  data,
  title = "Average Revenue by City & NTEE Category",
  selectedMission = "ALL",
  onMissionRowClick,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 400 });
  const [hoverInfo, setHoverInfo] = useState(null);
  const [page, setPage] = useState(0);

  // Margins around the heatmap
  const margin = { top: 30, right: 10, bottom: 90, left: 120 };

  // Measure container (responsive)
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      const width = Math.max(rect.width, 300);
      const height = Math.max(rect.height, 220);
      setSize({ width, height });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const allYLabels = data?.yLabels || [];
  const pageCount = Math.max(
    1,
    Math.ceil(allYLabels.length / PAGE_SIZE)
  );

  // Keep page index valid when data changes
  useEffect(() => {
    setPage((prev) => {
      if (prev >= pageCount) return pageCount - 1;
      if (prev < 0) return 0;
      return prev;
    });
  }, [pageCount]);

  // Auto-jump to the page containing the selected mission (if any)
  useEffect(() => {
    if (
      !data ||
      !data.missionToIndex ||
      !selectedMission ||
      selectedMission === "ALL"
    ) {
      return;
    }
    const idx = data.missionToIndex[selectedMission];
    if (idx == null) return;

    const newPage = Math.floor(idx / PAGE_SIZE);
    setPage((prev) => (prev === newPage ? prev : newPage));
  }, [selectedMission, data]);

  const {
    xScale,
    yScale,
    valueColor,
    grayColor,
    valuesPage,
    xLabelsPage,
    yLabelsPage,
  } = useMemo(() => {
    if (
      !data ||
      !data.values ||
      !data.xLabels ||
      !data.yLabels ||
      !data.yLabels.length
    ) {
      return {
        xScale: null,
        yScale: null,
        valueColor: () => colors.primary[400],
        grayColor: () => colors.primary[900],
        valuesPage: [],
        xLabelsPage: [],
        yLabelsPage: [],
      };
    }

    const innerWidth = Math.max(
      size.width - margin.left - margin.right,
      10
    );
    const innerHeight = Math.max(
      size.height - margin.top - margin.bottom,
      10
    );

    const startIndex = page * PAGE_SIZE;
    const endIndex = Math.min(
      startIndex + PAGE_SIZE,
      data.yLabels.length
    );
    const yLabelsPage = data.yLabels.slice(startIndex, endIndex);
    const xLabelsPage = data.xLabels;

    const x = scaleBand()
      .domain(xLabelsPage)
      .range([margin.left, margin.left + innerWidth])
      .padding(0.02);

    const y = scaleBand()
      .domain(yLabelsPage)
      .range([margin.top, margin.top + innerHeight])
      .padding(0.02);

    const valuesPage = data.values.filter(
      (d) =>
        xLabelsPage.includes(d.city) &&
        yLabelsPage.includes(d.categoryLabel)
    );

    const nonZeroValues = valuesPage
      .filter((d) => d.value > 0)
      .map((d) => d.value);

    const maxValue = nonZeroValues.length ? max(nonZeroValues) : 0;

    const valueColor = (v) => {
      if (!maxValue || v <= 0) return colors.primary[700];
      const ratio = v / maxValue;
      const t = 0.25 + 0.75 * Math.sqrt(ratio);
      return interpolateGreens(t);
    };
    // const valueColor = (v) => {
    //   if (!maxValue || v <= 0) return colors.primary[700];

    //   const ratio = v / maxValue; // 0 → min, 1 → max

    //   // Keep away from extreme ends so colors stay nicely visible
    //   const t = 0.1 + 0.9 * ratio; // 0.1 ≈ dark red, 0.9 ≈ strong green

    //   // interpolateRdYlGn(0) = red, 0.5 = yellow, 1 = green
    //   return interpolateRdYlGn(t);
    // };


    const grayColor = (v) => {
      if (!maxValue || v <= 0) {
        return "rgba(80, 80, 80, 0.9)";
      }
      const ratio = v / maxValue;
      const base = 80;
      const span = 120;
      const val = Math.round(base + span * Math.sqrt(ratio)); // 80–200
      return `rgb(${val},${val},${val})`;
    };

    return {
      xScale: x,
      yScale: y,
      valueColor,
      grayColor,
      valuesPage,
      xLabelsPage,
      yLabelsPage,
    };
  }, [
    data,
    size,
    margin.bottom,
    margin.left,
    margin.right,
    margin.top,
    colors.primary,
    colors.grey,
    page,
  ]);

  const getRelativePosition = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const bounds = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    };
  };

  if (!xScale || !yScale) {
    return (
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
      >
        <Typography
          variant="body2"
          color={colors.grey[100]}
          sx={{ p: 1 }}
        >
          Loading heatmap...
        </Typography>
      </div>
    );
  }

  const labelToMission = data.labelToMission || {};
  const isAllMode = !selectedMission || selectedMission === "ALL";

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      {/* Pagination controls inside chart area */}
      {pageCount > 1 && (
        <Box
          sx={{
            position: "absolute",
            right: 6,
            top: 4,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            backgroundColor: "rgba(0,0,0,0.4)",
            borderRadius: 1,
            px: 0.5,
            py: 0.25,
            zIndex: 5,
          }}
        >
          <IconButton
            size="small"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            sx={{ color: colors.grey[100], p: 0.25 }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="caption"
            sx={{ color: colors.grey[100], fontSize: 10 }}
          >
            {page + 1}/{pageCount}
          </Typography>
          <IconButton
            size="small"
            onClick={() =>
              setPage((p) => Math.min(pageCount - 1, p + 1))
            }
            disabled={page === pageCount - 1}
            sx={{ color: colors.grey[100], p: 0.25 }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

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
          x={size.width * 0.35}
          y={margin.top - 13}
          textAnchor="middle"
          fontSize={14}
          fontWeight={600}
          fill={colors.grey[100]}
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        >
          {title}
        </text>

        {/* Cells */}
        <g>
          {valuesPage.map((d, i) => {
            const x = xScale(d.city);
            const y = yScale(d.categoryLabel);
            if (x == null || y == null) return null;

            const isSelected =
              !isAllMode && d.mission === selectedMission;

            const baseColor = isAllMode
              ? valueColor(d.value)
              : isSelected
              ? valueColor(d.value)
              : grayColor(d.value);

            const opacity =
              d.value <= 0
                ? 0.12
                : isAllMode || isSelected
                ? 0.95
                : 0.4;

            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={xScale.bandwidth()}
                height={yScale.bandwidth()}
                fill={baseColor}
                opacity={opacity}
                rx={3}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => {
                  const pos = getRelativePosition(e);
                  setHoverInfo({
                    x: pos.x,
                    y: pos.y,
                    city: d.city,
                    categoryLabel: d.categoryLabel,
                    mission: d.mission,
                    value: d.value,
                  });
                }}
                onMouseMove={(e) => {
                  const pos = getRelativePosition(e);
                  setHoverInfo((prev) =>
                    prev ? { ...prev, x: pos.x, y: pos.y } : prev
                  );
                }}
                onMouseLeave={() => setHoverInfo(null)}
                onClick={() => {
                  if (onMissionRowClick) {
                    onMissionRowClick(d.mission);
                  }
                }}
              />
            );
          })}
        </g>

        {/* X-axis labels (cities) */}
        <g>
          {xLabelsPage.map((city) => {
            const x = xScale(city);
            if (x == null) return null;
            const labelY = size.height - margin.bottom + 18;
            const cx = x + xScale.bandwidth() / 2;

            return (
              <text
                key={city}
                x={cx}
                y={labelY}
                textAnchor="end"
                transform={`rotate(-45 ${cx}, ${labelY})`}
                fontSize={9}
                fill={colors.grey[100]}
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
              >
                {city}
              </text>
            );
          })}
        </g>

        {/* Y-axis labels (categories) */}
        <g>
          {yLabelsPage.map((cat) => {
            const y = yScale(cat);
            if (y == null) return null;

            const mission = labelToMission[cat];
            const highlighted =
              isAllMode ||
              (mission && mission === selectedMission);

            return (
              <text
                key={cat}
                x={margin.left - 8}
                y={y + yScale.bandwidth() / 2}
                textAnchor="end"
                dy="0.35em"
                fontSize={9}
                fill={
                  highlighted
                    ? colors.grey[100]
                    : colors.grey[500]
                }
                fontWeight={highlighted ? 600 : 400}
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
                style={{ cursor: mission ? "pointer" : "default" }}
                onClick={() => {
                  if (mission && onMissionRowClick) {
                    onMissionRowClick(mission);
                  }
                }}
              >
                {cat}
              </text>
            );
          })}
        </g>

        {/* Axis titles */}
        <text
          x={size.width / 2}
          y={size.height - 6}
          textAnchor="middle"
          fontSize={11}
          fill={colors.grey[100]}
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        >
          City (Top 10 by Total Revenue)
        </text>

        <text
          x={20}
          y={
            margin.top +
            (size.height - margin.top - margin.bottom) / 2
          }
          textAnchor="middle"
          fontSize={11}
          fill={colors.grey[100]}
          transform={`rotate(-90 20, ${
            margin.top +
            (size.height - margin.top - margin.bottom) / 2
          })`}
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        >
          NTEE Category
        </text>
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
            borderRadius: "8px",
            fontSize: 12,
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            boxShadow: "0 8px 18px rgba(0,0,0,0.4)",
            pointerEvents: "none",
            maxWidth: 260,
            lineHeight: 1.4,
            zIndex: 10,
            border: `1px solid ${colors.grey[300]}`,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {hoverInfo.city} · {hoverInfo.categoryLabel}
          </div>
          <div>
            Avg: $
            {hoverInfo.value.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatmapBase;
