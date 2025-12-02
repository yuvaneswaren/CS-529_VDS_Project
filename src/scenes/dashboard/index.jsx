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

// Performance color constants (matching MissionMomentumChart)
const IMPROVED_COLOR = "#4CAF50";
const DECLINED_COLOR = "#EF5350";

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Selected NTEE mission letter
  const [selectedMission, setSelectedMission] = useState("E");
  
  // Search state (supports EIN or name)
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedEIN, setHighlightedEIN] = useState(null);

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      setHighlightedEIN(query);
    }
  };

  // Handle clear button
  const handleClearSearch = () => {
    setSearchQuery("");
    setHighlightedEIN(null);
  };

  // Handle text input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Clear highlight if user deletes all text
    if (!value.trim()) {
      setHighlightedEIN(null);
    }
  };

  // Called when clicking on chart area (clears the EIN highlight and search)
  const handleClearHighlight = () => {
    setHighlightedEIN(null);
    setSearchQuery("");
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
      setSearchQuery("");
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
            {/* Header with title and interactive hint */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography
                variant="h5"
                fontWeight="600"
                color={colors.grey[100]}
              >
                NTEE Category Distribution
              </Typography>
              <Typography
                variant="caption"
                sx={{ 
                  color: colors[400],
                  fontSize: "11px",
                  fontWeight: 600,
                  fontStyle: "bold"
                }}
              >
              </Typography>
            </Box>
            
            {/* Description */}
            <Typography
              variant="body2"
              color={colors.grey[300]}
              sx={{ fontSize: "12px", mb: 0.5 }}
            >
              Each box area is proportional to the number of organizations in that mission category.
            </Typography>

            <Box flex="1" minHeight={0}>
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
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by EIN or Name"
                  size="small"
                  sx={{
                    width: "220px",
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
                    endAdornment: searchQuery && (
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

          {/* Improved Legend row - stronger colors and higher contrast */}
          <Box 
            display="flex" 
            justifyContent="space-between"
            alignItems="center"
            mb={0.5}
            sx={{
              backgroundColor: "rgba(0,0,0,0.25)",
              borderRadius: 1,
              px: 1.5,
              py: 0.6,
            }}
          >
            {/* Left side - Performance indicators */}
            <Box display="flex" alignItems="center" gap={3}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Box
                  sx={{
                    width: 24,
                    height: 3,
                    backgroundColor: IMPROVED_COLOR,
                    borderRadius: 1,
                  }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: IMPROVED_COLOR, 
                    fontWeight: 600, 
                    fontSize: 11,
                  }}
                >
                  Margin Improved
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Box
                  sx={{
                    width: 24,
                    height: 3,
                    backgroundColor: DECLINED_COLOR,
                    borderRadius: 1,
                  }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: DECLINED_COLOR, 
                    fontWeight: 600, 
                    fontSize: 11,
                  }}
                >
                  Margin Declined
                </Typography>
              </Box>
            </Box>

            {/* Right side - Time indicators */}
            <Box display="flex" alignItems="center" gap={3}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: '#e0e0e0',
                    border: '2px solid #1a1a2e',
                  }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#e0e0e0', 
                    fontWeight: 600, 
                    fontSize: 11 
                  }}
                >
                  2019 Start
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Box
                  sx={{
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderBottom: '10px solid #e0e0e0',
                  }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#e0e0e0', 
                    fontWeight: 600, 
                    fontSize: 11 
                  }}
                >
                  2023 End
                </Typography>
              </Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: colors.grey[400], 
                  fontSize: 10, 
                  ml: 1,
                  fontStyle: 'italic'
                }}
              >
                Click any path for details
              </Typography>
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