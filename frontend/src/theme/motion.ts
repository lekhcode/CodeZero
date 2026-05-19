/** Fast, fluent motion presets — keep durations short for snappy UI. */
export const easeOut = [0.22, 1, 0.36, 1] as const;

export const transitionFast = {
  duration: 0.18,
  ease: easeOut,
} as const;

export const springSnappy = {
  type: "spring" as const,
  stiffness: 520,
  damping: 34,
  mass: 0.45,
};

export const springSoft = {
  type: "spring" as const,
  stiffness: 380,
  damping: 30,
  mass: 0.5,
};

export const hoverLift = {
  y: -2,
  transition: transitionFast,
};

export const tapPress = {
  scale: 0.97,
  transition: { duration: 0.1 },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.045, delayChildren: 0.02 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: transitionFast,
  },
};
