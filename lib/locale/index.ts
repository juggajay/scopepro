import { AU_LOCALE } from "./au";
import type { LocaleConfig } from "./types";

export type { LocaleConfig };

// Default locale — AU only at launch.
// To add US/UK: create us.ts/uk.ts configs and select based on user preference.
export const locale: LocaleConfig = AU_LOCALE;
