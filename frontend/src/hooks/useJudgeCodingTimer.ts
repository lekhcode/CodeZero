import { useCallback, useEffect, useRef, useState } from "react";
import type { editor as MonacoEditor } from "monaco-editor";

const ARM_DELAY_MS = 3000;
const MAX_CODING_MS = 1000 * 60 * 60 * 12;
const TICK_MS = 200;

/** Formats elapsed ms into H:mm:ss when needed, otherwise m:ss */
export function formatSolveDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms === 0) return "0:00";
  const capped = Math.min(ms, MAX_CODING_MS);
  const sec = Math.floor(capped / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** LCD-style mm:ss.cs for toolbar (always digits; idle shows 00:00.00). */
export function formatCodingTimerDisplay(ms: number, running: boolean): string {
  if (!running) return "00:00.00";
  const capped = Math.min(Math.max(0, ms), MAX_CODING_MS);
  const totalSec = Math.floor(capped / 1000);
  const cs = Math.floor((capped % 1000) / 10);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const cs2 = String(cs).padStart(2, "0");
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}.${cs2}`;
  return `${pad2(m)}:${pad2(s)}.${cs2}`;
}

/**
 * Session-only coding timer: arms after the first edit while Monaco has focus, then a
 * {@link ARM_DELAY_MS} delay, then runs until Submit freezes the elapsed time.
 */
export function useJudgeCodingTimer(slug: string) {
  const editorFocusedRef = useRef(false);

  const phaseRef = useRef<"idle" | "arming" | "running">("idle");
  const armTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const armLatchRef = useRef(false); // first typing scheduled 3s one-shot until fire/cancel

  const runningStartPerfRef = useRef<number | null>(null);
  const disposersRef = useRef<Array<{ dispose(): void }>>([]);

  const [displayMs, setDisplayMs] = useState(0);
  const [clockActive, setClockActive] = useState(false);

  const clearArmTimeout = () => {
    if (armTimeoutRef.current !== null) {
      clearTimeout(armTimeoutRef.current);
      armTimeoutRef.current = null;
    }
  };

  const clearTicker = () => {
    if (tickIntervalRef.current !== null) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  };

  const tryCancelArm = useCallback(() => {
    clearArmTimeout();
    if (phaseRef.current === "running") return;
    armLatchRef.current = false;
    if (phaseRef.current === "arming") phaseRef.current = "idle";
  }, []);

  const resetTimerSession = useCallback(() => {
    clearArmTimeout();
    clearTicker();
    armLatchRef.current = false;
    runningStartPerfRef.current = null;
    phaseRef.current = "idle";
    setDisplayMs(0);
    setClockActive(false);
  }, []);

  useEffect(() => {
    resetTimerSession();
  }, [slug, resetTimerSession]);

  useEffect(() => {
    return () => {
      clearArmTimeout();
      clearTicker();
      disposersRef.current.forEach((d) => d.dispose());
      disposersRef.current = [];
    };
  }, []);

  /** Call on every Monaco model change while user types */
  const handleModelEdited = useCallback(() => {
    if (phaseRef.current === "running") return;
    /* Focus in the editor is enough — mouse may be over the statement panel or toolbar */
    if (!editorFocusedRef.current) return;
    if (armLatchRef.current) return;

    armLatchRef.current = true;
    phaseRef.current = "arming";
    clearArmTimeout();
    armTimeoutRef.current = setTimeout(() => {
      armTimeoutRef.current = null;
      armLatchRef.current = false;
      if (!editorFocusedRef.current) {
        phaseRef.current = "idle";
        return;
      }
      phaseRef.current = "running";
      runningStartPerfRef.current = performance.now();
      setDisplayMs(0);
      setClockActive(true);
      clearTicker();
      tickIntervalRef.current = setInterval(() => {
        const start = runningStartPerfRef.current;
        if (start === null) return;
        const e = Math.min(MAX_CODING_MS, Math.floor(performance.now() - start));
        setDisplayMs(e);
      }, TICK_MS);
    }, ARM_DELAY_MS);
  }, []);

  /** Call when user clicks Submit – returns elapsed coding ms (session), stops ticker */
  const freezeForSubmit = useCallback(() => {
    clearArmTimeout();
    clearTicker();

    let ms = 0;
    if (phaseRef.current === "running" && runningStartPerfRef.current !== null) {
      ms = Math.min(MAX_CODING_MS, Math.floor(performance.now() - runningStartPerfRef.current));
      setDisplayMs(ms);
    }

    phaseRef.current = "idle";
    runningStartPerfRef.current = null;
    armLatchRef.current = false;
    clearArmTimeout();
    return ms;
  }, []);

  /** Mount handler for `<Editor onMount={onEditorMounted} />` */
  const onEditorMounted = useCallback(
    (ed: MonacoEditor.IStandaloneCodeEditor) => {
      disposersRef.current.forEach((d) => d.dispose());
      disposersRef.current = [];
      editorFocusedRef.current = ed.hasTextFocus();
      const d1 = ed.onDidBlurEditorWidget(() => {
        editorFocusedRef.current = false;
        tryCancelArm();
      });
      const d2 = ed.onDidFocusEditorWidget(() => {
        editorFocusedRef.current = true;
      });
      disposersRef.current.push(d1, d2);
    },
    [tryCancelArm],
  );

  const elapsedLabel = formatCodingTimerDisplay(displayMs, clockActive);

  return {
    displayMs,
    elapsedLabel,
    codingClockActive: clockActive,
    handleModelEdited,
    freezeForSubmit,
    resetTimerSession,
    onEditorMounted,
    formatSolveDuration,
  };
}