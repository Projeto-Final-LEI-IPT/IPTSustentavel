// routes/notificacoes.js
// Ficheiro que define as rotas relacionadas com notificações
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const db = require('../models');
const { Op } = require('sequelize');

// GET todas as notificações para o utilizador autenticado
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Obter todas as notificações diretamente
    const notificacoes = await db.Notificacao.findAll({
      order: [['data', 'DESC']],
      include: [
        {
          model: db.Utilizador,
          as: 'remetente',
          attributes: ['id', 'nome', 'email']
        }
      ]
    });

    // Obter os registos de leitura do utilizador atual
    const leituras = await db.NotificacaoLida.findAll({
      where: { utilizador_id: userId },
      attributes: ['notificacao_id', 'lida', 'data_leitura']
    });

    // Mapa para lookup rápido
    const leiturasMap = {};
    leituras.forEach(leitura => {
      leiturasMap[leitura.notificacao_id] = {
        lida: leitura.lida,
        data_leitura: leitura.data_leitura
      };
    });

    // Formatar a resposta
    const formattedNotificacoes = notificacoes.map(notif => {
      const notifJson = notif.toJSON();
      const leituraInfo = leiturasMap[notifJson.id] || { lida: false, data_leitura: null };

      return {
        id: notifJson.id,
        titulo: notifJson.titulo,
        conteudo: notifJson.conteudo,
        data: notifJson.data,
        remetente: notifJson.remetente,
        lida: leituraInfo.lida,
        data_leitura: leituraInfo.data_leitura
      };
    });

    res.json(formattedNotificacoes);
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).send({
      message: error.message || "Ocorreu um erro ao obter as notificações"
    });
  }
});

// GET contagem de notificações não lidas
router.get('/nao-lidas/contagem', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // Query SQL para contar notificações não lidas
    const count = await db.sequelize.query(`
       SELECT COUNT(n.id) as count
      FROM notificacao n
      LEFT JOIN notificacao_lida nl 
        ON n.id = nl.notificacao_id
        AND nl.utilizador_id = :userId
        AND nl.lida = true
      WHERE nl.notificacao_id IS NULL;
    `, {
      replacements: { userId },
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json({ count: count[0].count });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erro ao obter contagem de notificações não lidas"
    });
  }
});

// PUT marcar notificação como lida
router.put('/:id/marcar-lida', authenticateToken, async (req, res) => {
  try {
    const notificacaoId = req.params.id;
    const userId = req.user.id;
    console.log(`Marcando notificação ${notificacaoId} como lida para utilizador ${userId}`);

    // Procurar ou criar o registo de leitura
    const [notificacaoLida, created] = await db.NotificacaoLida.findOrCreate({
      where: {
        notificacao_id: notificacaoId,
        utilizador_id: userId
      },
      defaults: {
        lida: true,
        data_leitura: new Date()
      }
    });

    // Se já existir mas não estiver lida, marcar como lida
    if (!created && !notificacaoLida.lida) {
      await notificacaoLida.update({
        lida: true,
        data_leitura: new Date()
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erro ao marcar notificação como lida"
    });
  }
});

// POST criar nova notificação (apenas admin)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { titulo, conteudo } = req.body;

    if (!titulo || !conteudo) {
      return res.status(400).send({
        message: "Título e conteúdo são obrigatórios"
      });
    }

    const notificacao = await db.Notificacao.create({
      titulo,
      conteudo,
      enviado_por: req.user.id,
      data: new Date()
    });

    res.status(201).json(notificacao);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erro ao criar nova notificação"
    });
  }
});

// DELETE remover notificação (apenas admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notificacaoId = req.params.id;

    // Primeiro apagar todos os registos de leitura
    await db.NotificacaoLida.destroy({
      where: { notificacao_id: notificacaoId }
    });

    // Depois apagar a notificação
    const deleted = await db.Notificacao.destroy({
      where: { id: notificacaoId }
    });

    if (deleted) {
      res.json({ message: "Notificação removida com sucesso" });
    } else {
      res.status(404).send({ message: "Notificação não encontrada" });
    }
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erro ao remover notificação"
    });
  }
});

module.exports = router;
