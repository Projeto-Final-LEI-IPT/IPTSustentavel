// routes/categorias.js
// Importação das dependências necessárias
// Importa o framework Express
const express = require('express');
// Cria um router Express
const router = express.Router();
// Importa o middleware de autenticação
const authenticateToken = require('../middleware/auth');
// Importa os modelos da base de dados
const db = require('../models');

// GET todas as categorias com artigos relacionados
// Rota para obter todas as categorias (requer autenticação)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Procura todas as categorias na base de dados
    const categorias = await db.Categoria.findAll({
      include: [{
        model: db.Artigo,
        as: 'artigos',
        attributes: ['id', 'titulo', 'estado']
      }],
      order: [['nome', 'ASC']]
    });
    // Retorna as categorias em formato JSON
    res.json(categorias);
  } catch (error) {
    // Em caso de erro, retorna status 500
    res.status(500).send({
      message: error.message || "Ocorreu um erro ao obter as categorias"
    });
  }
});

// GET categoria por ID com artigos
// Rota para obter uma categoria específica por ID (requer autenticação)
router.get('/:id', authenticateToken, async (req, res) => {
  // Obtém o ID dos parâmetros da rota
  const id = req.params.id;
  try {
    // Procura a categoria pelo ID
    const categoria = await db.Categoria.findByPk(id, {
      include: [{
        model: db.Artigo,
        as: 'artigos',
        attributes: ['id', 'titulo', 'estado', 'data_publicacao']
      }]
    });
    // Verifica se a categoria foi encontrada
    if (categoria) {
      res.json(categoria); // Retorna a categoria encontrada
    } else {
      res.status(404).send({ // Se não encontrada, retorna 404
        message: `Não foi possível encontrar a categoria com id=${id}`
      });
    }
  } catch (error) {
    res.status(500).send({
      message: `Erro ao obter categoria com id=${id}`
    });
  }
});

// POST criar nova categoria
// Rota para criar uma nova categoria (requer autenticação)
router.post('/', authenticateToken, async (req, res) => {
  // Extrai nome e descrição do corpo do pedido
  const { nome, descricao } = req.body;
  // Verifica se o campo obrigatório 'nome' está presente
  if (!nome) {
    return res.status(400).send({
      message: "Campo obrigatório: nome"
    });
  }

  try {
    // Cria uma nova categoria na base de dados
    const novaCategoria = await db.Categoria.create({
      nome,
      descricao: descricao || null  // Se não fornecida, descrição é null
    });
    res.status(201).json(novaCategoria);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erro ao criar nova categoria"
    });
  }
});

// PUT atualizar categoria
// Rota para atualizar uma categoria existente (requer autenticação)
router.put('/:id', authenticateToken, async (req, res) => {
  const id = req.params.id;
  try {
    // Atualiza a categoria e obtém o número de linhas afetadas
    const [numLinhasAfetadas] = await db.Categoria.update(req.body, {
      where: { id: id }
    });
    // Verifica se a atualização foi bem-sucedida
    if (numLinhasAfetadas === 1) {
      res.send({ message: "Categoria atualizada com sucesso" });
    } else {
      res.status(404).send({
        message: `Não foi possível atualizar a categoria com id=${id}`  // Se não encontrada, retorna 404
      });
    }
  } catch (error) {
    res.status(500).send({
      message: `Erro ao atualizar categoria com id=${id}`
    });
  }
});

// DELETE apagar categoria
// Rota para apagar uma categoria (requer autenticação)
router.delete('/:id', authenticateToken, async (req, res) => {
  const id = req.params.id;
  try {
    // Apaga a categoria e obtém o número de linhas afetadas
    const numLinhasAfetadas = await db.Categoria.destroy({
      where: { id: id }
    });
    // Verifica se a eliminação foi bem-sucedida
    if (numLinhasAfetadas === 1) {
      res.send({ message: "Categoria apagada com sucesso" });
    } else {
      res.status(404).send({
        message: `Não foi possível apagar a categoria com id=${id}`
      });
    }
  } catch (error) {
    res.status(500).send({
      message: `Não foi possível apagar a categoria com id=${id}`
    });
  }
});
// Exporta o router para uso em outros ficheiros
module.exports = router;