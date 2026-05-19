import { Box, Typography, type BoxProps, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { sectionCardSx, sectionHeaderSx, sectionScrollSx } from "@/theme/theme";

type SectionCardProps = {
  title?: ReactNode;
  titleAdornment?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  sx?: SxProps<Theme>;
  headerSx?: SxProps<Theme>;
  bodySx?: SxProps<Theme>;
} & Omit<BoxProps, "title">;

export function SectionCard({
  title,
  titleAdornment,
  action,
  children,
  scroll = false,
  sx,
  headerSx,
  bodySx,
  ...rest
}: SectionCardProps) {
  const hasHeader = title !== undefined || action !== undefined;

  return (
    <Box
      className="card"
      sx={{
        ...sectionCardSx,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        minWidth: 0,
        ...sx,
      }}
      {...rest}
    >
      {hasHeader && (
        <Box sx={{ ...sectionHeaderSx, ...headerSx }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}>
            {title !== undefined && (
              <Typography variant="subtitle2" sx={{ fontWeight: 700, minWidth: 0 }}>
                {title}
              </Typography>
            )}
            {titleAdornment}
          </Box>
          {action}
        </Box>
      )}
      <Box
        sx={{
          ...(scroll ? sectionScrollSx : {}),
          flex: scroll ? 1 : undefined,
          minWidth: 0,
          ...bodySx,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
