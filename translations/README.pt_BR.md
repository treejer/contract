Os contratos inteligentes do protocolo Treejer são uma implementação leve do [Protocolo Treejer](treejer.com) no Polygon.

Documentação detalhada sobre o protocolo Treejer e os endereços de contratos implantados mais recentes estão disponíveis em [Treejer Docs](https://docs.treejer.com/smart-contracts).

Visite [Treejer Blog](http://blog.treejer.com) para obter mais detalhes sobre o Treejer e como ele funciona.

## Desenvolvimento Local

O seguinte assume o uso de `node@>=13`.

### Instalar dependências

`npm instalar`

### Iniciar Ganache

`npm executar ganache`

### Teste

`npm executar teste`

### Implante no ganache local

`npm executar implantação`

### Desenvolvimento usando Docker

Para facilitar o melhor desenvolvimento e teste, o projeto foi integrado ao [Docker](https://www.docker.com/) e ao [Docker Compose](https://docs.docker.com/compose/). Isso elimina a necessidade de configurar o ambiente em sua máquina local. Simplesmente gire o `container` e comece a desenvolver e testar nele.

**Requisitos**
- `Docker` - Se você não tiver o Docker instalado em sua máquina local, você pode obtê-lo seguindo as etapas [aqui](https://docs.docker.com/get-docker/). Isso também deve instalar o `docker-compose`.

**Configuração**

Dois modos podem ser ativados via docker:
- _Desenvolvimento_: Cria um `container` com o projeto e todas as dependências instaladas nele. O local do projeto em sua máquina local será vinculado como um [volume](https://docs.docker.com/storage/volumes/) ao contêiner e todas as edições feitas em seu local serão sincronizadas com o contêiner. Para ativar o contêiner de desenvolvimento, use: `docker-compose up develop`
- _Testing_: Isso abre um contêiner e executa todos os testes nele automaticamente e pode ser usado apenas para fins de teste. Para ativar um contêiner de teste, use: `docker-compose up test`

## Como contribuir

Para conversar conosco e manter-se atualizado, junte-se ao nosso [Discord](https://discord.gg/8WuVd2ERC2).

As vulnerabilidades devem ser divulgadas diretamente à equipe Treejer enviando um e-mail para security@treejer.com.

_© Copyright 2021, Treejer_