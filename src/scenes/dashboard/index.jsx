import { useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import NteeTreemap from "../../components/NteeTreemap";
import RevenueHeatmap from "../../components/RevenueHeatmap";
import SectorStackedBarChart from "../../components/SectorStackedBarChart";
import MissionMomentumChart from "../../components/MissionMomentumChart";

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Selected NTEE mission letter, for example "E" for Health
  const [selectedMission, setSelectedMission] = useState("E");

  return (
    <Box m="10px">
      <Box display="flex" gap="20px" height="calc(100vh - 110px)">
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
            <Typography
              variant="h5"
              fontWeight="600"
              color={colors.grey[100]}
              mb={0}
            >
              NTEE Category Distribution
            </Typography>

            <Box flex="1" mt="4px" minHeight={0}>
              <Box height="100%">
                <NteeTreemap
                  selectedMission={selectedMission}
                  onMissionSelect={setSelectedMission}
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
          {/* Header row with title and legend */}
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center"
            mb={0.5}
          >
            <Typography
              color={colors.grey[100]}
              variant="h5"
              fontWeight="600"
            >
              Revenue vs Margin Momentum - Mission {selectedMission} cohort
            </Typography>
            
            {/* Legend - inline with header */}
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
                <Typography variant="caption" color={colors.grey[300]} fontSize={10}>
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
                <Typography variant="caption" color={colors.grey[300]} fontSize={10}>
                  Arrowhead: 2023
                </Typography>
              </Box>
            </Box>
          </Box>

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
            mb={1}
          >
            Log revenue is a size measure that compresses small and very large
            organizations onto one axis.
          </Typography>

          <Box flex="1" mt="4px" minHeight={0}>
            <MissionMomentumChart selectedMission={selectedMission} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;