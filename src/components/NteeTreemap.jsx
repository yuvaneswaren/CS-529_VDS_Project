// src/components/NteeTreemap.jsx
import { useEffect, useState } from "react";
import { ResponsiveTreeMap } from "@nivo/treemap";
import { useTheme, Typography } from "@mui/material";
import { tokens } from "../theme";
import Papa from "papaparse";

import { scaleLinear } from "d3-scale";
import { interpolateBlues } from "d3-scale-chromatic";
import { format } from "d3-format";

// Map NTEE letter -> description
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

// 🔹 Helper: build short label like "B (Edu)"
const getShortLabel = (letter) => {
  const full = NTEE_DESCRIPTIONS[letter] || "Unknown";
  // take first word, split on space/dash/en dash
  const firstWord = full.split(/[\s–-]+/)[0] || full;
  // shorten long words to 3 letters
  const short =
    firstWord.length <= 8 ? firstWord : firstWord.slice(0, 3);
  return `${letter} (${short})`;
};

const NteeTreemap = ({ csvUrl = "/il_nonprofits_orgs.csv" }) => {
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
            // be a bit robust: support both ntee_letter and NTEE_LETTER
            const letterRaw = row.ntee_letter || row.NTEE_LETTER;
            if (!letterRaw || typeof letterRaw !== "string") return;
            const key = letterRaw.trim().toUpperCase();
            if (!key) return;
            counts[key] = (counts[key] || 0) + 1;
          });

          const children = Object.entries(counts).map(
            ([letter, count]) => ({
              name: letter,
              value: count,
              description:
                NTEE_DESCRIPTIONS[letter] || "Unknown / Other",
            })
          );

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

  // 🔹 d3: build a numeric color scale based on counts
  const maxValue = Math.max(
    ...treeData.children.map((c) => c.value || 0),
    0
  );

  const colorScale =
    maxValue > 0
      ? scaleLinear()
          .domain([1, maxValue])
          .range([interpolateBlues(0.6), interpolateBlues(0.95)])
      : () => colors.primary[500];

  // 🔹 d3: nice integer formatter for counts
  const formatCount = format(",d");

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ResponsiveTreeMap
        data={treeData}
        identity="name"
        value="value"
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        innerPadding={3}
        outerPadding={3}
        // ⬇️ use short label "B (Edu)" instead of just "B"
        label={(node) => getShortLabel(node.data.name)}
        labelSkipSize={22} // a bit higher since label is longer
        labelTextColor={{
          from: "color",
          modifiers: [["darker", 6]],
        }}
        parentLabelPosition="left"
        parentLabelPadding={4}
        parentLabelTextColor={{
          from: "color",
          modifiers: [["brighter", 3]],
        }}
        borderWidth={1}
        borderColor={{
          from: "color",
          modifiers: [["darker", 0.3]],
        }}
        // nodeColor={(node) => colorScale(node.value || 0)}
        // colors={{ scheme: "tableau10" }}
        colors={{ scheme: "green_blue" }}
        // colors={{ scheme: "blues" }}
        // colors={{ scheme: "greens" }}
        nodeOpacity={1}           // <- removes visual transparency
        // enableParentLabel={true}
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
            node.data.description ||
            NTEE_DESCRIPTIONS[letter] ||
            "Total";

          const nodeX = node.x || 0;
          const nodeWidth = node.width || 0;
          const centerX = nodeX + nodeWidth / 2;

          const rootWidth =
            (node.parent && node.parent.width) || nodeWidth || 0;

          const isLeftHalf =
            rootWidth > 0 ? centerX < rootWidth / 2 : true;

          const horizontalTransform = isLeftHalf
            ? "translate(70%, 100px)"
            : "translate(100px, 70%)";

          return (
            <div
              style={{
                padding: "6px 9px",
                background: colors.primary[500],
                border: `1px solid ${colors.grey[300]}`,
                color: colors.grey[100],
                borderRadius: 4,
                maxWidth: 220,
                whiteSpace: "normal",
                transform: horizontalTransform,
                pointerEvents: "none",
                boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
              }}
            >
              <strong>{desc}</strong>
              <br />
              ({letter}) – Organizations: {formatCount(node.value || 0)}
            </div>
          );
        }}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
};

export default NteeTreemap;
