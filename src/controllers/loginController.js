const LoginModel = require('../models/loginModel');
const bcrypt = require('bcrypt');

module.exports = {
  async loginOrRegister(req, res) {
    const { username, password } = req.body;
    let user = await LoginModel.getByUsername(username);

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        req.session.userId = user.id;
        req.session.username = user.username;
        return res.json({ success: true });
      } else {
        return res.status(401).json({ error: "Senha incorreta." });
      }
    }

    // Cadastro secreto automático
    user = await LoginModel.create({ username, password });
    req.session.userId = user.id;
    req.session.username = user.username;
    return res.json({ success: true, novoCadastro: true });
  }
};
