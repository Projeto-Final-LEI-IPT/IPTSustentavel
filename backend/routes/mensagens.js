// Importação das dependências necessárias
// routes/mensagens.js
// Importa o framework Express
const express = require('express');
// Cria um router Express
const router = express.Router();
// Importa o middleware de autenticação
const authenticateToken = require('../middleware/auth');
// Importa os modelos da base de dados
const db = require('../models');
const { Op } = require('sequelize');

// GET todas as mensagens
// Rota para obter todas as mensagens (requer autenticação)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; 
    // Procura todas as mensagens incluindo dados do remetente e destinatário
    const mensagens = await db.Mensagem.findAll({
     where: {
        [db.Sequelize.Op.or]: [
          { remetente_id: userId },
          { destinatario_id: userId }
        ]
      },      
      include: [
        {
          model: db.Utilizador, // Inclui dados do remetente
          as: 'remetente', // Alias para a relação remetente
          attributes: ['id', 'nome', 'email'] // Campos a incluir do remetente
        },
        {
          model: db.Utilizador, // Inclui dados do destinatário
          as: 'destinatario', // Alias para a relação destinatário
          attributes: ['id', 'nome', 'email'] // Campos a incluir do destinatário
        }
      ],
      order: [['data', 'DESC']] // Ordena por data decrescente (mais recentes primeiro)
    });
    res.json(mensagens);
  } catch (error) {
    res.status(500).send({  // Em caso de erro, retorna status 500
      message: error.message || "Ocorreu um erro ao obter as mensagens"
    });
  }
});

// GET mensagem por ID
// Rota para obter uma mensagem específica por ID (requer autenticação)
router.get('/:id', authenticateToken, async (req, res) => {
  const id = req.params.id;  // Obtém o ID dos parâmetros da rota
  try {
    // Procura a mensagem pelo ID, incluindo dados do remetente e destinatário
    const mensagem = await db.Mensagem.findByPk(id, {
      include: [
        {
          model: db.Utilizador,
          as: 'remetente',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: db.Utilizador,
          as: 'destinatario',
          attributes: ['id', 'nome', 'email']
        }
      ]
    });
    // Verifica se a mensagem foi encontrada
    if (mensagem) {
      res.json(mensagem); // Retorna a mensagem encontrada
    } else {
      res.status(404).send({ // Se não encontrada, retorna 404
        message: `Não foi possível encontrar a mensagem com id=${id}`
      });
    }
  } catch (error) {
    res.status(500).send({
      message: `Erro ao obter mensagem com id=${id}`
    });
  }
});

// POST criar nova mensagem
// Rota para criar uma nova mensagem (requer autenticação)
router.post('/', authenticateToken, async (req, res) => {
  const { conteudo, lida, remetente_id, destinatario_id } = req.body;

  if (!conteudo || !remetente_id || !destinatario_id) {
    return res.status(400).send({
      message: "Campos obrigatórios: conteudo, remetente_id, destinatario_id"
    });
  }

  try {
    // Cria uma nova mensagem na base de dados
    const novaMensagem = await db.Mensagem.create({
      conteudo,
      lida, // Estado de leitura da mensagem
      remetente_id, // ID do utilizador que envia
      destinatario_id, // ID do utilizador que recebe
      data: new Date() // Data atual de envio
    });
    // Obtém a mensagem criada com dados completos dos utilizadores
    const mensagemCompleta = await db.Mensagem.findByPk(novaMensagem.id, {
      include: [
        { model: db.Utilizador, as: 'remetente' },
        { model: db.Utilizador, as: 'destinatario' }
      ]
    });

    res.status(201).json(mensagemCompleta); // Retorna a mensagem criada com status 201
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erro ao criar nova mensagem"
    });
  }
});

// PUT atualizar mensagem
// Rota para atualizar uma mensagem existente (requer autenticação)
router.put('/:id', authenticateToken, async (req, res) => {
  const id = req.params.id;
  try {
    // Atualiza a mensagem e obtém o número de linhas afetadas
    const [numLinhasAfetadas] = await db.Mensagem.update(req.body, {
      where: { id: id }
    });
    // Verifica se a atualização foi bem-sucedida
    if (numLinhasAfetadas === 1) {
      res.send({ message: "Mensagem atualizada com sucesso" });
    } else {
      res.status(404).send({
        message: `Não foi possível atualizar a mensagem com id=${id}`
      });
    }
  } catch (error) {
    res.status(500).send({
      message: `Erro ao atualizar mensagem com id=${id}`
    });
  }
});

// DELETE apagar mensagem
// Rota para apagar uma mensagem (requer autenticação)
router.delete('/:id', authenticateToken, async (req, res) => {
  const id = req.params.id; // Obtém o ID dos parâmetros da rota
  try {
    // Apaga a mensagem e obtém o número de linhas afetadas
    const numLinhasAfetadas = await db.Mensagem.destroy({
      where: { id: id }
    });
    // Verifica se a eliminação foi bem-sucedida
    if (numLinhasAfetadas === 1) {
      res.send({ message: "Mensagem apagada com sucesso" });
    } else {
      res.status(404).send({
        message: `Não foi possível apagar a mensagem com id=${id}`
      });
    }
  } catch (error) {
    res.status(500).send({
      message: `Não foi possível apagar a mensagem com id=${id}`
    });
  }
});
// GET contagem de mensagens não lidas
router.get('/nao-lidas/contagem', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // Conta mensagens onde o utilizador é destinatário e a mensagem não foi lida
    const count = await db.Mensagem.count({
      where: {
        destinatario_id: userId,
        lida: false
      }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erro ao obter contagem de mensagens não lidas"
    });
  }
});

// PUT marcar mensagens como lidas
router.put('/marcar-lidas/:conversaComId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversaComId = req.params.conversaComId;
    
    // Atualiza todas as mensagens não lidas dessa conversa
    const [numLinhasAfetadas] = await db.Mensagem.update(
      { lida: true },
      {
        where: {
          destinatario_id: userId,
          remetente_id: conversaComId,
          lida: false
        }
      }
    );
    
    res.json({ atualizadas: numLinhasAfetadas });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erro ao marcar mensagens como lidas"
    });
  }
});

// Exporta o router para uso em outros ficheiros
module.exports = router;
