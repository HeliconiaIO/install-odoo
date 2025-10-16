module.exports = {
  printWidth: 100,
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  arrowParens: 'avoid',
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      options: { parser: 'typescript' },
    },
  ],
}
