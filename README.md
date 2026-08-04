# Backend Projeto Pizzaria

API REST para gerenciamento de pedidos de uma pizzaria, desenvolvida com Node.js, TypeScript, Express e Prisma ORM.

## Sobre o projeto

O sistema resolve o problema de controle de pedidos de mesa em um estabelecimento do tipo pizzaria/restaurante: cadastro de categorias e produtos (com imagem), abertura de pedidos vinculados a uma mesa, inclusão e remoção de itens, envio do pedido para a cozinha e finalização do atendimento.

O público-alvo é o backend de um sistema de comanda eletrônica, consumido por uma aplicação cliente (web, desktop ou mobile) operada por atendentes/garçons autenticados.

Este repositório contém **apenas a API backend**. Não há frontend, aplicativo mobile ou painel administrativo neste diretório.

Estágio atual: projeto de estudo/portfólio, funcional para uso local, sem testes automatizados, sem containerização e sem pipeline de CI/CD.

## Principais funcionalidades

Concluídas (confirmadas em [src/routes.ts](src/routes.ts) e nos respectivos controllers/services):

- Cadastro de usuário ([CreateUserController](src/controllers/user/CreateUserController.ts)) com senha criptografada via `bcryptjs`.
- Autenticação por e-mail e senha com emissão de token JWT, válido por 30 dias ([AuthUserService](src/services/user/AuthUserService.ts)).
- Consulta dos dados do usuário autenticado ([DetailUserController](src/controllers/user/DetailUserController.ts)).
- Middleware de autenticação via Bearer token em todas as rotas protegidas ([isAuthenticated.ts](src/middlewares/isAuthenticated.ts)).
- Criação e listagem de categorias de produtos.
- Criação de produtos com upload de imagem (`multer`, armazenamento local em `tmp/`) e listagem de produtos por categoria.
- Criação de pedido vinculado a uma mesa (`table`), com pedido nascendo como rascunho (`draft: true`).
- Inclusão e remoção de itens em um pedido.
- Envio do pedido (`draft` passa para `false`), listagem de pedidos enviados e ainda não finalizados, detalhamento de um pedido com seus itens/produtos, e finalização do pedido (`status: true`).

Não há, no código analisado, controle de perfis/papéis de usuário (todo usuário autenticado tem acesso às mesmas rotas), nem exclusão/edição de produtos ou categorias, nem edição de pedido além de adicionar/remover item.

## Tecnologias utilizadas

- **Backend**: Node.js, TypeScript, Express, `express-async-errors` (tratamento de erros assíncronos), `cors`
- **Autenticação**: `jsonwebtoken`, `bcryptjs`
- **Upload de arquivos**: `multer`
- **Banco de dados / ORM**: PostgreSQL, Prisma ORM (`@prisma/client`, `prisma`)
- **Ferramentas de desenvolvimento**: `ts-node-dev`, Yarn (presença de `yarn.lock`)

## Arquitetura

A aplicação segue uma separação em camadas simples: **rotas → controllers → services → Prisma Client → banco de dados**. Cada controller apenas recebe a requisição HTTP e delega a regra de negócio a um service correspondente.

```mermaid
flowchart LR
    Client[Cliente HTTP] --> Router[src/routes.ts]
    Router --> Auth[isAuthenticated middleware]
    Router --> Controllers[Controllers]
    Controllers --> Services[Services]
    Services --> Prisma[Prisma Client]
    Prisma --> DB[(PostgreSQL)]
    Controllers --> Static["/files - arquivos estáticos (tmp/)"]
```

## Estrutura do projeto

```
prisma/
  schema.prisma          # Modelos User, Category, Product, Order, Item
  migrations/             # Histórico de migrations do Prisma
src/
  server.ts               # Bootstrap do Express, middlewares globais e tratamento de erros
  routes.ts               # Definição de todas as rotas da API
  config/multer.ts        # Configuração de armazenamento de upload
  middlewares/isAuthenticated.ts
  controllers/            # user, category, product, order
  services/                # regras de negócio, um arquivo por caso de uso
  prisma/index.ts          # instância única do PrismaClient
  @types/express/          # extensão de tipos do Express (req.user_id)
tmp/                       # arquivos enviados via upload (banners de produto)
```

## Pré-requisitos

- Node.js (versão não especificada no repositório — `TODO: confirmar` versão mínima)
- Yarn (há `yarn.lock`; `npm` também deve funcionar, mas não há `package-lock.json` no repositório)
- Instância PostgreSQL acessível (local ou remota)

## Configuração

A aplicação lê a variável de ambiente `DATABASE_URL` (ver [prisma/schema.prisma](prisma/schema.prisma)) e `JWT_SECRET` (ver [isAuthenticated.ts](src/middlewares/isAuthenticated.ts) e [AuthUserService.ts](src/services/user/AuthUserService.ts)). Não há arquivo `.env.example` no repositório; crie um arquivo `.env` na raiz com valores próprios:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/pizzaria?schema=public"
JWT_SECRET="uma-chave-secreta-qualquer"
```

`TODO: confirmar` — o pacote `dotenv` está listado em [package.json](package.json), mas não há chamada a `dotenv.config()` (ou import `dotenv/config`) em nenhum arquivo do código-fonte analisado. Isso pode significar que as variáveis de ambiente precisam ser fornecidas de outra forma (por exemplo, exportadas no shell) para que a aplicação funcione como está.

Nunca utilize credenciais reais neste arquivo ou em commits — o `.gitignore` já exclui `.env`.

## Como executar

1. **Clonar o repositório**

```bash
git clone <url-do-repositorio>
cd BackEnd-ProjetoPizzaria
```

2. **Instalar dependências**

```bash
yarn install
```

3. **Configurar variáveis de ambiente**

Crie o arquivo `.env` conforme a seção [Configuração](#configuração).

4. **Aplicar as migrations no banco de dados**

```bash
yarn prisma migrate dev
```

5. **Executar a aplicação em modo desenvolvimento**

```bash
yarn dev
```

O servidor sobe em `http://localhost:3333` (porta fixa definida em [src/server.ts](src/server.ts)).

`TODO: confirmar` — não há scripts `build` ou `start` em [package.json](package.json), portanto não há um comando de execução em modo produção documentado pelo próprio projeto.

## API

- **URL base**: `http://localhost:3333`
- **Autenticação**: Bearer token JWT no header `Authorization`, obtido em `POST /session`. Rotas protegidas retornam `401` sem token válido.
- **Uploads**: arquivos de produto ficam acessíveis publicamente em `/files/<nome-do-arquivo>`.
- Não há Swagger/OpenAPI configurado no repositório.

A lista completa de grupos de endpoints (usuários, categorias, produtos e pedidos), com exemplos de requisição, está em [docs/API.md](docs/API.md).

## Banco de dados

PostgreSQL, com schema versionado via Prisma Migrate ([prisma/migrations/](prisma/migrations/)). Não há arquivo de seed no repositório.

Entidades e relacionamentos estão detalhados em [docs/DATABASE.md](docs/DATABASE.md).

## Decisões técnicas

- Uso do Prisma ORM como camada única de acesso a dados, com um client singleton exportado em [src/prisma/index.ts](src/prisma/index.ts).
- Separação entre controller (camada HTTP) e service (regra de negócio) para cada caso de uso, um arquivo por operação.
- `express-async-errors` é utilizado para permitir que erros lançados em funções `async` dos controllers sejam capturados pelo middleware de erro central em [src/server.ts](src/server.ts), sem a necessidade de `try/catch` manual em cada rota.
- Pedidos usam o campo `draft` para diferenciar uma comanda em edição (ainda recebendo itens) de uma comanda já enviada à cozinha, e o campo `status` para marcar a finalização — ambos booleanos no modelo `Order`.

## Limitações e próximos passos

Estas são possibilidades de evolução, não funcionalidades já implementadas:

- Não há validação estruturada de payloads (schema validation) nas rotas; a validação encontrada é pontual (ex.: verificação de e-mail vazio em `CreateUserService`, nome vazio em `CreateCategoryService`).
- Não há controle de perfis/permissões de usuário.
- Não há testes automatizados, containerização (Docker) ou pipeline de CI/CD.
- Não há edição/remoção de produto ou categoria, apenas criação e listagem.
- O carregamento de variáveis de ambiente via `dotenv` não está confirmado no código (ver seção Configuração).
- Armazenamento de imagens é local em disco (`tmp/`), sem integração com serviço de armazenamento externo.

## Autor

Fábio Simones
