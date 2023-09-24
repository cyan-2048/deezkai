import { defineConfig, splitVendorChunk, splitVendorChunkPlugin } from "vite";
import preact from "@preact/preset-vite";
import tsconfigPaths from "vite-tsconfig-paths";
import polyfillKaiOS from "./scripts/vite";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [tsconfigPaths(), preact(), polyfillKaiOS(), splitVendorChunkPlugin()],
	server: {
		port: 3000,
	},
	esbuild: {
		mangleProps: /^\$\$/,
	},
	build: {
		target: "es6",
		cssTarget: "firefox48",
		cssCodeSplit: false,
		modulePreload: false,
		assetsInlineLimit: 0,
		minify: true,
		ssr: false,
		rollupOptions: {
			output: {
				format: "iife",
			},
		},
	},
	worker: {
		plugins: [polyfillKaiOS()],
	},
});
