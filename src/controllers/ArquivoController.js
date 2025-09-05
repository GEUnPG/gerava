const Arquivo = require('../models/ArquivoModel');

class ArquivoController {
  static async listDeleted(req, res) {
    console.log('Acessando GET /api/arquivo', {
      query: req.query,
      headers: req.headers,
      session: req.sessionID,
    });
    try {
      const avaliacoes = await Arquivo.findAllDeleted();
      console.log('Avaliações arquivadas retornadas:', avaliacoes.length);
      res.json(avaliacoes);
    } catch (error) {
      console.error('Erro em listDeleted:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao listar avaliações arquivadas', details: error.message });
    }
  }

  static async restore(req, res) {
    const { id } = req.params;
    console.log(`Acessando POST /api/arquivo/restore/${id}`);
    try {
      await Arquivo.restore(id);
      res.json({ message: 'Avaliação restaurada com sucesso.' });
    } catch (error) {
      console.error('Erro em restore:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  static async deletePermanently(req, res) {
    const { id } = req.params;
    console.log(`Acessando DELETE /api/arquivo/delete/${id}`);
    try {
      await Arquivo.deletePermanently(id);
      res.json({ message: 'Avaliação excluída permanentemente.' });
    } catch (error) {
      console.error('Erro em deletePermanently:', error.message);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = ArquivoController;