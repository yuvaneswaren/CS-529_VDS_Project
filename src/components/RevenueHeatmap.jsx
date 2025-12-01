// // src/components/RevenueHeatmap.jsx
// import React, { useEffect, useState } from "react";
// import Papa from "papaparse";
// import HeatmapBase from "./HeatmapBase";
// import { useTheme, Typography } from "@mui/material";
// import { tokens } from "../theme";

// // Same mapping used in your treemap
// const NTEE_DESCRIPTIONS = {
//   A: "Arts, Culture and Humanities",
//   B: "Educational Institutions and Related Activities",
//   C: "Environmental Quality, Protection and Beautification",
//   D: "Animal-Related",
//   E: "Health – General and Rehabilitative",
//   F: "Mental Health, Crisis Intervention",
//   G: "Diseases, Disorders, Medical Disciplines",
//   H: "Medical Research",
//   I: "Crime, Legal-Related",
//   J: "Employment, Job-Related",
//   K: "Food, Agriculture and Nutrition",
//   L: "Housing, Shelter",
//   M: "Public Safety, Disaster Preparedness and Relief",
//   N: "Recreation, Sports, Leisure, Athletics",
//   O: "Youth Development",
//   P: "Human Services – Multipurpose and Other",
//   Q: "International, Foreign Affairs and National Security",
//   R: "Civil Rights, Social Action, Advocacy",
//   S: "Community Improvement, Capacity Building",
//   T: "Philanthropy, Voluntarism and Grantmaking Foundations",
//   U: "Science and Technology Research Institutes, Services",
//   V: "Social Science Research Institutes, Services",
//   W: "Public, Society Benefit – Multipurpose and Other",
//   X: "Religion-Related, Spiritual Development",
//   Y: "Mutual/Membership Benefit Organizations, Other",
//   Z: "Unknown",
// };

// const parseNumber = (val) => {
//   if (val == null || val === "") return 0;
//   if (typeof val === "number") return val;
//   const cleaned = String(val).replace(/[^0-9.-]+/g, "");
//   const num = parseFloat(cleaned);
//   return Number.isNaN(num) ? 0 : num;
// };

// const RevenueHeatmap = ({ csvUrl = "/il_nonprofits_orgs.csv" }) => {
//   const theme = useTheme();
//   const colors = tokens(theme.palette.mode);

//   const [heatmapData, setHeatmapData] = useState(null);
//   const [status, setStatus] = useState("loading");
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     setStatus("loading");
//     setError(null);

//     Papa.parse(csvUrl, {
//       download: true,
//       header: true,
//       dynamicTyping: true,
//       complete: (results) => {
//         try {
//           const data = results.data || [];

//           const cityCatStats = {};
//           const cityTotalRevenue = {};

//           data.forEach((row) => {
//             const cityRaw = row.city || row.mailing_city || row.city_name;
//             const city = (cityRaw || "").trim();
//             if (!city) return;

//             const letterRaw = row.ntee_letter || row.NTEE_LETTER;
//             const letter = (letterRaw || "").trim().toUpperCase();
//             if (!letter) return;

//             const cat =
//               NTEE_DESCRIPTIONS[letter] || `Category ${letter}` || "Unknown";
//             if (cat === "Unknown") return;

//             const revRaw =
//               row.revenue_amount ||
//               row.REVENUE_AMOUNT ||
//               row.revenue ||
//               row.REVENUE;

//             const rev = parseNumber(revRaw);
//             if (rev <= 0) return;

//             // total per city (for top 20 selection)
//             if (!cityTotalRevenue[city]) cityTotalRevenue[city] = 0;
//             cityTotalRevenue[city] += rev;

//             // stats per (city, category): sum + count
//             const key = `${city}||${cat}`;
//             if (!cityCatStats[key]) {
//               cityCatStats[key] = { total: 0, count: 0 };
//             }
//             cityCatStats[key].total += rev;
//             cityCatStats[key].count += 1;
//           });

//           const topCities = Object.entries(cityTotalRevenue)
//             .sort((a, b) => b[1] - a[1])
//             .slice(0, 10)
//             .map(([city]) => city);

//           const categorySet = new Set();
//           Object.keys(cityCatStats).forEach((key) => {
//             const [city, cat] = key.split("||");
//             if (topCities.includes(city)) {
//               categorySet.add(cat);
//             }
//           });

//           const categoryList = Array.from(categorySet).sort();

//           const values = [];
//           categoryList.forEach((cat) => {
//             topCities.forEach((city) => {
//               const key = `${city}||${cat}`;
//               const stats = cityCatStats[key];
//               const avg = stats ? stats.total / stats.count : 0;
//               values.push({
//                 x: topCities.indexOf(city),
//                 y: categoryList.indexOf(cat),
//                 city,
//                 category: cat,
//                 value: avg,
//               });
//             });
//           });

//           setHeatmapData({
//             xLabels: topCities,
//             yLabels: categoryList,
//             values,
//           });
//           setStatus("ready");
//         } catch (e) {
//           console.error(e);
//           setError("Failed to process CSV data for heatmap.");
//           setStatus("error");
//         }
//       },
//       error: (err) => {
//         console.error(err);
//         setError("Failed to load CSV file for heatmap.");
//         setStatus("error");
//       },
//     });
//   }, [csvUrl]);

//   if (status === "loading") {
//     return (
//       <Typography
//         variant="body2"
//         color={colors.grey[100]}
//         sx={{ p: 1 }}
//       >
//         Loading heatmap...
//       </Typography>
//     );
//   }

//   if (status === "error") {
//     return (
//       <Typography variant="body2" color="error.main" sx={{ p: 1 }}>
//         {error}
//       </Typography>
//     );
//   }

//   if (!heatmapData || !heatmapData.values?.length) {
//     return (
//       <Typography
//         variant="body2"
//         color={colors.grey[100]}
//         sx={{ p: 1 }}
//       >
//         No heatmap data available.
//       </Typography>
//     );
//   }

//   return <HeatmapBase data={heatmapData} />;
// };

// export default RevenueHeatmap;


// src/components/RevenueHeatmap.jsx
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import HeatmapBase from "./HeatmapBase";
import { useTheme, Typography } from "@mui/material";
import { tokens } from "../theme";

// Same mapping used in your treemap
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

const parseNumber = (val) => {
  if (val == null || val === "") return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/[^0-9.-]+/g, "");
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
};

const RevenueHeatmap = ({ csvUrl = "/il_nonprofits_orgs.csv" }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [heatmapData, setHeatmapData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    setStatus("loading");
    setError(null);

    Papa.parse(csvUrl, {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        try {
          const data = results.data || [];

          const cityCatStats = {};
          const cityTotalRevenue = {};

          data.forEach((row) => {
            const cityRaw = row.city || row.mailing_city || row.city_name;
            const city = (cityRaw || "").trim();
            if (!city) return;

            const letterRaw = row.ntee_letter || row.NTEE_LETTER;
            const letter = (letterRaw || "").trim().toUpperCase();
            if (!letter) return;

            const fullCat = NTEE_DESCRIPTIONS[letter] || `Category ${letter}`;
            if (fullCat === "Unknown") return;

            // Short label format → "<first 10 chars> (code)"
            const shortCat = `${fullCat.slice(0, 10).trim()} (${letter})`;

            const revRaw =
              row.revenue_amount ||
              row.REVENUE_AMOUNT ||
              row.revenue ||
              row.REVENUE;

            const rev = parseNumber(revRaw);
            if (rev <= 0) return;

            // total per city (for top-N selection)
            if (!cityTotalRevenue[city]) cityTotalRevenue[city] = 0;
            cityTotalRevenue[city] += rev;

            // stats per (city, category): sum + count
            const key = `${city}||${shortCat}`;
            if (!cityCatStats[key]) {
              cityCatStats[key] = { total: 0, count: 0 };
            }
            cityCatStats[key].total += rev;
            cityCatStats[key].count += 1;
          });

          // 🔟 Top 10 cities by TOTAL revenue
          const topCities = Object.entries(cityTotalRevenue)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([city]) => city);

          const categorySet = new Set();
          Object.keys(cityCatStats).forEach((key) => {
            const [city, catLabel] = key.split("||");
            if (topCities.includes(city)) {
              categorySet.add(catLabel);
            }
          });

          const categoryList = Array.from(categorySet).sort();

          const values = [];
          categoryList.forEach((catLabel) => {
            topCities.forEach((city) => {
              const key = `${city}||${catLabel}`;
              const stats = cityCatStats[key];
              const avg = stats ? stats.total / stats.count : 0;
              values.push({
                x: topCities.indexOf(city),
                y: categoryList.indexOf(catLabel),
                city,
                category: catLabel,
                value: avg,
              });
            });
          });

          setHeatmapData({
            xLabels: topCities,
            yLabels: categoryList, // short labels like "Arts (A)"
            values,
          });
          setStatus("ready");
        } catch (e) {
          console.error(e);
          setError("Failed to process CSV data for heatmap.");
          setStatus("error");
        }
      },
      error: (err) => {
        console.error(err);
        setError("Failed to load CSV file for heatmap.");
        setStatus("error");
      },
    });
  }, [csvUrl]);

  if (status === "loading") {
    return (
      <Typography variant="body2" color={colors.grey[100]} sx={{ p: 1 }}>
        Loading heatmap...
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

  if (!heatmapData || !heatmapData.values?.length) {
    return (
      <Typography variant="body2" color={colors.grey[100]} sx={{ p: 1 }}>
        No heatmap data available.
      </Typography>
    );
  }

  return <HeatmapBase data={heatmapData} />;
};

export default RevenueHeatmap;
