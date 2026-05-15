/**
 * Python prelude — typing + future annotations common on judge platforms (stdlib only).
 */
export const PYTHON_PRELUDE = `from __future__ import annotations

from typing import Any, Deque, Dict, List, Optional, Set, Tuple
from collections import defaultdict, deque
import heapq
import itertools
`.trimEnd();
