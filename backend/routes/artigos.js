// routes/artigo.js
// Importação das dependências necessárias
// Importa o framework Express
const express = require('express');
// Cria um router Express
const router = express.Router();
// Importa o middleware de autenticação
const authenticateToken = require('../middleware/auth');
// Importa os modelos da base de dado
const db = require('../models');

// GET todos os artigos (público)
// Rota para obter todos os artigos (requer autenticação)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const artigos = await db.Artigo.findAll({
      include: [

        {
          model: db.Utilizador,
          as: 'utilizador',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: db.Categoria,
          as: 'categoria',
          attributes: ['id', 'nome']
        },

        {
          model: db.ArtigoFotos,
          as: 'fotos',
          attributes: ['id', 'caminho_foto']
        }
      ],
      order: [['data_publicacao', 'DESC']]
    });
    res.json(artigos);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erro ao obter artigos"
    });
  }
});

// GET artigo por ID (público)
// Rota para obter um artigo específico por ID (requer autenticação)
router.get('/:id', authenticateToken, async (req, res) => {
  // Obtém o ID dos parâmetros da rota
  const id = req.params.id;
  try {
    const artigo = await db.Artigo.findByPk(id, {
      include: [
        {
          model: db.Utilizador,
          as: 'utilizador',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: db.Categoria,
          as: 'categoria',
          attributes: ['id', 'nome']
        }
        ,
        {
          model: db.ArtigoFotos,
          as: 'fotos',
          attributes: ['id', 'caminho_foto']
        }
      ]
    });

    if (artigo) {
      res.json(artigo);
    } else {
      res.status(404).send({
        message: `Artigo com id=${id} não encontrado`
      });
    }
  } catch (error) {
    res.status(500).send({
      message: `Erro ao obter artigo com id=${id}`
    });
  }
});

// POST criar novo artigo (protegido)
// Rota para criar um novo artigo (requer autenticação)
router.post('/', authenticateToken, async (req, res) => {
  const {
    titulo,
    descricao,
    estado,
    categoria_id,
    disponivel,
    validade_meses
  } = req.body;
  // Verifica se os campos obrigatórios estão presentes
  if (!titulo || !categoria_id) {
    return res.status(400).send({
      message: "Campos obrigatórios: titulo, categoria_id"
    });
  }

  try {
    // Cria um novo artigo com os dados fornecidos
    const novoArtigo = await db.Artigo.create({
      titulo,
      descricao: descricao || null, // Se não fornecido, usa null
      estado: estado || 'Disponível', // Valor padrão: 'Disponível'
      categoria_id,
      disponivel: disponivel !== undefined ? disponivel : true, // Valor padrão: true
      validade_meses: validade_meses || 6, // Valor padrão: 6 meses
      utilizador_id: req.user.id, // ID do utilizador autenticado
      data_publicacao: new Date()  // Data atual
    });
    // Procura o artigo criado com suas relações
    const artigoCompleto = await db.Artigo.findByPk(novoArtigo.id, {
      include: [
        { model: db.Utilizador, as: 'utilizador' },
        { model: db.Categoria, as: 'categoria' }
      ]
    });
    // Retorna o artigo criado com status 201
    res.status(201).json(artigoCompleto);
  } catch (error) {
    // Em caso de erro, retorna status 500
    res.status(500).send({
      message: error.message || "Erro ao criar artigo"
    });
  }
});

// PUT atualizar artigo (protegido)
// Rota para atualizar um artigo existente (requer autenticação)
router.put('/:id', authenticateToken, async (req, res) => {
  // Obtém o ID dos parâmetros da rota
  const id = req.params.id;

  try {
    // Procura o artigo a ser atualizado
    const artigo = await db.Artigo.findByPk(id);

    if (!artigo) {
      // Verifica se o artigo existe
      return res.status(404).send({
        message: `Artigo com id=${id} não encontrado`
      });
    }

    // Verificar se o utilizador é o dono do artigo
    if (artigo.utilizador_id !== req.user.id) {
      return res.status(403).send({
        message: "Não tem permissão para editar este artigo"
      });
    }
    // Atualiza o artigo e obtém o número de linhas afetadas
    const [numLinhasAfetadas] = await db.Artigo.update(req.body, {
      where: { id: id }
    });
    // Verifica se a atualização foi bem-sucedida
    if (numLinhasAfetadas === 1) {
      res.send({ message: "Artigo atualizado com sucesso" });
    } else {
      res.status(404).send({
        message: `Não foi possível atualizar o artigo com id=${id}`
      });
    }
  } catch (error) {
    res.status(500).send({
      message: `Erro ao atualizar artigo com id=${id}`
    });
  }
});

// DELETE apagar artigo (protegido)
// Rota para apagar um artigo (requer autenticação)
router.delete('/:id', authenticateToken, async (req, res) => {
  // Obtém o ID dos parâmetros da rota
  const id = req.params.id;

  try {
    // Procura o artigo a ser apagado
    const artigo = await db.Artigo.findByPk(id);
    // Verifica se o artigo existe
    if (!artigo) {
      return res.status(404).send({
        message: `Artigo com id=${id} não encontrado`
      });
    }

    // Verificar se o utlizador é o dono do artigo
    // Verifica se o utilizador tem permissão para apagar
    if (artigo.utilizador_id !== req.user.id) {
      return res.status(403).send({
        message: "Não tem permissão para apagar este artigo"
      });
    }
    // Apaga o artigo e obtém o número de linhas afetadas
    const numLinhasAfetadas = await db.Artigo.destroy({
      where: { id: id }
    });
    // Verifica se a eliminação foi bem-sucedida
    if (numLinhasAfetadas === 1) {
      res.send({ message: "Artigo apagado com sucesso" });
    } else {
      res.status(404).send({
        message: `Não foi possível apagar o artigo com id=${id}`
      });
    }
  } catch (error) {
    res.status(500).send({
      message: `Erro ao apagar artigo com id=${id}`
    });
  }
});
// Exporta o router para uso em outros ficheiros
module.exports = router;
