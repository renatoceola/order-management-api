# API de Gerenciamento de Pedidos

API REST em JavaScript para criar, consultar, listar, atualizar e excluir pedidos. O projeto usa PostgreSQL, autenticação JWT, documentação OpenAPI e testes automatizados.

## Requisitos

- Node.js 24 ou superior
- PostgreSQL 17 ou compatível
- Um banco vazio chamado `order_management`

## Configuração local

1. Instale as dependências:

   ```bash
   npm ci
   ```

2. Crie o banco:

   ```sql
   CREATE DATABASE order_management;
   ```

3. Copie `.env.example` para `.env` e substitua todos os valores de exemplo. Use um segredo JWT aleatório com pelo menos 32 caracteres e uma senha de administrador com pelo menos 12 caracteres.

4. Aplique a estrutura e crie o usuário inicial:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Inicie a API:

   ```bash
   npm run dev
   ```

A API estará em `http://localhost:3000`. O Swagger ficará em `http://localhost:3000/docs`.

## Uso

Primeiro, obtenha um token:

```bash
curl --request POST http://localhost:3000/auth/login \
  --header "Content-Type: application/json" \
  --data '{"usuario":"admin","senha":"sua-senha-local"}'
```

Depois, envie o token nos endpoints de pedidos:

```bash
curl --request POST http://localhost:3000/order \
  --header "Authorization: Bearer SEU_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "numeroPedido": "v10089015vdb-01",
    "valorTotal": 10000,
    "dataCriacao": "2023-07-19T12:24:11.5299601+00:00",
    "items": [
      {"idItem": "2434", "quantidadeItem": 1, "valorItem": 1000}
    ]
  }'
```

O retorno usa o modelo persistido:

```json
{
  "orderId": "v10089015vdb-01",
  "value": 10000,
  "creationDate": "2023-07-19T12:24:11.529Z",
  "items": [{ "productId": 2434, "quantity": 1, "price": 1000 }]
}
```

O identificador recebido é preservado. A API não recalcula `valorTotal`, pois o exemplo do teste apresenta um total diferente da soma dos itens.

## Endpoints

| Método | Rota              | Autenticação | Resultado                 |
| ------ | ----------------- | ------------ | ------------------------- |
| POST   | `/auth/login`     | Não          | Cria um token JWT         |
| GET    | `/health`         | Não          | Verifica API e PostgreSQL |
| POST   | `/order`          | JWT          | Cria um pedido            |
| GET    | `/order/list`     | JWT          | Lista os pedidos          |
| GET    | `/order/:orderId` | JWT          | Consulta um pedido        |
| PUT    | `/order/:orderId` | JWT          | Substitui um pedido       |
| DELETE | `/order/:orderId` | JWT          | Exclui um pedido          |
| GET    | `/docs`           | Não          | Abre o Swagger UI         |

No `PUT`, `numeroPedido` no corpo deve ser igual a `orderId` da URL.

## Qualidade

```bash
npm run lint
npm run format:check
npm run openapi:validate
npm run test:unit
npm run test:integration
npm run test:coverage
```

Os testes de integração usam o endereço definido em `DATABASE_URL`. Use um banco exclusivo para testes, pois as tabelas são limpas entre os casos.

## Documentação adicional

- [Decisões de design](docs/DECISOES_DE_DESIGN.md)
- [OpenAPI](docs/openapi.yaml)
- [Coleção Postman](docs/postman/order-management-api.postman_collection.json)

A coleção Postman armazena automaticamente o token recebido no login. Preencha as variáveis `usuario` e `senha` antes de executá-la.
