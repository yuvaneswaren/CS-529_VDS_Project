// // // import React, { useEffect } from "react";
// // import Header from "../components/Header";
// // import NavBar from "../components/NavBar";
// // import PageWrapper from "../components/PageWrapper";
// // import "../layout.css";

// // import Papa from "papaparse";
// // import { useEffect, useState } from "react";
// // import { buildTreemapData } from "../utils/treemapPrep";
// // import TreeMap from "../components/d3/TreeMap";
// // import SankeyDiagram from "../components/SankeyDiagram";

// // import Heatmap from "../components/d3/Heatmap";



// // function MainPage() {
// //   const [treeData, setTreeData] = useState(null);
// //   const [sankeyData, setSankeyData] = useState(null);

// //   // useEffect(() => {
// //   //   Papa.parse("/data/nonprofits.csv", {
// //   //     download: true,
// //   //     header: true,
// //   //     complete: (result) => {
// //   //       const processed = buildTreemapData(result.data);
// //   //       setTreeData(processed);
// //   //     }
// //   //   });
// //   // }, []);

// // useEffect(() => {
// //   Papa.parse("/data/nonprofits.csv", {
// //     download: true,
// //     header: true,
// //     complete: (result) => {
// //       const data = result.data;

// //       // ===== TREEMAP (your existing logic) =====
// //       const processed = buildTreemapData(data);
// //       setTreeData(processed);

// //       // ===== SANKEY: Total → Top4 + Other → Revenue/Assets/Income =====

// //       // 1) Aggregate per category
// //       const categories = {};
// //       data.forEach(row => {
// //         const cat = row.ntee_category || "Unknown";
// //         if (!categories[cat]) {
// //           categories[cat] = { assets: 0, income: 0, revenue: 0 };
// //         }
// //         categories[cat].assets  += Number(row.asset_amount   || 0);
// //         categories[cat].income  += Number(row.income_amount  || 0);
// //         categories[cat].revenue += Number(row.revenue_amount || 0);
// //       });

// //       // 2) Turn into array and compute total funds = assets + income + revenue
// //       let catArray = Object.entries(categories).map(([name, vals]) => {
// //         const total = vals.assets + vals.income + vals.revenue;
// //         return { name, ...vals, total };
// //       });

// //       // Remove categories with 0  and unknown
// //       // catArray = catArray.filter(c => c.total > 0);
// //       catArray = catArray.filter(c => c.name !== "Unknown").filter(c => c.total > 0);

// //       // 3) Sort by total descending & pick top 4
// //       catArray.sort((a, b) => b.total - a.total);
// //       const top4 = catArray.slice(0, 4);
// //       const others = catArray.slice(4);

// //       // 4) Combine "Others" if needed
// //       let finalCats = [...top4];
// //       if (others.length > 0) {
// //         const othersAgg = others.reduce(
// //           (acc, c) => {
// //             acc.assets  += c.assets;
// //             acc.income  += c.income;
// //             acc.revenue += c.revenue;
// //             acc.total   += c.total;
// //             return acc;
// //           },
// //           { name: "Other", assets: 0, income: 0, revenue: 0, total: 0 }
// //         );
// //         finalCats.push(othersAgg);
// //       }

// //       // 5) Compute total pool
// //       const totalPool = finalCats.reduce((sum, c) => sum + c.total, 0);

// //       // 6) Build nodes:
// //       //    0           → "Total Funds"
// //       //    1..5        → Top 4 categories + Other
// //       //    last 3      → "Revenue", "Assets", "Income"
// //       const nodes = [
// //         { name: "Total Funds" },
// //         ...finalCats.map(c => ({ name: c.name })),
// //         { name: "Revenue" },
// //         { name: "Assets" },
// //         { name: "Income" }
// //       ];

// //       const nodeIndex = {};
// //       nodes.forEach((n, i) => { nodeIndex[n.name] = i; });

// //       const revenueIdx = nodeIndex["Revenue"];
// //       const assetsIdx  = nodeIndex["Assets"];
// //       const incomeIdx  = nodeIndex["Income"];

// //       // 7) Build links
// //       const links = [];

// //       // Total → each category
// //       finalCats.forEach(cat => {
// //         links.push({
// //           source: nodeIndex["Total Funds"],
// //           target: nodeIndex[cat.name],
// //           value:  cat.total
// //         });
// //       });

// //       // Each category → Revenue / Assets / Income
// //       finalCats.forEach(cat => {
// //         if (cat.revenue > 0) {
// //           links.push({
// //             source: nodeIndex[cat.name],
// //             target: revenueIdx,
// //             value:  cat.revenue
// //           });
// //         }
// //         if (cat.assets > 0) {
// //           links.push({
// //             source: nodeIndex[cat.name],
// //             target: assetsIdx,
// //             value:  cat.assets
// //           });
// //         }
// //         if (cat.income > 0) {
// //           links.push({
// //             source: nodeIndex[cat.name],
// //             target: incomeIdx,
// //             value:  cat.income
// //           });
// //         }
// //       });

// //       setSankeyData({ nodes, links });
// //     }
// //   });
// // }, []);

// //   return (
// //     <PageWrapper>
// //       <div className="page-container">
// //         <Header />
// //         <NavBar />

// //         <div className="main-content no-filter">
// //           <div className="top-section single-column">
// //             <div className="treemap-container full-page">

// //               {treeData ? (
// //                 <TreeMap data={treeData} />
// //               ) : (
// //                 <div className="treemap-placeholder">Loading CSV...</div>
// //               )}

// //             </div>
// //           </div>

// //           <div className="bottom-section full-row">
// //             <div className="d3-placeholder">Heatmap Placeholder (D3)</div>
// //             <div className="d3-placeholder">
// //               {sankeyData ? (
// //                 <SankeyDiagram data={sankeyData} />
// //               ) : (
// //                 <div>Loading Sankey...</div>
// //               )}
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </PageWrapper>
// //   );
// // }

// // export default MainPage;


// import Header from "../components/Header";
// import NavBar from "../components/NavBar";
// import PageWrapper from "../components/PageWrapper";
// import "../layout.css";

// import Papa from "papaparse";
// import { useEffect, useState } from "react";
// import { buildTreemapData } from "../utils/treemapPrep";
// import TreeMap from "../components/d3/TreeMap";
// import SankeyDiagram from "../components/SankeyDiagram";
// import Heatmap from "../components/d3/Heatmap";

// function MainPage() {
//   const [treeData, setTreeData] = useState(null);
//   const [sankeyData, setSankeyData] = useState(null);
//   const [heatmapData, setHeatmapData] = useState(null);

//   useEffect(() => {
//     Papa.parse("/data/nonprofits.csv", {
//       download: true,
//       header: true,
//       complete: (result) => {
//         const data = result.data;

//         // =========================
//         // TREEMAP
//         // =========================
//         const processed = buildTreemapData(data);
//         setTreeData(processed);

//         // =========================
//         // SANKEY: Total → Top4 + Other → Revenue/Assets/Income
//         // =========================

//         // 1) Aggregate per NTEE category
//         const categories = {};
//         data.forEach((row) => {
//           const cat = row.ntee_category || "Unknown";
//           if (!categories[cat]) {
//             categories[cat] = { assets: 0, income: 0, revenue: 0 };
//           }
//           categories[cat].assets += Number(row.asset_amount || 0);
//           categories[cat].income += Number(row.income_amount || 0);
//           categories[cat].revenue += Number(row.revenue_amount || 0);
//         });

//         // 2) Turn into array and compute total funds = assets + income + revenue
//         let catArray = Object.entries(categories).map(([name, vals]) => {
//           const total = vals.assets + vals.income + vals.revenue;
//           return { name, ...vals, total };
//         });

//         // Remove categories with total 0 and the "Unknown" bucket
//         catArray = catArray
//           .filter((c) => c.name !== "Unknown")
//           .filter((c) => c.total > 0);

//         // 3) Sort by total descending & pick top 4
//         catArray.sort((a, b) => b.total - a.total);
//         const top4 = catArray.slice(0, 4);
//         const others = catArray.slice(4);

//         // 4) Combine "Others" if needed
//         let finalCats = [...top4];
//         if (others.length > 0) {
//           const othersAgg = others.reduce(
//             (acc, c) => {
//               acc.assets += c.assets;
//               acc.income += c.income;
//               acc.revenue += c.revenue;
//               acc.total += c.total;
//               return acc;
//             },
//             { name: "Other", assets: 0, income: 0, revenue: 0, total: 0 }
//           );
//           finalCats.push(othersAgg);
//         }

//         // 5) (Optional) total pool if you need it later
//         // const totalPool = finalCats.reduce((sum, c) => sum + c.total, 0);

//         // 6) Build nodes:
//         //   0           → "Total Funds"
//         //   1..N        → Top categories + Other
//         //   last 3      → "Revenue", "Assets", "Income"
//         const nodes = [
//           { name: "Total Funds" },
//           ...finalCats.map((c) => ({ name: c.name })),
//           { name: "Revenue" },
//           { name: "Assets" },
//           { name: "Income" }
//         ];

//         const nodeIndex = {};
//         nodes.forEach((n, i) => {
//           nodeIndex[n.name] = i;
//         });

//         const revenueIdx = nodeIndex["Revenue"];
//         const assetsIdx = nodeIndex["Assets"];
//         const incomeIdx = nodeIndex["Income"];

//         // 7) Build links
//         const links = [];

//         // Total → each category
//         finalCats.forEach((cat) => {
//           links.push({
//             source: nodeIndex["Total Funds"],
//             target: nodeIndex[cat.name],
//             value: cat.total
//           });
//         });

//         // Each category → Revenue / Assets / Income
//         finalCats.forEach((cat) => {
//           if (cat.revenue > 0) {
//             links.push({
//               source: nodeIndex[cat.name],
//               target: revenueIdx,
//               value: cat.revenue
//             });
//           }
//           if (cat.assets > 0) {
//             links.push({
//               source: nodeIndex[cat.name],
//               target: assetsIdx,
//               value: cat.assets
//             });
//           }
//           if (cat.income > 0) {
//             links.push({
//               source: nodeIndex[cat.name],
//               target: incomeIdx,
//               value: cat.income
//             });
//           }
//         });

//         setSankeyData({ nodes, links });

//         // =========================
//         // HEATMAP: City vs NTEE Category (Total Revenue)
//         // =========================

//         const cityCatRevenue = {};
//         const cityTotalRevenue = {};

//         data.forEach((row) => {
//           // Adjust this if your city column name is different
//           const cityRaw = row.city || row.mailing_city || row.city_name;
//           const city = (cityRaw || "").trim();
//           if (!city) return;

//           const catRaw = row.ntee_category || "";
//           const cat = catRaw.trim();
//           if (!cat || cat === "Unknown") return;

//           const rev = Number(row.revenue_amount || 0);
//           if (!rev) return;

//           // total per city (for top 20 selection)
//           if (!cityTotalRevenue[city]) cityTotalRevenue[city] = 0;
//           cityTotalRevenue[city] += rev;

//           // revenue per (city, category)
//           const key = `${city}||${cat}`;
//           if (!cityCatRevenue[key]) cityCatRevenue[key] = 0;
//           cityCatRevenue[key] += rev;
//         });

//         // Top 20 cities by total revenue
//         const topCities = Object.entries(cityTotalRevenue)
//           .sort((a, b) => b[1] - a[1])
//           .slice(0, 20)
//           .map(([city]) => city);

//         // All categories that appear among those top cities
//         const categorySet = new Set();
//         Object.keys(cityCatRevenue).forEach((key) => {
//           const [city, cat] = key.split("||");
//           if (topCities.includes(city)) {
//             categorySet.add(cat);
//           }
//         });

//         const categoryList = Array.from(categorySet).sort();

//         const values = [];
//         categoryList.forEach((cat) => {
//           topCities.forEach((city) => {
//             const key = `${city}||${cat}`;
//             const v = cityCatRevenue[key] || 0;
//             values.push({
//               x: topCities.indexOf(city), // not strictly needed, but fine
//               y: categoryList.indexOf(cat),
//               city,
//               category: cat,
//               value: v
//             });
//           });
//         });

//         setHeatmapData({
//           xLabels: topCities,
//           yLabels: categoryList,
//           values
//         });
//       }
//     });
//   }, []);

//   return (
//     <PageWrapper>
//       <div className="page-container">
//         <Header />
//         <NavBar />

//         <div className="main-content no-filter">
//           <div className="top-section single-column">
//             <div className="treemap-container full-page">
//               {treeData ? (
//                 <TreeMap data={treeData} />
//               ) : (
//                 <div className="treemap-placeholder">Loading CSV...</div>
//               )}
//             </div>
//           </div>

//           <div className="bottom-section full-row">
//             <div className="d3-placeholder">
//               {heatmapData ? (
//                 <Heatmap data={heatmapData} />
//               ) : (
//                 <div>Loading Heatmap...</div>
//               )}
//             </div>

//             <div className="d3-placeholder">
//               {sankeyData ? (
//                 <SankeyDiagram data={sankeyData} />
//               ) : (
//                 <div>Loading Sankey...</div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </PageWrapper>
//   );
// }

// export default MainPage;

import Header from "../components/Header";
import NavBar from "../components/NavBar";
import PageWrapper from "../components/PageWrapper";
import "../layout.css";

import Papa from "papaparse";
import { useEffect, useState } from "react";
import { buildTreemapData } from "../utils/treemapPrep";
import TreeMap from "../components/d3/TreeMap";
import SankeyDiagram from "../components/SankeyDiagram";
import Heatmap from "../components/d3/Heatmap";

function MainPage() {
  const [treeData, setTreeData] = useState(null);
  const [sankeyData, setSankeyData] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);

  useEffect(() => {
    Papa.parse("/data/nonprofits.csv", {
      download: true,
      header: true,
      complete: (result) => {
        const data = result.data;

        // =========================
        // TREEMAP
        // =========================
        const processed = buildTreemapData(data);
        setTreeData(processed);

        // =========================
        // SANKEY: Total → Top4 + Other → Revenue/Assets/Income
        // =========================

        // 1) Aggregate per NTEE category
        const categories = {};
        data.forEach((row) => {
          const cat = row.ntee_category || "Unknown";
          if (!categories[cat]) {
            categories[cat] = { assets: 0, income: 0, revenue: 0 };
          }
          categories[cat].assets += Number(row.asset_amount || 0);
          categories[cat].income += Number(row.income_amount || 0);
          categories[cat].revenue += Number(row.revenue_amount || 0);
        });

        // 2) Turn into array and compute total funds = assets + income + revenue
        let catArray = Object.entries(categories).map(([name, vals]) => {
          const total = vals.assets + vals.income + vals.revenue;
          return { name, ...vals, total };
        });

        // Remove categories with total 0 and the "Unknown" bucket
        catArray = catArray
          .filter((c) => c.name !== "Unknown")
          .filter((c) => c.total > 0);

        // 3) Sort by total descending & pick top 4
        catArray.sort((a, b) => b.total - a.total);
        const top4 = catArray.slice(0, 4);
        const others = catArray.slice(4);

        // 4) Combine "Others" if needed
        let finalCats = [...top4];
        if (others.length > 0) {
          const othersAgg = others.reduce(
            (acc, c) => {
              acc.assets += c.assets;
              acc.income += c.income;
              acc.revenue += c.revenue;
              acc.total += c.total;
              return acc;
            },
            { name: "Other", assets: 0, income: 0, revenue: 0, total: 0 }
          );
          finalCats.push(othersAgg);
        }

        // 6) Build nodes
        const nodes = [
          { name: "Total Funds" },
          ...finalCats.map((c) => ({ name: c.name })),
          { name: "Revenue" },
          { name: "Assets" },
          { name: "Income" }
        ];

        const nodeIndex = {};
        nodes.forEach((n, i) => {
          nodeIndex[n.name] = i;
        });

        const revenueIdx = nodeIndex["Revenue"];
        const assetsIdx = nodeIndex["Assets"];
        const incomeIdx = nodeIndex["Income"];

        // 7) Build links
        const links = [];

        // Total → each category
        finalCats.forEach((cat) => {
          links.push({
            source: nodeIndex["Total Funds"],
            target: nodeIndex[cat.name],
            value: cat.total
          });
        });

        // Each category → Revenue / Assets / Income
        finalCats.forEach((cat) => {
          if (cat.revenue > 0) {
            links.push({
              source: nodeIndex[cat.name],
              target: revenueIdx,
              value: cat.revenue
            });
          }
          if (cat.assets > 0) {
            links.push({
              source: nodeIndex[cat.name],
              target: assetsIdx,
              value: cat.assets
            });
          }
          if (cat.income > 0) {
            links.push({
              source: nodeIndex[cat.name],
              target: incomeIdx,
              value: cat.income
            });
          }
        });

        setSankeyData({ nodes, links });

        // =========================
        // HEATMAP: City vs NTEE Category (AVERAGE Revenue)
        // =========================

        // helper to safely parse numeric fields like "12,345" or "$1,234"
        const parseNumber = (val) => {
          if (val == null || val === "") return 0;
          if (typeof val === "number") return val;
          const cleaned = String(val).replace(/[^0-9.-]+/g, "");
          const num = parseFloat(cleaned);
          return Number.isNaN(num) ? 0 : num;
        };

        const cityCatStats = {};   // key -> { total, count }
        const cityTotalRevenue = {}; // city -> total revenue (for top 20 selection)

        data.forEach((row) => {
          // 🔁 Adjust this line if your city column name is different
          const cityRaw = row.city || row.mailing_city || row.city_name;
          const city = (cityRaw || "").trim();
          if (!city) return;

          const catRaw = row.ntee_category || "";
          const cat = catRaw.trim();
          if (!cat || cat === "Unknown") return;

          // Try several possible revenue column names
          const revRaw =
            row.revenue_amount ||
            row.REVENUE_AMOUNT ||
            row.revenue ||
            row.REVENUE;

          const rev = parseNumber(revRaw);
          if (rev <= 0) return;

          // total per city (for top 20 selection)
          if (!cityTotalRevenue[city]) cityTotalRevenue[city] = 0;
          cityTotalRevenue[city] += rev;

          // stats per (city, category): sum + count
          const key = `${city}||${cat}`;
          if (!cityCatStats[key]) {
            cityCatStats[key] = { total: 0, count: 0 };
          }
          cityCatStats[key].total += rev;
          cityCatStats[key].count += 1;
        });

        // Top 20 cities by TOTAL revenue
        const topCities = Object.entries(cityTotalRevenue)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([city]) => city);

        // All categories that appear among those top cities
        const categorySet = new Set();
        Object.keys(cityCatStats).forEach((key) => {
          const [city, cat] = key.split("||");
          if (topCities.includes(city)) {
            categorySet.add(cat);
          }
        });

        const categoryList = Array.from(categorySet).sort();

        const values = [];
        categoryList.forEach((cat) => {
          topCities.forEach((city) => {
            const key = `${city}||${cat}`;
            const stats = cityCatStats[key];
            const avg = stats ? stats.total / stats.count : 0;
            values.push({
              x: topCities.indexOf(city),
              y: categoryList.indexOf(cat),
              city,
              category: cat,
              value: avg
            });
          });
        });

        setHeatmapData({
          xLabels: topCities,
          yLabels: categoryList,
          values
        });
      }
    });
  }, []);

  return (
    <PageWrapper>
      <div className="page-container">
        <Header />
        <NavBar />

        <div className="main-content no-filter">
          <div className="top-section single-column">
            <div className="treemap-container full-page">
              {treeData ? (
                <TreeMap data={treeData} />
              ) : (
                <div className="treemap-placeholder">Loading CSV...</div>
              )}
            </div>
          </div>

          <div className="bottom-section full-row">
            <div className="d3-placeholder">
              {heatmapData ? (
                <Heatmap data={heatmapData} />
              ) : (
                <div>Loading Heatmap...</div>
              )}
            </div>

            <div className="d3-placeholder">
              {sankeyData ? (
                <SankeyDiagram data={sankeyData} />
              ) : (
                <div>Loading Sankey...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default MainPage;
