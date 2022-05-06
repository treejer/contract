# Treejer Protocol Smart Contracts

![Background Image](../assets/treejerStory.png)
[![Twitter Follow](https://img.shields.io/twitter/follow/TreejerTalks?label=Follow)](https://twitter.com/TreejerTalks)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![CircleCI](https://circleci.com/gh/treejer/contract/tree/main.svg?style=shield)](https://app.circleci.com/pipelines/github/treejer/contract?branch=main&filter=all)
[![Coverage Status](https://coveralls.io/repos/github/treejer/contract/badge.svg?branch=main)](https://coveralls.io/github/treejer/contract?branch=main)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](https://docs.treejer.com/project-charter#da-contributor-covenant-code-of-conduct)

Treejer Protocol Smart Contracts es una implementación ligera de [Treejer Protocol](treejer.com) en Polygon.


La documentación completa del protocolo de Treejer y las ligas a los últimos lanzamientos de contratos se encuentran disponibles en [Treejer Docs](https://docs.treejer.com/smart-contracts).

Visite [Treejer Blog](http://blog.treejer.com) para más detalles sobre Treejer y como funciona.


## Local Development

Los siguientes pasos asumen el uso de `node@>=13`.

### Instalación de Dependencias

`npm install`

### Start Ganache

`npm run ganache`

### Test

`npm run test`

### Deploy on local ganache

`npm run deploy`

### Desarrollo con el uso de Docker

Con el propósito de facilitar el mejor desarrollo y testeo, el proyecto ha sido integrado con [Docker](https://www.docker.com/) y [Docker Compose](https://docs.docker.com/compose/). Esto elimina lo necesario para configurar el ambiente de desarrollo en tu máquina local. Simplemente corre el `container` y empieza a desarrollar y testear en él.

**Requerimentos**
- `Docker` - Si no tienes Docker instalado localmente, puedes seguir los siguientes pasos [here](https://docs.docker.com/get-docker/). Esto, además, puede instalar `docker-compose`.

**Configuración**

Dos modos en que se puede adaptar vía docker:
- _Development_: Esto crea un `container` con el proyecto y todas las dependencias son intaladas en esto. La localización del proyecto en tu maquina local estará linkeada como un [volume](https://docs.docker.com/storage/volumes/) para el contenedor y cualquier edición local deberá sincronizarse con el contenedor. Para correr (spin up) el contenedor de desarrollo usa: `docker-compose up develop`
- _Testing_: Esto proporciona un contenedor y corre todos los tests automáticamente y puede ser usado puramente para propósitos de testeo. Para correr un contenedor de testeo usar: `docker-compose up test`

## Cómo contribuir

To chat with us & stay up to date, join our [Discord](https://discord.gg/8WuVd2ERC2).
Para chatear con nosotros y mantenerse actualizado, unírsenos a [Discord](https://discord.gg/8WuVd2ERC2).

Vulnerabilidades deberían ser notificadas al equipo de Treejer por correo electrónico security@treejer.com.

_© Copyright 2021, Treejer_