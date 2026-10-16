# IA_LOG - Diário de Prompts

## 1. Ferramentas utilizadas

- Claude (Anthropic), pelo chat do claude.ai: geração do código, estrutura do projeto, README e testes locais.
- NeonDB (PostgreSQL na nuvem), Render (deploy) e GitHub (repositório): configurados por mim seguindo as instruções do README.

## 2. Prompts iniciais

1. Enviei o PDF com as instruções do Trabalho de Recuperação de Desenvolvimento Backend e pedi:
   > "faça pra mim e não precisa por comentários"
2. A partir das especificações do PDF, a IA definiu o tema (Biblioteca: Categorias e Livros) e a arquitetura:
   - Monolito com Node.js + Express e views em EJS.
   - PostgreSQL via biblioteca `pg`, conexão por `DATABASE_URL` (NeonDB) com SSL.
   - Tabelas `categorias` e `livros` (1:N, `livros.categoria_id` referencia `categorias.id` com `ON DELETE RESTRICT`), criadas automaticamente na inicialização.
   - CRUD completo das duas tabelas pela interface web, usando formulários HTML com `POST` (rotas `/editar` e `/excluir`), sem depender de `method-override`.
   - Validação dos campos no servidor e mensagens de erro nas telas.
   - Estrutura de pastas: `server.js`, `db.js`, `routes/`, `views/`, `public/`.

## 3. Resolução de problemas (erros da IA)

### Problema 1: exclusão de categoria com livros retornava erro 500

- **O que aconteceu:** a primeira versão da rota `POST /categorias/:id/excluir` apenas tentava executar o `DELETE` e tratava o erro de chave estrangeira checando `err.code === '23503'`. Ao testar a aplicação localmente, excluir uma categoria que tinha livros gerou erro 500 (página "Erro interno do servidor") em vez da mensagem amigável.
- **Causa:** o teste foi feito com um emulador de PostgreSQL em memória (não havia PostgreSQL instalado no ambiente de testes), e ele não devolve o código `23503` no erro. O código dependia totalmente desse detalhe do driver.
- **Como foi corrigido:** a rota passou a consultar antes quantos livros pertencem à categoria (`SELECT COUNT(*) FROM livros WHERE categoria_id = $1`). Se houver livros, redireciona para `/categorias` com a mensagem "Não é possível excluir: existem livros nessa categoria." O tratamento do código `23503` foi mantido como segunda proteção. Após a correção, o teste passou: a exclusão é bloqueada com mensagem quando há livros e funciona normalmente depois que os livros são removidos.

### Problema 2: listagem de categorias com consulta frágil

- **O que aconteceu:** a listagem de categorias usava um `LEFT JOIN` com `GROUP BY c.id` para contar os livros. No teste, as colunas `nome` e `descricao` vieram vazias na tela. Tentei trocar por uma subconsulta correlacionada, que deu erro de coluna inexistente.
- **Como foi corrigido:** a consulta foi dividida em duas simples: uma busca as categorias e outra conta os livros por `categoria_id` (`GROUP BY categoria_id`); a junção é feita em JavaScript com um `Map`. A listagem passou a mostrar nome, descrição e quantidade de livros corretamente.

### Problema 3: criação de pastas na estrutura do projeto

- **O que aconteceu:** o comando de criação das pastas usou expansão de chaves (`mkdir -p {routes,views/...}`) em um shell que não suporta esse recurso. Foi criada uma pasta literal chamada `{routes,views` e os arquivos de `routes/`, `views/` e `public/` não foram gravados.
- **Como foi corrigido:** a pasta errada foi removida, as pastas foram criadas uma a uma com caminhos explícitos e os arquivos foram gerados novamente.

## 4. Revisão do código final

Antes de entregar, os testes de fluxo (criar, listar, editar e excluir categorias e livros, validações, categoria duplicada, ano inválido, rotas 404) foram executados localmente e passaram.
