# Decisões de design da API de pedidos

## Arquitetura

O projeto separa transporte HTTP, regras de negócio, persistência, validação e mapeamento. As rotas definem o contrato HTTP, os controladores convertem a chamada em uma operação, os serviços aplicam regras e os repositórios concentram o SQL. Essa divisão permite testar o mapeamento e as regras sem iniciar o servidor.

Foi usado `node-postgres` sem ORM. O desafio avalia SQL e transformação de dados, então consultas explícitas deixam as transações, parâmetros e restrições visíveis.

## Modelo de dados

A tabela principal se chama `orders`, e não `Order`. `ORDER` é uma palavra da linguagem SQL; um nome plural e em minúsculas evita identificadores entre aspas e diferenças entre ferramentas.

`items.order_id` referencia `orders.order_id` com `ON DELETE CASCADE`. Criar e atualizar um pedido ocorre em uma transação. Assim, um erro em qualquer item desfaz toda a operação.

Valores monetários usam `NUMERIC(14,2)`, não ponto flutuante. Quantidade e identificador de produto usam inteiros positivos. Um produto aparece no máximo uma vez em cada pedido.

## Mapeamento

| Entrada          | Persistência e saída | Regra                                     |
| ---------------- | -------------------- | ----------------------------------------- |
| `numeroPedido`   | `orderId`            | Preserva o texto recebido                 |
| `valorTotal`     | `value`              | Aceita zero ou valor positivo             |
| `dataCriacao`    | `creationDate`       | Converte ISO 8601 para UTC                |
| `idItem`         | `productId`          | Converte uma string de dígitos em inteiro |
| `quantidadeItem` | `quantity`           | Exige inteiro positivo                    |
| `valorItem`      | `price`              | Aceita zero ou valor positivo             |

O documento mostra `v10089015vdb-01` na entrada e `v10089016vdb` na saída, mas não define uma regra para essa alteração. A API preserva o identificador recebido para evitar corrupção silenciosa.

O total também não é comparado com a soma dos itens. O exemplo informa `valorTotal` igual a 10000 e apenas um item de 1000. Rejeitar esse exemplo contrariaria o próprio contrato fornecido.

## API e erros

`PUT` faz substituição completa do pedido. O identificador não pode ser trocado: o valor no corpo deve coincidir com a URL. Os itens antigos são removidos e recriados na mesma transação.

As respostas de erro possuem código estável, mensagem em português e `requestId`. Detalhes de validação são enviados quando ajudam o cliente. Erros inesperados não expõem pilha, SQL ou credenciais.

## Segurança

Todos os endpoints de pedidos exigem JWT assinado com HS256. O login, a verificação de saúde e o Swagger são públicos. A senha fica apenas como hash bcrypt no PostgreSQL, e o login possui limite de tentativas.

O segredo JWT, a senha inicial e a conexão do banco vêm do ambiente. O repositório contém somente nomes e exemplos. Helmet configura cabeçalhos de segurança, o corpo JSON tem limite de 100 KB e todas as consultas usam parâmetros.

## Operação e limites

O endpoint de lista devolve todos os pedidos, conforme o requisito. Em um sistema de alto volume, ele deveria receber paginação e filtros.

O processo expõe uma verificação de saúde que consulta o banco. Logs estruturados omitem o cabeçalho de autorização e usam o mesmo identificador devolvido ao cliente.

O projeto não inclui renovação de token, recuperação de senha, perfis de autorização ou auditoria de alterações. Esses recursos seriam necessários em um produto real com múltiplos usuários, mas não fazem parte do desafio.
