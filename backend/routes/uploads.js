// Importação dos módulos necessários
// Framework web para Node.js
const express = require('express');
// Criação de um router Express para gerir rotas
const router = express.Router();
// Middleware para gestão de upload de ficheiros
const multer = require('multer');
// Módulo para manipulação de caminhos de ficheiro
const path = require('path');
// Módulo para operações com o sistema de ficheiros
const fs = require('fs');
// Middleware personalizado para autenticação
const authenticateToken = require('../middleware/auth');

// Configurações de segurança
const MAX_FILE_SIZE = 5 * 1024 * 1024; // Limite máximo de 5MB para ficheiros
const ALLOWED_MIME_TYPES = [
  'image/jpeg', // Permite JPEGs
  'image/png', // Permite PNGs
  'image/gif', // Permite GIFs
  'image/webp' // Permite WebP
];

// Verifica e cria o diretório de uploads
// Verifica se a pasta de uploads existe; se não, cria-a
const uploadDir = path.join(__dirname, '../pictures'); // Define o caminho para a pasta de uploads
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); // Cria a pasta recursivamente se não existir
}

// Configuração segura do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Define o destino dos ficheiros carregados
  },
  filename: (req, file, cb) => {
    const sanitizedName = Date.now() + '_' +
      file.originalname.replace(/[^a-zA-Z0-9_.-]/g, ''); // Sanitiza o nome do ficheiro, removendo caracteres potencialmente perigosos
    cb(null, sanitizedName); // Define o nome final do ficheiro
  }
});
// Função de filtro para verificar os tipos de ficheiros permitidos
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true); // Aceita o ficheiro se o tipo MIME estiver na lista permitida
  } else {
    cb(new Error('Tipo de arquivo não permitido'), false); // Rejeita o ficheiro se o tipo não for permitido
  }
};
// Configuração completa do middleware Multer
const upload = multer({
  storage: storage, // Usa a configuração de armazenamento definida acima
  limits: {
    fileSize: MAX_FILE_SIZE, // Limita o tamanho do ficheiro a 5MB
    files: 1 // Apenas 1 arquivo por requisição
  },
  fileFilter: fileFilter // Usa a função de filtro definida acima
});

// Rota de upload protegida
router.post('/',
  authenticateToken, // Requer autenticação - Middleware que verifica se o utilizador está autenticado
  upload.single('foto'), // Middleware Multer que processa um único ficheiro com o nome 'foto'
  (req, res) => {
    try {
      // Validação adicional - Verifica se foi enviado um ficheiro válido
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo válido enviado' });
      }

      // Cria uma URL segura para o ficheiro carregado
      const fileUrl = `/pictures/${encodeURIComponent(req.file.filename)}`;
      // Envia resposta de sucesso com informações sobre o ficheiro
      res.json({
        caminho: req.file.filename, // Nome do ficheiro no servidor
        url: fileUrl, // URL para aceder ao ficheiro
        message: 'Upload realizado com sucesso' // Mensagem de sucesso
      });

    } catch (error) {
      // Tratamento de erros durante o processamento do upload
      console.error('Erro de upload:', error);
      res.status(500).json({
        error: 'Erro no processamento do arquivo',
        details: error.message // Detalhes do erro
      });
    }
  }
);

// Rota GET para aceder aos ficheiros carregados
router.get('/:filename',
  authenticateToken, // Requer autenticação JWT para aceder aos ficheiros
  (req, res) => {
    try {
      // Sanitização reforçada
      // Sanitiza o nome do ficheiro para evitar ataques de traversal do diretório
      const sanitizedFilename = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, '');
      // Constrói o caminho completo do ficheiro
      const filePath = path.join(uploadDir, sanitizedFilename);

      // Verificações de segurança
      if (!sanitizedFilename || sanitizedFilename !== req.params.filename) {
        return res.status(400).json({ error: 'Nome de arquivo inválido' });
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }

      //  Controle de acesso
      // Verificação adicional de controlo de acesso
      if (!req.user || !req.user.id) { // Verifica se o utilizador está autenticado e tem um ID válido
        return res.status(403).json({ error: 'Acesso negado' }); // Rejeita se o utilizador não tiver permissões
      }

      // Headers de segurança
      //  res.set({
      //   'Content-Security-Policy': "default-src 'self'",
      //    'X-Content-Type-Options': 'nosniff',
      //    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      //  });

      // Envia o ficheiro como resposta
      res.sendFile(filePath);

    } catch (error) {
      // Tratamento de erros ao aceder ao ficheiro
      console.error('Erro de acesso:', error);
      res.status(500).json({
        error: 'Erro ao recuperar arquivo',
        details: 'Tente novamente mais tarde'  // Mensagem genérica para o utilizador
      });
    }
  }
);
// Exporta o router para uso noutros ficheiros
module.exports = router;