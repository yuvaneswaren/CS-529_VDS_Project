import { Box, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box 
      display="flex" 
      justifyContent="space-between" 
      p={3} 
      paddingBottom={0}
      backgroundColor={colors.primary[400]}
    >
      <Header subtitle="Illinois Non-Profit IRS 990 Data Dashboard" />
    </Box>
  );
};

export default Topbar;