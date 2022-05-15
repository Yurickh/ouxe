module.exports = {
  branches: ['main'],
  plugins: [
    'semantic-release-gitmoji',
    [
      '@semantic-release/github',
      {
        labels: ['failed-release'],
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
