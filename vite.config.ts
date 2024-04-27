import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
	server: {
		port: 4321,
		host: "0.0.0.0",
	},
	resolve: {
		alias: {
			"jsx-factory": path.resolve(__dirname, "./src/jsx"),
		},
	},
});
