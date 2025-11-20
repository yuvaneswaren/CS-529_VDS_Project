// import React, { useMemo } from "react";
// import { sankey, sankeyLinkHorizontal } from "d3-sankey";
// import { scaleOrdinal } from "d3-scale";
// import { schemeCategory10 } from "d3-scale-chromatic";

// const SankeyDiagram = ({ data, width = 900, height = 500 }) => {
//   const { nodes, links } = useMemo(() => {
//     if (!data || !data.nodes || !data.links) {
//       return { nodes: [], links: [] };
//     }

//     const sankeyGen = sankey()
//       .nodeWidth(20)
//       .nodePadding(30)
//       .extent([
//         [0, 0],
//         [width, height]
//       ]);

//     // d3-sankey mutates the arrays, so we copy them
//     const graph = sankeyGen({
//       nodes: data.nodes.map(d => ({ ...d })),
//       links: data.links.map(d => ({ ...d }))
//     });

//     return { nodes: graph.nodes, links: graph.links };
//   }, [data, width, height]);

//   const color = useMemo(
//     () => scaleOrdinal(schemeCategory10),
//     []
//   );

//   if (!nodes.length) {
//     return <div>Loading Sankey...</div>;
//   }

//   return (
//     <svg
//       width={width}
//       height={height}
//       style={{
//         background: "#0f172a", // slate-900-ish
//         borderRadius: "12px",
//         boxShadow: "0 10px 25px rgba(0,0,0,0.25)"
//       }}
//     >
//       {/* Links */}
//       <g fill="none" strokeOpacity={0.5}>
//         {links.map((link, i) => (
//           <path
//             key={i}
//             d={sankeyLinkHorizontal()(link)}
//             stroke={color(link.source.name)}
//             strokeWidth={Math.max(1, link.width)}
//             style={{
//               mixBlendMode: "multiply"
//             }}
//           >
//             <title>
//               {`${link.source.name} → ${link.target.name}\n${link.value.toLocaleString()}`}
//             </title>
//           </path>
//         ))}
//       </g>

//       {/* Nodes */}
//       <g>
//         {nodes.map((node, i) => (
//           <g key={i} transform={`translate(${node.x0},${node.y0})`}>
//             <rect
//               width={node.x1 - node.x0}
//               height={Math.max(4, node.y1 - node.y0)}
//               fill={color(node.name)}
//               stroke="#0f172a"
//               strokeWidth={1}
//               rx={4}
//             >
//               <title>
//                 {`${node.name}\n${node.value ? node.value.toLocaleString() : ""}`}
//               </title>
//             </rect>
//             <text
//               x={node.x0 < width / 2 ? (node.x1 - node.x0) + 8 : -8}
//               y={(node.y1 - node.y0) / 2}
//               dy="0.35em"
//               textAnchor={node.x0 < width / 2 ? "start" : "end"}
//               fill="#e5e7eb"
//               fontSize={12}
//               fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
//             >
//               {node.name}
//             </text>
//           </g>
//         ))}
//       </g>
//     </svg>
//   );
// };

// export default SankeyDiagram;

// -------------------------------------------------------------------------------------------------------------

import React, { useMemo, useRef, useLayoutEffect, useState } from "react";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";
import { rgb } from "d3";

const SankeyDiagram = ({ data }) => {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 400 });

  // Measure container
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(entries => {
      const rect = entries[0].contentRect;
      const width = Math.max(rect.width, 300);
      const height = Math.max(rect.height, 250);
      setSize({ width, height });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { nodes, links } = useMemo(() => {
    if (!data || !data.nodes || !data.links) return { nodes: [], links: [] };

    const sankeyGen = sankey()
      .nodeWidth(20)
      .nodePadding(30)
      .extent([
        [0, 0],
        [size.width, size.height]
      ]);

    const graph = sankeyGen({
      nodes: data.nodes.map(d => ({ ...d })),
      links: data.links.map(d => ({ ...d }))
    });

    return { nodes: graph.nodes, links: graph.links };
  }, [data, size]);

  const color = useMemo(
    () => scaleOrdinal(schemeCategory10),
    []
  );

  if (!nodes.length) {
    return <div ref={containerRef}>Loading Sankey...</div>;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 320,
        position: "relative"
      }}
    >
      <svg
        viewBox={`0 0 ${size.width} ${size.height}`}
        style={{
          width: "99%",
          height: "100%",
          background: rgb(244,244,244),
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
          display: "block"
        }}
      >
        {/* Links */}
        <g fill="none" strokeOpacity={0.5}>
          {links.map((link, i) => (
            <path
              key={i}
              d={sankeyLinkHorizontal()(link)}
              stroke={color(link.source.name)}
              strokeWidth={Math.max(1, link.width)}
              style={{ mixBlendMode: "multiply" }}
            >
              <title>
                {`${link.source.name} → ${link.target.name}\n${link.value.toLocaleString()}`}
              </title>
            </path>
          ))}
        </g>

        {/* Nodes */}
        <g>
          {nodes.map((node, i) => (
            <g key={i} transform={`translate(${node.x0},${node.y0})`}>
              <rect
                width={node.x1 - node.x0}
                height={Math.max(4, node.y1 - node.y0)}
                fill={color(node.name)}
                stroke="#0f172a"
                strokeWidth={1}
                rx={4}
              >
                <title>
                  {`${node.name}\n${node.value ? node.value.toLocaleString() : ""}`}
                </title>
              </rect>
              <text
                x={node.x0 < size.width / 2 ? (node.x1 - node.x0) + 8 : -8}
                y={(node.y1 - node.y0) / 2}
                dy="0.35em"
                textAnchor={node.x0 < size.width / 2 ? "start" : "end"}
                fill="#030303ff"
                fontSize={12}
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
              >
                {node.name}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default SankeyDiagram;
