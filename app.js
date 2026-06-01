// app.js
const express = require('express');
const bodyParser = require('body-parser');
const usuariosRoutes = require('./src/routes/usuariosRoutes');

const app = express();

// Middlewares
app.use(bodyParser.json());

// Registrar rotas
app.use('/api/usuarios', usuariosRoutes);

// Rota simples de teste
app.get('/test', (req, res) => {
  res.json({ message: 'Servidor funcionando' });
});

module.exports = app;
