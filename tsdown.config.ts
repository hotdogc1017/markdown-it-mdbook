import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  external: ["markdown-it"],
});
