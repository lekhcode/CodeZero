import { Box } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { miui } from "@/theme/theme";

type ProblemSolvedIndicatorProps = {
  solved: boolean;
};

/** Small circle with tick when the user has solved this problem. */
export function ProblemSolvedIndicator({ solved }: ProblemSolvedIndicatorProps) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        border: `1px solid ${solved ? miui.successBorder : miui.borderStrong}`,
        bgcolor: solved ? miui.successSoft : "transparent",
      }}
    >
      {solved ? (
        <CheckRoundedIcon sx={{ fontSize: 12, color: miui.success }} />
      ) : null}
    </Box>
  );
}
