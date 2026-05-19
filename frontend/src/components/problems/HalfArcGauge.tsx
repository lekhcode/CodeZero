import { Box } from "@mui/material";
import { miui } from "@/theme/theme";

const CX = 40;
const CY = 40;
const R = 32;
const STROKE = 5;
/** Semicircle path length (π × r). */
const ARC_LEN = Math.PI * R;

type HalfArcGaugeProps = {
  percent: number;
  color: string;
};

export function HalfArcGauge({ percent, color }: HalfArcGaugeProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = (clamped / 100) * ARC_LEN;
  const offset = ARC_LEN - filled;

  return (
    <Box sx={{ width: 80, height: 44, position: "relative", overflow: "hidden" }}>
      <svg width={80} height={44} viewBox="0 0 80 44" aria-hidden>
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke={miui.elevated}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${ARC_LEN} ${ARC_LEN}`}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 150ms ease" }}
        />
      </svg>
    </Box>
  );
}
