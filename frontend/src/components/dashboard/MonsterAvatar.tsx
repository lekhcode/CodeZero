import { generateMonster } from "@/utils/monsterAvatar";

type MonsterAvatarProps = {
  username: string;
  size?: number;
  floatDelayClass?: "lb-delay-0" | "lb-delay-1" | "lb-delay-2";
};

/**
 * Renders a deterministic animated monster SVG for the given username.
 */
export function MonsterAvatar({ username, size = 64, floatDelayClass }: MonsterAvatarProps) {
  let svg = generateMonster(username, size);
  if (floatDelayClass !== undefined) {
    svg = svg.replace('class="lb-monster-float"', `class="lb-monster-float ${floatDelayClass}"`);
  }

  return (
    <span
      className="lb-monster-host"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
