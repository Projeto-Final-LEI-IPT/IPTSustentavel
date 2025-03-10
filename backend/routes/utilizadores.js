// routes/utilizadores.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const db = require('../models');

// GET todos os utilizadores
// Rota para obter todos os utilizadores (requer autenticação)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Procura todos os utilizadores incluindo o tipo de utilizador associado
    const utilizadores = await db.Utilizador.findAll({
      include: [{
        model: db.TipoUtilizador,  // Inclui o modelo TipoUtilizador
        as: 'tipo_utilizador'  // Alias para a relação
      }]
    });
    res.json(utilizadores);  // Retorna os utilizadores em formato JSON
  } catch (error) {
    res.status(500).send({
      message: error.message || "Ocorreu um erro ao obter os utilizadores"
    });
  }
});

// GET utilizador por ID
// Rota para obter um utilizador específico por ID (requer autenticação)
router.get('/:id', authenticateToken, async (req, res) => {
  const id = req.params.id;  // Obtém o ID dos parâmetros da rota
  try {
    // Procura o utilizador pelo ID, incluindo o tipo de utilizador
    const utilizador = await db.Utilizador.findByPk(id, {
      include: [{
        model: db.TipoUtilizador,
        as: 'tipo_utilizador'
      }]
    });
    // Verifica se o utilizador foi encontrado
    if (utilizador) {
      res.json(utilizador);  // Retorna o utilizador encontrado
    } else {
      res.status(404).send({
        message: `Não foi possível encontrar o utilizador com id=${id}`
      });
    }
  } catch (error) {
    res.status(500).send({
      message: `Erro ao obter utilizador com id=${id}`
    });
  }
});

// POST criar novo utilizador
// Rota para criar um novo utilizador (não requer autenticação - registo público)
router.post('/', async (req, res) => {
  // Extrai os dados do corpo do pedido
  const { email, nome, imagem, categoria, data_registo, password, tipo_utilizador_id } = req.body;
  // Verifica se todos os campos obrigatórios estão presentes
  if (!email || !nome || !data_registo || !password) {
    return res.status(400).send({
      message: "Campos obrigatórios: email, nome, data_registo, password"
    });
  }

  try {
    // Cria um novo utilizador na base de dados
    const novoUtilizador = await db.Utilizador.create({
      email,
      nome,
      imagem,
      categoria,
      data_registo,
      password,
      tipo_utilizador_id
    });
    // Retorna o utilizador criado com status 201
    res.status(201).json(novoUtilizador);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erro ao criar novo utilizador"
    });
  }
});

// PUT atualizar utilizador
// Rota para atualizar um utilizador existente (requer autenticação)
router.put('/:id', authenticateToken, async (req, res) => {
  const id = req.params.id;
  try {
    // Atualiza o utilizador e obtém o número de linhas afetadas
    const [numLinhasAfetadas] = await db.Utilizador.update(req.body, {
      where: { id: id }
    });
    // Verifica se a atualização foi bem-sucedida
    if (numLinhasAfetadas === 1) {
      res.send({ message: "Utilizador atualizado com sucesso" });
    } else {
      res.status(404).send({
        message: `Não foi possível atualizar o utilizador com id=${id}`
      });
    }
  } catch (error) {
    res.status(500).send({
      message: `Erro ao atualizar utilizador com id=${id}`
    });
  }
});

// DELETE apagar utilizador
// Rota para apagar um utilizador (requer autenticação)
router.delete('/:id', authenticateToken, async (req, res) => {
  const id = req.params.id;
  try {
    // Apaga o utilizador e obtém o número de linhas afetadas
    const numLinhasAfetadas = await db.Utilizador.destroy({
      where: { id: id }
    });
    // Verifica se a eliminação foi bem-sucedida
    if (numLinhasAfetadas === 1) {
      res.send({ message: "Utilizador apagado com sucesso" });
    } else {
      res.status(404).send({
        message: `Não foi possível apagar o utilizador com id=${id}`
      });
    }
  } catch (error) {
    res.status(500).send({
      message: `Não foi possível apagar o utilizador com id=${id}`
    });
  }
});

module.exports = router;