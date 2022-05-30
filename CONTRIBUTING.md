# Contributing to Treejer

We welcome all forms of contributions! You can start with some [_**good first isssues**_](https://github.com/treejer/contract/contribute). You can also go through other existing issues or create new ones in the issues dashboard.

You can find our contributing guide on our [website](https://docs.treejer.com/contribution-guideline).

## Legal Notice

All contributions must and will be licensed under [GNU General Public License v3.0](https://github.com/treejer/contract/blob/main/LICENSE).

## Code of Conduct

Treejer has adapted its Code of Conduct from the **Contributer Covenant (v2.1)**. All community members are expected to adhere to it. Please refer [here](https://docs.treejer.com/project-charter#da-contributor-covenant-code-of-conduct) for more details.

## Developer Setup

#### Preliminary Steps

1. The preferred workflow for contributing to `Treejer` is to [fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo) the [main repository](https://github.com/treejer/contract/) on GitHub and create a new branch.
2. [Clone](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository) the forked repository to your local.

### Docker

In order to facilitate better development and testing, the project has been integrated with [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/). This eliminates the necessity to setup the entire environment in your local machine. Simply spin up the required `container` and start developing or testing in it.

#### Requirements
- `Docker` - If you don't have Docker installed in your local machine, you can get it by following the steps [here](https://docs.docker.com/get-docker/). This should also install `docker-compose`.

#### Setup

Two modes can be enabled via docker:
1. _Development_: This creates a `container` with the project and all the dependencies installed in it. The project location in your local machine will be linked as a [volume](https://docs.docker.com/storage/volumes/) to the container and any edits you make in your local would be synced to the container. To spin up the development container run: `docker-compose up develop` inside the project folder on your local.
2. _Testing_: This brings up a container and runs all the tests in it automatically and then kills the container. This can be used purely for testing purposes. To spin up a testing container run: `docker-compose up test` inside the project folder on your local.

### Local

If you are unable to install `docker` in your local, then you can setup the environment directly by following the steps mentioned below.

#### Requirements

- `node>=13.0.0`

#### Setup

1. Once inside the project folder on your local, run `npm install` to install all the dependencies.
2. Start [Ganache](https://trufflesuite.com/ganache/) using: `npm run ganache`
3. Run all the tests using `npm run test`
4. Deploy to the local ganache using `npm run deploy`


## Get in touch

You can join the *contributors* channel our [Discord](https://discord.gg/8WuVd2ERC2).

Vulnerabilities should be disclosed directly to the Treejer team by emailing security@treejer.com.