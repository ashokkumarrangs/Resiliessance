import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    "node_modules/**",
    "**/node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    ".wrangler/**",
    ".open-next/**",
    ".pnpm-store/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
