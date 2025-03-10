// Exporta uma função que recebe a instância do Sequelize e os tipos de dados
module.exports = (sequelize, DataTypes) => {
  // Define um modelo chamado 'CATEGORIA' no Sequelize
  const Categoria = sequelize.define('CATEGORIA', {
     // Campo 'nome' do tipo String que não pode ser nulo
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Campo 'descricao' do tipo TEXT para armazenar textos longos/descritivos
    descricao: DataTypes.TEXT
  },
  {
    // Define que o nome da tabela no banco de dados será 'categoria'
    tableName: 'categoria'
  });
// Define um método que estabelece as relações com outros modelos
  Categoria.associate = (models) => {
    // Estabelece uma relação de "possui muitos" com o modelo Artigo
    // Isso significa que uma categoria pode ter múltiplos artigos
    // A chave estrangeira 'artigo_id' conecta os artigos à categoria
    // O alias 'artigos' permite aceder a coleção de artigos relacionados
    Categoria.hasMany(models.Artigo, {
      foreignKey: 'categoria_id',
      as: 'artigos'
    });
  };
 // Retorna o modelo Categoria configurado
  return Categoria;
};