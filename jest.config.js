/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@scure|@noble|otplib|@otplib)',
  ],
};
