export type EmojiCategoryKey = "smileys" | "gestures" | "tech" | "objects" | "symbols";

export const EMOJI_CATEGORIES: Array<{ key: EmojiCategoryKey; icon: string }> = [
  { key: "smileys", icon: "😀" },
  { key: "gestures", icon: "👋" },
  { key: "tech", icon: "💻" },
  { key: "objects", icon: "🔥" },
  { key: "symbols", icon: "⚡" },
];

export const EMOJI_SETS: Record<EmojiCategoryKey, string[]> = {
  smileys: ["😀", "😂", "🥲", "😎", "🤔", "😤", "🥳", "😭", "🤯", "😴", "🫡", "🥸", "😅", "🤓", "😬", "🙃"],
  gestures: ["👋", "👍", "👎", "🤝", "👏", "🙌", "🤜", "🤛", "✌️", "🤞", "🫶", "💪", "🦾", "🖖", "🤙", "👌"],
  tech: ["💻", "🖥️", "⌨️", "🖱️", "💾", "📱", "🔌", "🖨️", "📡", "🤖", "👾", "🎮", "🕹️", "💿", "📀", "🔋"],
  objects: ["🔥", "⚡", "💡", "🧠", "🎯", "🚀", "💎", "🏆", "🎖️", "🥇", "🔑", "🗝️", "🧩", "🔮", "💣", "⚙️"],
  symbols: ["✅", "❌", "❓", "❗", "💯", "🔴", "🟡", "🟢", "🔵", "🟣", "⭐", "💫", "✨", "🌟", "🎉", "🫧"],
};
