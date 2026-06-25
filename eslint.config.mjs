import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    ".firebase/**",
    "out/**",
    "build/**",
    "functions/lib/**",
    "next-env.d.ts",
    "nextjs-fix-plan-1/**",
    "nextjs-fix-plan/**",
    "thenijobs-nextjs/**",
  ]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
]);

export default eslintConfig;
