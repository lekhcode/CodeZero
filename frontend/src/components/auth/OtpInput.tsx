import { Box, TextField } from "@mui/material";
import { useCallback, useRef } from "react";
import { miui } from "@/theme/theme";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function OtpInput({ value, onChange, disabled }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  const setAt = useCallback(
    (index: number, char: string) => {
      const next = value.split("");
      next[index] = char;
      const joined = next.join("").replace(/\s/g, "").slice(0, 6);
      onChange(joined);
    },
    [onChange, value],
  );

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) {
      setAt(index, "");
      return;
    }
    setAt(index, digit);
    if (index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index]?.trim()) {
      if (index > 0) refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    refs.current[focusIdx]?.focus();
  };

  return (
    <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }} onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <TextField
          key={i}
          inputRef={(el) => {
            refs.current[i] = el;
          }}
          value={digits[i]?.trim() ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e.key)}
          disabled={disabled}
          slotProps={{
            htmlInput: {
              inputMode: "numeric",
              maxLength: 1,
              style: { textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "1.25rem" },
            },
          }}
          sx={{
            width: 44,
            "& .MuiOutlinedInput-root": {
              bgcolor: miui.elevated,
              "&.Mui-focused fieldset": { borderColor: miui.accent },
            },
          }}
        />
      ))}
    </Box>
  );
}
