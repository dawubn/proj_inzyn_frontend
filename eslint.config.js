//eslint.config.js
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  //ignores
  {
    ignores: ["dist", "node_modules", "src/components/ui/**"],
  },

  //ts base
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    languageOptions: {
      ...config.languageOptions,
      parserOptions: {
        ...config.languageOptions?.parserOptions,
        project: undefined,
        tsconfigRootDir: undefined,
      },
      globals: {
        ...globals.browser,
      },
    },
  })),

  //ts+react rules
  {
    files: ["**/*.{ts,tsx}"],

    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: globals.browser,
    },

    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },

    rules: {
      //react hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      //unused vars
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      //console
      "no-console": ["warn", { allow: ["warn", "error"] }],

      //any
      "@typescript-eslint/no-explicit-any": "warn",

      //empty fn
      "@typescript-eslint/no-empty-function": "off",

      //fast refresh
      "react-refresh/only-export-components": "off",
    },
  },
);
