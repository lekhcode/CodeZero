import { Card, CardActionArea, CardContent, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { DifficultyChip } from "@/components/ui/DifficultyChip";

type ProblemCardProps = {
  title: string;
  slug: string;
  difficulty: string;
  subtitle?: string;
};

export function ProblemCard({ title, slug, difficulty, subtitle }: ProblemCardProps) {
  return (
    <Card>
      <CardActionArea component={RouterLink} to={`/problems/${slug}`}>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            <DifficultyChip difficulty={difficulty} />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
