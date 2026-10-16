const express = require('express');
const { pool } = require('../db');

const router = express.Router();

async function listarCategorias() {
  const { rows } = await pool.query('SELECT id, nome FROM categorias ORDER BY nome');
  return rows;
}

function validar({ titulo, autor, ano, categoria_id }) {
  if (!titulo || !titulo.trim()) return 'O título é obrigatório.';
  if (!autor || !autor.trim()) return 'O autor é obrigatório.';
  if (!categoria_id) return 'Selecione uma categoria.';
  if (ano && (!/^\d{1,4}$/.test(ano) || Number(ano) < 1 || Number(ano) > new Date().getFullYear() + 1)) {
    return 'Ano inválido.';
  }
  return null;
}

async function renderForm(res, { status = 200, livro, erro, titulo, action }) {
  const categorias = await listarCategorias();
  res.status(status).render('livros/form', { livro, categorias, erro, titulo, action });
}

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT l.id, l.titulo, l.autor, l.ano, c.nome AS categoria
      FROM livros l
      JOIN categorias c ON c.id = l.categoria_id
      ORDER BY l.titulo
    `);
    res.render('livros/index', { livros: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/novo', async (req, res, next) => {
  try {
    await renderForm(res, { livro: {}, erro: null, titulo: 'Novo livro', action: '/livros' });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  const { titulo, autor, ano, categoria_id } = req.body;
  try {
    const erro = validar(req.body);
    if (erro) {
      return await renderForm(res, {
        status: 400,
        livro: { titulo, autor, ano, categoria_id },
        erro,
        titulo: 'Novo livro',
        action: '/livros',
      });
    }
    await pool.query('INSERT INTO livros (titulo, autor, ano, categoria_id) VALUES ($1, $2, $3, $4)', [
      titulo.trim(),
      autor.trim(),
      ano ? Number(ano) : null,
      categoria_id,
    ]);
    res.redirect('/livros');
  } catch (err) {
    next(err);
  }
});

router.get('/:id/editar', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM livros WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).render('erro', { mensagem: 'Livro não encontrado.' });
    await renderForm(res, {
      livro: rows[0],
      erro: null,
      titulo: 'Editar livro',
      action: `/livros/${rows[0].id}/editar`,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/editar', async (req, res, next) => {
  const { titulo, autor, ano, categoria_id } = req.body;
  const id = req.params.id;
  try {
    const erro = validar(req.body);
    if (erro) {
      return await renderForm(res, {
        status: 400,
        livro: { id, titulo, autor, ano, categoria_id },
        erro,
        titulo: 'Editar livro',
        action: `/livros/${id}/editar`,
      });
    }
    const result = await pool.query(
      'UPDATE livros SET titulo = $1, autor = $2, ano = $3, categoria_id = $4 WHERE id = $5',
      [titulo.trim(), autor.trim(), ano ? Number(ano) : null, categoria_id, id]
    );
    if (!result.rowCount) return res.status(404).render('erro', { mensagem: 'Livro não encontrado.' });
    res.redirect('/livros');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/excluir', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM livros WHERE id = $1', [req.params.id]);
    res.redirect('/livros');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
