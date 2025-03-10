// middleware/auth.js
// Importa a biblioteca jsonwebtoken para manipular tokens JWT
const jwt = require('jsonwebtoken');
// Define a função de middleware que verifica a autenticação do utilizador
const authenticateToken = (req, res, next) => {
  // Obtém o cabeçalho de autorização do pedido HTTP
  const authHeader = req.headers['authorization'];
   // Extrai o token do cabeçalho (remove o prefixo "Bearer ")
  // Se authHeader for undefined, a expressão retorna undefined
  const token = authHeader && authHeader.split(' ')[1];
  // Se não houver token, termina o pedido com código 401 (Não Autorizado)
  if (!token) return res.sendStatus(401); // Sem token
// Verifica se o token é válido usando a chave secreta guardada nas variáveis de ambiente
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
     // Se ocorrer um erro (token expirado, inválido, etc.), termina com código 403 
    if (err) return res.sendStatus(403); // Token inválido
    // Se o token for válido, adiciona os dados do utilizador ao objeto de pedido
    req.user = user;
     // Chama a próxima função na cadeia de middleware
    next();
  });
};
// Exporta a função para ser utilizada noutros módulos da aplicação
module.exports = authenticateToken;
