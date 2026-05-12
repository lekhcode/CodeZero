/**
 * Load environment variables before any other app modules read `process.env`.
 * Keeping this tiny file avoids import cycles with `config/env.ts`.
 */
import dotenv from "dotenv";

dotenv.config();
