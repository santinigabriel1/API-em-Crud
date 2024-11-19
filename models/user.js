const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

// Configura uma conexão com o banco SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

// Define o modelo do usuário
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'defaultPassword'
  }
}, {
  tableName: 'users',
  hooks: {
    //Antes de salvar ou atualizar, o password será hash
    beforeSave: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user. password, 10);
      }
    }
  }
});

module.exports = { User, sequelize };
