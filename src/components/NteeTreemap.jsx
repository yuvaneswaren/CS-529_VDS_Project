// // src/components/NteeTreemap.jsx
// import { useEffect, useState } from "react";
// import { ResponsiveTreeMap } from "@nivo/treemap";
// import { useTheme, Typography } from "@mui/material";
// import { tokens } from "../theme";
// import Papa from "papaparse";

// import { scaleLinear } from "d3-scale";
// import { interpolateBlues } from "d3-scale-chromatic";
// import { format } from "d3-format";

// // Map NTEE letter -> description
// const NTEE_DESCRIPTIONS = {
//   A: "Arts, Culture and Humanities",
//   B: "Educational Institutions and Related Activities",
//   C: "Environmental Quality, Protection and Beautification",
//   D: "Animal-Related",
//   E: "Health, General and Rehabilitative",
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

// // Short label like "P (Human)"
// const getShortLabel = (letter) => {
//   const full = NTEE_DESCRIPTIONS[letter] || "Unknown";
//   const firstWord = full.split(/[\s–-]+/)[0] || full;
//   const trimmed =
//     firstWord.length <= 8 ? firstWord : firstWord.slice(0, 6);
//   return `${letter} (${trimmed})`;
// };

// const NteeTreemap = ({
//   csvUrl = "/il_nonprofits_orgs.csv",
//   selectedMission = "ALL", // "ALL" means root / no filter
//   onMissionSelect,
// }) => {
//   const theme = useTheme();
//   const colors = tokens(theme.palette.mode);

//   const [status, setStatus] = useState("loading");
//   const [error, setError] = useState(null);
//   const [treeData, setTreeData] = useState(null);

//   useEffect(() => {
//     setStatus("loading");
//     setError(null);

//     Papa.parse(csvUrl, {
//       download: true,
//       header: true,
//       dynamicTyping: true,
//       complete: (results) => {
//         try {
//           const rows = results.data || [];

//           const counts = {};
//           rows.forEach((row) => {
//             const letterRaw = row.ntee_letter || row.NTEE_LETTER;
//             if (!letterRaw || typeof letterRaw !== "string") return;
//             const key = letterRaw.trim().toUpperCase();
//             if (!key) return;
//             counts[key] = (counts[key] || 0) + 1;
//           });

//           const children = Object.entries(counts).map(
//             ([letter, count]) => ({
//               name: letter,
//               value: count,
//               description:
//                 NTEE_DESCRIPTIONS[letter] || "Unknown / Other",
//             })
//           );

//           if (!children.length) {
//             setTreeData(null);
//             setStatus("ready");
//             return;
//           }

//           setTreeData({
//             name: "NTEE - wise organizations count",
//             children,
//           });
//           setStatus("ready");
//         } catch (e) {
//           console.error(e);
//           setError("Failed to process CSV data.");
//           setStatus("error");
//         }
//       },
//       error: (err) => {
//         console.error(err);
//         setError("Failed to load CSV file.");
//         setStatus("error");
//       },
//     });
//   }, [csvUrl]);

//   if (status === "loading") {
//     return (
//       <Typography variant="body2" color={colors.grey[100]} sx={{ p: 2 }}>
//         Loading treemap…
//       </Typography>
//     );
//   }

//   if (status === "error") {
//     return (
//       <Typography variant="body2" color="error.main" sx={{ p: 2 }}>
//         {error}
//       </Typography>
//     );
//   }

//   if (!treeData || !treeData.children || treeData.children.length === 0) {
//     return (
//       <Typography variant="body2" color={colors.grey[100]} sx={{ p: 2 }}>
//         No NTEE data available.
//       </Typography>
//     );
//   }

//   // d3 color scale based on counts
//   const maxValue = Math.max(
//     ...treeData.children.map((c) => c.value || 0),
//     0
//   );

//   const colorScale =
//     maxValue > 0
//       ? scaleLinear()
//           .domain([1, maxValue])
//           .range([interpolateBlues(0.45), interpolateBlues(0.95)])
//       : () => colors.greenAccent[500];

//   const formatCount = format(",d");
//   const activeMission =
//     selectedMission && selectedMission !== "ALL"
//       ? selectedMission
//       : null;

//   return (
//     <div style={{ width: "100%", height: "100%" }}>
//       <ResponsiveTreeMap
//         data={treeData}
//         identity="name"
//         value="value"
//         margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
//         innerPadding={3}
//         outerPadding={3}
//         tile="squarify"
//         label={(node) => getShortLabel(node.data.name)}
//         labelSkipSize={18}
//         labelTextColor={{
//           from: "color",
//           modifiers: [["brighter", 8]],
//         }}
//         parentLabelPosition="left"
//         parentLabelPadding={4}
//         parentLabelTextColor={{
//           from: "color",
//           modifiers: [["brighter", 3]],
//         }}
//         nodeColor={(node) => colorScale(node.value || 0)}
//         // 🔹 Highlight logic:
//         // - ALL mode: all tiles get a slightly thicker light border
//         // - Single mission: that tile gets a strong thick border
//         borderWidth={(node) => {
//           const letter = node.data.name;
//           if (!activeMission) {
//             // "ALL" state: subtle global highlight
//             return 2;
//           }
//           return letter === activeMission ? 3 : 1;
//         }}
//         borderColor={(node) => {
//           const letter = node.data.name;
//           if (!activeMission) {
//             // ALL mode: light outline for all tiles
//             return colors.grey[300];
//           }
//           if (letter === activeMission) {
//             return colors.grey[100]; // strong highlight
//           }
//           return "rgba(0, 0, 0, 0.6)";
//         }}
//         theme={{
//           textColor: colors.grey[100],
//           tooltip: {
//             container: {
//               background: colors.primary[500],
//               color: colors.grey[100],
//               fontSize: 12,
//             },
//           },
//         }}
//         tooltip={({ node }) => {
//         const letter = node.data.name;
//         const desc =
//           node.data.description ||
//           NTEE_DESCRIPTIONS[letter] ||
//           "Total";

//         return (
//           <div
//             style={{
//               position: "relative",

//               /* move down + right from cursor anchor */
//               transform: "translate(120px, 100px)",  

//               padding: "6px 9px",
//               background: colors.primary[500],
//               border: `1px solid ${colors.grey[300]}`,
//               color: colors.grey[100],
//               borderRadius: 4,
//               maxWidth: 260,
//               pointerEvents: "none",
//               whiteSpace: "normal",
//               boxShadow: "0 3px 10px rgba(0,0,0,0.4)",
//             }}
//           >
//             <strong>{desc}</strong>
//             <br />
//             ({letter}) - Organizations: {formatCount(node.value || 0)}
//           </div>
//         );
//       }}

//         // tooltip={({ node }) => {
//         //   const letter = node.data.name;
//         //   const desc =
//         //     node.data.description ||
//         //     NTEE_DESCRIPTIONS[letter] ||
//         //     "Total";

//         //   return (
//         //     <div
//         //       style={{
//         //         padding: "6px 9px",
//         //         background: colors.primary[500],
//         //         border: `1px solid ${colors.grey[300]}`,
//         //         color: colors.grey[100],
//         //         borderRadius: 4,
//         //         maxWidth: 240,
//         //         whiteSpace: "normal",
//         //         pointerEvents: "none",
//         //         boxShadow: "0 2px 6px rgba(0,0,0,0.4)",

//         //         // 🔽 move tooltip content below the cursor
//         //         marginTop: 230,   // adjust this to taste
//         //         // optional: nudge a bit left so it’s more centered under cursor
//         //         marginLeft: 2,
//         //       }}
//         //     >
//         //       <strong>{desc}</strong>
//         //       <br />
//         //       ({letter}) – Organizations: {formatCount(node.value || 0)}
//         //     </div>
//         //   );
//         // }}
//         onClick={(node) => {
//           if (!onMissionSelect) return;

//           // Nivo doesn't really render a separate root tile, but if it ever
//           // sends the root node here, treat that as "ALL"
//           if (node.data && node.data.name === treeData.name) {
//             onMissionSelect("ALL");
//             return;
//           }

//           const letter = node.data.name;
//           if (!letter) return;

//           // Clicking the same mission again toggles back to ALL (no filter)
//           if (activeMission && letter === activeMission) {
//             onMissionSelect("ALL");
//           } else {
//             onMissionSelect(letter);
//           }
//         }}
//         animate={true}
//         motionConfig="gentle"
//       />
//     </div>
//   );
// };

// export default NteeTreemap;

// src/components/NteeTreemap.jsx
import { useEffect, useState } from "react";
import { ResponsiveTreeMap } from "@nivo/treemap";
import { useTheme, Typography } from "@mui/material";
import { tokens } from "../theme";
import Papa from "papaparse";

import { format } from "d3-format";

// Map NTEE letter -> description
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

// Short label like "P (Human)"
const getShortLabel = (letter) => {
  const full = NTEE_DESCRIPTIONS[letter] || "Unknown";
  const firstWord = full.split(/[\s–-]+/)[0] || full;
  const trimmed = firstWord.length <= 8 ? firstWord : firstWord.slice(0, 6);
  return `${letter} (${trimmed})`;
};

const NteeTreemap = ({
  csvUrl = "/il_nonprofits_orgs.csv",
  selectedMission = "ALL", // "ALL" means root / no filter
  onMissionSelect,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [treeData, setTreeData] = useState(null);

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

          const counts = {};
          rows.forEach((row) => {
            const letterRaw = row.ntee_letter || row.NTEE_LETTER;
            if (!letterRaw || typeof letterRaw !== "string") return;
            const key = letterRaw.trim().toUpperCase();
            if (!key) return;
            counts[key] = (counts[key] || 0) + 1;
          });

          const children = Object.entries(counts).map(([letter, count]) => ({
            name: letter,
            value: count,
            description: NTEE_DESCRIPTIONS[letter] || "Unknown / Other",
          }));

          if (!children.length) {
            setTreeData(null);
            setStatus("ready");
            return;
          }

          setTreeData({
            name: "NTEE - wise organizations count",
            children,
          });
          setStatus("ready");
        } catch (e) {
          console.error(e);
          setError("Failed to process CSV data.");
          setStatus("error");
        }
      },
      error: (err) => {
        console.error(err);
        setError("Failed to load CSV file.");
        setStatus("error");
      },
    });
  }, [csvUrl]);

  if (status === "loading") {
    return (
      <Typography variant="body2" color={colors.grey[100]} sx={{ p: 2 }}>
        Loading treemap…
      </Typography>
    );
  }

  if (status === "error") {
    return (
      <Typography variant="body2" color="error.main" sx={{ p: 2 }}>
        {error}
      </Typography>
    );
  }

  if (!treeData || !treeData.children || treeData.children.length === 0) {
    return (
      <Typography variant="body2" color={colors.grey[100]} sx={{ p: 2 }}>
        No NTEE data available.
      </Typography>
    );
  }

  const formatCount = format(",d");
  const activeMission =
    selectedMission && selectedMission !== "ALL" ? selectedMission : null;

  // 🎨 Choose Nivo color scheme:
  // - ALL mode: softer "set3"
  // - Specific mission selected: stronger "category10" (Tableau-like)
  // const colorScheme = !activeMission ? "set3" : "category10";
  const colorScheme = "paired";

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ResponsiveTreeMap
        data={treeData}
        identity="name"
        value="value"
        margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
        innerPadding={3}
        outerPadding={3}
        tile="squarify"
        label={(node) => getShortLabel(node.data.name)}
        labelSkipSize={18}
        labelTextColor={{
          from: "color",
          modifiers: [["brighter", 8]],
        }}
        parentLabelPosition="left"
        parentLabelPadding={4}
        parentLabelTextColor={{
          from: "color",
          modifiers: [["brighter", 3]],
        }}
        // ⭐ Use Nivo's built-in color scheme
        // colors={{ scheme: colorScheme}}
        colors={{ scheme: colorScheme, opacity: 1}}

        nodeColor={(node) => {
            const c = node.color;
            // Convert RGBA → RGB to force full opacity
            if (c.startsWith("rgba")) {
                const [r, g, b] = c
                    .replace("rgba(", "")
                    .replace(")", "")
                    .split(",")
                    .map((d) => d.trim())
                    .slice(0, 3);
                return `rgb(${r}, ${g}, ${b})`;
            }
            return c; // already opaque
        }}
        // 🔹 Highlight logic:
        // - ALL mode: all tiles get a slightly thicker light border
        // - Single mission: that tile gets a strong thick border
        borderWidth={(node) => {
          const letter = node.data.name;
          if (!activeMission) {
            // "ALL" state: subtle global highlight
            return 2;
          }
          return letter === activeMission ? 3 : 1;
        }}
        borderColor={(node) => {
          const letter = node.data.name;
          if (!activeMission) {
            // ALL mode: light outline for all tiles
            return colors.grey[300];
          }
          if (letter === activeMission) {
            return colors.grey[100]; // strong highlight
          }
          return "rgba(0, 0, 0, 0.6)";
        }}
        theme={{
          textColor: colors.grey[100],
          tooltip: {
            container: {
              background: colors.primary[500],
              color: colors.grey[100],
              fontSize: 12,
            },
          },
        }}
        tooltip={({ node }) => {
          const letter = node.data.name;
          const desc =
            node.data.description || NTEE_DESCRIPTIONS[letter] || "Total";

          return (
            <div
              style={{
                position: "relative",

                // move tooltip down + right from cursor anchor
                transform: "translate(120px, 100px)",

                padding: "6px 9px",
                background: colors.primary[500],
                border: `1px solid ${colors.grey[300]}`,
                color: colors.grey[100],
                borderRadius: 4,
                maxWidth: 260,
                pointerEvents: "none",
                whiteSpace: "normal",
                boxShadow: "0 3px 10px rgba(0,0,0,0.4)",
              }}
            >
              <strong>{desc}</strong>
              <br />
              ({letter}) - Organizations: {formatCount(node.value || 0)}
            </div>
          );
        }}
        onClick={(node) => {
          if (!onMissionSelect) return;

          // Nivo doesn't really render a separate root tile, but if it ever
          // sends the root node here, treat that as "ALL"
          if (node.data && node.data.name === treeData.name) {
            onMissionSelect("ALL");
            return;
          }

          const letter = node.data.name;
          if (!letter) return;

          // Clicking the same mission again toggles back to ALL (no filter)
          if (activeMission && letter === activeMission) {
            onMissionSelect("ALL");
          } else {
            onMissionSelect(letter);
          }
        }}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
};

export default NteeTreemap;
