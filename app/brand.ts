/** Product display name used in UI chrome and document titles. */
export const APP_NAME = 'Biosense';

/** Single-letter mark shown in the collapsed sidebar. */
export const APP_INITIAL = 'B';

/** Builds a browser tab title: `"Page — Biosense"`. */
export function pageTitle(page: string) {
  return `${page} — ${APP_NAME}`;
}
