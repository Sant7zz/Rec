# Biblioteca

Aplicação web monolítica de gestão de biblioteca, com CRUD completo de **Categorias** e **Livros** (relacionamento 1:N: uma categoria possui vários livros; cada livro pertence a uma categoria).

## Tecnologias

- Node.js + Express
- EJS (renderização das views)
- PostgreSQL hospedado no NeonDB
- Deploy no Render

## Estrutura do banco

- `categorias` (id, nome, descricao)
- `livros` (id, titulo, autor, ano, categoria_id → categorias.id)

As tabelas são criadas automaticamente ao iniciar a aplicação.

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão do NeonDB (PostgreSQL) |
| `PORT` | Porta do servidor (opcional, padrão 3000) |

## Executar localmente

```bash
git clone <URL_DO_REPOSITORIO>
cd biblioteca
npm install
cp .env.example .env
npm start
```

Edite o `.env` com a string de conexão do seu banco no NeonDB e acesse `http://localhost:3000`.

## Deploy no Render

1. Crie um Web Service no Render apontando para o repositório do GitHub.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Adicione a variável de ambiente `DATABASE_URL` com a string de conexão do NeonDB.

## Rotas

| Método | Rota | Ação |
|---|---|---|
| GET | `/livros` | Listar livros |
| GET | `/livros/novo` | Formulário de cadastro |
| POST | `/livros` | Criar livro |
| GET | `/livros/:id/editar` | Formulário de edição |
| POST | `/livros/:id/editar` | Atualizar livro |
| POST | `/livros/:id/excluir` | Excluir livro |
| GET | `/categorias` | Listar categorias |
| GET | `/categorias/nova` | Formulário de cadastro |
| POST | `/categorias` | Criar categoria |
| GET | `/categorias/:id/editar` | Formulário de edição |
| POST | `/categorias/:id/editar` | Atualizar categoria |
| POST | `/categorias/:id/excluir` | Excluir categoria (bloqueado se houver livros) |
