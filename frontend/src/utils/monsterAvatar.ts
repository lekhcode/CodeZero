const BODY_COLORS = ["#4F8FFF", "#7C6BFF", "#38BDF8", "#34D399", "#94A3B8", "#1A2230"] as const;

type MonsterParts = {
  bodyColor: string;
  bodyShape: 0 | 1 | 2;
  horns: 0 | 1 | 2 | 3;
  eyes: 0 | 1 | 2;
  mouth: 0 | 1 | 2;
  arms: 0 | 1 | 2;
  spots: 0 | 1;
};

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

function pick<T>(hash: number, index: number, pool: readonly T[]): T {
  return pool[(hash >> (index * 4)) % pool.length] as T;
}

function resolveParts(username: string): MonsterParts {
  const h = djb2(username.toLowerCase().trim() || "coder");
  return {
    bodyColor: pick(h, 0, BODY_COLORS),
    bodyShape: pick(h, 1, [0, 1, 2] as const),
    horns: pick(h, 2, [0, 1, 2, 3] as const),
    eyes: pick(h, 3, [0, 1, 2] as const),
    mouth: pick(h, 4, [0, 1, 2] as const),
    arms: pick(h, 5, [0, 1, 2] as const),
    spots: pick(h, 6, [0, 1] as const),
  };
}

function bodyShapeSvg(shape: MonsterParts["bodyShape"], color: string): string {
  if (shape === 0) {
    return `<ellipse cx="50" cy="56" rx="34" ry="30" fill="${color}" class="lb-monster-body"/>`;
  }
  if (shape === 1) {
    return `<rect x="20" y="30" width="60" height="52" rx="14" fill="${color}" class="lb-monster-body"/>`;
  }
  return `<ellipse cx="50" cy="56" rx="24" ry="36" fill="${color}" class="lb-monster-body"/>`;
}

function hornsSvg(horns: MonsterParts["horns"]): string {
  switch (horns) {
    case 1:
      return `
        <polygon points="28,32 32,18 36,32" fill="#2A2835" class="lb-monster-horn"/>
        <polygon points="64,32 68,18 72,32" fill="#2A2835" class="lb-monster-horn"/>
      `;
    case 2:
      return `
        <polygon points="44,28 50,12 56,28" fill="#2A2835" class="lb-monster-horn"/>
        <polygon points="34,30 38,16 42,30" fill="#2A2835" class="lb-monster-horn"/>
        <polygon points="58,30 62,16 66,30" fill="#2A2835" class="lb-monster-horn"/>
      `;
    case 3:
      return `
        <ellipse cx="32" cy="30" rx="8" ry="10" fill="#2A2835" class="lb-monster-horn"/>
        <ellipse cx="68" cy="30" rx="8" ry="10" fill="#2A2835" class="lb-monster-horn"/>
      `;
    default:
      return "";
  }
}

function eyesSvg(eyes: MonsterParts["eyes"]): string {
  const wrap = (inner: string) =>
    `<g class="lb-monster-eyes lb-monster-blink">${inner}</g>`;

  if (eyes === 1) {
    return wrap(`
      <ellipse cx="38" cy="50" rx="8" ry="9" fill="#fff"/>
      <ellipse cx="62" cy="50" rx="8" ry="9" fill="#fff"/>
      <circle cx="38" cy="51" r="4" fill="#1a1824"/>
      <circle cx="62" cy="51" r="4" fill="#1a1824"/>
    `);
  }
  if (eyes === 2) {
    return wrap(`
      <ellipse cx="38" cy="51" rx="7" ry="3.5" fill="#fff"/>
      <ellipse cx="62" cy="51" rx="7" ry="3.5" fill="#fff"/>
      <ellipse cx="38" cy="51" rx="4" ry="2" fill="#1a1824"/>
      <ellipse cx="62" cy="51" rx="4" ry="2" fill="#1a1824"/>
    `);
  }
  return wrap(`
    <circle cx="38" cy="50" r="6" fill="#fff"/>
    <circle cx="62" cy="50" r="6" fill="#fff"/>
    <circle cx="38" cy="51" r="3.5" fill="#1a1824"/>
    <circle cx="62" cy="51" r="3.5" fill="#1a1824"/>
  `);
}

function mouthSvg(mouth: MonsterParts["mouth"]): string {
  if (mouth === 1) {
    return `<line x1="40" y1="66" x2="60" y2="66" stroke="#2A2835" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  if (mouth === 2) {
    return `
      <rect x="38" y="62" width="24" height="10" rx="2" fill="#2A2835"/>
      <rect x="41" y="65" width="3" height="5" fill="#fff"/>
      <rect x="46" y="65" width="3" height="5" fill="#fff"/>
      <rect x="51" y="65" width="3" height="5" fill="#fff"/>
      <rect x="56" y="65" width="3" height="5" fill="#fff"/>
    `;
  }
  return `<path d="M 38 64 Q 50 74 62 64" fill="none" stroke="#2A2835" stroke-width="2.5" stroke-linecap="round"/>`;
}

function armsSvg(arms: MonsterParts["arms"]): string {
  if (arms === 1) {
    return `
      <ellipse cx="14" cy="48" rx="10" ry="14" fill="currentColor" class="lb-monster-arm" transform="rotate(-25 14 48)"/>
      <ellipse cx="86" cy="48" rx="10" ry="14" fill="currentColor" class="lb-monster-arm" transform="rotate(25 86 48)"/>
    `;
  }
  if (arms === 2) {
    return "";
  }
  return `
    <ellipse cx="16" cy="58" rx="11" ry="9" fill="currentColor" class="lb-monster-arm"/>
    <ellipse cx="84" cy="58" rx="11" ry="9" fill="currentColor" class="lb-monster-arm"/>
  `;
}

function spotsSvg(spots: MonsterParts["spots"]): string {
  if (spots === 0) {
    return "";
  }
  return `
    <circle cx="40" cy="58" r="3" fill="rgba(0,0,0,0.12)"/>
    <circle cx="55" cy="64" r="2.5" fill="rgba(0,0,0,0.12)"/>
    <circle cx="62" cy="52" r="2" fill="rgba(0,0,0,0.12)"/>
  `;
}

/**
 * Deterministic inline SVG monster from username (djb2 hash → variation pools).
 */
export function generateMonster(username: string, size = 64): string {
  const parts = resolveParts(username);
  const floatClass = "lb-monster-float";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-hidden="true">
  <g class="${floatClass}" style="color: ${parts.bodyColor}">
    ${armsSvg(parts.arms)}
    ${bodyShapeSvg(parts.bodyShape, parts.bodyColor)}
    ${spotsSvg(parts.spots)}
    ${hornsSvg(parts.horns)}
    ${eyesSvg(parts.eyes)}
    ${mouthSvg(parts.mouth)}
  </g>
</svg>`;
}

/** Default monster for empty states. */
export function generateDefaultMonster(size = 80): string {
  return generateMonster("__empty_leaderboard__", size);
}
