// src/components/NteeTreemap.jsx
import { useEffect, useState } from "react";
import { ResponsiveTreeMap } from "@nivo/treemap";
import { useTheme, Typography } from "@mui/material";
import { tokens } from "../theme";
import Papa from "papaparse";

import { scaleLinear } from "d3-scale";
import { interpolateBlues } from "d3-scale-chromatic";

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

const getShortLabel = (letter) => {
  const full = NTEE_DESCRIPTIONS[letter] || "Unknown";
  const firstWord = full.split(/[\s–-]+/)[0] || full;
  const short = firstWord.length <= 8 ? firstWord : firstWord.slice(0, 3);
  return `${letter} (${short})`;
};

const NteeTreemap = ({
  csvUrl = "/il_nonprofits_orgs.csv",
  selectedMission,
  onMissionSelect,
  highlightedEIN = null
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [rawRows, setRawRows] = useState([]);

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
          setRawRows(rows); // Store for EIN lookup

          const counts = {};
          rows.forEach((row) => {
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
              description: NTEE_DESCRIPTIONS[letter] || "Unknown / Other",
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

  // Auto-select mission when highlightedEIN changes
  useEffect(() => {
    if (highlightedEIN && rawRows.length > 0) {
      const org = rawRows.find(
        row => String(row.ein || row.EIN) === String(highlightedEIN)
      );
      
      if (org) {
        const missionLetter = (org.ntee_letter || org.NTEE_LETTER || "").trim().toUpperCase();
        console.log("Treemap found EIN:", highlightedEIN, "Mission:", missionLetter);
        if (missionLetter && onMissionSelect) {
          onMissionSelect(missionLetter);
        }
      } else {
        console.log("Treemap: EIN not found in rawRows:", highlightedEIN);
      }
    }
  }, [highlightedEIN, rawRows, onMissionSelect]);

  if (status === "loading") {
    return (
      <Typography
        variant="body2"
        color={colors.grey[100]}
        sx={{ p: 2 }}
      >
        Loading treemap…
      </Typography>
    );
  }

  if (status === "error") {
    return (
      <Typography
        variant="body2"
        color="error.main"
        sx={{ p: 2 }}
      >
        {error}
      </Typography>
    );
  }

  if (!treeData || !treeData.children || treeData.children.length === 0) {
    return (
      <Typography
        variant="body2"
        color={colors.grey[100]}
        sx={{ p: 2 }}
      >
        No NTEE data available.
      </Typography>
    );
  }

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

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ResponsiveTreeMap
        data={treeData}
        identity="name"
        value="value"
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        innerPadding={3}
        outerPadding={3}
        label={(node) => getShortLabel(node.data.name)}
        labelSkipSize={22}
        labelTextColor={{
          from: "color",
          modifiers: [["darker", 6]],
        }}
        parentLabelPosition="left"
        parentLabelPadding={4}
        parentLabelTextColor={{
          from: "color",
          modifiers: [["darker", 3]],
        }}
        colors={{ scheme: "green_blue" }}
        nodeOpacity={1}
        borderWidth={(node) =>
          selectedMission && node.data.name === selectedMission ? 3 : 1
        }
        borderColor={(node) =>
          selectedMission && node.data.name === selectedMission
            ? colors.grey[100]
            : colors.grey[800]
        }
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
          
          // Get first word of description for short label
          const firstWord = desc.split(/[\s–-]+/)[0] || desc;

          return (
            <div
              style={{
                padding: "8px 12px",
                background: colors.primary[600],
                color: colors.grey[100],
                borderRadius: 8,
                fontSize: 12,
                fontFamily:
                  "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                boxShadow: "0 8px 18px rgba(0,0,0,0.45)",
                pointerEvents: "none",
                maxWidth: 260,
                lineHeight: 1.4,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {letter} ({firstWord})
              </div>
              <div>Organizations</div>
              <div>
                Count:{" "}
                {(node.value || 0).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
          );
        }}
        animate={true}
        motionConfig="gentle"
        onClick={(node) => {
          const letter = node.data.name;
          if (letter && onMissionSelect) {
            onMissionSelect(letter);
          }
        }}
      />
    </div>
  );
};

export default NteeTreemap;