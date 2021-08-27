module.exports = {
  providerOptions: {
    networkId: 1337,
    chainId: 1337,
  },
  skipFiles: ["external"],
  measureStatementCoverage: true,
  measureFunctionCoverage: true,
  istanbulReporter: ["html"],
  mocha: {
    timeout: 11111111111111111111111111100,
    grep: "@skip-on-coverage", // Find everything with this tag
    invert: true, // Run the grep's inverse set.
  },
};
