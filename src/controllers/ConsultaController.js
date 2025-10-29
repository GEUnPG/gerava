// // src/controllers/ConsultaController.js # sanitizado para xss
// const Consulta = require('../models/ConsultaModel');

// // Função simples para escapar HTML
// function escapeHtml(str) {
//   return typeof str === 'string'
//     ? str.replace(/[&<>"']/g, (m) => ({
//         '&': '&amp;',
//         '<': '&lt;',
//         '>': '&gt;',
//         '"': '&quot;',
//         "'": '&#39;',
//       }[m]))
//     : str;
// }

// // Sanitiza todos os campos string de um objeto ou array
// function sanitizeObject(obj) {
//   if (Array.isArray(obj)) {
//     return obj.map(sanitizeObject);
//   }
//   if (obj && typeof obj === 'object') {
//     const sanitized = {};
//     for (const key in obj) {
//       sanitized[key] = typeof obj[key] === 'string'
//         ? escapeHtml(obj[key])
//         : Array.isArray(obj[key]) || (obj[key] && typeof obj[key] === 'object')
//           ? sanitizeObject(obj[key])
//           : obj[key];
//     }
//     return sanitized;
//   }
//   return obj;
// }

// class ConsultaController {
//   // 🔹 Listagem paginada
//   static async listPublic(req, res) {
//     console.log('Acessando GET /api/consulta/public');
//     try {
//       // Validação dos parâmetros
//       const limitRaw = parseInt(req.query.limit, 10);
//       const pageRaw = parseInt(req.query.page, 10);

//       const limit = Number.isInteger(limitRaw) && limitRaw > 0 && limitRaw <= 100 ? limitRaw : 10;
//       const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
//       const offset = (page - 1) * limit;

//       const { avaliacoes, total } = await Consulta.findAllPublic(limit, offset);

//       // Sanitiza os dados antes de enviar
//       const safeData = sanitizeObject(avaliacoes);

//       res.setHeader('Content-Type', 'application/json; charset=utf-8');
//       res.json({
//         data: safeData,
//         total,
//         totalPages: Math.ceil(total / limit),
//         currentPage: page,
//       });
//     } catch (error) {
//       console.error('Erro em listPublic:', error.message, error.stack);
//       res.status(500).json({ error: 'Erro ao listar avaliações públicas', details: error.message });
//     }
//   }

//   // 🔹 Listagem sem paginação (para pesquisa avançada)
//   static async listAll(req, res) {
//     console.log('Acessando GET /api/consulta/public-all');
//     try {
//       const avaliacoes = await Consulta.findAllPublicNoPagination();
//       const safeData = sanitizeObject(avaliacoes);

//       res.setHeader('Content-Type', 'application/json; charset=utf-8');
//       res.json(safeData);
//     } catch (error) {
//       console.error('Erro em listAll:', error.message, error.stack);
//       res.status(500).json({ error: 'Erro ao listar todas avaliações públicas', details: error.message });
//     }
//   }
// }

// module.exports = ConsultaController;


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
