// // import React, { useMemo, useRef, useLayoutEffect, useState } from "react";
// // import { scaleBand, scaleSequential } from "d3-scale";
// // import { max } from "d3-array";
// // import { interpolateBlues } from "d3-scale-chromatic";
// // import { rgb } from "d3";

// // const Heatmap = ({ data }) => {
// //   const containerRef = useRef(null);
// //   const [size, setSize] = useState({ width: 800, height: 400 });
// //   const [hoverInfo, setHoverInfo] = useState(null);

// //   // Extra space for rotated x labels
// //   const margin = { top: 40, right: 20, bottom: 90, left: 140 };

// //   // Measure container (responsive)
// //   useLayoutEffect(() => {
// //     if (!containerRef.current) return;

// //     const observer = new ResizeObserver((entries) => {
// //       const rect = entries[0].contentRect;
// //       const width = Math.max(rect.width, 300);
// //       const height = Math.max(rect.height, 250);
// //       setSize({ width, height });
// //     });

// //     observer.observe(containerRef.current);
// //     return () => observer.disconnect();
// //   }, []);

// //   const { xScale, yScale, colorScale, values, xLabels, yLabels } = useMemo(() => {
// //     if (!data || !data.values || !data.xLabels || !data.yLabels) {
// //       return {
// //         xScale: null,
// //         yScale: null,
// //         colorScale: () => "#f5f5f5",
// //         values: [],
// //         xLabels: [],
// //         yLabels: []
// //       };
// //     }

// //     const innerWidth = Math.max(size.width - margin.left - margin.right, 10);
// //     const innerHeight = Math.max(size.height - margin.top - margin.bottom, 10);

// //     const x = scaleBand()
// //       .domain(data.xLabels)
// //       .range([margin.left, margin.left + innerWidth])
// //       .padding(0.05);

// //     const y = scaleBand()
// //       .domain(data.yLabels)
// //       .range([margin.top, margin.top + innerHeight])
// //       .padding(0.05);

// //     const maxValue = max(data.values, (d) => d.value) || 0;

// //     // Stronger blue scale: 0 is very light, max is deep blue
// //     const color =
// //       maxValue > 0
// //         ? scaleSequential(interpolateBlues).domain([0, maxValue])
// //         : () => "#e5e7eb";

// //     return {
// //       xScale: x,
// //       yScale: y,
// //       colorScale: color,
// //       values: data.values,
// //       xLabels: data.xLabels,
// //       yLabels: data.yLabels
// //     };
// //   }, [data, size, margin.bottom, margin.left, margin.right, margin.top]);

// //   const getRelativePosition = (e) => {
// //     if (!containerRef.current) return { x: 0, y: 0 };
// //     const bounds = containerRef.current.getBoundingClientRect();
// //     return {
// //       x: e.clientX - bounds.left,
// //       y: e.clientY - bounds.top
// //     };
// //   };

// //   if (!xScale || !yScale) {
// //     return (
// //       <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
// //         Loading Heatmap...
// //       </div>
// //     );
// //   }

// //   return (
// //     <div
// //       ref={containerRef}
// //       style={{
// //         width: "100%",
// //         height: "100%",
// //         minHeight: 320,
// //         position: "relative"
// //       }}
// //     >
// //       <svg
// //         viewBox={`0 0 ${size.width} ${size.height}`}
// //         style={{
// //           width: "99%",
// //           height: "100%",
// //           background: rgb(244, 244, 244),
// //           borderRadius: "12px",
// //           boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
// //           display: "block"
// //         }}
// //       >
// //         {/* Title */}
// //         <text
// //           x={size.width / 2}
// //           y={20}
// //           textAnchor="middle"
// //           fontSize={14}
// //           fontWeight={600}
// //           fill="#0f172a"
// //           fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
// //         >
// //           Average Revenue by City &amp; NTEE Category
// //         </text>

// //         {/* Cells */}
// //         <g>
// //           {values.map((d, i) => {
// //             const x = xScale(d.city);
// //             const y = yScale(d.category);
// //             if (x == null || y == null) return null;

// //             return (
// //               <rect
// //                 key={i}
// //                 x={x}
// //                 y={y}
// //                 width={xScale.bandwidth()}
// //                 height={yScale.bandwidth()}
// //                 fill={d.value > 0 ? colorScale(d.value) : "#f9fafb"}
// //                 rx={3}
// //                 style={{ cursor: d.value ? "pointer" : "default" }}
// //                 onMouseEnter={(e) => {
// //                   const pos = getRelativePosition(e);
// //                   setHoverInfo({
// //                     x: pos.x,
// //                     y: pos.y,
// //                     city: d.city,
// //                     category: d.category,
// //                     value: d.value
// //                   });
// //                 }}
// //                 onMouseMove={(e) => {
// //                   const pos = getRelativePosition(e);
// //                   setHoverInfo((prev) =>
// //                     prev ? { ...prev, x: pos.x, y: pos.y } : prev
// //                   );
// //                 }}
// //                 onMouseLeave={() => setHoverInfo(null)}
// //               />
// //             );
// //           })}
// //         </g>

// //         {/* X-axis labels (cities) */}
// //         <g>
// //           {xLabels.map((city) => {
// //             const x = xScale(city);
// //             if (x == null) return null;
// //             const labelY = size.height - margin.bottom + 20;
// //             const cx = x + xScale.bandwidth() / 2;

// //             return (
// //               <text
// //                 key={city}
// //                 x={cx}
// //                 y={labelY}
// //                 textAnchor="end"
// //                 transform={`rotate(-45 ${cx}, ${labelY})`}
// //                 fontSize={10}
// //                 fill="#111827"
// //                 fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
// //               >
// //                 {city}
// //               </text>
// //             );
// //           })}
// //         </g>

// //         {/* Y-axis labels (categories) */}
// //         <g>
// //           {yLabels.map((cat) => {
// //             const y = yScale(cat);
// //             if (y == null) return null;
// //             return (
// //               <text
// //                 key={cat}
// //                 x={margin.left - 8}
// //                 y={y + yScale.bandwidth() / 2}
// //                 textAnchor="end"
// //                 dy="0.35em"
// //                 fontSize={10}
// //                 fill="#111827"
// //                 fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
// //               >
// //                 {cat}
// //               </text>
// //             );
// //           })}
// //         </g>

// //         {/* Axis titles */}
// //         <text
// //           x={size.width / 2}
// //           y={size.height - 8}
// //           textAnchor="middle"
// //           fontSize={12}
// //           fill="#374151"
// //           fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
// //         >
// //           City (Top 20 by Total Revenue)
// //         </text>

// //         <text
// //           x={16}
// //           y={margin.top + (size.height - margin.top - margin.bottom) / 2}
// //           textAnchor="middle"
// //           fontSize={12}
// //           fill="#374151"
// //           transform={`rotate(-90 16, ${
// //             margin.top + (size.height - margin.top - margin.bottom) / 2
// //           })`}
// //           fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
// //         >
// //           NTEE Category
// //         </text>
// //       </svg>

// //       {/* Tooltip */}
// //       {hoverInfo && (
// //         <div
// //           style={{
// //             position: "absolute",
// //             left: hoverInfo.x + 12,
// //             top: hoverInfo.y + 12,
// //             background: "rgba(15,23,42,0.96)",
// //             color: "#f9fafb",
// //             padding: "8px 12px",
// //             borderRadius: "10px",
// //             fontSize: 12,
// //             fontFamily:
// //               "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
// //             boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
// //             pointerEvents: "none",
// //             maxWidth: 260,
// //             lineHeight: 1.4,
// //             zIndex: 10
// //           }}
// //         >
// //           <div style={{ fontWeight: 600, marginBottom: 4 }}>
// //             {hoverInfo.city} · {hoverInfo.category}
// //           </div>
// //           <div>
// //             Average revenue:{" "}
// //             {hoverInfo.value.toLocaleString(undefined, {
// //               maximumFractionDigits: 0
// //             })}
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default Heatmap;


// import React, { useMemo, useRef, useLayoutEffect, useState } from "react";
// import { scaleBand } from "d3-scale";
// import { max } from "d3-array";
// import { interpolateBlues } from "d3-scale-chromatic";
// import { rgb } from "d3";

// const Heatmap = ({ data }) => {
//   const containerRef = useRef(null);
//   const [size, setSize] = useState({ width: 800, height: 400 });
//   const [hoverInfo, setHoverInfo] = useState(null);

//   // Slightly smaller bottom margin so the grid isn't squished
//   const margin = { top: 40, right: 20, bottom: 90, left: 140 };

//   // Measure container (responsive)
//   useLayoutEffect(() => {
//     if (!containerRef.current) return;

//     const observer = new ResizeObserver((entries) => {
//       const rect = entries[0].contentRect;
//       const width = Math.max(rect.width, 300);
//       const height = Math.max(rect.height, 260); // a bit taller
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
//         yLabels: []
//       };
//     }

//     const innerWidth = Math.max(size.width - margin.left - margin.right, 10);
//     const innerHeight = Math.max(size.height - margin.top - margin.bottom, 10);

//     const x = scaleBand()
//       .domain(data.xLabels)
//       .range([margin.left, margin.left + innerWidth])
//       .padding(0.02); // less padding → cells use more space

//     const y = scaleBand()
//       .domain(data.yLabels)
//       .range([margin.top, margin.top + innerHeight])
//       .padding(0.02);

//     const nonZeroValues = data.values
//       .filter((d) => d.value > 0)
//       .map((d) => d.value);

//     const maxValue = nonZeroValues.length ? max(nonZeroValues) : 0;

//     // Color: force non-zero cells to be visibly blue
//     // t ranges from 0.25 (light) to 1.0 (deep)
//     const color = (v) => {
//       if (!maxValue || v <= 0) return "#f1f5f9"; // light gray for zero
//       const ratio = v / maxValue; // 0..1
//       const t = 0.25 + 0.75 * Math.sqrt(ratio); // sqrt boosts small values
//       return interpolateBlues(t);
//     };

//     return {
//       xScale: x,
//       yScale: y,
//       colorScale: color,
//       values: data.values,
//       xLabels: data.xLabels,
//       yLabels: data.yLabels
//     };
//   }, [data, size, margin.bottom, margin.left, margin.right, margin.top]);

//   const getRelativePosition = (e) => {
//     if (!containerRef.current) return { x: 0, y: 0 };
//     const bounds = containerRef.current.getBoundingClientRect();
//     return {
//       x: e.clientX - bounds.left,
//       y: e.clientY - bounds.top
//     };
//   };

//   if (!xScale || !yScale) {
//     return (
//       <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
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
//         minHeight: 380, // more vertical room overall
//         position: "relative"
//       }}
//     >
//       <svg
//         viewBox={`0 0 ${size.width} ${size.height}`}
//         style={{
//           width: "99%",
//           height: "100%",
//           background: rgb(244, 244, 244),
//           borderRadius: "12px",
//           boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
//           display: "block"
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
//           Average Revenue by City &amp; NTEE Category
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
//                     value: d.value
//                   });
//                 }}
//                 onMouseMove={(e) => {
//                   const pos = getRelativePosition(e);
//                   setHoverInfo((prev) =>
//                     prev ? { ...prev, x: pos.x, y: pos.y } : prev
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
//             zIndex: 10
//           }}
//         >
//           <div style={{ fontWeight: 600, marginBottom: 4 }}>
//             {hoverInfo.city} · {hoverInfo.category}
//           </div>
//           <div>
//             Average revenue:{" "}
//             {hoverInfo.value.toLocaleString(undefined, {
//               maximumFractionDigits: 0
//             })}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Heatmap;

import React, { useMemo, useRef, useLayoutEffect, useState } from "react";
import { scaleBand } from "d3-scale";
import { max } from "d3-array";
import { interpolateBlues } from "d3-scale-chromatic";
import { rgb } from "d3";

const Heatmap = ({ data }) => {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 400 });
  const [hoverInfo, setHoverInfo] = useState(null);

  // Margins around the heatmap
  const margin = { top: 40, right: 20, bottom: 80, left: 140 };

  // Measure container (responsive)
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      const width = Math.max(rect.width, 300);
      const height = Math.max(rect.height, 200); // parent controls height; this is just a minimum
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
        colorScale: () => "#f5f5f5",
        values: [],
        xLabels: [],
        yLabels: []
      };
    }

    const innerWidth = Math.max(size.width - margin.left - margin.right, 10);
    const innerHeight = Math.max(size.height - margin.top - margin.bottom, 10);

    const x = scaleBand()
      .domain(data.xLabels)
      .range([margin.left, margin.left + innerWidth])
      .padding(0.02); // small padding → cells take more space

    const y = scaleBand()
      .domain(data.yLabels)
      .range([margin.top, margin.top + innerHeight])
      .padding(0.02);

    const nonZeroValues = data.values
      .filter((d) => d.value > 0)
      .map((d) => d.value);

    const maxValue = nonZeroValues.length ? max(nonZeroValues) : 0;

    // Color: force non-zero cells to be visibly blue.
    // t ranges from 0.25 (light) to 1.0 (deep blue).
    const color = (v) => {
      if (!maxValue || v <= 0) return "#f1f5f9"; // light gray for zero
      const ratio = v / maxValue; // 0..1
      const t = 0.25 + 0.75 * Math.sqrt(ratio); // sqrt boosts small values visually
      return interpolateBlues(t);
    };

    return {
      xScale: x,
      yScale: y,
      colorScale: color,
      values: data.values,
      xLabels: data.xLabels,
      yLabels: data.yLabels
    };
  }, [data, size, margin.bottom, margin.left, margin.right, margin.top]);

  const getRelativePosition = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const bounds = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top
    };
  };

  if (!xScale || !yScale) {
    return (
      <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
        Loading Heatmap...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%", // parent decides the height
        position: "relative"
      }}
    >
      <svg
        viewBox={`0 0 ${size.width} ${size.height}`}
        style={{
          width: "99%",
          height: "100%",
          background: rgb(244, 244, 244),
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
          display: "block"
        }}
      >
        {/* Title */}
        <text
          x={size.width / 2}
          y={22}
          textAnchor="middle"
          fontSize={14}
          fontWeight={600}
          fill="#0f172a"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        >
          Average Revenue by City &amp; NTEE Category
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
                    value: d.value
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
                fontSize={10}
                fill="#111827"
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
                fontSize={10}
                fill="#111827"
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
          fontSize={12}
          fill="#374151"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        >
          City (Top 20 by Total Revenue)
        </text>

        <text
          x={16}
          y={margin.top + (size.height - margin.top - margin.bottom) / 2}
          textAnchor="middle"
          fontSize={12}
          fill="#374151"
          transform={`rotate(-90 16, ${
            margin.top + (size.height - margin.top - margin.bottom) / 2
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
            background: "rgba(15,23,42,0.96)",
            color: "#f9fafb",
            padding: "8px 12px",
            borderRadius: "10px",
            fontSize: 12,
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
            pointerEvents: "none",
            maxWidth: 260,
            lineHeight: 1.4,
            zIndex: 10
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {hoverInfo.city} · {hoverInfo.category}
          </div>
          <div>
            Average revenue:{" "}
            {hoverInfo.value.toLocaleString(undefined, {
              maximumFractionDigits: 0
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Heatmap;
