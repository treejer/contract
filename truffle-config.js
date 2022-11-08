/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like truffle-hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */
require("dotenv").config();
const HDWalletProvider = require("@truffle/hdwallet-provider");
// const infuraKey = "fj4jll3k.....";

const privateKeys = [process.env.DEPLOYER_PRIVAE_KEY];

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */
  networks: {
    // Useful for testing. The `development` name is special - truffle uses it by default
    // if it's defined here and no other network is specified at the command line.
    // You should run a client (like ganache-cli, geth or parity) in a separate terminal
    // tab if you use this network and you must also set the `host`, `port` and `network_id`
    // options below to some value.
    //

    development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 8545, // Standard Ethereum port (default: none)
      network_id: "*", // Any network (default: none)
      gas: 20000000,
      gasPrice: 1e9,
    },

    // Another network with more advanced options...
    // advanced: {
    // port: 8777,             // Custom port
    // network_id: 1342,       // Custom network
    // gas: 8500000,           // Gas sent with each transaction (default: ~6700000)
    // gasPrice: 20000000000,  // 20 gwei (in wei) (default: 100 gwei)
    // from: <address>,        // Account to send txs from (default: accounts[0])
    // websockets: true        // Enable EventEmitter interface for web3 (default: false)
    // },

    // Useful for deploying to a public network.
    // NB: It's important to wrap the provider as a function.
    ropsten: {
      provider: () =>
        new HDWalletProvider(
          privateKeys,
          `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
        ),
      network_id: 3, // Ropsten's id
      gas: 5500000, // Ropsten has a lower block limit than mainnet
      confirmations: 2, // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200, // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true, // Skip dry run before migrations? (default: false for public nets )
    },

    rinkeby: {
      provider: () =>
        new HDWalletProvider(
          privateKeys,
          `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
        ),
      network_id: 4,
      gas: 6700000,
      gasPrice: 10000000000,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
    goerli: {
      provider: () =>
        new HDWalletProvider(
          privateKeys,
          `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
        ),
      network_id: 5, // eslint-disable-line camelcase
      gas: 6900000,
      gasPrice: 30e9,
      timeoutBlocks: 200,
      skipDryRun: true,
    },

    // arbitrum: {
    //   provider: () => {
    //     // return wrapped provider:
    //     return wrapProvider(
    //       new HDWalletProvider(privateKeys, process.env.ARB_PROVIDER_URL)
    //     );
    //   },
    //   network_id: "*",
    //   gasPrice: 0,
    //   chainId: 215728282823301,
    // },

    matic: {
      provider: () =>
        new HDWalletProvider(
          privateKeys,
          `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
        ),
      network_id: 137,
      confirmations: 2,
      timeoutBlocks: 200,
      gas: 8500000,
      gasPrice: 101000000000,
      skipDryRun: false,
    },

    mumbai: {
      provider: () =>
        new HDWalletProvider(
          privateKeys,
          `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
        ),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 500,
      skipDryRun: true,
      // gas: 60000000,
      // gasPrice: 100000000000,
    },
  },
  plugins: ["solidity-coverage"],
  mocha: {
    timeout: 0,
    // reporter: "eth-gas-reporter",
    reporterOptions: {
      token: process.env.GAS_REPORTER_TOKEN,
      gasPriceApi: process.env.GAS_PRICE_API,
      currency: "USD",
      outputFile: "eth-gas-reporter.log",
      showTimeSpent: true,
      coinmarketcap: process.env.COINMARKETCAP_APIKEY,
      excludeContracts: ["Migrations"],
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.6", // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 9999,
        },
      },
    },
  },
};
