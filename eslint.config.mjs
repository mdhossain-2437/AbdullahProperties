import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["apps/office-desktop/**/*.{ts,tsx}"],
    rules: {
      // The desktop shell is a Vite/Tauri application; next/image is not available there.
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "apps/office-desktop/dist/**",
    "apps/office-desktop/src-tauri/target/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
