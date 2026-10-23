import { z } from "zod";

/** The shortest search that queries the database. */
export const SEARCH_MIN_LENGTH = 2;

/** The longest search accepted. */
export const SEARCH_MAX_LENGTH = 60;

/** A search box query: trimmed, {@link SEARCH_MIN_LENGTH}–{@link SEARCH_MAX_LENGTH} characters. */
export const searchQuerySchema = z
  .string()
  .trim()
  .min(SEARCH_MIN_LENGTH, `Type at least ${SEARCH_MIN_LENGTH} characters.`)
  .max(SEARCH_MAX_LENGTH, `Use at most ${SEARCH_MAX_LENGTH} characters.`);
