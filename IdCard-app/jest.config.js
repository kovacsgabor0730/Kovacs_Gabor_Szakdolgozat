module.exports = {
    preset: "jest-expo",
    transformIgnorePatterns: [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
    ],
    setupFilesAfterEnv: [
      "./tests/setup.js"
    ],
    moduleFileExtensions: [
      "ts",
      "tsx",
      "js",
      "jsx"
    ],
    collectCoverage: true,
    collectCoverageFrom: [
      "**/*.{js,jsx,ts,tsx}",
      "!**/coverage/**",
      "!**/node_modules/**",
      "!**/babel.config.js",
      "!**/jest.setup.js"
    ],
    testMatch: [
      "**/__tests__/**/*.{js,jsx,ts,tsx}",
      "**/?(*.)+(spec|test).{js,jsx,ts,tsx}"
    ],
    moduleNameMapper: {
      "@expo/vector-icons": "<rootDir>/tests/mocks/expoVectorIconsMock.js"
    }
  };