/** Shell snippets embedded in judge {@code run.sh} for compile-phase timing inside the container. */

export const SHELL_NOW_MS = `
_ms_now() {
  if command -v python3 >/dev/null 2>&1; then
    python3 -c 'import time; print(int(time.time()*1000))'
  elif date +%s%3N >/dev/null 2>&1; then
    date +%s%3N
  else
    echo $(($(date +%s) * 1000))
  fi
}
`.trim();

export const ZERO_COMPILE_MS = `echo 0 > compile_ms.txt`;
