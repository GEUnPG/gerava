// src/controllers/ConsultaController.js
const Consulta = require('../models/ConsultaModel');

class ConsultaController {
  static async listPublic(req, res) {
    console.log('Acessando GET /api/avaliacoes/public');
    try {
      const avaliacoes = await Consulta.findAllPublic();
      res.json(avaliacoes);
    } catch (error) {
      console.error('Erro em listPublic:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao listar avaliações públicas', details: error.message });
    }
  }
}

module.exports = ConsultaController; //