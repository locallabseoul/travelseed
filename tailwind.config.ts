import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: "#f4efe7",
        forest: "#18352f",
        ocean: "#0f5f6b",
      },
    },
  },
  plugins: [],
};

export default config;
