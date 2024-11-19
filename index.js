const express = require('express');
const { User, sequelize } = require('./models/user');
const { validateUser } = require('./models/validation');


const app = express();
const PORT = 3000;
const { Op } = require('sequelize');

app.use(express.json());

// Sincroniza o banco de dados e inicia o servidor
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}).catch(err => {
  console.error('Erro ao sincronizar o banco de dados:', err);
});

// Testa a conexão com o banco de dados
sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o banco de dados foi estabelecida com sucesso.');
  })
  .catch(err => {
    console.error('Não foi possível conectar ao banco de dados:', err);
  });

// Rota principal
app.get('/', (req, res) => {
  res.send('API de Gerenciamento de Usuários');
});

// Rota de Criação (POST /users) com validação
app.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    const newUser = await User.create({ name, email });
    res.status(201).json({ message: 'Usuário criado!', user: newUser });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message);
      return res.status(400).json({error: 'Erro de validação', details: validationErrors});
    }
    res.status(400).json({ error: 'Erro ao criar usuário', details: error.message });
  }
});

// Rota para Obter Todos os Usuários (GET /users)
app.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, name } = req.query; // Padrão para página 1 e limite 10
    const offset = (page - 1) * limit; // Calcula o offset com base na página

    // Constrói o filtro para nome (se o nome for passado na query)
    const filter = name ? { where: { name: { [Op.like]: `%${name}%` } } } : {};

    // Busca os usuários com a paginação e o filtro aplicado
    const users = await User.findAll({
      ...filter,
      limit,
      offset
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao buscar usuários', details: error.message });
  }
});

// Rota para Obter um Usuário pelo ID (GET /users/:id)
app.get('/users/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  res.status(200).json(user);
});

// Rota para Atualizar um Usuário (PUT /users/:id) com validação
app.put('/users/:id', validateUser, async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  const { name, email } = req.body;
  await user.update({ name, email });
  res.status(200).json({ message: 'Usuário atualizado!', user });
});

// Rota para Deletar um Usuário (DELETE /users/:id)
app.delete('/users/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  await user.destroy();
  res.status(200).json({ message: 'Usuário deletado!' });
});

app.patch('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const updatedUser = await user.update(req.body);
    res.status(200).json({message: 'Usuário atualizado parcialmente', user:updatedUser});
  } catch (error) {
    if (error.name === 'sequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message);
      return res.status(400).json({error: 'Erro de validação', details: validationErrors}); 
    }
    res.status(400).json({error: 'Erro ao atualizar usuário', details: error.message});
  } 
});
