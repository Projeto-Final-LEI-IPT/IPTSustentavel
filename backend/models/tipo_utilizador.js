// models/tipo_utilizador.js
module.exports = (sequelize, DataTypes) => {
  const TipoUtilizador = sequelize.define('TIPO_UTILIZADOR', {
    tipo: {
      type: DataTypes.ENUM('ESTUDANTE', 'DOCENTE', 'FUNCIONARIO'),
      allowNull: false,
      unique: true
    }
  }, {
    timestamps: false, // Remove campos de timestamp automático
    tableName: 'tipo_utilizador'
  });

  TipoUtilizador.associate = (models) => {
    // Definição da associação hasMany com Utilizador
    TipoUtilizador.hasMany(models.Utilizador, {
      foreignKey: 'tipo_utilizador_id',
      as: 'utilizadores'
    });
  };

  return TipoUtilizador;
};