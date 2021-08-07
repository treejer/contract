module.exports = {
    providerOptions: {
        "networkId": 1337,
        "chainId": 1337
    },
    skipFiles: ['gsn/externalFile'],
    measureStatementCoverage: true,
    measureFunctionCoverage: true,
    istanbulReporter: ['html'],
    mocha: {
        grep: "@skip-on-coverage", // Find everything with this tag
        invert: true               // Run the grep's inverse set.
    }
};