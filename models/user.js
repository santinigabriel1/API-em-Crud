const { Sequelize, DataTypes } = require('sequelize');

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
    validate: {
      notEmpty: {msg: 'O nome não pode estar vazio'},
      len: {args: [3, 255], msg: 'O nome deve ter entre 3 e 255 caracteres'},
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {msg: 'O email não pode estar vazio'},
      isEmail: {msg: 'O email deve ser válido'},
    },
  },
}, {
  tableName: 'users'
});

module.exports = { User, sequelize };
