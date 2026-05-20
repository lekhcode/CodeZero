import { Box } from "@mui/material";
import { authorAccentColor, authorInitials } from "@/utils/forumAuthor";

export function ForumAuthorAvatar({
  authorId,
  name,
  email,
  size = 28,
}: {
  authorId: string;
  name: string | null;
  email: string;
  size?: number;
}) {
  const color = authorAccentColor(authorId);
  const initials = authorInitials(name, email);

  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size < 24 ? "0.6rem" : "0.65rem",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        color: "#0a0b0d",
        bgcolor: color,
        opacity: 0.92,
      }}
    >
      {initials}
    </Box>
  );
}
