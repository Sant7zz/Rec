# IA_LOG - Diário de Prompts

Projeto: Biblioteca (Categorias e Livros) - Node.js + Express + EJS + PostgreSQL (NeonDB) + Render

## 1. Ferramentas utilizadas

| Ferramenta | Uso |
|---|---|
| Claude (Anthropic), pelo chat do claude.ai | Geração do código, estrutura do projeto, README, testes e ajuda para rodar o projeto |
| VS Code | Edição dos arquivos e terminal |
| NeonDB | Banco PostgreSQL na nuvem |
| GitHub | Repositório público do código |
| Render | Deploy da aplicação |

## 2. Prompts iniciais
1. Enviei o PDF com as instruções do Trabalho de Recuperação
2. A IA leu as especificações e definiu o tema e a arquitetura:
   - Monolito com Node.js + Express e views em EJS (frontend e backend no mesmo projeto).
   - PostgreSQL com a biblioteca `pg`, conectando pela variável `DATABASE_URL` (NeonDB) com SSL.
   - Validação dos campos no servidor, com mensagens de erro nas telas.
3. durante a execução:
   - Enviei capturas de tela dos erros do terminal para a IA ajudar a diagnosticar.
## 3. Resolução de problemas (erros da IA)

### Problema 1: excluir categoria com livros gerava erro 500

- **Erro:** na primeira versão, a rota `POST /categorias/:id/excluir` executava o `DELETE` e tratava a violação de chave estrangeira checando `err.code === '23503'`. Nos testes locais, excluir uma categoria que tinha livros mostrou a página "Erro interno do servidor" em vez de uma mensagem amigável.
- **Causa:** o teste foi feito com um emulador de PostgreSQL em memória, que não devolve o código `23503`. O código dependia desse detalhe do driver.
- **Como foi corrigido:** a rota agora consulta antes quantos livros pertencem à categoria (`SELECT COUNT(*) FROM livros WHERE categoria_id = $1`). Se houver livros, redireciona para `/categorias` com a mensagem "Não é possível excluir: existem livros nessa categoria." O tratamento do `23503` ficou como segunda proteção. Depois da correção, o teste passou: a exclusão é bloqueada quando há livros e funciona quando a categoria está vazia.

### Problema 2: listagem de categorias com consulta frágil

- **Erro:** a listagem usava `LEFT JOIN` com `GROUP BY c.id` para contar livros por categoria. No teste, as colunas `nome` e `descricao` apareceram vazias na tela. Ao trocar por uma subconsulta correlacionada, apareceu o erro "column c.id does not exist".
- **Como foi corrigido:** a consulta foi dividida em duas simples. Uma busca as categorias e a outra conta os livros por `categoria_id` (`GROUP BY categoria_id`). A junção dos dois resultados é feita em JavaScript, com um `Map`. A listagem passou a mostrar nome, descrição e quantidade de livros corretamente.

### Problema 3: mensagem de erro vazia ao falhar a conexão com o banco

- **Erro:** quando a conexão falhava, o `server.js` imprimia apenas `err.message`. Na minha máquina isso mostrou só "Falha ao conectar ao banco:" sem nenhum motivo, o que atrapalhou o diagnóstico.
- **Como foi corrigido:** o `catch` passou a imprimir o erro completo (`console.error('Falha ao conectar ao banco:', err)`). Com isso, o terminal passou a mostrar o código do erro (por exemplo `ENOTFOUND`), que indicou o problema real.

### Problema 4: diagnóstico errado da IA sobre o `.env`

- **Erro:** ao rodar o projeto, apareceu `getaddrinfo ENOTFOUND host.neon.tech`. A IA supôs que eu tinha copiado o `.env.example` depois de voltá-lo ao modelo. A causa real era outra: o arquivo `.env` estava aberto no VS Code com a string do Neon, mas **não estava salvo** (bolinha branca na aba), então o Node lia a versão antiga do arquivo.
- **Como foi resolvido:** enviei uma captura de tela do VS Code, a IA percebeu a bolinha de arquivo não salvo, e eu salvei com Ctrl+S. Também removi o parâmetro `&channel_binding=require` da string. Depois disso apareceu "Servidor rodando na porta 3000" e a aplicação conectou ao Neon.

## 4. Segurança

- A string de conexão do banco fica somente no arquivo `.env`, que está no `.gitignore` e não vai para o GitHub.
- O `.env.example` contém apenas um modelo, sem senha real.
- Como a senha apareceu em capturas de tela durante os testes, ela foi resetada no painel do Neon.

## 5. Testes realizados

Criar, listar, editar e excluir categorias e livros; categoria com nome duplicado; nome vazio; ano inválido; bloqueio de exclusão de categoria que tem livros; rotas inexistentes (404). Testado localmente com conexão ao NeonDB e depois na URL pública do Render.

# Log da Aula - Projeto Biblioteca

## Contexto

- **Ferramenta:** Claude (Anthropic), pelo chat do claude.ai.
- **Prompt:** "preciso que me explique de uma forma geral do que fizemos aqui de uma forma bem explicada para caso eu precise estudar novamente"

## 1. Visão geral

A aplicação é um **monolito**: telas e lógica no mesmo projeto. Toda requisição segue o mesmo caminho:

```
Navegador → Rota (Express) → Consulta SQL (PostgreSQL/Neon) → View (EJS) → HTML de volta
```

Exemplo: ao abrir `/livros`, o Express chama a rota, ela busca os livros no banco, entrega os dados para `livros/index.ejs`, e o EJS monta o HTML exibido no navegador.

## 2. Estrutura de pastas

| Item | Função |
|---|---|
| `server.js` | Liga tudo e sobe o servidor |
| `db.js` | Conexão com o banco e criação das tabelas |
| `routes/` | Lógica das rotas: `categorias.js` e `livros.js` |
| `views/` | Telas em EJS |
| `public/` | Arquivos estáticos (`style.css`) |
| `.env` | Segredos, como a `DATABASE_URL` (não vai para o GitHub) |
| `.env.example` | Modelo do `.env` (vai para o GitHub) |
| `package.json` | Dependências e comando de start |
| `README.md` | Instruções de execução |
| `IA_LOG.md` | Diário de prompts exigido pelo professor |

## 3. Dependências e variáveis de ambiente

- **express:** servidor web e rotas.
- **ejs:** transforma templates em HTML.
- **pg:** comunicação com o PostgreSQL.
- **dotenv:** lê o `.env` e disponibiliza os valores em `process.env`.

`npm install` baixa as dependências para `node_modules`; `npm start` executa `node server.js`.

O `.env` guarda a `DATABASE_URL`, que contém a senha do banco, por isso está no `.gitignore`. O código lê com `process.env.DATABASE_URL`, e no Render a mesma variável é cadastrada no painel. O Node só enxerga o que está **salvo** no arquivo (problema real: o `.env` estava aberto no VS Code sem salvar).

## 4. `db.js`: banco de dados

- **Pool:** conjunto de conexões reaproveitadas, mais eficiente do que abrir uma a cada requisição.
- **ssl:** o Neon exige conexão criptografada.
- **init():** executa `CREATE TABLE IF NOT EXISTS`, criando as tabelas apenas se ainda não existirem. Por isso não é necessário enviar as tabelas manualmente ao Neon.

Tabelas:

```
categorias (id, nome UNIQUE, descricao)
livros (id, titulo, autor, ano, categoria_id → categorias.id)
```

**Relacionamento 1:N:** uma categoria tem vários livros; cada livro pertence a uma categoria. O vínculo é a **chave estrangeira** `categoria_id`. O `ON DELETE RESTRICT` faz o banco recusar a exclusão de uma categoria que ainda tenha livros.

## 5. `server.js`: ponto de entrada

1. `app.set('view engine', 'ejs')`: define EJS como motor das telas.
2. `express.urlencoded(...)`: permite ler os dados dos formulários em `req.body`.
3. `express.static('public')`: serve o CSS.
4. `app.use('/livros', ...)` e `app.use('/categorias', ...)`: conectam os arquivos de rotas.
5. Handler de **404** para páginas inexistentes e handler de **erro 500** para falhas inesperadas.
6. `init().then(() => app.listen(...))`: só sobe o servidor depois que o banco conectou e as tabelas existem; se falhar, mostra o erro e encerra o processo.

## 6. Rotas e CRUD

Cada tabela tem as mesmas seis rotas:

| Ação | Método | Rota |
|---|---|---|
| Listar (Read) | GET | `/livros` |
| Formulário de cadastro | GET | `/livros/novo` |
| Criar (Create) | POST | `/livros` |
| Formulário de edição | GET | `/livros/:id/editar` |
| Atualizar (Update) | POST | `/livros/:id/editar` |
| Excluir (Delete) | POST | `/livros/:id/excluir` |

Conceitos explicados:

- **POST para editar e excluir:** formulários HTML só enviam GET ou POST, por isso foram usadas rotas com `/editar` e `/excluir` em vez de PUT/DELETE, sem precisar de bibliotecas extras.
- **Consultas parametrizadas:** `pool.query('... WHERE id = $1', [id])`. Os valores vão separados do SQL, o que impede **SQL Injection**.
- **Validação:** o servidor confere os campos; se houver erro, mostra o formulário de novo com a mensagem, os dados preenchidos e status 400.
- **Redirect depois do POST:** `res.redirect('/livros')` evita que o F5 reenvie o formulário e duplique o cadastro.
- **async/await e `next(err)`:** as consultas são assíncronas, e qualquer erro vai para o handler de erro do `server.js`.
- **Categoria duplicada:** o banco devolve o código `23505` (violação de UNIQUE), e a tela mostra "Já existe uma categoria com esse nome."
- **Excluir categoria:** antes do DELETE, o código conta os livros da categoria; se houver algum, redireciona com a mensagem de bloqueio.
- **Listagem de livros:** usa `JOIN` para trazer o nome da categoria junto com cada livro.

## 7. Views (EJS)

- `<%= valor %>` imprime o valor **escapado**, protegendo contra XSS (um `<script>` cadastrado aparece como texto).
- `<% if (...) { %>` e `forEach` fazem a lógica e a repetição.
- `<%- include('../partials/header') %>` reaproveita cabeçalho e rodapé em todas as páginas.
- Cada tabela tem `index.ejs` (listagem) e `form.ejs`. O mesmo formulário serve para criar e editar: a rota envia `action` e `titulo` diferentes, e os campos vêm vazios ou preenchidos.

## 8. Deploy

- **GitHub:** guarda o código; o repositório precisa ser público e conter README e IA_LOG.
- **Neon:** banco na nuvem; a string de conexão vai no `.env` (local) e nas variáveis de ambiente do Render.
- **Render:** baixa o código do GitHub, executa o **Build Command** (`npm install`) para instalar as dependências e depois o **Start Command** (`npm start`). O erro `MODULE_NOT_FOUND` aparece quando o build não instala as dependências.

## 9. Erros da IA registrados no projeto

1. Exclusão de categoria com livros dava erro 500; a correção foi contar os livros antes de excluir.
2. Listagem de categorias vinha com colunas vazias; a consulta foi simplificada em duas partes.
3. Mensagem de falha na conexão vinha vazia; passou a imprimir o erro completo.
4. Diagnóstico errado da IA sobre o `.env`; a causa real era o arquivo não salvo.

## 10. Perguntas para revisão

| Pergunta | Resposta |
|---|---|
| Por que usar `$1` nas consultas? | Para evitar SQL Injection. |
| O que é a chave estrangeira? | É o `categoria_id`, que liga cada livro à sua categoria. |
| Por que o `.env` não vai para o GitHub? | Porque contém a senha do banco. |
| O que o `RESTRICT` faz? | O banco impede apagar uma categoria que tem livros. |
| Por que redirecionar depois do POST? | Para o F5 não reenviar o formulário. |
| Como o Render sabe onde está o banco? | Pela variável `DATABASE_URL` cadastrada no painel. |
| Por que usar POST em `/editar` e `/excluir`? | Porque formulários HTML só enviam GET ou POST. |
| O que `<%= %>` faz diferente de `<%- %>`? | O primeiro escapa o conteúdo (protege contra XSS); o segundo insere HTML sem escapar, usado apenas para os includes. |
