import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist", // Ensure the build output is correct
    assetsDir: "assets", // Place assets in the assets folder
  },
});
