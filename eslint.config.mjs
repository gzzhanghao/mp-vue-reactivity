import eslint from '@eslint/js';
import eslintImport from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    ignores: ['dist/'],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    plugins: {
      import: eslintImport,
    },
    rules: {
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],
    },
  },
  {
    files: ['*.cjs', '*.mjs', 'jest.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
