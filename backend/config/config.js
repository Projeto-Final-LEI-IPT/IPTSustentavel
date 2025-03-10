// Carrega as variáveis de ambiente do ficheiro .env para o objeto process.env
// Isto permite aceder às variáveis de ambiente definidas no ficheiro .env
require('dotenv').config();
// Exporta um objeto de configuração para ser utilizado noutros módulos
module.exports = {
  // Define as configurações para o ambiente de desenvolvimento
  development: {
    // Define o nome de utilizador da base de dados a partir da variável de ambiente DB_USER
    username: process.env.DB_USER,
     // Define a palavra-passe da base de dados a partir da variável de ambiente DB_PASSWORD
    password: process.env.DB_PASSWORD,
     // Define o nome da base de dados a partir da variável de ambiente DB_NAME
    database: process.env.DB_NAME,
    // Define o endereço do servidor da base de dados a partir da variável de ambiente DB_HOST
    host: process.env.DB_HOST,
     // Especifica que o dialeto SQL a ser utilizado é MySQL
    dialect: 'mysql'
  }
};
