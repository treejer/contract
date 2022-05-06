# Treejer Protocol Smart Contracts

![Background Image](./assets/treejerStory.png)
[![Twitter Follow](https://img.shields.io/twitter/follow/TreejerTalks?label=Follow)](https://twitter.com/TreejerTalks)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![CircleCI](https://circleci.com/gh/treejer/contract/tree/main.svg?style=shield)](https://app.circleci.com/pipelines/github/treejer/contract?branch=main&filter=all)
[![Coverage Status](https://coveralls.io/repos/github/treejer/contract/badge.svg?branch=main)](https://coveralls.io/github/treejer/contract?branch=main)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](https://docs.treejer.com/project-charter#da-contributor-covenant-code-of-conduct)

Treejer Protocol Smart Contracts is a lightweight implementation of the [Treejer Protocol](treejer.com) on Polygon.

In-depth documentation on Treejer protocol and the latest deployed contracts addresses are available at [Treejer Docs](https://docs.treejer.com/smart-contracts).

Visit [Treejer Blog](http://blog.treejer.com) for more details into the Treejer and how it works.

## Local Development

The following assumes the use of `node@>=13`.

### Install Dependencies

`npm install`

### Start Ganache

`npm run ganache`

### Test

`npm run test`

### Deploy on local ganache

`npm run deploy`

### Development using Docker

In order to facilitate better development and testing, the project has been integrated with [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/). This eliminates the necessity to setup the environment in your local machine. Simply spin up the `container` and start developing and testing in it.

**Requirements**
- `Docker` - If you don't have Docker installed in your local machine, you can get it by following the steps [here](https://docs.docker.com/get-docker/). This should also install `docker-compose`.

**Setup**

Two modes can be enabled via docker:
- _Development_: This creates a `container` with the project and all the dependencies installed in it. The project location in your local machine will be linked as a [volume](https://docs.docker.com/storage/volumes/) to the container and any edits you make in your local would be synced to the container. To spin up the development container use: `docker-compose up develop`
- _Testing_: This brings up a container and runs all the tests in it automatically and can be used purely for testing purposes. To spin up a testing container use: `docker-compose up test`

## How to Contribute

To chat with us & stay up to date, join our [Discord](https://discord.gg/8WuVd2ERC2).

Vulnerabilities should be disclosed directly to the Treejer team by emailing security@treejer.com.

_© Copyright 2021, Treejer_

[Spanish version](./translations/README-es.md)
