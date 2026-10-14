import tailwindcss from "@tailwindcss/postcss";

// Next.js's postcss loader accepts bare plugin-name strings; Vite's
// (postcss-load-config) needs the actual plugin instance.
const config = {
  plugins: [tailwindcss()],
};

export default config;
