import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  //ignore-build
  globalIgnores(["dist", "node_modules"]),

  {
    files: ["**/*.{ts,tsx}"],

    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      prettier,
    },

    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs["flat/recommended"],
      reactRefresh.configs.vite,
      //prettier-last
      prettier.configs.recommended,
    ],

    rules: {
      //format-by-prettier
      "prettier/prettier": "error",

      //react-hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      //unused-vars-ts
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      //console-soft
      "no-console": ["warn", { allow: ["warn", "error"] }],

      //any-soft
      "@typescript-eslint/no-explicit-any": "warn",

      //allow-empty-fn
      "@typescript-eslint/no-empty-function": "off",

      //react-refresh-soft
      "react-refresh/only-export-components": "warn",
    },
  },
]);
