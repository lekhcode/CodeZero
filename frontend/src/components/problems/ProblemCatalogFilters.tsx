import {
  Box,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import type { DifficultyLevel } from "@/types/api.types";
import { AnimatedBanner } from "@/components/ui/AnimatedBanner";
import { difficultyColor, formatDifficulty } from "@/utils/difficulty";
import { miui } from "@/theme/theme";

const DIFFICULTY_OPTIONS: DifficultyLevel[] = ["EASY", "MEDIUM", "HARD"];

const CONTROL_HEIGHT = 40;

type ProblemCatalogFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  difficulty: DifficultyLevel[];
  onDifficultyChange: (value: DifficultyLevel[]) => void;
  includePremium: boolean;
  onIncludePremiumChange: (value: boolean) => void;
};

export function ProblemCatalogFilters({
  search,
  onSearchChange,
  difficulty,
  onDifficultyChange,
  includePremium,
  onIncludePremiumChange,
}: ProblemCatalogFiltersProps) {
  return (
    <AnimatedBanner
      subtle
      sx={{
        p: 2,
        borderRadius: 2.5,
        border: `1px solid ${miui.border}`,
        bgcolor: miui.paper,
        boxShadow: "none",
      }}
    >
      <TextField
        fullWidth
        size="small"
        placeholder="Search problems by title or slug…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: <SearchRoundedIcon sx={{ mr: 1, color: "text.secondary", fontSize: 20 }} />,
            sx: {
              height: CONTROL_HEIGHT,
              transition: "box-shadow 0.15s ease",
            },
          },
        }}
        sx={{
          mb: 1.5,
          "& .MuiOutlinedInput-root": {
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            "&.Mui-focused": {
              boxShadow: `0 0 0 3px ${alpha(miui.primary, 0.12)}`,
            },
          },
        }}
      />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{
          alignItems: { sm: "center" },
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minHeight: CONTROL_HEIGHT }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0 }}
          >
            Difficulty
          </Typography>
          <ToggleButtonGroup
            exclusive={false}
            size="small"
            value={difficulty}
            onChange={(_e, next: DifficultyLevel[]) => {
              onDifficultyChange(next);
            }}
            aria-label="Difficulty filter"
            sx={{
              height: CONTROL_HEIGHT,
              gap: 0.5,
              "& .MuiToggleButton-root": {
                height: CONTROL_HEIGHT - 4,
                px: 1.75,
                textTransform: "none",
                fontWeight: 700,
                borderColor: miui.border,
                borderRadius: "10px !important",
                transition: "background-color 0.15s ease, color 0.15s ease, transform 0.12s ease",
                "&.Mui-selected": {
                  transform: "scale(1.02)",
                },
                "&.Mui-selected.MuiToggleButton-root": {
                  bgcolor: miui.accentDim,
                  color: miui.primary,
                  borderColor: miui.primary,
                },
              },
            }}
          >
            {DIFFICULTY_OPTIONS.map((d) => {
              const c = difficultyColor(d);
              return (
                <ToggleButton
                  key={d}
                  value={d}
                  sx={{
                    "&.Mui-selected": {
                      bgcolor: `${alpha(c, 0.14)} !important`,
                      color: `${c} !important`,
                      borderColor: `${alpha(c, 0.4)} !important`,
                    },
                  }}
                >
                  {formatDifficulty(d)}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        </Box>

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={includePremium}
              onChange={(e) => onIncludePremiumChange(e.target.checked)}
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Show premium
            </Typography>
          }
          sx={{ m: 0, minHeight: CONTROL_HEIGHT, alignItems: "center" }}
        />
      </Stack>
    </AnimatedBanner>
  );
}
