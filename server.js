require('dotenv').config();
const path = require('path');
const express = require('express');
const { init } = require('./db');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.redirect('/livros'));
app.use('/categorias', require('./routes/categorias'));
app.use('/livros', require('./routes/livros'));

app.use((req, res) => {
  res.status(404).render('erro', { mensagem: 'Página não encontrada.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('erro', { mensagem: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3000;

init()
  .then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((err) => {
    console.error('Falha ao conectar ao banco:', err.message);
    process.exit(1);
  });
