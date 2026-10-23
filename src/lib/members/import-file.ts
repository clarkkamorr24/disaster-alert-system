/**
 * The largest member CSV the import accepts, in bytes. Next.js caps a Server
 * Action request at 1 MB including the multipart overhead, so this leaves
 * room for it.
 */
export const MAX_IMPORT_BYTES = 1_000_000;

/** Shown when the chosen file is over {@link MAX_IMPORT_BYTES}. */
export const FILE_TOO_LARGE_MESSAGE = "File is too large (max 1 MB).";
