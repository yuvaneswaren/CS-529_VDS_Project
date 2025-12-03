// // src/components/RevenueHeatmap.jsx
// import React, { useEffect, useState } from "react";
// import Papa from "papaparse";
// import HeatmapBase from "./HeatmapBase";
// import { useTheme, Typography } from "@mui/material";
// import { tokens } from "../theme";

// // NTEE descriptions (same as treemap)
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

// // helper to safely parse numeric fields like "12,345" or "$1,234"
// const parseNumber = (val) => {
//   if (val == null || val === "") return 0;
//   if (typeof val === "number") return val;
//   const cleaned = String(val).replace(/[^0-9.-]+/g, "");
//   const num = parseFloat(cleaned);
//   return Number.isNaN(num) ? 0 : num;
// };

// // Short category label for y-axis, e.g. "Human (P)"
// const getShortLabel = (letter) => {
//   const full = NTEE_DESCRIPTIONS[letter] || "Unknown";
//   const firstWord = full
//     .split(/[\s–-]+/)[0]
//     .replace(/[,.:-]+$/, "");
//   return `${firstWord} (${letter})`;
// };

// const RevenueHeatmap = ({
//   csvUrl = "/il_nonprofits_orgs.csv",
//   selectedMission,      // single-letter NTEE, if any
//   onMissionSelect,      // function(letter)
// }) => {
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

//           const cityCatStats = {};    // key: city||letter -> { total, count }
//           const cityTotalRevenue = {}; // city -> total revenue

//           data.forEach((row) => {
//             const cityRaw = row.city || row.mailing_city || row.city_name;
//             const city = (cityRaw || "").trim();
//             if (!city) return;

//             const letterRaw = row.ntee_letter || row.NTEE_LETTER;
//             const letter = (letterRaw || "").trim().toUpperCase();
//             if (!letter) return;

//             const revRaw =
//               row.revenue_amount ||
//               row.REVENUE_AMOUNT ||
//               row.revenue ||
//               row.REVENUE;

//             const rev = parseNumber(revRaw);
//             if (rev <= 0) return;

//             if (!cityTotalRevenue[city]) cityTotalRevenue[city] = 0;
//             cityTotalRevenue[city] += rev;

//             const key = `${city}||${letter}`;
//             if (!cityCatStats[key]) {
//               cityCatStats[key] = { total: 0, count: 0 };
//             }
//             cityCatStats[key].total += rev;
//             cityCatStats[key].count += 1;
//           });

//           // Top 10 cities by total revenue
//           const topCities = Object.entries(cityTotalRevenue)
//             .sort((a, b) => b[1] - a[1])
//             .slice(0, 10)
//             .map(([city]) => city);

//           // All NTEE letters that appear among those top cities
//           const letterSet = new Set();
//           Object.keys(cityCatStats).forEach((key) => {
//             const [city, letter] = key.split("||");
//             if (topCities.includes(city)) {
//               letterSet.add(letter);
//             }
//           });

//           const letters = Array.from(letterSet).sort();
//           const yLabels = letters.map((letter) => getShortLabel(letter));

//           // Build values array for heatmap
//           const values = [];
//           letters.forEach((letter, li) => {
//             const label = getShortLabel(letter);
//             topCities.forEach((city, ci) => {
//               const key = `${city}||${letter}`;
//               const stats = cityCatStats[key];
//               const avg = stats ? stats.total / stats.count : 0;
//               values.push({
//                 x: ci,
//                 y: li,
//                 city,
//                 category: label,
//                 value: avg,
//                 nteeLetter: letter,
//               });
//             });
//           });

//           setHeatmapData({
//             xLabels: topCities,
//             yLabels,
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

//   return (
//     <HeatmapBase
//       data={heatmapData}
//       title="Average Revenue by City & NTEE Category"
//       selectedMission={selectedMission}
//       onMissionSelect={onMissionSelect}
//     />
//   );
// };

// export default RevenueHeatmap;


// src/components/RevenueHeatmap.jsx
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { useTheme, Typography } from "@mui/material";
import { tokens } from "../theme";
import HeatmapBase from "./HeatmapBase";

// Same mapping used elsewhere
const NTEE_DESCRIPTIONS = {
  A: "Arts, Culture and Humanities",
  B: "Educational Institutions and Related Activities",
  C: "Environmental Quality, Protection and Beautification",
  D: "Animal-Related",
  E: "Health, General and Rehabilitative",
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

// Short label like "Human Serv (P)" but clipped for axis
const getShortLabel = (letter) => {
  const full = NTEE_DESCRIPTIONS[letter] || `Category ${letter}`;
  const prefix = full.slice(0, 12).trim();
  return `${prefix} (${letter})`;
};

const RevenueHeatmap = ({
  csvUrl = "/il_nonprofits_orgs.csv",
  selectedMission = "ALL",
  onMissionRowClick,
}) => {
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

          const cityMissionStats = {};
          const cityTotalRevenue = {};
          const missionLettersSet = new Set();

          data.forEach((row) => {
            const cityRaw = row.city || row.mailing_city || row.city_name;
            const city = (cityRaw || "").trim();
            if (!city) return;

            const letterRaw = row.ntee_letter || row.NTEE_LETTER;
            const letter = (letterRaw || "").trim().toUpperCase();
            if (!letter) return;

            const revRaw =
              row.revenue_amount ||
              row.REVENUE_AMOUNT ||
              row.revenue ||
              row.REVENUE;

            const rev = parseNumber(revRaw);
            if (rev <= 0) return;

            missionLettersSet.add(letter);

            if (!cityTotalRevenue[city]) cityTotalRevenue[city] = 0;
            cityTotalRevenue[city] += rev;

            const key = `${city}||${letter}`;
            if (!cityMissionStats[key]) {
              cityMissionStats[key] = { total: 0, count: 0 };
            }
            cityMissionStats[key].total += rev;
            cityMissionStats[key].count += 1;
          });

          const topCities = Object.entries(cityTotalRevenue)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([city]) => city);

          const missionLetters = Array.from(missionLettersSet).sort();

          const yLabels = [];
          const labelToMission = {};
          const missionToIndex = {};

          missionLetters.forEach((letter, idx) => {
            const label = getShortLabel(letter);
            yLabels.push(label);
            labelToMission[label] = letter;
            missionToIndex[letter] = idx;
          });

          const values = [];
          missionLetters.forEach((letter) => {
            const label = getShortLabel(letter);
            topCities.forEach((city) => {
              const key = `${city}||${letter}`;
              const stats = cityMissionStats[key];
              const avg = stats ? stats.total / stats.count : 0;

              values.push({
                city,
                mission: letter,
                categoryLabel: label,
                value: avg,
              });
            });
          });

          setHeatmapData({
            xLabels: topCities,
            yLabels,
            values,
            labelToMission,
            missionToIndex,
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
      <Typography
        variant="body2"
        color={colors.grey[100]}
        sx={{ p: 1 }}
      >
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
      <Typography
        variant="body2"
        color={colors.grey[100]}
        sx={{ p: 1 }}
      >
        No heatmap data available.
      </Typography>
    );
  }

  return (
    <HeatmapBase
      data={heatmapData}
      title="Average Revenue by City & NTEE Category"
      selectedMission={selectedMission}
      onMissionRowClick={onMissionRowClick}
    />
  );
};

export default RevenueHeatmap;
