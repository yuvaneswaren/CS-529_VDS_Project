// // src/components/HeatmapBase.jsx
// import React, {
//   useMemo,
//   useRef,
//   useLayoutEffect,
//   useState,
// } from "react";
// import { scaleBand } from "d3-scale";
// import { max } from "d3-array";
// import { interpolateBlues } from "d3-scale-chromatic";
// import { rgb } from "d3-color";

// const HeatmapBase = ({ data, title = "Average Revenue by City & NTEE Category" }) => {
//   const containerRef = useRef(null);
//   const [size, setSize] = useState({ width: 800, height: 400 });
//   const [hoverInfo, setHoverInfo] = useState(null);

//   // Margins around the heatmap
//   const margin = { top: 40, right: 20, bottom: 80, left: 140 };

//   // Measure container (responsive)
//   useLayoutEffect(() => {
//     if (!containerRef.current) return;

//     const observer = new ResizeObserver((entries) => {
//       const rect = entries[0].contentRect;
//       const width = Math.max(rect.width, 300);
//       const height = Math.max(rect.height, 200);
//       setSize({ width, height });
//     });

//     observer.observe(containerRef.current);
//     return () => observer.disconnect();
//   }, []);

//   const { xScale, yScale, colorScale, values, xLabels, yLabels } = useMemo(() => {
//     if (!data || !data.values || !data.xLabels || !data.yLabels) {
//       return {
//         xScale: null,
//         yScale: null,
//         colorScale: () => "#f5f5f5",
//         values: [],
//         xLabels: [],
//         yLabels: [],
//       };
//     }

//     const innerWidth = Math.max(
//       size.width - margin.left - margin.right,
//       10
//     );
//     const innerHeight = Math.max(
//       size.height - margin.top - margin.bottom,
//       10
//     );

//     const x = scaleBand()
//       .domain(data.xLabels)
//       .range([margin.left, margin.left + innerWidth])
//       .padding(0.02);

//     const y = scaleBand()
//       .domain(data.yLabels)
//       .range([margin.top, margin.top + innerHeight])
//       .padding(0.02);

//     const nonZeroValues = data.values
//       .filter((d) => d.value > 0)
//       .map((d) => d.value);

//     const maxValue = nonZeroValues.length ? max(nonZeroValues) : 0;

//     const color = (v) => {
//       if (!maxValue || v <= 0) return "#f1f5f9"; // light gray for zero
//       const ratio = v / maxValue;
//       const t = 0.25 + 0.75 * Math.sqrt(ratio); // boost small values
//       return interpolateBlues(t);
//     };

//     return {
//       xScale: x,
//       yScale: y,
//       colorScale: color,
//       values: data.values,
//       xLabels: data.xLabels,
//       yLabels: data.yLabels,
//     };
//   }, [data, size, margin.bottom, margin.left, margin.right, margin.top]);

//   const getRelativePosition = (e) => {
//     if (!containerRef.current) return { x: 0, y: 0 };
//     const bounds = containerRef.current.getBoundingClientRect();
//     return {
//       x: e.clientX - bounds.left,
//       y: e.clientY - bounds.top,
//     };
//   };

//   if (!xScale || !yScale) {
//     return (
//       <div
//         ref={containerRef}
//         style={{ width: "100%", height: "100%" }}
//       >
//         Loading Heatmap...
//       </div>
//     );
//   }

//   return (
//     <div
//       ref={containerRef}
//       style={{
//         width: "100%",
//         height: "100%",
//         position: "relative",
//       }}
//     >
//       <svg
//         viewBox={`0 0 ${size.width} ${size.height}`}
//         style={{
//           width: "99%",
//           height: "100%",
//           background: rgb(244, 244, 244),
//           borderRadius: "12px",
//           display: "block",
//         }}
//       >
//         {/* Title */}
//         <text
//           x={size.width / 2}
//           y={22}
//           textAnchor="middle"
//           fontSize={14}
//           fontWeight={600}
//           fill="#0f172a"
//           fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
//         >
//           {title}
//         </text>

//         {/* Cells */}
//         <g>
//           {values.map((d, i) => {
//             const x = xScale(d.city);
//             const y = yScale(d.category);
//             if (x == null || y == null) return null;

//             return (
//               <rect
//                 key={i}
//                 x={x}
//                 y={y}
//                 width={xScale.bandwidth()}
//                 height={yScale.bandwidth()}
//                 fill={colorScale(d.value)}
//                 rx={3}
//                 style={{ cursor: d.value ? "pointer" : "default" }}
//                 onMouseEnter={(e) => {
//                   const pos = getRelativePosition(e);
//                   setHoverInfo({
//                     x: pos.x,
//                     y: pos.y,
//                     city: d.city,
//                     category: d.category,
//                     value: d.value,
//                   });
//                 }}
//                 onMouseMove={(e) => {
//                   const pos = getRelativePosition(e);
//                   setHoverInfo((prev) =>
//                     prev ? { ...prev, ...getRelativePosition(e) } : prev
//                   );
//                 }}
//                 onMouseLeave={() => setHoverInfo(null)}
//               />
//             );
//           })}
//         </g>

//         {/* X-axis labels (cities) */}
//         <g>
//           {xLabels.map((city) => {
//             const x = xScale(city);
//             if (x == null) return null;
//             const labelY = size.height - margin.bottom + 18;
//             const cx = x + xScale.bandwidth() / 2;

//             return (
//               <text
//                 key={city}
//                 x={cx}
//                 y={labelY}
//                 textAnchor="end"
//                 transform={`rotate(-45 ${cx}, ${labelY})`}
//                 fontSize={10}
//                 fill="#111827"
//                 fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
//               >
//                 {city}
//               </text>
//             );
//           })}
//         </g>

//         {/* Y-axis labels (categories) */}
//         <g>
//           {yLabels.map((cat) => {
//             const y = yScale(cat);
//             if (y == null) return null;
//             return (
//               <text
//                 key={cat}
//                 x={margin.left - 8}
//                 y={y + yScale.bandwidth() / 2}
//                 textAnchor="end"
//                 dy="0.35em"
//                 fontSize={10}
//                 fill="#111827"
//                 fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
//               >
//                 {cat}
//               </text>
//             );
//           })}
//         </g>

//         {/* Axis titles */}
//         <text
//           x={size.width / 2}
//           y={size.height - 6}
//           textAnchor="middle"
//           fontSize={12}
//           fill="#374151"
//           fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
//         >
//           City (Top 20 by Total Revenue)
//         </text>

//         <text
//           x={16}
//           y={margin.top + (size.height - margin.top - margin.bottom) / 2}
//           textAnchor="middle"
//           fontSize={12}
//           fill="#374151"
//           transform={`rotate(-90 16, ${
//             margin.top + (size.height - margin.top - margin.bottom) / 2
//           })`}
//           fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
//         >
//           NTEE Category
//         </text>
//       </svg>

//       {/* Tooltip */}
//       {hoverInfo && (
//         <div
//           style={{
//             position: "absolute",
//             left: hoverInfo.x + 12,
//             top: hoverInfo.y + 12,
//             background: "rgba(15,23,42,0.96)",
//             color: "#f9fafb",
//             padding: "8px 12px",
//             borderRadius: "10px",
//             fontSize: 12,
//             fontFamily:
//               "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
//             boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
//             pointerEvents: "none",
//             maxWidth: 260,
//             lineHeight: 1.4,
//             zIndex: 10,
//           }}
//         >
//           <div style={{ fontWeight: 600, marginBottom: 4 }}>
//             {hoverInfo.city} · {hoverInfo.category}
//           </div>
//           <div>
//             Average revenue:{" "}
//             {hoverInfo.value.toLocaleString(undefined, {
//               maximumFractionDigits: 0,
//             })}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default HeatmapBase;

// src/components/HeatmapBase.jsx
import React, {
  useMemo,
  useRef,
  useLayoutEffect,
  useState,
} from "react";
import { scaleBand } from "d3-scale";
import { max } from "d3-array";
import { interpolateBlues } from "d3-scale-chromatic";
import { useTheme, Typography } from "@mui/material";
import { tokens } from "../theme";

const HeatmapBase = ({
  data,
  title = "Average Revenue by City & NTEE Category",
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 400 });
  const [hoverInfo, setHoverInfo] = useState(null);

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

  const { xScale, yScale, colorScale, values, xLabels, yLabels } = useMemo(() => {
    if (!data || !data.values || !data.xLabels || !data.yLabels) {
      return {
        xScale: null,
        yScale: null,
        colorScale: () => colors.primary[400],
        values: [],
        xLabels: [],
        yLabels: [],
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

    const x = scaleBand()
      .domain(data.xLabels)
      .range([margin.left, margin.left + innerWidth])
      .padding(0.02);

    const y = scaleBand()
      .domain(data.yLabels)
      .range([margin.top, margin.top + innerHeight])
      .padding(0.02);

    const nonZeroValues = data.values
      .filter((d) => d.value > 0)
      .map((d) => d.value);

    const maxValue = nonZeroValues.length ? max(nonZeroValues) : 0;

    // Color: non-zero cells in blue scale, zero cells in subtle theme-matching color
    const color = (v) => {
      if (!maxValue || v <= 0) return colors.primary[500]; // subtle background-ish color
      const ratio = v / maxValue;
      const t = 0.25 + 0.75 * Math.sqrt(ratio);
      return interpolateBlues(t);
    };

    return {
      xScale: x,
      yScale: y,
      colorScale: color,
      values: data.values,
      xLabels: data.xLabels,
      yLabels: data.yLabels,
    };
  }, [
    data,
    size,
    margin.bottom,
    margin.left,
    margin.right,
    margin.top,
    colors.primary,
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
          // Let the parent MUI Box background show through
          background: "transparent",
          display: "block",
        }}
      >
        {/* Title (use theme colors instead of hardcoded) */}
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
          {values.map((d, i) => {
            const x = xScale(d.city);
            const y = yScale(d.category);
            if (x == null || y == null) return null;

            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={xScale.bandwidth()}
                height={yScale.bandwidth()}
                fill={colorScale(d.value)}
                rx={3}
                style={{ cursor: d.value ? "pointer" : "default" }}
                onMouseEnter={(e) => {
                  const pos = getRelativePosition(e);
                  setHoverInfo({
                    x: pos.x,
                    y: pos.y,
                    city: d.city,
                    category: d.category,
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
              />
            );
          })}
        </g>

        {/* X-axis labels (cities) */}
        <g>
          {xLabels.map((city) => {
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
          {yLabels.map((cat) => {
            const y = yScale(cat);
            if (y == null) return null;
            return (
              <text
                key={cat}
                x={margin.left - 8}
                y={y + yScale.bandwidth() / 2}
                textAnchor="end"
                dy="0.35em"
                fontSize={9}
                fill={colors.grey[100]}
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
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
          y={margin.top + (size.height - margin.top - margin.bottom) / 2}
          textAnchor="middle"
          fontSize={11}
          fill={colors.grey[100]}
          transform={`rotate(-90 20, ${
            margin.top + (size.height - margin.top - margin.bottom) / 2
          })`}
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        >
          NTEE Category
        </text>
      </svg>

      {/* Tooltip – themed to match the dashboard */}
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
            {hoverInfo.city} · {hoverInfo.category}
          </div>
          <div>
            Avg:{" "}$
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
