module.exports = {
  testEnvironment: 'jest-environment-node',
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  testTimeout: 10000,
  watchPathIgnorePatterns: ['fixtures'],
}
