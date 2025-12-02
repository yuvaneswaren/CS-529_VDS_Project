// src/scenes/dashboard/index.jsx
import { useState } from "react";
import { Box, Typography, TextField, InputAdornment, IconButton, useTheme } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { tokens } from "../../theme";
import NteeTreemap from "../../components/NteeTreemap";
import RevenueHeatmap from "../../components/RevenueHeatmap";
import SectorStackedBarChart from "../../components/SectorStackedBarChart";
import MissionMomentumChart from "../../components/MissionMomentumChart";

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Selected NTEE mission letter
  const [selectedMission, setSelectedMission] = useState("E");
  
  // EIN search state
  const [searchEIN, setSearchEIN] = useState("");
  const [highlightedEIN, setHighlightedEIN] = useState(null);

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const ein = searchEIN.trim();
    if (ein) {
      setHighlightedEIN(ein);
    }
  };

  // Handle clear button
  const handleClearSearch = () => {
    setSearchEIN("");
    setHighlightedEIN(null);
  };

  // Handle text input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchEIN(value);
    // Clear highlight if user deletes all text
    if (!value.trim()) {
      setHighlightedEIN(null);
    }
  };

  // Called when clicking on chart area (clears the EIN highlight and search)
  const handleClearHighlight = () => {
    setHighlightedEIN(null);
    setSearchEIN("");
  };

  // Called when an EIN's mission is detected in the momentum chart
  const handleEINMissionDetected = (mission) => {
    setSelectedMission(mission);
  };

  // Called when user manually clicks a treemap category (should clear search)
  const handleMissionSelect = (mission) => {
    // Only clear highlight if this is a manual selection (not from EIN search)
    // Check if the mission is different from current
    if (mission !== selectedMission && highlightedEIN) {
      setHighlightedEIN(null);
      setSearchEIN("");
    }
    setSelectedMission(mission);
  };

  return (
    <Box m="10px">
      <Box display="flex" gap="20px" height="calc(100vh - 100px)">
        {/* LEFT SIDE (60%) */}
        <Box
          flex="2.5"
          display="flex"
          flexDirection="column"
          gap="20px"
          minHeight={0}
        >
          {/* Top-left: NTEE treemap */}
          <Box
            flex="0.5"
            backgroundColor={colors.primary[400]}
            p="10px 10px 10px 10px"
            display="flex"
            flexDirection="column"
            minHeight={0}
          >
            <Box display="flex" alignItems="baseline" gap={1.5}>
              <Typography
                variant="h5"
                fontWeight="600"
                color={colors.grey[100]}
              >
                NTEE Category Distribution
              </Typography>
              <Typography
                variant="body2"
                color={colors.grey[300]}
                sx={{ fontSize: "12px" }}
              >
                Each box area is directly proportional to the number of organizations in that mission category.
              </Typography>
            </Box>

            <Box flex="1" mt="4px" minHeight={0}>
              <Box height="100%">
                <NteeTreemap
                  selectedMission={selectedMission}
                  onMissionSelect={handleMissionSelect}
                  highlightedEIN={highlightedEIN}
                />
              </Box>
            </Box>
          </Box>

          {/* Bottom-left: heatmap and stacked bar chart */}
          <Box
            flex="1"
            display="flex"
            gap="20px"
            minHeight={0}
          >
            {/* Revenue heatmap */}
            <Box
              flex="1.3"
              backgroundColor={colors.primary[400]}
              p="5px 5px"
              display="flex"
              flexDirection="column"
              minHeight={0}
            >
              <Box flex="1" mt="4px" minHeight={0}>
                <Box height="100%">
                  <RevenueHeatmap />
                </Box>
              </Box>
            </Box>

            {/* Sector stacked bar */}
            <Box
              flex="1"
              backgroundColor={colors.primary[400]}
              p="16px 20px"
              display="flex"
              flexDirection="column"
              minHeight={0}
            >
              <Typography
                variant="h5"
                fontWeight="600"
                color={colors.grey[100]}
                mb={1}
              >
                Assets, Income & Revenue
              </Typography>

              <Box flex="1" mt="-8px" minHeight={0}>
                <Box height="100%">
                  <SectorStackedBarChart />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* RIGHT SIDE: mission momentum visualization */}
        <Box
          flex="2"
          backgroundColor={colors.primary[400]}
          p="16px 18px"
          display="flex"
          flexDirection="column"
          minHeight={0}
        >
          {/* Header */}
          <Typography
            color={colors.grey[100]}
            variant="h5"
            fontWeight="600"
            mb={0.5}
          >
            Revenue vs Margin Momentum - Mission {selectedMission} cohort
          </Typography>

          {/* Description and Search Row */}
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="flex-start"
            mb={0.5}
          >
            {/* Left side - Descriptions */}
            <Box flex="1">
              <Typography
                color={colors.grey[300]}
                variant="body2"
                mb={0.3}
              >
                Margin = surplus ÷ revenue.
              </Typography>

              <Typography
                color={colors.grey[300]}
                variant="body2"
              >
                Log revenue is a size measure that compresses small and very large
                organizations onto one axis.
              </Typography>
            </Box>

            {/* Right side - Search Bar */}
            <Box ml={2}>
              <form onSubmit={handleSearchSubmit}>
                <TextField
                  value={searchEIN}
                  onChange={handleSearchChange}
                  placeholder="Search by EIN"
                  size="small"
                  sx={{
                    width: "200px",
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: colors.primary[500],
                      "& fieldset": {
                        borderColor: colors.grey[600],
                      },
                      "&:hover fieldset": {
                        borderColor: colors.grey[500],
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: colors.greenAccent[500],
                      },
                    },
                    "& .MuiInputBase-input": {
                      color: colors.grey[100],
                      padding: "5px 8px",
                      fontSize: "12px",
                    },
                    "& .MuiInputBase-input::placeholder": {
                      color: colors.grey[400],
                      opacity: 1,
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: colors.grey[400], fontSize: "16px" }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchEIN && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={handleClearSearch}
                          sx={{ color: colors.grey[400], padding: "2px" }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </form>
            </Box>
          </Box>

          {/* Legend row - aligned with search bar on right */}
          <Box 
            display="flex" 
            justifyContent="flex-end"
            alignItems="center"
            mb={0.5}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: colors.grey[200],
                    border: '1px solid #111827'
                  }}
                />
                <Typography variant="caption" color={colors.grey[300]} fontSize={11}>
                  Dot: 2019 (Click dot for details)
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Box
                  sx={{
                    width: 0,
                    height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderBottom: `8px solid ${colors.redAccent[400]}`
                  }}
                />
                <Typography variant="caption" color={colors.grey[300]} fontSize={11}>
                  Arrowhead: 2023
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box flex="1" mt="4px" minHeight={0}>
            <MissionMomentumChart 
              selectedMission={selectedMission}
              highlightedEIN={highlightedEIN}
              onClearHighlight={handleClearHighlight}
              onEINMissionDetected={handleEINMissionDetected}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;