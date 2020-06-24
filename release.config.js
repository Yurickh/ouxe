module.exports = {
  branches: ['main'],
  plugins: [
    'semantic-release-gitmoji',
    [
      '@semantic-release/github',
      {
        assets: [
          { path: 'lib/ouxe.js', label: 'Standard distribution' },
          { path: 'lib/ouxe.mjs', label: 'ES6 modules distribution' },
          { path: 'lib/ouxe.modern.js', label: 'Modern JS distribution' },
          { path: 'lib/ouxe.umd.js', label: 'UMD distribution' },
        ],
      },
    ],
    '@semantic-release/npm',
    [
      '@semantic-release/git',
      {
        assets: ['package.json'],
        message: '🔖 ${nextRelease.version}\n\n${nextRelease.notes}',
      },
    ],
  ],
}
