# API — Backend Projeto Pizzaria

URL base local: `http://localhost:3333`

Todas as rotas retornam JSON. Não há Swagger/OpenAPI configurado neste repositório; a documentação abaixo foi extraída diretamente de [src/routes.ts](../src/routes.ts) e dos controllers/services correspondentes.

## Autenticação

A maioria das rotas exige o header:

```
Authorization: Bearer <token>
```

O token é obtido em `POST /session` e validado pelo middleware [isAuthenticated](../src/middlewares/isAuthenticated.ts), que decodifica o JWT e injeta `req.user_id`. Requisições sem token ou com token inválido recebem `401`.

## Tratamento de erros

O middleware de erro global em [src/server.ts](../src/server.ts) captura exceções lançadas nos services:

- Erros do tipo `Error` (lançados explicitamente nas regras de negócio) retornam `400` com `{ "error": "<mensagem>" }`.
- Qualquer outro erro não tratado retorna `500` com `{ "status": "error", "message": "Internal server error." }`.

## Usuários

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| POST | `/users` | Não | Cria um usuário |
| POST | `/session` | Não | Autentica e retorna um token JWT |
| GET | `/me` | Sim | Retorna os dados do usuário autenticado |

**POST /users**

```json
{
  "name": "Maria Silva",
  "email": "maria@exemplo.com",
  "password": "senha-segura"
}
```

Retorna `{ "id", "name", "email" }`. Lança erro se `email` não for informado ou se já existir usuário com o mesmo e-mail ([CreateUserService](../src/services/user/CreateUserService.ts)).

**POST /session**

```json
{
  "email": "maria@exemplo.com",
  "password": "senha-segura"
}
```

Retorna `{ "id", "name", "email", "token" }`. O token expira em 30 dias ([AuthUserService](../src/services/user/AuthUserService.ts)).

**GET /me**

Retorna `{ "id", "name", "email" }` do usuário identificado pelo token enviado.

## Categorias

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| POST | `/category` | Sim | Cria uma categoria |
| GET | `/category` | Sim | Lista todas as categorias |

**POST /category**

```json
{ "name": "Pizzas salgadas" }
```

Lança erro se `name` for vazio ([CreateCategoryService](../src/services/category/CreateCategoryService.ts)).

## Produtos

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| POST | `/product` | Sim | Cria um produto (multipart/form-data) |
| GET | `/category/product?category_id=<id>` | Sim | Lista produtos de uma categoria |

**POST /product** — `multipart/form-data`, campo de arquivo `file`:

| Campo | Tipo | Observação |
|---|---|---|
| `name` | string | |
| `price` | string | |
| `description` | string | |
| `category_id` | string | id de uma categoria existente |
| `file` | arquivo | obrigatório; salvo em `tmp/` e servido em `/files/<nome-gerado>` |

Se nenhum arquivo for enviado, a requisição lança erro (`Error upload file`) — ver [CreateProductController](../src/controllers/product/CreateProductController.ts).

## Pedidos

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| POST | `/order` | Sim | Cria um pedido (rascunho) vinculado a uma mesa |
| DELETE | `/order?order_id=<id>` | Sim | Remove um pedido |
| POST | `/order/add` | Sim | Adiciona um item ao pedido |
| DELETE | `/order/remove?item_id=<id>` | Sim | Remove um item do pedido |
| PUT | `/order/send` | Sim | Envia o pedido (sai do rascunho) |
| GET | `/orders` | Sim | Lista pedidos enviados e ainda não finalizados |
| GET | `/order/detail?order_id=<id>` | Sim | Detalha os itens/produtos de um pedido |
| PUT | `/order/finish` | Sim | Finaliza o pedido |

**POST /order**

```json
{ "table": 5, "name": "Cliente balcão" }
```

Cria um `Order` com `draft: true` e `status: false` por padrão (ver [prisma/schema.prisma](../prisma/schema.prisma)).

**POST /order/add**

```json
{ "order_id": "uuid-do-pedido", "product_id": "uuid-do-produto", "amount": 2 }
```

**PUT /order/send**

```json
{ "order_id": "uuid-do-pedido" }
```

Atualiza `draft` para `false`.

**PUT /order/finish**

```json
{ "order_id": "uuid-do-pedido" }
```

Atualiza `status` para `true`. `GET /orders` só retorna pedidos com `draft: false` e `status: false`, ou seja, pedidos já enviados e ainda não finalizados.

## Arquivos estáticos

Imagens de produto enviadas via `POST /product` ficam acessíveis em:

```
GET /files/<nome-do-arquivo-gerado>
```

Conforme configurado em [src/server.ts](../src/server.ts) (`express.static` apontando para `tmp/`).
