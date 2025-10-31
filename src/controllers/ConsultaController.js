// src/controllers/ConsultaController.js # funcionando
const Consulta = require('../models/ConsultaModel');

class ConsultaController {
  // 🔹 Listagem paginada
  static async listPublic(req, res) {
    console.log('Acessando GET /api/consulta/public');
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { avaliacoes, total } = await Consulta.findAllPublic(limit, offset);

      res.json({
        data: avaliacoes,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      });
    } catch (error) {
      console.error('Erro em listPublic:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao listar avaliações públicas', details: error.message });
    }
  }

  // 🔹 Listagem sem paginação (para pesquisa avançada)
  static async listAll(req, res) {
    console.log('Acessando GET /api/consulta/public-all');
    try {
      const avaliacoes = await Consulta.findAllPublicNoPagination();
      res.json(avaliacoes);
    } catch (error) {
      console.error('Erro em listAll:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao listar todas avaliações públicas', details: error.message });
    }
  }
}

module.exports = ConsultaController;

