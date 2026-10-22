import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(new URL("./src/test/empty.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // next-auth imports "next/server" without an extension, which Node's ESM resolver rejects;
    // inlining lets Vite resolve it instead.
    server: { deps: { inline: ["next-auth"] } },
  },
});
