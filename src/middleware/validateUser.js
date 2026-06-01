// src/middleware/validateUser.js para validação de dados do usuário antes de criar/atualizar usuários jogar para o repositório
const UsuariosModel = require('../models/UsuariosModel');

// Express middleware para validar dados de usuário
async function validateUser(req, res, next) {
  const { nome, username, password } = req.body;

  // 1️⃣ Campos obrigatórios
  if (!nome || !username || !password) {
    return res.status(400).json({ error: 'Nome, username e senha são obrigatórios.' });
  }

  // 2️⃣ Nome sem números ou símbolos
  const nomeRegex = /^[A-Za-zÀ-ÿ\s]+$/;
  if (!nomeRegex.test(nome)) {
    return res.status(400).json({
      error: 'O nome não pode conter números nem símbolos.',
    });
  }

  // 3️⃣ Username único
  try {
    const existingUser = await UsuariosModel.getByUsername(username);
    if (existingUser && (!req.params.id || existingUser.id != req.params.id)) {
      return res.status(400).json({ error: 'Username já está em uso.' });
    }
  } catch (error) {
    console.error('Erro ao verificar username:', error.message);
    return res.status(500).json({ error: 'Erro interno ao validar usuário.' });
  }

  // 4️⃣ Senha forte (mesmo padrão do frontend)
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
  if (!strongPasswordRegex.test(password)) {
    return res.status(400).json({
      error:
        'A senha deve ter no mínimo 12 caracteres e incluir letra maiúscula, minúscula, número e símbolo.',
    });
  }

  next(); // ✅ prossegue para o controller
}

module.exports = validateUser;
