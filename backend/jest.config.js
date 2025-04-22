module.exports = {
    testEnvironment: 'node',
    setupFiles: ['<rootDir>/tests/setup.js'],
    collectCoverage: true,
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/server.js',
      '!src/app.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'clover'],
    testMatch: ['**/*.test.js'],
    verbose: true
  };