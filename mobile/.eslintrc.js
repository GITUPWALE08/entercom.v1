module.exports = {
    root: true,
    env: { browser: true, es2021: true, node: true },
    extends: [
      'eslint:recommended',
      '@typescript-eslint/recommended',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
      'prettier'
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['react-refresh'],
    rules: { 'react-refresh/only-export-components': 'warn' },
    settings: { react: { version: 'detect' } }
  };