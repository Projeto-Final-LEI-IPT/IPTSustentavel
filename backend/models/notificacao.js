module.exports = (sequelize, DataTypes) => {
  const Notificacao = sequelize.define('NOTIFICACAO', {
    titulo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    conteudo: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
    {
      tableName: 'notificacao'
    }
  );

  Notificacao.associate = (models) => {
    // Quem enviou a notificação (admin)
    Notificacao.belongsTo(models.Utilizador, {
      foreignKey: 'enviado_por',
      as: 'remetente'
    });

    // Relação muitos-para-muitos para controlar leituras
    Notificacao.belongsToMany(models.Utilizador, {
      through: 'NOTIFICACAO_LIDA',
      as: 'leituras',
      foreignKey: 'notificacao_id'
    });
  };

  return Notificacao;
};