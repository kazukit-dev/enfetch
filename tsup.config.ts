import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/timeout.ts", "src/retry.ts"],
	format: ["esm"],
	dts: true,
	sourcemap: true,
	clean: true,
	outDir: "dist",
});
