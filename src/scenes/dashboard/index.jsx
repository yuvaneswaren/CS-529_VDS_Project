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
          <Typography
            color={colors.grey[100]}
            variant="h5"
            fontWeight="600"
            mb={0.5}
          >
            Revenue vs Margin Momentum - Mission {selectedMission} cohort
          </Typography>

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