// Exporta uma função que recebe a instância do Sequelize e os tipos de dados
module.exports = (sequelize, DataTypes) => {
   // Define um modelo chamado 'MENSAGEM' no Sequelize  
  const Mensagem = sequelize.define('MENSAGEM', {
      // Campo 'conteudo' do tipo TEXT para armazenar o corpo da mensagem
      conteudo: DataTypes.TEXT,
      lida: DataTypes.BOOLEAN,
      data: DataTypes.DATE
    });
  
    Mensagem.associate = (models) => {
    // Estabelece que cada mensagem pertence a um utilizador que é o remetente
    // A coluna 'remetente_id' na tabela Mensagem guardará o ID do utilizador que enviou
    // O alias 'remetente' permite aceder os dados do remetente facilmente
      Mensagem.belongsTo(models.Utilizador, {
        foreignKey: 'remetente_id',
        as: 'remetente'
      });
    // Estabelece que cada mensagem também pertence a um utilizador que é o destinatário
    // A coluna 'destinatario_id' na tabela Mensagem guardará o ID do destinatário
    // O alias 'destinatario' permite aceder os dados do destinatário facilmente
      Mensagem.belongsTo(models.Utilizador, {
        foreignKey: 'destinatario_id',
        as: 'destinatario'
      });
    };
   // Retorna o modelo Mensagem configurado
    return Mensagem;
  };