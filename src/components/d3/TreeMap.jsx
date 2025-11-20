// // src/components/TreeMap.jsx
// import React, { useState, useRef } from "react";
// import * as d3 from "d3";
// import useD3 from "./useD3";
// import "./treemap.css";

// export default function TreeMap({ data }) {
//   const [currentNode, setCurrentNode] = useState(null);
//   const [tooltip, setTooltip] = useState({
//     show: false,
//     x: 0,
//     y: 0,
//     content: "",
//   });

//   const rootRef = useRef(null);
//   const zoomRef = useRef(null);

//   const ref = useD3((container) => {
//     if (!data) return;

//     // Clear any previous render
//     d3.select(container).selectAll("*").remove();

//     const legendWidth = 200;
//     const padding = { top: 16, right: legendWidth + 16, bottom: 16, left: 16 };

//     const fullWidth = container.clientWidth || 800;
//     const fullHeight = container.clientHeight || 500;

//     const width = Math.max(300, fullWidth - padding.left - padding.right);
//     const height = Math.max(300, fullHeight - padding.top - padding.bottom);

//     // ---- Build hierarchy ----
//     const root = d3
//       .hierarchy(data)
//       .sum((d) => d.value || 1)
//       .sort((a, b) => (b.value || 0) - (a.value || 0));

//     d3
//       .treemap()
//       .size([width, height])
//       .paddingInner(3)
//       .paddingOuter(2)(root);

//     rootRef.current = root;
//     setCurrentNode(root);

//     // ---- SVG + main group ----
//     const svg = d3
//       .select(container)
//       .append("svg")
//       .attr("class", "treemap-svg")
//       .attr("width", fullWidth)
//       .attr("height", fullHeight);

//     const gMain = svg
//       .append("g")
//       .attr("transform", `translate(${padding.left},${padding.top})`);

//     // ---- Colors by top-level category ----
//     const categories = (root.children || []).map((d) => d.data.name);

//     const colorScale = d3
//       .scaleOrdinal()
//       .domain(categories.length ? categories : ["_dummy_"])
//       .range(
//         (categories.length ? categories : ["_dummy_"]).map((_, i) =>
//           d3.interpolateTurbo(
//             categories.length > 1 ? i / (categories.length - 1) : 0.5
//           )
//         )
//       );

//     function getColor(d) {
//       if (!d.parent) return "#dddddd"; // root
//       if (d.parent === root) return colorScale(d.data.name); // top-level
//       const base = colorScale(d.parent.data.name);
//       return d3.color(base).brighter(0.7); // children lighter
//     }

//     // ---- Zoom function (no text scaling, legend unaffected) ----
//     function zoomTo(node) {
//       if (!node) return;

//       const { x0, x1, y0, y1 } = node;
//       const kx = width / (x1 - x0 || 1);
//       const ky = height / (y1 - y0 || 1);

//       const maxScale = 3; // cap zoom so it doesn't explode
//       const sx = Math.min(kx, maxScale);
//       const sy = Math.min(ky, maxScale);

//       // Move each node into new viewport (translate only)
//       gMain
//         .selectAll(".treemap-node")
//         .transition()
//         .duration(600)
//         .attr("transform", (d) => {
//           const tx = (d.x0 - x0) * sx;
//           const ty = (d.y0 - y0) * sy;
//           return `translate(${tx},${ty})`;
//         });

//       // Resize rects
//       gMain
//         .selectAll(".treemap-node rect")
//         .transition()
//         .duration(600)
//         .attr("width", (d) => (d.x1 - d.x0) * sx)
//         .attr("height", (d) => (d.y1 - d.y0) * sy);

//       // Reposition labels, keep font size constant
//       gMain
//         .selectAll(".treemap-node text.treemap-label")
//         .transition()
//         .duration(600)
//         .attr("x", 6)
//         .attr("y", (d) => {
//           const h = (d.y1 - d.y0) * sy;
//           return Math.min(18, Math.max(12, h / 2));
//         })
//         .style("opacity", (d) => {
//           const w = (d.x1 - d.x0) * sx;
//           const h = (d.y1 - d.y0) * sy;
//           return w > 40 && h > 24 ? 1 : 0;
//         });
//     }

//     zoomRef.current = zoomTo;

//     // ---- Draw nodes ----
//     const nodes = gMain
//       .selectAll(".treemap-node")
//       .data(root.descendants())
//       .join("g")
//       .attr("class", "treemap-node")
//       .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
//       .on("click", (event, d) => {
//         event.stopPropagation();

//         // If it's a leaf/org (depth >= 2), zoom to its category
//         let target = d;
//         if (d.depth >= 2 && d.parent) {
//           target = d.parent;
//         }

//         setCurrentNode(target);
//         zoomTo(target);
//       })
//       .on("mousemove", (event, d) => {
//         const rect = container.getBoundingClientRect();

//         const content = [
//           `Name: ${d.data.name || ""}`,
//           `EIN: ${d.data.ein || "-"}`,
//           `Amount: $${d.value?.toLocaleString() || "-"}`,
//         ].join("\n");

//         // Raw position relative to container
//         let x = event.clientX - rect.left + 12;
//         let y = event.clientY - rect.top + 12;

//         // Approx tooltip size, should match CSS max-width
//         const tooltipWidth = 260;
//         const tooltipHeight = 100;
//         const pad = 8;

//         const maxX = rect.width - tooltipWidth - pad;
//         const maxY = rect.height - tooltipHeight - pad;

//         x = Math.min(Math.max(pad, x), Math.max(pad, maxX));
//         y = Math.min(Math.max(pad, y), Math.max(pad, maxY));

//         setTooltip({
//           show: true,
//           x,
//           y,
//           content,
//         });
//       })
//       .on("mouseleave", () => {
//         setTooltip((t) => ({ ...t, show: false }));
//       });

//     nodes
//       .append("rect")
//       .attr("class", "treemap-rect")
//       .attr("width", (d) => d.x1 - d.x0)
//       .attr("height", (d) => d.y1 - d.y0)
//       .attr("fill", getColor)
//       .attr("rx", 6)
//       .attr("ry", 6);

//     nodes
//       .append("text")
//       .attr("class", "treemap-label")
//       .attr("x", 6)
//       .attr("y", 16)
//       .text((d) => d.data.name)
//       .style("opacity", (d) =>
//         d.x1 - d.x0 > 40 && d.y1 - d.y0 > 24 ? 1 : 0
//       )
//       .style("font-size", (d) => {
//         const label = d.data.name || "";
//         const rectWidth = d.x1 - d.x0 - 10;
//         const rectHeight = d.y1 - d.y0 - 6;
//         if (!label || rectWidth <= 0 || rectHeight <= 0) return "0px";

//         const maxWidthSize = (rectWidth / label.length) * 1.6;
//         const maxHeightSize = rectHeight * 0.45;
//         const fontSize = Math.min(maxWidthSize, maxHeightSize, 14);
//         return `${fontSize}px`;
//       });

//     // ---- Click empty background → zoom to root ----
//     svg.on("click", () => {
//       setCurrentNode(root);
//       zoomTo(root);
//     });

//     // ---- Legend ----
//     const legend = svg
//       .append("g")
//       .attr("class", "treemap-legend")
//       .attr(
//         "transform",
//         `translate(${fullWidth - legendWidth + 12}, ${padding.top})`
//       );

//     legend
//       .append("text")
//       .attr("class", "legend-title")
//       .attr("x", 0)
//       .attr("y", 0)
//       .text("Categories");

//     const legendSize = 12;
//     const legendSpacing = 4;

//     (categories || []).slice(0, 12).forEach((cat, i) => {
//       const y = 18 + i * (legendSize + legendSpacing);
//       const row = legend.append("g").attr("transform", `translate(0,${y})`);

//       row
//         .append("rect")
//         .attr("width", legendSize)
//         .attr("height", legendSize)
//         .attr("rx", 3)
//         .attr("ry", 3)
//         .attr("fill", colorScale(cat));

//       row
//         .append("text")
//         .attr("x", legendSize + 6)
//         .attr("y", legendSize - 2)
//         .attr("class", "legend-label")
//         .text(cat);
//     });
//   }, [data]);

//   const handleReset = () => {
//     const root = rootRef.current;
//     if (!root || !zoomRef.current) return;
//     setCurrentNode(root);
//     zoomRef.current(root);
//   };

//   return (
//     <div className="treemap-wrapper">
//       <div ref={ref} className="treemap-canvas" />

//       {rootRef.current && currentNode && currentNode !== rootRef.current && (
//         <button className="zoom-out-btn" onClick={handleReset}>
//           ⟲ Reset view
//         </button>
//       )}

//       {tooltip.show && (
//         <div
//           className="treemap-tooltip"
//           style={{
//             left: tooltip.x,
//             top: tooltip.y,
//           }}
//         >
//           {tooltip.content}
//         </div>
//       )}
//     </div>
//   );
// }



// // src/components/TreeMap.jsx
// import React, { useState, useRef } from "react";
// import * as d3 from "d3";
// import useD3 from "./useD3";
// import "./treemap.css";

// export default function TreeMap({ data }) {
//   const [tooltip, setTooltip] = useState({
//     show: false,
//     x: 0,
//     y: 0,
//     content: "",
//   });

//   // This ref lets the React button trigger a reset to the root view
//   const resetRef = useRef(null);

//   const ref = useD3((container) => {
//     if (!data) return;

//     const legendWidthRoot = 200;
//     const padding = { top: 16, right: 16, bottom: 16, left: 16 };

//     const treemapLayout = d3
//       .treemap()
//       .paddingInner(3)
//       .paddingOuter(2);

//     // Full hierarchy for root view
//     const fullHierarchy = d3
//       .hierarchy(data)
//       .sum((d) => d.value || 1)
//       .sort((a, b) => (b.value || 0) - (a.value || 0));

//     const topCategories = (fullHierarchy.children || []).map(
//       (d) => d.data.name
//     );

//     const baseColorScale = d3
//       .scaleOrdinal()
//       .domain(topCategories.length ? topCategories : ["_dummy_"])
//       .range(
//         (topCategories.length ? topCategories : ["_dummy_"]).map((_, i) =>
//           d3.interpolateTurbo(
//             topCategories.length > 1 ? i / (topCategories.length - 1) : 0.5
//           )
//         )
//       );

//     /**
//      * Draw function
//      * @param {Object|null} nodeData - null → full root view, object → category root (drill-down)
//      */
//     function draw(nodeData) {
//       // Clear previous drawing
//       const sel = d3.select(container);
//       sel.selectAll("*").remove();

//       const fullWidth = container.clientWidth || 800;
//       const fullHeight = container.clientHeight || 500;

//       // Reserve legend space only in root view
//       const legendWidth = nodeData ? 0 : legendWidthRoot;
//       const width = Math.max(
//         300,
//         fullWidth - padding.left - padding.right - legendWidth
//       );
//       const height = Math.max(
//         300,
//         fullHeight - padding.top - padding.bottom
//       );

//       // Build hierarchy for current view
//       let root;
//       if (!nodeData) {
//         root = d3
//           .hierarchy(data)
//           .sum((d) => d.value || 1)
//           .sort((a, b) => (b.value || 0) - (a.value || 0));
//       } else {
//         // nodeData is the category's data object
//         root = d3
//           .hierarchy(nodeData)
//           .sum((d) => d.value || 1)
//           .sort((a, b) => (b.value || 0) - (a.value || 0));
//       }

//       treemapLayout.size([width, height])(root);

//       // Color function
//       let getColor;
//       if (!nodeData) {
//         // Root view: per-category colors, lighter for orgs
//         getColor = (d) => {
//           if (!d.parent) return "#dddddd";
//           if (d.parent === root) return baseColorScale(d.data.name);
//           const base = baseColorScale(d.parent.data.name);
//           return d3.color(base).brighter(0.7);
//         };
//       } else {
//         // Category view: all orgs use shades of the same category color
//         const baseColor = baseColorScale(nodeData.name) || "#4b5563";
//         getColor = (d) => {
//           if (!d.parent) return "#dddddd";
//           if (d.depth === 1) return baseColor; // org tiles
//           return d3.color(baseColor).brighter(0.7);
//         };
//       }

//       // SVG and main group
//       const svg = sel
//         .append("svg")
//         .attr("class", "treemap-svg")
//         .attr("width", fullWidth)
//         .attr("height", fullHeight);

//       const gMain = svg
//         .append("g")
//         .attr("transform", `translate(${padding.left},${padding.top})`);

//       // ----- Nodes -----
//       const nodes = gMain
//         .selectAll(".treemap-node")
//         .data(root.descendants())
//         .join("g")
//         .attr("class", "treemap-node")
//         .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
//         .on("click", (event, d) => {
//           event.stopPropagation();

//           // Only drill-down when we are in the root view
//           if (!nodeData) {
//             // If you clicked on an org, walk up to its top-level category
//             let catNode = d;
//             while (catNode.parent && catNode.depth > 1) {
//               catNode = catNode.parent;
//             }

//             // Now if this is actually a category node, drill into it
//             if (catNode.depth === 1) {
//               draw(catNode.data); // pass the category's data as new root
//             }
//           }
//           // In category view, clicks do nothing extra for now
//         })
//         .on("mousemove", (event, d) => {
//           const rect = container.getBoundingClientRect();

//           const content = [
//             `Name: ${d.data.name || ""}`,
//             `EIN: ${d.data.ein || "-"}`,
//             `Amount: $${d.value?.toLocaleString() || "-"}`,
//           ].join("\n");

//           // Position relative to container
//           let x = event.clientX - rect.left + 12;
//           let y = event.clientY - rect.top + 12;

//           const tooltipWidth = 260;
//           const tooltipHeight = 100;
//           const pad = 8;

//           const maxX = rect.width - tooltipWidth - pad;
//           const maxY = rect.height - tooltipHeight - pad;

//           x = Math.min(Math.max(pad, x), Math.max(pad, maxX));
//           y = Math.min(Math.max(pad, y), Math.max(pad, maxY));

//           setTooltip({
//             show: true,
//             x,
//             y,
//             content,
//           });
//         })
//         .on("mouseleave", () => {
//           setTooltip((t) => ({ ...t, show: false }));
//         });

//       nodes
//         .append("rect")
//         .attr("class", "treemap-rect")
//         .attr("width", (d) => d.x1 - d.x0)
//         .attr("height", (d) => d.y1 - d.y0)
//         .attr("fill", getColor)
//         .attr("rx", 6)
//         .attr("ry", 6);

//       nodes
//         .append("text")
//         .attr("class", "treemap-label")
//         .attr("x", 6)
//         .attr("y", 16)
//         .text((d) => d.data.name)
//         .style("opacity", (d) =>
//           d.x1 - d.x0 > 40 && d.y1 - d.y0 > 24 ? 1 : 0
//         )
//         .style("font-size", (d) => {
//           const label = d.data.name || "";
//           const rectWidth = d.x1 - d.x0 - 10;
//           const rectHeight = d.y1 - d.y0 - 6;
//           if (!label || rectWidth <= 0 || rectHeight <= 0) return "0px";

//           const maxWidthSize = (rectWidth / label.length) * 1.6;
//           const maxHeightSize = rectHeight * 0.45;
//           const fontSize = Math.min(maxWidthSize, maxHeightSize, 14);
//           return `${fontSize}px`;
//         });

//       // ----- Background click in category view → back to root -----
//       if (nodeData) {
//         svg.on("click", () => {
//           draw(null);
//         });
//       }

//       // ----- Legend (only in root view) -----
//       if (!nodeData) {
//         const legend = svg
//           .append("g")
//           .attr("class", "treemap-legend")
//           .attr(
//             "transform",
//             `translate(${fullWidth - legendWidthRoot + 12}, ${padding.top})`
//           );

//         legend
//           .append("text")
//           .attr("class", "legend-title")
//           .attr("x", 0)
//           .attr("y", 0)
//           .text("Categories");

//         const legendSize = 12;
//         const legendSpacing = 4;

//         (topCategories || []).slice(0, 22).forEach((cat, i) => {
//           const y = 18 + i * (legendSize + legendSpacing);
//           const row = legend
//             .append("g")
//             .attr("transform", `translate(0,${y})`);

//           row
//             .append("rect")
//             .attr("width", legendSize)
//             .attr("height", legendSize)
//             .attr("rx", 3)
//             .attr("ry", 3)
//             .attr("fill", baseColorScale(cat));

//           row
//             .append("text")
//             .attr("x", legendSize + 6)
//             .attr("y", legendSize - 2)
//             .attr("class", "legend-label")
//             .text(cat);
//         });
//       }
//     }

//     // initial root view
//     draw(null);

//     // allow React "Back to all categories" button to reset
//     resetRef.current = () => draw(null);
//   }, [data]);

//   const handleResetClick = () => {
//     if (resetRef.current) {
//       resetRef.current();
//     }
//   };

//   return (
//     <div className="treemap-wrapper">
//       <div ref={ref} className="treemap-canvas" />

//       {/* Always show this; it's idempotent in root view */}
//       <button className="zoom-out-btn" onClick={handleResetClick}>
//         ⟲ Back to all categories
//       </button>

//       {tooltip.show && (
//         <div
//           className="treemap-tooltip"
//           style={{
//             left: tooltip.x,
//             top: tooltip.y,
//           }}
//         >
//           {tooltip.content}
//         </div>
//       )}
//     </div>
//   );
// }


import React, { useState, useRef } from "react";
import * as d3 from "d3";
import useD3 from "./useD3";
import "./treemap.css";

export default function TreeMap({ data }) {
  const [tooltip, setTooltip] = useState({
    show: false,
    x: 0,
    y: 0,
    content: "",
  });

  const resetRef = useRef(null);

  const ref = useD3((container) => {
    if (!data) return;

    const legendWidthRoot = 200;
    const padding = { top: 16, right: 16, bottom: 16, left: 16 };

    const treemapLayout = d3
      .treemap()
      .paddingInner(3)
      .paddingOuter(2);

    // Precompute full hierarchy for root view + category list
    const fullHierarchy = d3
      .hierarchy(data)
      .sum((d) => d.value || 1)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const topCategories = (fullHierarchy.children || []).map(
      (d) => d.data.name
    );

    const baseColorScale = d3
      .scaleOrdinal()
      .domain(topCategories.length ? topCategories : ["_dummy_"])
      .range(
        (topCategories.length ? topCategories : ["_dummy_"]).map((_, i) =>
          d3.interpolateTurbo(
            topCategories.length > 1 ? i / (topCategories.length - 1) : 0.5
          )
        )
      );

    // Helper: pick black or white based on background luminance
    function getTextColor(bg) {
      const c = d3.color(bg);
      if (!c) return "#111827";

      const luminance = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
      // Dark background → white, light background → dark text
      return luminance < 150 ? "#ffffff" : "#111827";
    }

    /**
     * Draw function
     * @param {Object|null} nodeData - null → full root view, object → category root (drill-down view)
     */
    function draw(nodeData) {
      const sel = d3.select(container);
      sel.selectAll("*").remove();

      const fullWidth = container.clientWidth || 800;
      const fullHeight = container.clientHeight || 500;

      const legendWidth = nodeData ? 0 : legendWidthRoot;
      const width = Math.max(
        300,
        fullWidth - padding.left - padding.right - legendWidth
      );
      const height = Math.max(
        300,
        fullHeight - padding.top - padding.bottom
      );

      // Build hierarchy for current view
      let root;
      if (!nodeData) {
        root = d3
          .hierarchy(data)
          .sum((d) => d.value || 1)
          .sort((a, b) => (b.value || 0) - (a.value || 0));
      } else {
        root = d3
          .hierarchy(nodeData)
          .sum((d) => d.value || 1)
          .sort((a, b) => (b.value || 0) - (a.value || 0));
      }

      treemapLayout.size([width, height])(root);

      // Color function for tiles
      let getColor;
      if (!nodeData) {
        // Root view: per-category colors, lighter for orgs
        getColor = (d) => {
          if (!d.parent) return "#dddddd";
          if (d.parent === root) return baseColorScale(d.data.name);
          const base = baseColorScale(d.parent.data.name);
          return d3.color(base).brighter(0.7);
        };
      } else {
        // Category view: all orgs use shades of the same category color
        const baseColor = baseColorScale(nodeData.name) || "#4b5563";
        getColor = (d) => {
          if (!d.parent) return "#dddddd";
          if (d.depth === 1) return baseColor;
          return d3.color(baseColor).brighter(0.7);
        };
      }

      const svg = sel
        .append("svg")
        .attr("class", "treemap-svg")
        .attr("width", fullWidth)
        .attr("height", fullHeight);

      const gMain = svg
        .append("g")
        .attr("transform", `translate(${padding.left},${padding.top})`);

      // ----- Nodes -----
      const nodes = gMain
        .selectAll(".treemap-node")
        .data(root.descendants())
        .join("g")
        .attr("class", "treemap-node")
        .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
        .on("click", (event, d) => {
          event.stopPropagation();

          // Only drill-down when we are in the root view
          if (!nodeData) {
            // If you clicked on an org, walk up to its top-level category
            let catNode = d;
            while (catNode.parent && catNode.depth > 1) {
              catNode = catNode.parent;
            }

            // If this is actually a category node, redraw in category view
            if (catNode.depth === 1) {
              draw(catNode.data);
            }
          }
          // In category view, clicks do nothing extra for now
        })
        .on("mousemove", (event, d) => {
          const rect = container.getBoundingClientRect();

          // Determine category for this tile
          let categoryName = "-";
          if (d.depth === 1) {
            // Category tile
            categoryName = d.data.name;
          } else if (d.depth >= 2 && d.parent) {
            // Org tile inside category
            categoryName = d.parent.data.name;
          }

          const content = [
            `Name: ${d.data.name || ""}`,
            `Category: ${categoryName}`,
            `EIN: ${d.data.ein || "-"}`,
            `Amount: $${d.value?.toLocaleString() || "-"}`,
          ].join("\n");


          let x = event.clientX - rect.left + 12;
          let y = event.clientY - rect.top + 12;

          const tooltipWidth = 260;
          const tooltipHeight = 100;
          const pad = 8;

          const maxX = rect.width - tooltipWidth - pad;
          const maxY = rect.height - tooltipHeight - pad;

          x = Math.min(Math.max(pad, x), Math.max(pad, maxX));
          y = Math.min(Math.max(pad, y), Math.max(pad, maxY));

          setTooltip({
            show: true,
            x,
            y,
            content,
          });
        })
        .on("mouseleave", () => {
          setTooltip((t) => ({ ...t, show: false }));
        });

      nodes
        .append("rect")
        .attr("class", "treemap-rect")
        .attr("width", (d) => d.x1 - d.x0)
        .attr("height", (d) => d.y1 - d.y0)
        .attr("fill", getColor)
        .attr("rx", 6)
        .attr("ry", 6);

      // ----- Labels -----
      nodes
        .append("text")
        .attr("class", "treemap-label")
        .attr("x", 6)
        .attr("y", 16)
        .text((d) => d.data.name)
        // only apply contrast logic in category view;
        // in root view, keep text dark
        .style("fill", (d) => {
          if (!nodeData) {
            return "#ffffff"; // root view: consistent light labels
          }
          const bg = getColor(d);
          return getTextColor(bg); // category view: contrast text
        })
        .style("opacity", (d) =>
          d.x1 - d.x0 > 40 && d.y1 - d.y0 > 24 ? 1 : 0
        )
        .style("font-size", (d) => {
          const label = d.data.name || "";
          const rectWidth = d.x1 - d.x0 - 10;
          const rectHeight = d.y1 - d.y0 - 6;

          if (!label || rectWidth <= 0 || rectHeight <= 0) return "0px";

          const maxWidthSize = (rectWidth / label.length) * 1.6;
          const maxHeightSize = rectHeight * 0.45;
          const fontSize = Math.min(maxWidthSize, maxHeightSize, 14);
          return `${fontSize}px`;
        });

      // Simple fade-in animation
      gMain
        .selectAll(".treemap-node")
        .attr("opacity", 0)
        .transition()
        .duration(250)
        .attr("opacity", 1);

      // Click background in category view → back to root
      if (nodeData) {
        svg.on("click", () => {
          draw(null);
        });
      }

      // Legend only in root view
      if (!nodeData) {
        const legend = svg
          .append("g")
          .attr("class", "treemap-legend")
          .attr(
            "transform",
            `translate(${fullWidth - legendWidthRoot}, ${padding.top})`
          );

        legend
          .append("text")
          .attr("class", "legend-title")
          .attr("x", 0)
          .attr("y", 0)
          .text("Categories (Revenue-wise)");

        const legendSize = 10;
        const legendSpacing = 4;

        (topCategories || []).forEach((cat, i) => {
          const y = 18 + i * (legendSize + legendSpacing);
          const row = legend
            .append("g")
            .attr("transform", `translate(0,${y})`);

          row
            .append("rect")
            .attr("width", legendSize)
            .attr("height", legendSize)
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("fill", baseColorScale(cat));

          row
            .append("text")
            .attr("x", legendSize + 6)
            .attr("y", legendSize - 2)
            .attr("class", "legend-label")
            .text(cat);
        });
      }
    }

    // initial root view
    draw(null);

    // allow React "Back to all categories" button to reset
    resetRef.current = () => draw(null);
  }, [data]);

  const handleResetClick = () => {
    resetRef.current?.();
  };

  return (
    <div className="treemap-wrapper">
      <div ref={ref} className="treemap-canvas" />

      <button className="zoom-out-btn" onClick={handleResetClick}>
        ⟲ Back to all categories
      </button>

      {tooltip.show && (
        <div
          className="treemap-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}




// // src/components/TreeMap.jsx
// import React, { useState, useRef } from "react";
// import * as d3 from "d3";
// import useD3 from "./useD3";
// import "./treemap.css";

// export default function TreeMap({ data }) {
//   const [tooltip, setTooltip] = useState({
//     show: false,
//     x: 0,
//     y: 0,
//     content: "",
//   });

//   // This ref lets the React button trigger a reset to the root view
//   const resetRef = useRef(null);

//   const ref = useD3((container) => {
//     if (!data) return;

//     const legendWidthRoot = 200;
//     const padding = { top: 16, right: 16, bottom: 16, left: 16 };

//     const treemapLayout = d3
//       .treemap()
//       .paddingInner(3)
//       .paddingOuter(2);

//     // Full hierarchy for root view
//     const fullHierarchy = d3
//       .hierarchy(data)
//       .sum((d) => d.value || 1)
//       .sort((a, b) => (b.value || 0) - (a.value || 0));

//     const topCategories = (fullHierarchy.children || []).map(
//       (d) => d.data.name
//     );

//     const baseColorScale = d3
//       .scaleOrdinal()
//       .domain(topCategories.length ? topCategories : ["_dummy_"])
//       .range(
//         (topCategories.length ? topCategories : ["_dummy_"]).map((_, i) =>
//           d3.interpolateTurbo(
//             topCategories.length > 1 ? i / (topCategories.length - 1) : 0.5
//           )
//         )
//       );

//     /**
//      * Draw function
//      * @param {Object|null} nodeData - null → full root view, object → category root (drill-down)
//      */
//     function draw(nodeData) {
//       // Clear previous drawing
//       const sel = d3.select(container);
//       sel.selectAll("*").remove();

//       const fullWidth = container.clientWidth || 800;
//       const fullHeight = container.clientHeight || 500;

//       // Reserve legend space only in root view
//       const legendWidth = nodeData ? 0 : legendWidthRoot;
//       const width = Math.max(
//         300,
//         fullWidth - padding.left - padding.right - legendWidth
//       );
//       const height = Math.max(
//         300,
//         fullHeight - padding.top - padding.bottom
//       );

//       // Build hierarchy for current view
//       let root;
//       if (!nodeData) {
//         root = d3
//           .hierarchy(data)
//           .sum((d) => d.value || 1)
//           .sort((a, b) => (b.value || 0) - (a.value || 0));
//       } else {
//         // nodeData is the category's data object
//         root = d3
//           .hierarchy(nodeData)
//           .sum((d) => d.value || 1)
//           .sort((a, b) => (b.value || 0) - (a.value || 0));
//       }

//       treemapLayout.size([width, height])(root);

//       // Color function
//       let getColor;
//       if (!nodeData) {
//         // Root view: per-category colors, lighter for orgs
//         getColor = (d) => {
//           if (!d.parent) return "#dddddd";
//           if (d.parent === root) return baseColorScale(d.data.name);
//           const base = baseColorScale(d.parent.data.name);
//           return d3.color(base).brighter(0.7);
//         };
//       } else {
//         // Category view: all orgs use shades of the same category color
//         const baseColor = baseColorScale(nodeData.name) || "#4b5563";
//         getColor = (d) => {
//           if (!d.parent) return "#dddddd";
//           if (d.depth === 1) return baseColor; // org tiles
//           return d3.color(baseColor).brighter(0.7);
//         };
//       }

//       // SVG and main group
//       const svg = sel
//         .append("svg")
//         .attr("class", "treemap-svg")
//         .attr("width", fullWidth)
//         .attr("height", fullHeight);

//       const gMain = svg
//         .append("g")
//         .attr("transform", `translate(${padding.left},${padding.top})`);

//       // ----- Nodes -----
//       const nodes = gMain
//         .selectAll(".treemap-node")
//         .data(root.descendants())
//         .join("g")
//         .attr("class", "treemap-node")
//         .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
//         .on("click", (event, d) => {
//           event.stopPropagation();

//           // Only drill-down when we are in the root view
//           if (!nodeData) {
//             // If you clicked on an org, walk up to its top-level category
//             let catNode = d;
//             while (catNode.parent && catNode.depth > 1) {
//               catNode = catNode.parent;
//             }

//             // If this is actually a category node, redraw in category view
//             if (catNode.depth === 1) {
//               draw(catNode.data);
//             }
//           }
//           // In category view, clicks do nothing extra for now
//         })
//         .on("mousemove", (event, d) => {
//           const rect = container.getBoundingClientRect();

//           const content = [
//             `Name: ${d.data.name || ""}`,
//             `EIN: ${d.data.ein || "-"}`,
//             `Amount: $${d.value?.toLocaleString() || "-"}`,
//           ].join("\n");

//           // Position relative to container
//           let x = event.clientX - rect.left + 12;
//           let y = event.clientY - rect.top + 12;

//           const tooltipWidth = 260;
//           const tooltipHeight = 100;
//           const pad = 8;

//           const maxX = rect.width - tooltipWidth - pad;
//           const maxY = rect.height - tooltipHeight - pad;

//           x = Math.min(Math.max(pad, x), Math.max(pad, maxX));
//           y = Math.min(Math.max(pad, y), Math.max(pad, maxY));

//           setTooltip({
//             show: true,
//             x,
//             y,
//             content,
//           });
//         })
//         .on("mouseleave", () => {
//           setTooltip((t) => ({ ...t, show: false }));
//         });

//       nodes
//         .append("rect")
//         .attr("class", "treemap-rect")
//         .attr("width", (d) => d.x1 - d.x0)
//         .attr("height", (d) => d.y1 - d.y0)
//         .attr("fill", getColor)
//         .attr("rx", 6)
//         .attr("ry", 6);

//       nodes
//         .append("text")
//         .attr("class", "treemap-label")
//         .attr("x", 6)
//         .attr("y", 16)
//         .text((d) => d.data.name)
//         .style("opacity", (d) =>
//           d.x1 - d.x0 > 40 && d.y1 - d.y0 > 24 ? 1 : 0
//         )
//         .style("font-size", (d) => {
//           const label = d.data.name || "";
//           const rectWidth = d.x1 - d.x0 - 10;
//           const rectHeight = d.y1 - d.y0 - 6;
//           if (!label || rectWidth <= 0 || rectHeight <= 0) return "0px";

//           const maxWidthSize = (rectWidth / label.length) * 1.6;
//           const maxHeightSize = rectHeight * 0.45;
//           const fontSize = Math.min(maxWidthSize, maxHeightSize, 14);
//           return `${fontSize}px`;
//         });

//       // --- Lightweight fade-in animation for each view ---
//       gMain
//         .selectAll(".treemap-node")
//         .attr("opacity", 0)
//         .transition()
//         .duration(280)
//         .attr("opacity", 1);

//       // ----- Background click in category view → back to root -----
//       if (nodeData) {
//         svg.on("click", () => {
//           draw(null);
//         });
//       }

//       // ----- Legend (only in root view) -----
//       if (!nodeData) {
//         const legend = svg
//           .append("g")
//           .attr("class", "treemap-legend")
//           .attr(
//             "transform",
//             `translate(${fullWidth - legendWidthRoot + 12}, ${padding.top})`
//           );

//         legend
//           .append("text")
//           .attr("class", "legend-title")
//           .attr("x", 0)
//           .attr("y", 0)
//           .text("Categories");

//         const legendSize = 12;
//         const legendSpacing = 4;

//         (topCategories || []).slice(0, 12).forEach((cat, i) => {
//           const y = 18 + i * (legendSize + legendSpacing);
//           const row = legend
//             .append("g")
//             .attr("transform", `translate(0,${y})`);

//           row
//             .append("rect")
//             .attr("width", legendSize)
//             .attr("height", legendSize)
//             .attr("rx", 3)
//             .attr("ry", 3)
//             .attr("fill", baseColorScale(cat));

//           row
//             .append("text")
//             .attr("x", legendSize + 6)
//             .attr("y", legendSize - 2)
//             .attr("class", "legend-label")
//             .text(cat);
//         });
//       }
//     }

//     // initial root view
//     draw(null);

//     // allow React "Back to all categories" button to reset
//     resetRef.current = () => draw(null);
//   }, [data]);

//   const handleResetClick = () => {
//     if (resetRef.current) {
//       resetRef.current();
//     }
//   };

//   return (
//     <div className="treemap-wrapper">
//       <div ref={ref} className="treemap-canvas" />

//       {/* Always show this; it's idempotent in root view */}
//       <button className="zoom-out-btn" onClick={handleResetClick}>
//         ⟲ Back to all categories
//       </button>

//       {tooltip.show && (
//         <div
//           className="treemap-tooltip"
//           style={{
//             left: tooltip.x,
//             top: tooltip.y,
//           }}
//         >
//           {tooltip.content}
//         </div>
//       )}
//     </div>
//   );
// }
