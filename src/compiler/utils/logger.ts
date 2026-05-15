import { logger } from "../../config/logger.js";

/** Dedicated child logger for the compiler domain — filter in prod via `module: compiler`. */
export const compilerLogger = logger.child({ module: "compiler" });
