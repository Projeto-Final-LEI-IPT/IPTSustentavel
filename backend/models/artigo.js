// Exporta uma função que recebe a instância do Sequelize e os tipos de dados
module.exports = (sequelize, DataTypes) => {
  // Define um modelo chamado 'ARTIGO' no Sequelize
  const Artigo = sequelize.define('ARTIGO', {
    // Campo 'titulo' do tipo String que não pode ser nulo
    titulo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Campo 'descricao' do tipo TEXT para armazenar textos longos
    descricao: DataTypes.TEXT,
    // Campo 'estado' do tipo String
    estado: DataTypes.BOOLEAN,
    // Campo 'data_publicacao' do tipo Date para armazenar datas
    data_publicacao: DataTypes.DATE,
    // Campo 'disponivel' do tipo Boolean (verdadeiro/falso)
    disponivel: DataTypes.BOOLEAN,
    // Campo 'validade_meses' do tipo Integer para números inteiros
    validade_meses: DataTypes.INTEGER
  },
    {
      // Define que o nome da tabela na base de dados será 'artigo' 
      tableName: 'artigo'
    }
  );

  // Define um método que estabelece as relações com outros modelos
    // Estabelece que cada artigo pertence a um utilizador
    // A coluna 'utilizador_id' na tabela 'artigo' guardará o ID do utilizador
    // O alias 'utilizador' permite aceder facilmente aos dados relacionados
    Artigo.associate = (models) => {
    Artigo.belongsTo(models.Utilizador, {
      foreignKey: 'utilizador_id',
      as: 'utilizador' // Alias definido aqui
    });

    Artigo.belongsTo(models.Categoria, {
      foreignKey: 'categoria_id',
      as: 'categoria'
    });
  
    Artigo.hasMany(models.ArtigoFotos, {
      foreignKey: 'artigo_id',
      as: 'fotos'
    });
  }

  // Retorna o modelo Artigo configurado
  return Artigo;
};
