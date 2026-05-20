import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Panel, Group, Separator } from "react-resizable-panels";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Stack,
  TextField,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Tabs,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useQueryClient } from "@tanstack/react-query";
import type { CompilerLanguage } from "@/types/compiler.types";
import { COMPILER_LANGUAGES } from "@/types/compiler.types";
import type { ProblemDetail } from "@/types/api.types";
import type {
  JudgeMeta,
  JudgeSubmission,
  SubmissionStatus,
} from "@/types/judge.types";
import { judgeService } from "@/services/judge.service";
import { useAuthStore } from "@/store/authStore";
import { learningProgressKeyPrefixes, queryKeys } from "@/hooks/queryKeys";
import { useJudgeCodingTimer, formatSolveDuration } from "@/hooks/useJudgeCodingTimer";
import { formatJudgeEditor } from "@/utils/formatJudgeEditor";
import { handleSolveButtonMouseMove } from "@/utils/solveButtonRipple";
import dayjs from "dayjs";
import type { editor } from "monaco-editor";

const TERMINAL: SubmissionStatus[] = [
  "ACCEPTED",
  "WRONG_ANSWER",
  "RUNTIME_ERROR",
  "COMPILATION_ERROR",
  "TIME_LIMIT_EXCEEDED",
  "INTERNAL_ERROR",
];

function isCompilerLanguage(id: string): id is CompilerLanguage {
  return id === "javascript" || id === "python" || id === "cpp" || id === "java";
}

function isTerminal(status: SubmissionStatus): boolean {
  return TERMINAL.includes(status);
}

function statusLabel(status: SubmissionStatus): string {
  return status.replace(/_/g, " ");
}

function isHarnessDump(stdout: string | null): boolean {
  const t = stdout?.trim() ?? "";
  return t.startsWith("{") && t.includes('"results"');
}

function unwrapJsonDisplay(s: string | undefined | null): string {
  if (s === undefined || s === null || s.trim() === "") return "";
  try {
    const p = JSON.parse(s) as unknown;
    if (p === null) return "null";
    if (typeof p === "string" || typeof p === "number" || typeof p === "boolean") return String(p);
    return JSON.stringify(p);
  } catch {
    return s;
  }
}

/** Java default {@code Object.toString()} on arrays — hide when harness not updated yet. */
function formatJudgeActualDisplay(actual: string, expectedDisp: string, passed: boolean): string {
  const a = actual.trim();
  if (/^\[[A-Za-z]@[0-9a-fA-F]+$/.test(a)) {
    if (passed && expectedDisp.trim() !== "") return expectedDisp;
    return expectedDisp.trim() !== "" ? expectedDisp : a;
  }
  return unwrapJsonDisplay(a);
}

function formatValueForReadableField(v: unknown): string {
  if (v === null) return "null";
  const t = typeof v;
  if (t === "string" || t === "number" || t === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

type ParsedJudgeInput =
  | { kind: "args"; args: unknown[] }
  | { kind: "kv"; entries: { key: string; value: string }[] }
  | { kind: "text"; text: string };

function parseJudgeInput(raw: string): ParsedJudgeInput {
  const t = raw?.trim() ?? "";
  if (t === "") return { kind: "text", text: "" };
  try {
    const o = JSON.parse(t) as unknown;
    if (o !== null && typeof o === "object" && !Array.isArray(o) && "args" in o) {
      const args = (o as { args: unknown }).args;
      if (Array.isArray(args)) return { kind: "args", args };
    }
    if (o !== null && typeof o === "object" && !Array.isArray(o)) {
      const entries = Object.entries(o as Record<string, unknown>).map(([key, val]) => ({
        key,
        value: formatValueForReadableField(val),
      }));
      return { kind: "kv", entries };
    }
    if (typeof o === "string" || typeof o === "number" || typeof o === "boolean") {
      return { kind: "text", text: String(o) };
    }
    return { kind: "text", text: JSON.stringify(o) };
  } catch {
    return { kind: "text", text: raw };
  }
}

function ReadonlyIoField({
  label,
  value,
  pendingHint,
}: {
  label: string;
  value: string;
  pendingHint?: string;
}) {
  const v = value.trim();
  const isEmpty = v === "";
  const multiline = !isEmpty && (v.includes("\n") || v.length > 72);
  const fieldStyles = {
    "& .MuiOutlinedInput-root": {
      bgcolor: alpha("#161b22", 0.95),
      fontFamily: '"JetBrains Mono","Fira Code",ui-monospace,monospace',
      fontSize: 13,
      color: alpha("#fff", 0.88),
    },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: alpha("#fff", 0.12) },
    "& .MuiInputBase-input::placeholder": { color: alpha("#fff", 0.25), opacity: 1 },
  } as const;

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: alpha("#fff", 0.42), display: "block", mb: 0.35 }}>
        {label}
      </Typography>
      <TextField
        fullWidth
        size="small"
        variant="outlined"
        multiline={multiline}
        minRows={multiline ? 2 : 1}
        maxRows={8}
        placeholder={isEmpty ? (pendingHint ?? "…") : undefined}
        value={isEmpty ? "" : v}
        slotProps={{
          htmlInput: { readOnly: true },
        }}
        sx={fieldStyles}
      />
    </Box>
  );
}

function JudgeInputAsFields({
  raw,
  paramNames,
}: {
  raw: string;
  paramNames?: string[];
}) {
  const p = parseJudgeInput(raw);
  const rootSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: alpha("#161b22", 0.92),
      fontFamily: '"JetBrains Mono","Fira Code",ui-monospace,monospace',
      fontSize: 13,
      color: alpha("#fff", 0.88),
    },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: alpha("#fff", 0.12) },
    "& .MuiInputLabel-root": { color: alpha("#fff", 0.4), fontSize: 12 },
  };

  if (p.kind === "args") {
    return (
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
        {p.args.map((a, i) => (
          <TextField
            key={String(i)}
            label={paramNames?.[i] ?? `arg${i}`}
            size="small"
            variant="outlined"
            value={formatValueForReadableField(a)}
            slotProps={{ htmlInput: { readOnly: true } }}
            sx={{ flex: "1 1 140px", minWidth: 120, ...rootSx }}
          />
        ))}
      </Stack>
    );
  }
  if (p.kind === "kv") {
    return (
      <Stack spacing={0.85}>
        {p.entries.map((e) => (
          <TextField
            key={e.key}
            label={e.key}
            size="small"
            variant="outlined"
            value={e.value}
            slotProps={{ htmlInput: { readOnly: true } }}
            sx={{ ...rootSx }}
            fullWidth
          />
        ))}
      </Stack>
    );
  }
  return (
    <TextField
      fullWidth
      size="small"
      variant="outlined"
      label="Input"
      value={p.text}
      slotProps={{ htmlInput: { readOnly: true } }}
      multiline={p.text.includes("\n") || p.text.length > 80}
      minRows={p.text.includes("\n") || p.text.length > 80 ? 2 : 1}
      sx={{ ...rootSx }}
    />
  );
}

type LeftTab = "description" | "submissions";

type ProblemJudgeWorkspaceProps = {
  slug: string;
  problem: ProblemDetail;
  judgeMeta: JudgeMeta;
};

export function ProblemJudgeWorkspace({ slug, problem, judgeMeta }: ProblemJudgeWorkspaceProps) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  type LangRow = JudgeMeta["languages"][number] & { id: CompilerLanguage };

  const visibleCasesSorted = useMemo(
    () => [...judgeMeta.visibleTestcases].sort((a, b) => a.orderIndex - b.orderIndex),
    [judgeMeta.visibleTestcases],
  );

  /** Submit (full judge) history only — runs are intentionally excluded */
  const terminalSubmitHistory = useMemo(
    () =>
      judgeMeta.recentSubmissions
        .filter((s) => s.mode === "FULL_JUDGE" && isTerminal(s.status))
        .slice(0, 40),
    [judgeMeta.recentSubmissions],
  );

  const latestAcceptedSubmitId = useMemo(
    () => terminalSubmitHistory.find((r) => r.status === "ACCEPTED")?.id,
    [terminalSubmitHistory],
  );

  const readyLanguages = useMemo(
    () =>
      judgeMeta.languages.filter(
        (l): l is LangRow => l.judgeReadyForLanguage && isCompilerLanguage(l.id),
      ),
    [judgeMeta.languages],
  );

  const [language, setLanguage] = useState<CompilerLanguage | null>(() =>
    readyLanguages[0]?.id ?? null,
  );
  const [code, setCode] = useState(() => readyLanguages[0]?.starterCode ?? "");
  const [leftTab, setLeftTab] = useState<LeftTab>("description");

  const activeParamNames = useMemo(() => {
    const row = readyLanguages.find((l) => l.id === language);
    return row?.paramNames ?? [];
  }, [readyLanguages, language]);

  useEffect(() => {
    if (readyLanguages.length === 0) {
      setLanguage(null);
      setCode("");
      return;
    }
    setLanguage((prev) => {
      const stillOk = prev && readyLanguages.some((l) => l.id === prev);
      if (stillOk) return prev;
      const pick = readyLanguages[0];
      setCode(pick!.starterCode);
      return pick!.id;
    });
  }, [readyLanguages]);

  const onLanguageChange = (e: SelectChangeEvent<string>) => {
    const next = e.target.value as CompilerLanguage;
    const row = readyLanguages.find((l) => l.id === next);
    setLanguage(next);
    if (row) setCode(row.starterCode);
  };

  const locked = judgeMeta.locked || readyLanguages.length === 0;
  const lockMessage =
    judgeMeta.lockReason ??
    (readyLanguages.length === 0 ? "No judge-ready language is configured for this problem." : null);

  const [busy, setBusy] = useState(false);
  const [activeSampleIdx, setActiveSampleIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<JudgeSubmission | null>(null);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [solutionSnap, setSolutionSnap] = useState<{
    language: string;
    code: string;
    submittedAt: string;
    statusLabel: string;
    codingDurationMs?: number | null;
  } | null>(null);
  const [solutionLoadId, setSolutionLoadId] = useState<string | null>(null);
  const [solutionError, setSolutionError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Numeric height fixes Monaco `%` sizing so the editor scrollbar works inside flex layouts */
  const editorMeasureRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [formatBusy, setFormatBusy] = useState(false);
  const [formatHint, setFormatHint] = useState<string | null>(null);
  /** While true, code edits from format must not affect the solve timer */
  const formatInProgressRef = useRef(false);
  const [editorPxHeight, setEditorPxHeight] = useState(320);

  const codingTimer = useJudgeCodingTimer(slug);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    if (formatHint === null) return undefined;
    const t = window.setTimeout(() => setFormatHint(null), 4500);
    return () => window.clearTimeout(t);
  }, [formatHint]);

  useEffect(() => {
    const el = editorMeasureRef.current;
    if (el === null) return undefined;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height ?? 0;
      setEditorPxHeight(Math.max(120, Math.floor(h)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (submission === null) return;
    if (submission.mode !== "FULL_JUDGE") return;
    if (!isTerminal(submission.status)) return;
    codingTimer.resetTimerSession();
  }, [submission?.id, submission?.mode, submission?.status, codingTimer.resetTimerSession]);

  const lastCelebratedAccept = useRef<string | null>(null);

  useEffect(() => {
    if (submission === null) return;
    if (!isTerminal(submission.status)) return;
    if (submission.mode !== "FULL_JUDGE" || submission.status !== "ACCEPTED") return;
    if (lastCelebratedAccept.current === submission.id) return;
    lastCelebratedAccept.current = submission.id;

    void (async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.judgeMeta(slug) });
      await queryClient.refetchQueries({ queryKey: queryKeys.judgeMeta(slug) });
      for (const key of learningProgressKeyPrefixes) {
        await queryClient.invalidateQueries({ queryKey: key });
      }
    })();
    setLeftTab("submissions");
  }, [submission, queryClient, slug]);

  const pollSubmission = (id: string) => {
    stopPolling();
    pollRef.current = setInterval(() => {
      void (async () => {
        try {
          const { submission: next } = await judgeService.getSubmission(id);
          setSubmission(next);
          if (isTerminal(next.status)) {
            stopPolling();
            setBusy(false);
          }
        } catch (err) {
          stopPolling();
          setBusy(false);
          setError(err instanceof Error ? err.message : "Failed to fetch judge result");
        }
      })();
    }, 700);
  };

  const handleFormatCode = useCallback(async () => {
    if (locked || language === null || !isAuthenticated) return;
    const ed = editorRef.current;
    if (ed === null) {
      setFormatHint("Editor not ready yet.");
      return;
    }
    setFormatHint(null);
    setFormatBusy(true);
    formatInProgressRef.current = true;
    try {
      const r = await formatJudgeEditor(ed, language);
      const next = ed.getModel()?.getValue();
      if (next !== undefined) setCode(next);
      if (!r.ok) setFormatHint(r.reason);
    } finally {
      setFormatBusy(false);
      window.setTimeout(() => {
        formatInProgressRef.current = false;
      }, 0);
    }
  }, [isAuthenticated, language, locked]);

  const startJudge = async (kind: "run" | "submit") => {
    if (locked || language === null || !isAuthenticated) return;
    setError(null);
    const codingDurationMs = kind === "submit" ? codingTimer.freezeForSubmit() : undefined;
    setSubmission(null);
    setBusy(true);
    stopPolling();
    try {
      const create =
        kind === "run"
          ? judgeService.run(slug, { language, code })
          : judgeService.submit(slug, { language, code, codingDurationMs: codingDurationMs ?? 0 });
      const { judgeSubmissionId } = await create;
      const { submission: initial } = await judgeService.getSubmission(judgeSubmissionId);
      setSubmission(initial);
      if (isTerminal(initial.status)) {
        setBusy(false);
        return;
      }
      pollSubmission(judgeSubmissionId);
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Request failed");
    }
  };

  const loadSubmissionSolution = useCallback(async (submissionId: string) => {
    setSolutionLoadId(submissionId);
    setSolutionError(null);
    try {
      const { submission: next } = await judgeService.getSubmission(submissionId);
      const body = typeof next.code === "string" ? next.code : "";
      setSolutionSnap({
        language: next.language,
        code: body,
        submittedAt: next.createdAt,
        statusLabel: statusLabel(next.status),
        codingDurationMs: next.codingDurationMs ?? null,
      });
      setSolutionOpen(true);
    } catch (e) {
      setSolutionError(e instanceof Error ? e.message : "Could not load your submitted code.");
    } finally {
      setSolutionLoadId(null);
    }
  }, []);

  const results = submission?.testResults ?? null;
  const isFullAccepted =
    submission?.mode === "FULL_JUDGE" && submission?.status === "ACCEPTED";
  const showVerdictBanner = submission !== null && isTerminal(submission.status);

  /** Non-hidden verdict rows from the judge, sorted by harness case index → aligns with `visibleCasesSorted` */
  const visibleOrderedResults = useMemo(() => {
    if (!results?.length) return [];
    const vis = results.filter((r) => r.hidden !== true);
    vis.sort((a, b) => a.index - b.index);
    return vis;
  }, [results]);

  /** Hide per-case noise when full judge accepted cleanly */
  const hideRowTableForPureSubmitAc =
    isFullAccepted &&
    submission !== null &&
    results !== null &&
    results.every((r) => r.passed);

  const hiddenJudgeResults = useMemo(() => results?.filter((r) => r.hidden === true) ?? [], [results]);

  /** After a finished run/submit where we compare sample I/O — not pure submit-AC compaction */
  const showSampleDetailedResults =
    submission !== null &&
    isTerminal(submission.status) &&
    submission.status !== "COMPILATION_ERROR" &&
    results !== null &&
    results.length > 0 &&
    !hideRowTableForPureSubmitAc;

  const sampleFailures = showSampleDetailedResults
    ? visibleCasesSorted.map((tc, i) => {
        const r = visibleOrderedResults[i];
        const harnessOk = Boolean(r?.passed);

        let expectedDisp: string;
        if (tc.expectedOutput !== undefined && tc.expectedOutput.trim() !== "") {
          expectedDisp = unwrapJsonDisplay(tc.expectedOutput);
        } else if (r?.expected !== undefined && String(r.expected).trim() !== "") {
          expectedDisp = unwrapJsonDisplay(String(r.expected));
        } else {
          expectedDisp = "";
        }

        const outputDisp =
          r?.error !== undefined && r.error !== ""
            ? ""
            : r?.actual !== undefined
              ? formatJudgeActualDisplay(String(r.actual), expectedDisp, harnessOk)
              : busy
                ? ""
                : expectedDisp;

        const missingExpected =
          (tc.expectedOutput === undefined || tc.expectedOutput.trim() === "") &&
          (r?.expected === undefined || String(r.expected).trim() === "");

        let note: string | undefined =
          r?.error !== undefined && r.error.trim() !== "" ? `Error — ${r.error.slice(0, 400)}` : undefined;
        if (note === undefined && missingExpected && r !== undefined) {
          note = "No expected baseline on meta — verdict comes from harness only.";
        }

        return {
          idx: i + 1,
          input: tc.input,
          expectedDisp,
          outputDisp,
          ok: harnessOk,
          note,
        };
      })
    : [];

  /** Solid green cue when every official sample aligns with harness */
  const sampleStripHealthy = showSampleDetailedResults && sampleFailures.length > 0 && sampleFailures.every((row) => row.ok);

  const sampleStripAnyFail = showSampleDetailedResults && sampleFailures.some((row) => !row.ok);

  type SampleCaseRow = {
    key: number;
    label: string;
    input: string;
    expectedDisp: string;
    outputDisp: string;
    ok: boolean | null;
    note?: string;
  };

  const sampleCaseRows = useMemo((): SampleCaseRow[] => {
    if (showSampleDetailedResults) {
      return sampleFailures.map((row) => ({
        key: row.idx,
        label: `Case ${row.idx}`,
        input: row.input,
        expectedDisp: row.expectedDisp,
        outputDisp: row.outputDisp,
        ok: row.ok,
        note: row.note,
      }));
    }
    return visibleCasesSorted.map((tc, i) => ({
      key: tc.orderIndex,
      label: `Case ${i + 1}`,
      input: tc.input,
      expectedDisp: unwrapJsonDisplay(tc.expectedOutput ?? ""),
      outputDisp: "",
      ok: null,
      note: undefined,
    }));
  }, [showSampleDetailedResults, sampleFailures, visibleCasesSorted]);

  const activeSample = sampleCaseRows[activeSampleIdx] ?? sampleCaseRows[0];

  useEffect(() => {
    if (sampleCaseRows.length === 0) return;
    setActiveSampleIdx((i) => Math.min(i, sampleCaseRows.length - 1));
  }, [sampleCaseRows.length]);

  useEffect(() => {
    if (submission === null || !isTerminal(submission.status)) return;
    if (!showSampleDetailedResults) return;
    const failIdx = sampleFailures.findIndex((row) => !row.ok);
    if (failIdx >= 0) setActiveSampleIdx(failIdx);
  }, [submission?.id, submission?.status, showSampleDetailedResults, sampleFailures]);

  const descriptionBody = (
    <>
      <Typography sx={{ mt: 0.5, whiteSpace: "pre-wrap", lineHeight: 1.75 }}>
        {problem.statement || "Statement not available."}
      </Typography>

      {problem.examples.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }} gutterBottom>
            Examples
          </Typography>
          <Stack spacing={1.25}>
            {problem.examples.map((ex, i) => (
              <Paper
                key={i}
                variant="outlined"
                sx={{
                  p: 1.25,
                  bgcolor: alpha("#4f46e5", 0.05),
                  borderColor: alpha("#4f46e5", 0.12),
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 12,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                  Example {i + 1}
                </Typography>
                <Typography sx={{ mt: 0.75, whiteSpace: "pre-wrap" }}>Input: {ex.input}</Typography>
                {ex.output.trim() !== "" ? (
                  <Typography sx={{ whiteSpace: "pre-wrap" }}>Output: {ex.output}</Typography>
                ) : null}
                {ex.explanation !== undefined && ex.explanation !== "" && (
                  <Typography color="text.secondary" sx={{ mt: 0.75, fontFamily: "inherit" }}>
                    {ex.explanation}
                  </Typography>
                )}
              </Paper>
            ))}
          </Stack>
        </Box>
      )}

      {problem.constraints.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }} gutterBottom>
            Constraints
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            {problem.constraints.map((c, i) => (
              <Typography component="li" key={i} variant="body2" sx={{ mb: 0.5 }}>
                {c}
              </Typography>
            ))}
          </Box>
        </Box>
      )}

    </>
  );

  const submissionsBody = (
    <Stack spacing={2} sx={{ py: 1 }}>
      {!isAuthenticated ? (
        <Alert severity="info">Sign in to track submissions and solve status.</Alert>
      ) : judgeMeta.solved ? (
        <Alert severity="success" icon={<CheckCircleRoundedIcon />} sx={{ alignItems: "flex-start" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Solved
          </Typography>
          {judgeMeta.solvedAt !== null && (
            <Typography variant="body2" color="text.secondary">
              First solved: {dayjs(judgeMeta.solvedAt).format("MMM D, YYYY · HH:mm")}
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 0.75 }}>
            Full Submit checks hidden tests — per-case verdicts stay private.
          </Typography>
        </Alert>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Get <strong>Accepted</strong> on <strong>Submit</strong> (all visible + hidden tests) to solve this problem.
        </Typography>
      )}

      {solutionError !== null ? (
        <Alert severity="error" onClose={() => setSolutionError(null)}>
          {solutionError}
        </Alert>
      ) : null}

      {isAuthenticated && judgeMeta.solved === true && latestAcceptedSubmitId !== undefined ? (
        <Box>
          <Button
            size="small"
            variant="outlined"
            color="success"
            disabled={solutionLoadId !== null}
            onClick={() => void loadSubmissionSolution(latestAcceptedSubmitId)}
            sx={{ fontWeight: 700, textTransform: "none" }}
          >
            {solutionLoadId === latestAcceptedSubmitId ? <CircularProgress size={14} sx={{ mr: 0.75 }} /> : null}
            View accepted solution
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
            Opens the code from your winning Submit.
          </Typography>
        </Box>
      ) : null}

      {isAuthenticated && terminalSubmitHistory.length > 0 ? (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            Submit history
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
            <Table size="small" sx={{ "& th": { fontWeight: 700, bgcolor: alpha("#6366f1", 0.06) } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>Solve time</TableCell>
                  <TableCell>Verdict</TableCell>
                  <TableCell align="right">Judge time</TableCell>
                  <TableCell align="center">Solution</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {terminalSubmitHistory.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap", fontSize: 13 }}>
                      {dayjs(row.createdAt).format("MMM D, YYYY · hh:mm A")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {COMPILER_LANGUAGES.find((l) => l.id === row.language)?.label ?? row.language}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                      {typeof row.codingDurationMs === "number" && row.codingDurationMs > 0
                        ? formatSolveDuration(row.codingDurationMs)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Typography
                        component="span"
                        sx={{
                          fontWeight: 700,
                          color:
                            row.status === "ACCEPTED"
                              ? "success.main"
                              : row.status === "COMPILATION_ERROR"
                                ? "warning.main"
                                : "error.main",
                          fontSize: 13,
                        }}
                      >
                        {statusLabel(row.status)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{row.runtimeMs !== null ? `${row.runtimeMs} ms` : "—"}</TableCell>
                    <TableCell align="center" sx={{ width: 120 }}>
                      <Button
                        size="small"
                        variant="text"
                        disabled={solutionLoadId !== null}
                        onClick={() => void loadSubmissionSolution(row.id)}
                        sx={{ textTransform: "none", fontWeight: 700 }}
                      >
                        {solutionLoadId === row.id ? <CircularProgress size={14} sx={{ mr: 0.5 }} /> : null}
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
            Only finished <strong>Submit</strong> attempts are listed (Run stays in the workspace only).
          </Typography>
        </Box>
      ) : (
        isAuthenticated && (
          <Typography variant="body2" color="text.secondary">
            No submits yet — use <strong>Submit</strong> in the editor to build this history.
          </Typography>
        )
      )}
    </Stack>
  );

  const waitingForJudge = submission !== null && !isTerminal(submission.status);

  const sampleStatusAccent =
    hideRowTableForPureSubmitAc || sampleStripHealthy
      ? "#3fb950"
      : sampleStripAnyFail
        ? "#f85149"
        : alpha("#fff", 0.12);

  const sampleCasesSection =
    sampleCaseRows.length > 0 ? (
      <Box
        sx={{
          mb: 1.25,
          borderRadius: 1.5,
          border: `1px solid ${sampleStatusAccent}`,
          bgcolor: alpha("#0d1117", 0.6),
          overflow: "hidden",
        }}
      >
        <Stack
          direction="row"
          sx={{
            px: 1.25,
            py: 0.75,
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${alpha("#fff", 0.06)}`,
            bgcolor: alpha("#161b22", 0.5),
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 12, color: alpha("#fff", 0.82), letterSpacing: "0.04em" }}>
            SAMPLE CASES
          </Typography>
          {(waitingForJudge || (busy && submission !== null)) && !hideRowTableForPureSubmitAc ? (
            <Typography variant="caption" sx={{ color: alpha("#d29922", 0.95), fontWeight: 700 }}>
              Judging…
            </Typography>
          ) : hideRowTableForPureSubmitAc ? (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <CheckCircleRoundedIcon sx={{ color: "#aff5b4", fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: "#aff5b4", fontWeight: 700 }}>
                All passed
              </Typography>
            </Stack>
          ) : showSampleDetailedResults ? (
            <Typography variant="caption" sx={{ color: alpha("#fff", 0.45), fontWeight: 600 }}>
              {sampleFailures.filter((r) => r.ok).length}/{sampleFailures.length} passed
            </Typography>
          ) : null}
        </Stack>

        {hideRowTableForPureSubmitAc ? (
          <Typography variant="caption" sx={{ px: 1.25, py: 1, color: alpha("#fff", 0.42), display: "block" }}>
            Full submit accepted — hidden suites cleared. Per-case I/O hidden for Accepted.
          </Typography>
        ) : (
          <>
            <Tabs
              value={activeSampleIdx}
              onChange={(_, v) => setActiveSampleIdx(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 34,
                px: 0.5,
                borderBottom: `1px solid ${alpha("#fff", 0.06)}`,
                "& .MuiTabs-indicator": {
                  height: 2,
                  bgcolor:
                    activeSample?.ok === false ? "#f85149" : activeSample?.ok === true ? "#3fb950" : "#58a6ff",
                },
                "& .MuiTab-root": {
                  minHeight: 34,
                  py: 0.25,
                  px: 1.25,
                  minWidth: 72,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: 12,
                  color: alpha("#fff", 0.45),
                  "&.Mui-selected": { color: alpha("#fff", 0.92) },
                },
              }}
            >
              {sampleCaseRows.map((row, i) => (
                <Tab
                  key={row.key}
                  value={i}
                  label={
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                      <span>{row.label}</span>
                      {row.ok === true ? (
                        <CheckCircleRoundedIcon sx={{ fontSize: 14, color: "#3fb950" }} />
                      ) : row.ok === false ? (
                        <CloseRoundedIcon sx={{ fontSize: 14, color: "#f85149" }} />
                      ) : null}
                    </Stack>
                  }
                />
              ))}
            </Tabs>

            {activeSample !== undefined ? (
              <Box sx={{ px: 1.25, py: 1.25 }}>
                <JudgeInputAsFields raw={activeSample.input} paramNames={activeParamNames} />

                {showSampleDetailedResults ? (
                  <Box
                    sx={{
                      mt: 1.25,
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                      gap: 1.25,
                      alignItems: "start",
                    }}
                  >
                    <ReadonlyIoField label="Expected" value={activeSample.expectedDisp} pendingHint="—" />
                    <ReadonlyIoField
                      label="Your output"
                      value={activeSample.outputDisp}
                      pendingHint={busy ? "Running…" : "—"}
                    />
                  </Box>
                ) : null}

                {activeSample.note !== undefined ? (
                  <Typography
                    variant="caption"
                    sx={{ mt: 1, color: alpha("#ffa657", 0.95), whiteSpace: "pre-wrap", display: "block" }}
                  >
                    {activeSample.note}
                  </Typography>
                ) : null}
              </Box>
            ) : null}
          </>
        )}
      </Box>
    ) : null;

  const hiddenSummaryLine =
    submission?.mode === "FULL_JUDGE" &&
    showVerdictBanner &&
    hiddenJudgeResults.length > 0 &&
    !hideRowTableForPureSubmitAc ? (
      <Typography sx={{ color: alpha("#fff", 0.5), fontSize: 12, mb: 1.25 }}>
        Hidden tests:{" "}
        <strong style={{ color: "#e6edf3" }}>
          {hiddenJudgeResults.filter((h) => h.passed).length}/{hiddenJudgeResults.length} passed
        </strong>
        {submission.status === "WRONG_ANSWER" && sampleStripHealthy ? (
          <span style={{ color: alpha("#ffa657", 0.95) }}> — samples passed; investigate hidden edges.</span>
        ) : null}
      </Typography>
    ) : null;

  const outputPanelInner = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0, bgcolor: "#0b1017" }}>
      <Typography
        variant="caption"
        sx={{ px: 1.25, py: 0.85, color: alpha("#fff", 0.55), fontWeight: 800, letterSpacing: "0.04em", flexShrink: 0 }}
      >
        TEST RESULT
      </Typography>

      <Box
        className="app-scroll"
        sx={{
          px: 1.25,
          pb: 1.25,
          pt: 0,
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          fontSize: 12,
        }}
      >
        {error !== null && (
          <Typography color="#f85149" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        {showVerdictBanner && submission !== null && (
          <Stack direction="row" spacing={1} sx={{ mb: 1.25, flexWrap: "wrap", alignItems: "center" }}>
            <Typography sx={{ color: "#e6edf3", fontWeight: 800, letterSpacing: "0.02em" }}>
              {statusLabel(submission.status)}
            </Typography>
            {submission.mode === "FULL_JUDGE" && submission.status === "ACCEPTED" ? (
              <Chip size="small" label="All tests incl. hidden" sx={{ bgcolor: alpha("#238636", 0.25), color: "#7ee787" }} />
            ) : submission.mode === "RUN_SAMPLE" ? (
              <Chip size="small" label="Sample tests only" variant="outlined" sx={{ color: alpha("#fff", 0.65), borderColor: alpha("#fff", 0.2) }} />
            ) : null}
            {submission.executionTimeMs != null || submission.runtimeMs !== null ? (
              <Typography color={alpha("#fff", 0.45)} variant="caption" sx={{ fontWeight: 600 }}>
                Run {(submission.executionTimeMs ?? submission.runtimeMs) ?? 0} ms
                {submission.compileTimeMs != null && submission.compileTimeMs > 0
                  ? ` · Compile ${submission.compileTimeMs} ms`
                  : ""}
                {submission.queueTimeMs != null && submission.queueTimeMs > 0
                  ? ` · Queue ${submission.queueTimeMs} ms`
                  : ""}
                {submission.totalTimeMs != null ? ` · Total ${submission.totalTimeMs} ms` : ""}
              </Typography>
            ) : null}
          </Stack>
        )}

        {isFullAccepted && (
          <Alert
            severity="success"
            variant="outlined"
            sx={{ mb: 1.25, bgcolor: alpha("#238636", 0.06), borderColor: alpha("#238636", 0.35), color: "#aff5b4", py: 0.5 }}
          >
            <strong>Accepted</strong> — all official and hidden testcases matched. Problem marked solved when you refresh or reopen (history tab above).
          </Alert>
        )}

        {submission !== null &&
          submission.stderr !== null &&
          submission.stderr.trim() !== "" &&
          (submission.status === "COMPILATION_ERROR" ||
            submission.status === "RUNTIME_ERROR" ||
            submission.status === "INTERNAL_ERROR") && (
            <Box sx={{ mb: 1.25 }}>
              <Typography variant="caption" sx={{ color: "#f0883e", fontWeight: 700, display: "block", mb: 0.35 }}>
                {submission.status === "COMPILATION_ERROR" ? "Compiler output" : "Runtime / judge log"}
              </Typography>
              <Typography sx={{ color: "#f85149", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "ui-monospace", fontSize: 11 }}>
                {submission.stderr}
              </Typography>
            </Box>
          )}

        {busy && submission === null && (
          <Typography color={alpha("#fff", 0.45)} sx={{ mb: 1 }}>
            Judging…
          </Typography>
        )}

        {sampleCasesSection}
        {hiddenSummaryLine}

        {submission !== null &&
          submission.stderr !== null &&
          submission.stderr.trim() !== "" &&
          submission.status !== "COMPILATION_ERROR" &&
          submission.status !== "RUNTIME_ERROR" &&
          submission.status !== "INTERNAL_ERROR" && (
            <Typography sx={{ color: "#f85149", whiteSpace: "pre-wrap", mb: 1, fontFamily: "ui-monospace", fontSize: 11 }}>
              {submission.stderr}
            </Typography>
          )}

        {submission !== null &&
          submission.stdout !== null &&
          submission.stdout.trim() !== "" &&
          !isHarnessDump(submission.stdout) && (
            <Typography sx={{ color: alpha("#fff", 0.45), whiteSpace: "pre-wrap", fontSize: 11, fontFamily: "ui-monospace" }}>
              {submission.stdout}
            </Typography>
          )}
      </Box>
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          width: "100%",
          height: "100%",
          minHeight: 0,
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Group orientation="horizontal" id={`judge-${slug}`} style={{ flex: 1, minHeight: 0, width: "100%" }}>
        <Panel
          id="statement"
          defaultSize="48"
          minSize="26"
          maxSize="65"
          style={{ minHeight: 0, minWidth: 0, overflow: "hidden" }}
        >
          <Paper
            variant="outlined"
            sx={{
              height: "100%",
              borderRadius: 2,
              bgcolor: "background.paper",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            <Tabs
              value={leftTab}
              onChange={(_, v) => setLeftTab(v as LeftTab)}
              sx={{ borderBottom: 1, borderColor: "divider", px: 1, flexShrink: 0 }}
              variant="fullWidth"
            >
              <Tab value="description" label="Description" sx={{ textTransform: "none", fontWeight: 700 }} />
              <Tab value="submissions" label="Submissions" sx={{ textTransform: "none", fontWeight: 700 }} />
            </Tabs>
            <Box
              className="app-scroll"
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                overscrollBehavior: "contain",
                px: 2,
                py: 2,
                pr: 1.5,
              }}
            >
              {leftTab === "description" ? descriptionBody : submissionsBody}
            </Box>
          </Paper>
        </Panel>

        <Separator
          id="statement-workspace"
          style={{
            width: 12,
            minWidth: 12,
            margin: "0 4px",
            borderRadius: 4,
            background: "rgba(148, 163, 184, 0.25)",
            cursor: "col-resize",
          }}
        />

        <Panel
          id="workspace"
          defaultSize="52"
          minSize="30"
          style={{ minHeight: 0, minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
        >
          <Paper
            elevation={0}
            onWheel={(e) => e.stopPropagation()}
            sx={{
              height: "100%",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: 2,
              border: `1px solid ${alpha("#fff", 0.08)}`,
              bgcolor: "#0d1117",
              color: "#e6edf3",
              minHeight: 0,
            }}
          >
            {busy && (
              <LinearProgress
                sx={{
                  flexShrink: 0,
                  height: 2,
                  bgcolor: alpha("#fff", 0.06),
                  "& .MuiLinearProgress-bar": { bgcolor: "#58a6ff" },
                }}
              />
            )}

            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                px: 1.5,
                py: 1,
                borderBottom: `1px solid ${alpha("#fff", 0.08)}`,
                flexWrap: "wrap",
                gap: 1,
                flexShrink: 0,
              }}
            >
              <Select<string>
                size="small"
                value={language ?? ""}
                displayEmpty
                disabled={locked || readyLanguages.length === 0}
                onChange={onLanguageChange}
                sx={{
                  minWidth: 136,
                  color: "#e6edf3",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: alpha("#fff", 0.15) },
                  "& .MuiSvgIcon-root": { color: alpha("#fff", 0.5) },
                }}
                renderValue={(v) =>
                  v === "" ? "Language" : COMPILER_LANGUAGES.find((l) => l.id === v)?.label ?? v
                }
              >
                {readyLanguages.map((l) => (
                  <MenuItem key={l.id} value={l.id}>
                    {COMPILER_LANGUAGES.find((c) => c.id === l.id)?.label ?? l.id}
                  </MenuItem>
                ))}
              </Select>

              {isAuthenticated && !locked ? (
                <Typography
                  component="span"
                  sx={{
                    fontFamily: '"Share Tech Mono", "JetBrains Mono", ui-monospace, monospace',
                    fontSize: "0.6875rem",
                    lineHeight: 1.2,
                    letterSpacing: "0.04em",
                    color: codingTimer.codingClockActive ? "#ffffff" : alpha("#ffffff", 0.42),
                    fontWeight: 400,
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    maxWidth: { xs: "100%", sm: "none" },
                  }}
                  title="Starts after typing 3 seconds with cursor inside the code area (session only; resets after Submit completes or reload)."
                >
                  {codingTimer.elapsedLabel}
                </Typography>
              ) : null}

              <Box sx={{ flex: 1 }} />

              <Tooltip
                title={formatHint ?? "Format code"}
                placement="top"
                open={formatHint !== null ? true : undefined}
                disableHoverListener={formatHint !== null}
                disableFocusListener={formatHint !== null}
              >
                <span>
                  <IconButton
                    size="small"
                    disabled={locked || busy || language === null || !isAuthenticated || formatBusy}
                    onClick={() => void handleFormatCode()}
                    sx={{
                      color: alpha("#fff", 0.8),
                      border: `1px solid ${alpha("#fff", 0.15)}`,
                      borderRadius: 1,
                    }}
                    aria-label="Format code"
                  >
                    {formatBusy ? (
                      <CircularProgress size={16} thickness={4} sx={{ color: alpha("#fff", 0.75) }} />
                    ) : (
                      <AutoFixHighOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>

              <Button
                size="small"
                variant="outlined"
                disabled={locked || busy || language === null || !isAuthenticated}
                onClick={() => void startJudge("run")}
                sx={{
                  color: alpha("#fff", 0.88),
                  borderColor: alpha("#fff", 0.22),
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                {busy && submission === null ? <CircularProgress size={14} sx={{ mr: 0.5 }} /> : null}
                Run
              </Button>

              <Button
                size="small"
                variant="contained"
                className="solve-btn btn-primary"
                disabled={locked || busy || language === null || !isAuthenticated}
                onClick={() => void startJudge("submit")}
                onMouseMove={handleSolveButtonMouseMove}
                sx={{ textTransform: "none", fontWeight: 800, bgcolor: "#238636", "&:hover": { bgcolor: "#2ea043" } }}
              >
                Submit
              </Button>
            </Stack>

            {!isAuthenticated ? (
              <Alert severity="info" sx={{ m: 1.25, flexShrink: 0, py: 0.35 }}>
                Sign in to run and submit.
              </Alert>
            ) : null}

            {locked && lockMessage !== null ? (
              <Alert severity="warning" sx={{ m: 1.25, flexShrink: 0, py: 0.35 }}>
                {lockMessage}
              </Alert>
            ) : null}

            <Group
              orientation="vertical"
              id={`judge-${slug}-editor-output`}
              style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
            >
              <Panel
                id={`judge-${slug}-editor`}
                defaultSize="58"
                minSize="22"
                style={{ minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
              >
                {/* Code editor — measured height ensures Monaco scrollbar works */}
                <Box
                  ref={editorMeasureRef}
                  onWheel={(e) => e.stopPropagation()}
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden",
                    position: "relative",
                    isolation: "isolate",
                    overscrollBehavior: "contain",
                  }}
                >
                  <Editor
                    height={editorPxHeight}
                    language={
                      language === "cpp"
                        ? "cpp"
                        : language === "java"
                          ? "java"
                          : language === "python"
                            ? "python"
                            : "javascript"
                    }
                    theme="vs-dark"
                    value={code}
                    onChange={(v) => {
                      const next = v ?? "";
                      setCode(next);
                      if (formatInProgressRef.current) return;
                      codingTimer.handleModelEdited();
                    }}
                    onMount={(ed) => {
                      editorRef.current = ed;
                      codingTimer.onEditorMounted(ed);
                    }}
                    options={{
                      readOnly: locked,
                      minimap: { enabled: false },
                      fontSize: 13,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 12 },
                      mouseWheelScrollSensitivity: 1,
                    }}
                  />
                  {locked ? (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        bgcolor: alpha("#000", 0.35),
                        pointerEvents: "all",
                      }}
                    />
                  ) : null}
                </Box>
              </Panel>

              <Separator
                id={`judge-${slug}-editor-output-sep`}
                style={{
                  height: 12,
                  minHeight: 12,
                  margin: "2px 10px",
                  borderRadius: 4,
                  background: "rgba(148, 163, 184, 0.28)",
                  cursor: "row-resize",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DragIndicatorIcon sx={{ fontSize: 16, color: alpha("#e6edf3", 0.42), pointerEvents: "none" }} />
              </Separator>

              <Panel
                id={`judge-${slug}-test-output`}
                defaultSize="42"
                minSize="16"
                style={{ minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
              >
                <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  {outputPanelInner}
                </Box>
              </Panel>
            </Group>
          </Paper>
        </Panel>
      </Group>
    </Box>

      <Dialog
        open={solutionOpen}
        onClose={() => {
          setSolutionOpen(false);
          setSolutionSnap(null);
        }}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Submitted code</DialogTitle>
        <DialogContent dividers sx={{ bgcolor: alpha("#0d1117", 1), pt: 2 }}>
          {solutionSnap !== null ? (
            <>
              <Typography variant="caption" sx={{ color: alpha("#fff", 0.45), display: "block", mb: 1.5 }}>
                {COMPILER_LANGUAGES.find((l) => l.id === solutionSnap.language)?.label ?? solutionSnap.language} ·{" "}
                {dayjs(solutionSnap.submittedAt).format("MMM D, YYYY · hh:mm A")} ·{" "}
                <strong style={{ color: "#aff5b4" }}>{solutionSnap.statusLabel}</strong>
                {solutionSnap.codingDurationMs !== undefined &&
                solutionSnap.codingDurationMs !== null &&
                solutionSnap.codingDurationMs > 0 ? (
                  <>
                    {" "}
                    · Solve time:&nbsp;
                    <strong style={{ color: alpha("#fff", 0.85) }}>
                      {formatSolveDuration(solutionSnap.codingDurationMs)}
                    </strong>
                  </>
                ) : null}
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={14}
                maxRows={32}
                value={solutionSnap.code}
                slotProps={{ htmlInput: { readOnly: true } }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    alignItems: "flex-start",
                    bgcolor: alpha("#010409", 1),
                    fontFamily: '"JetBrains Mono","Fira Code",ui-monospace,monospace',
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: alpha("#fff", 0.88),
                  },
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: alpha("#fff", 0.12) },
                }}
              />
            </>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button
            onClick={() => {
              setSolutionOpen(false);
              setSolutionSnap(null);
            }}
            variant="contained"
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
