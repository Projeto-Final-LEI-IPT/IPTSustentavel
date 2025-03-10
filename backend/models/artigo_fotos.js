// Exporta uma função que recebe a instância do Sequelize e os tipos de dados
module.exports = (sequelize, DataTypes) => {
  // Define um modelo chamado 'ARTIGO_FOTOS' no Sequelize  
  const ArtigoFotos = sequelize.define('ARTIGO_FOTOS', {
    // Define um único campo 'caminho_foto' do tipo String para armazenar o caminho/URL da foto  
    caminho_foto: DataTypes.STRING
    });
  // Define um método que estabelece as relações com outros modelo
    ArtigoFotos.associate = (models) => {
    // Estabelece que cada foto pertence a um artigo específico
    // A coluna 'artigo_id' na tabela 'ARTIGO_FOTOS' guardará o ID do artigo associado
    // O alias 'artigo' permite aceder facilmente aos dados do artigo relacionado
      ArtigoFotos.belongsTo(models.Artigo, {
        foreignKey: 'artigo_id',
        as: 'artigo'
      });
    };

  // Retorna o modelo ArtigoFotos configurado
    return ArtigoFotos;
  };