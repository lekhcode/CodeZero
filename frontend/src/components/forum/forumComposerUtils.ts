/** Textarea selection helpers for the community post composer. */

export function insertAtCursor(
  textarea: HTMLTextAreaElement,
  snippet: string,
  value: string,
): string {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const next = value.slice(0, start) + snippet + value.slice(end);
  const pos = start + snippet.length;
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(pos, pos);
  });
  return next;
}

export function wrapSelection(
  textarea: HTMLTextAreaElement,
  value: string,
  before: string,
  after: string,
): string {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);
  const inner = selected.length > 0 ? selected : "text";
  const next = value.slice(0, start) + before + inner + after + value.slice(end);
  const cursor = start + before.length + inner.length + after.length;
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(cursor, cursor);
  });
  return next;
}

export function prependLines(textarea: HTMLTextAreaElement, value: string, prefix: string): string {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);
  const block = selected
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
  const next = value.slice(0, start) + block + value.slice(end);
  const cursor = start + block.length;
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(cursor, cursor);
  });
  return next;
}

export function autoResizeTextarea(el: HTMLTextAreaElement | null): void {
  if (el === null) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}
