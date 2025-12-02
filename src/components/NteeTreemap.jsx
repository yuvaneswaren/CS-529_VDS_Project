// src/components/NteeTreemap.jsx
import { useEffect, useState } from "react";
import { ResponsiveTreeMap } from "@nivo/treemap";
import { useTheme, Typography } from "@mui/material";
import { tokens } from "../theme";
import Papa from "papaparse";

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

          // Sort by value (size) in descending order
          children.sort((a, b) => b.value - a.value);

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

  // Professional muted color palette - no flashy or neon colors
  const modernColors = [
    '#FFFFFF', // White
    '#88C9A1', // Sage Green
    '#B8A4C9', // Soft Purple
    '#E8B563', // Warm Gold
    '#D88B7C', // Terracotta
    '#91C4D4', // Powder Blue
    '#C79D9D', // Dusty Rose
    '#D4A76A', // Bronze
    '#7FA89F', // Seafoam
    '#C8A8D4', // Lavender
    '#9BB88D', // Olive Green
    '#D9A27D', // Caramel
    '#A696C8', // Periwinkle
    '#88BDBC', // Teal Muted
    '#D6B877', // Sandy Gold
    '#C48B8B', // Mauve
    '#79A3A3', // Slate Teal
    '#B89DC9', // Lilac
    '#D4C27A', // Wheat
    '#A5988E', // Taupe
    '#8FA3B8', // Steel Blue
    '#7FA89F', // Sage Teal
    '#B68BA8', // Plum
    '#9A8C7A', // Warm Grey
    '#94A8B3', // Slate Grey
    '#B3A084', // Sand
    '#C9B2D4', // Orchid
  ];

  return (
    <div style={{ width: "100%", height: "100%", background: "transparent", position: "relative" }}>
      {/* Instruction label matching MissionMomentumChart exact styling - positioned at right end of treemap */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: 8,
          transform: "translateY(-450%)",
          fontSize: 10,
          color: colors.grey[100],
          background: colors.primary[500],
          padding: "6px 10px",
          borderRadius: 4,
          zIndex: 10,
          border: `1px solid ${colors.grey[600]}`,
          fontWeight: 500,
          height: "30px",
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        <strong style={{ color: colors[400] }}>Click any category to filter</strong>
      </div>

      <ResponsiveTreeMap
        data={treeData}
        identity="name"
        value="value"
        margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        innerPadding={2}
        outerPadding={2}
        label={(node) => {
          // Hide labels only for D, C, K, and R categories
          const hiddenCategories = ['D', 'C', 'K', 'R'];
          if (hiddenCategories.includes(node.data.name)) {
            return '';
          }
          return getShortLabel(node.data.name);
        }}
        labelSkipSize={40}
        labelTextColor="#000000"
        parentLabelPosition="left"
        parentLabelPadding={4}
        parentLabelTextColor="#000000"
        colors={modernColors}
        nodeOpacity={1}
        borderWidth={(node) =>
          selectedMission && node.data.name === selectedMission ? 8 : 0
        }
        borderColor={(node) => {
          if (selectedMission && node.data.name === selectedMission) {
            return '#000000'; // Black border for selection
          }
          return 'transparent'; // No border for unselected
        }}
        theme={{
          background: 'transparent',
          textColor: '#000000',
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
                boxShadow: "0 12px 18px rgba(0,0,0,0.45)",
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
      
      {/* Add global style for pointer cursor on all treemap rectangles */}
      <style>
        {`
          div[role="treemap"] rect {
            cursor: pointer !important;
          }
        `}
      </style>
    </div>
  );
};

export default NteeTreemap;