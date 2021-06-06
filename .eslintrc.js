'use strict'

const common = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: ['plugin:react/recommended', 'eslint:recommended', 'plugin:prettier/recommended'],
  parser: '@babel/eslint-parser',
  plugins: ['import', 'prettier'],
  rules: {
    'import/order': [
      'error',
      {
        alphabetize: {
          caseInsensitive: true,
          order: 'asc',
        },
      },
    ],
    'no-warning-comments': ['warn', { location: 'start', terms: ['todo', '@todo', 'fixme'] }],
    'padding-line-between-statements': [
      'warn',
      { blankLine: 'always', prev: '*', next: 'block' },
      { blankLine: 'always', prev: '*', next: 'block-like' },
      { blankLine: 'always', prev: 'const', next: 'expression' },
      { blankLine: 'always', prev: 'let', next: 'expression' },
      { blankLine: 'always', prev: 'var', next: 'expression' },
      { blankLine: 'always', prev: 'block', next: '*' },
      { blankLine: 'always', prev: 'block-like', next: '*' },
      { blankLine: 'always', prev: '*', next: 'return' },
    ],
  },
}

module.exports = {
  ...common,
  overrides: [
    {
      ...common,
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2018,
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint', 'prettier'],
      extends: [
        'eslint:recommended',
        'plugin:prettier/recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        ...common.rules,
        '@typescript-eslint/explicit-module-boundary-types': 'error',

        // Disable rules
        '@typescript-eslint/interface-name-prefix': 0,
        '@typescript-eslint/member-delimiter-style': 0,
        '@typescript-eslint/no-empty-interface': 0,
        '@typescript-eslint/no-explicit-any': 0,
      },
    },
  ],
}
