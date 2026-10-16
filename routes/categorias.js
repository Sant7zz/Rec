const express = require('express');
const { pool } = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows: categorias } = await pool.query('SELECT id, nome, descricao FROM categorias ORDER BY nome');
    const { rows: contagens } = await pool.query(
      'SELECT categoria_id, COUNT(*)::int AS total FROM livros GROUP BY categoria_id'
    );
    const totais = new Map(contagens.map((c) => [c.categoria_id, c.total]));
    const lista = categorias.map((c) => ({ ...c, total_livros: totais.get(c.id) || 0 }));
    res.render('categorias/index', { categorias: lista, erro: req.query.erro || null });
  } catch (err) {
    next(err);
  }
});

router.get('/nova', (req, res) => {
  res.render('categorias/form', { categoria: {}, erro: null, titulo: 'Nova categoria', action: '/categorias' });
});

router.post('/', async (req, res, next) => {
  const { nome, descricao } = req.body;
  if (!nome || !nome.trim()) {
    return res.status(400).render('categorias/form', {
      categoria: { nome, descricao },
      erro: 'O nome é obrigatório.',
      titulo: 'Nova categoria',
      action: '/categorias',
    });
  }
  try {
    await pool.query('INSERT INTO categorias (nome, descricao) VALUES ($1, $2)', [nome.trim(), descricao || null]);
    res.redirect('/categorias');
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).render('categorias/form', {
        categoria: { nome, descricao },
        erro: 'Já existe uma categoria com esse nome.',
        titulo: 'Nova categoria',
        action: '/categorias',
      });
    }
    next(err);
  }
});

router.get('/:id/editar', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM categorias WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).render('erro', { mensagem: 'Categoria não encontrada.' });
    res.render('categorias/form', {
      categoria: rows[0],
      erro: null,
      titulo: 'Editar categoria',
      action: `/categorias/${rows[0].id}/editar`,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/editar', async (req, res, next) => {
  const { nome, descricao } = req.body;
  const id = req.params.id;
  const renderErro = (erro) =>
    res.status(400).render('categorias/form', {
      categoria: { id, nome, descricao },
      erro,
      titulo: 'Editar categoria',
      action: `/categorias/${id}/editar`,
    });
  if (!nome || !nome.trim()) return renderErro('O nome é obrigatório.');
  try {
    const result = await pool.query('UPDATE categorias SET nome = $1, descricao = $2 WHERE id = $3', [
      nome.trim(),
      descricao || null,
      id,
    ]);
    if (!result.rowCount) return res.status(404).render('erro', { mensagem: 'Categoria não encontrada.' });
    res.redirect('/categorias');
  } catch (err) {
    if (err.code === '23505') return renderErro('Já existe uma categoria com esse nome.');
    next(err);
  }
});

router.post('/:id/excluir', async (req, res, next) => {
  const semExclusao = () =>
    res.redirect('/categorias?erro=' + encodeURIComponent('Não é possível excluir: existem livros nessa categoria.'));
  try {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM livros WHERE categoria_id = $1', [req.params.id]);
    if (rows[0].total > 0) return semExclusao();
    await pool.query('DELETE FROM categorias WHERE id = $1', [req.params.id]);
    res.redirect('/categorias');
  } catch (err) {
    if (err.code === '23503') return semExclusao();
    next(err);
  }
});

module.exports = router;
