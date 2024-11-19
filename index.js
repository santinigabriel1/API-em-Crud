const express = require('express');
const { User, sequelize } = require('./models/user');
const { validateUser } = require('./models/validation');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SECRET_KEY = 'sua-chave-secreta-aqui'; // Use algo seguro em produção

const app = express();
const PORT = 3000;
const { Op } = require('sequelize');

app.use(express.json());

// Sincroniza o banco de dados e inicia o servidor
sequelize.sync({ alter: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch(err => {
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

// Rota de Registro de Usuário
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validação para verificar se todos os campos estão presentes
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios!' });
    }

    // Verificar se o email já está registrado
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Este email já está em uso.' });
    }

    // Gerar o hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar o usuário
    const newUser = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ message: 'Usuário registrado com sucesso!', user: newUser });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar usuário.', details: error.message });
  }
});

// Rota de Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios!' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Email incorreto!' });
    }

    // Comparar a senha informada com a senha hashada
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Senha incorreta!' });
    }

    // Gerar um token JWT
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login bem-sucedido!', token });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer login.', details: error.message });
  }
});

// Middleware de autenticação
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};

// Rota para Obter Todos os Usuários (GET /users)
app.get('/users', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, name } = req.query;
    const offset = (page - 1) * limit;

    const filter = name ? { where: { name: { [Op.like]: `%${name}%` } } } : {};
    const users = await User.findAll({
      ...filter,
      limit,
      offset,
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao buscar usuários', details: error.message });
  }
});

// Rota para Obter um Usuário pelo ID (GET /users/:id)
app.get('/users/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao buscar usuário.', details: error.message });
  }
});

// Rota para Atualizar um Usuário (PUT /users/:id)
app.put('/users/:id', authenticate, validateUser, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const { name, email } = req.body;
    await user.update({ name, email });

    res.status(200).json({ message: 'Usuário atualizado!', user });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar usuário.', details: error.message });
  }
});

// Rota para Deletar um Usuário (DELETE /users/:id)
app.delete('/users/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    await user.destroy();
    res.status(200).json({ message: 'Usuário deletado!' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao deletar usuário.', details: error.message });
  }
});

// Rota para Atualização Parcial (PATCH /users/:id)
app.patch('/users/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const updatedUser = await user.update(req.body);
    res.status(200).json({ message: 'Usuário atualizado parcialmente', user: updatedUser });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar usuário.', details: error.message });
  }
});
