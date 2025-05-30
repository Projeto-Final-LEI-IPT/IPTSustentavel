module.exports = (sequelize, DataTypes) => {
  const NotificacaoLida = sequelize.define('NOTIFICACAO_LIDA', {
    lida: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    data_leitura: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
    {
      // Define que o nome da tabela na base de dados será 'categoria'
      tableName: 'notificacao_lida'
    }

  );

  NotificacaoLida.associate = (models) => {
    NotificacaoLida.belongsTo(models.Utilizador, {
      foreignKey: 'utilizador_id'
    });
    NotificacaoLida.belongsTo(models.Notificacao, {
      foreignKey: 'notificacao_id'
    });
  };

  return NotificacaoLida;
};
