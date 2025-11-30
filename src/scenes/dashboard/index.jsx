import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { mockTransactions } from "../../data/mockData";
import BarChart from "../../components/BarChart";
// import GeographyChart from "../../components/GeographyChart";
// import GeographyChart from "../../components/GeographyChart";
import ProgressCircle from "../../components/ProgressCircle";
import NteeTreemap from "../../components/NteeTreemap";
import RevenueHeatmap from "../../components/RevenueHeatmap";
import SectorStackedBarChart from "../../components/SectorStackedBarChart";

import AssetRevenueScatter from "../../components/AssetRevenueScatter";
import CityFinancialGlyphGrid from "../../components/CityFinancialGlyphGrid";

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box m="10px">
      {/* Outer split: 60% (left) / 40% (right) */}
      <Box display="flex" gap="20px" height="calc(100vh - 110px)">
        {/* LEFT SIDE (60%) */}
        <Box
          flex="2.5"
          display="flex"
          flexDirection="column"
          gap="20px"
          minHeight={0}
        >
          {/* Top-left: Treemap (takes top half of left) */}
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
              {/* parent needs explicit height for ResponsiveTreeMap */}
              <Box height="100%">
                <NteeTreemap />
              </Box>
            </Box>
          </Box>

          {/* Bottom-left: two charts side by side (each takes half of bottom-left height) */}
          <Box
            flex="1"
            display="flex"
            gap="20px"
            minHeight={0}
          >
            {/* Bottom-left: Chart 1 (Geography) */}
            <Box
              flex="1.3"
              backgroundColor={colors.primary[400]}
              p="5px 5px"
              display="flex"
              flexDirection="column"
              minHeight={0}
            >
              {/* <Typography
                variant="h5"
                fontWeight="600"
                color={colors.grey[100]}
                mb={1}
              >
                Geography Based Traffic
              </Typography> */}
              <Box flex="1" mt="4px" minHeight={0}>
                <Box height="100%">
                        <RevenueHeatmap />
                </Box>
              </Box>
            </Box>
            
            {/* Bottom-left: Chart 1 (Bar) */}
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

        {/* RIGHT SIDE (40%) */}
        <Box
          flex="2"
          display="flex"
          flexDirection="column"
          gap="20px"
          minHeight={0}
        >
          {/* Top-right: Recent Transactions */}
          <Box
            flex="1"
            backgroundColor={colors.primary[400]}
            display="flex"
            flexDirection="column"
            minHeight={0}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              borderBottom={`4px solid ${colors.primary[500]}`}
              p="15px 15px 10px 15px"
            >
              <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
                Recent Transactions
              </Typography>
            </Box>

            <Box
              flex="1"
              overflow="auto"
              minHeight={0}
            >
              {mockTransactions.map((transaction, i) => (
                <Box
                  key={`${transaction.txId}-${i}`}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  borderBottom={`4px solid ${colors.primary[500]}`}
                  p="12px 15px"
                >
                  <Box>
                    <Typography
                      color={colors.greenAccent[500]}
                      variant="h6"
                      fontWeight="600"
                    >
                      {transaction.txId}
                    </Typography>
                    <Typography color={colors.grey[100]}>
                      {transaction.user}
                    </Typography>
                  </Box>
                  <Box color={colors.grey[100]}>{transaction.date}</Box>
                  <Box
                    backgroundColor={colors.greenAccent[500]}
                    p="5px 10px"
                    borderRadius="4px"
                  >
                    ${transaction.cost}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Bottom-right: Campaign / Progress */}
          <Box
            flex="1"
            backgroundColor={colors.primary[400]}
            p="20px"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight={0}
          >
            <Typography
              variant="h5"
              fontWeight="600"
              color={colors.grey[100]}
            >
              Campaign Performance
            </Typography>

            <Box
              mt="15px"
              display="flex"
              flexDirection="column"
              alignItems="center"
            >
              <ProgressCircle size="125" />
              <Typography
                variant="h6"
                color={colors.greenAccent[500]}
                sx={{ mt: "15px" }}
              >
                $48,352 revenue generated
              </Typography>
              <Typography
                variant="body2"
                color={colors.grey[100]}
                textAlign="center"
                sx={{ mt: "5px" }}
              >
                Includes extra miscellaneous expenditures and costs.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
