const DisciplinaModel = require('../models/DisciplinaModel');

class DisciplinaController {
  static async getAll(req, res) {
    try {
      const search = req.query.search || '';
      const disciplinas = search ? await DisciplinaModel.search(search) : await DisciplinaModel.getAll();
      res.json(disciplinas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar disciplinas', details: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const disciplina = await DisciplinaModel.getById(req.params.id);
      if (!disciplina) {
        return res.status(404).json({ error: 'Disciplina não encontrada' });
      }
      res.json(disciplina);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar disciplina', details: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { descricao, modulo_id, professor_id } = req.body;
      if (!descricao) {
        return res.status(400).json({ error: 'Descrição é obrigatória' });
      }
      const novaDisciplina = await DisciplinaModel.create({ descricao, modulo_id, professor_id });
      res.status(201).json(novaDisciplina);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar disciplina', details: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { descricao, modulo_id, professor_id } = req.body;
      if (!descricao) {
        return res.status(400).json({ error: 'Descrição é obrigatória' });
      }
      const disciplinaAtualizada = await DisciplinaModel.update(req.params.id, { descricao, modulo_id, professor_id });
      if (!disciplinaAtualizada) {
        return res.status(404).json({ error: 'Disciplina não encontrada' });
      }
      res.json(disciplinaAtualizada);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar disciplina', details: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const result = await DisciplinaModel.delete(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir disciplina', details: error.message });
    }
  }


  static async getModulos(req, res) {
  console.log('Acessando GET /api/disciplinas/modulos');
  try {
    const modulos = await DisciplinaModel.getModulos();
    console.log('Módulos enviados:', modulos);
    res.json(modulos);
  } catch (error) {
    console.error('Erro em getModulos:', error.message, error.stack);
    res.status(500).json({ error: 'Erro ao buscar módulos', details: error.message });
  }
}

static async getProfessores(req, res) {
  console.log('Acessando GET /api/disciplinas/professores');
  try {
    const professores = await DisciplinaModel.getProfessores();
    console.log('Professores enviados:', professores);
    res.json(professores);
  } catch (error) {
    console.error('Erro em getProfessores:', error.message, error.stack);
    res.status(500).json({ error: 'Erro ao buscar professores', details: error.message });
  }
}

  // static async getModulos(req, res) {
  //   try {
  //     const modulos = await DisciplinaModel.getModulos();
  //     res.json(modulos);
  //   } catch (error) {
  //     res.status(500).json({ error: 'Erro ao buscar módulos', details: error.message });
  //   }
  // }


  static async getProfessores(req, res) {
  console.log('Acessando GET /api/disciplinas/professores');
  try {
    const professores = await DisciplinaModel.getProfessores();
    console.log('Professores enviados:', professores);
    res.json(professores);
  } catch (error) {
    console.error('Erro em getProfessores:', error.message, error.stack);
    res.status(500).json({ error: 'Erro ao buscar professores', details: error.message });
  }
}

  // static async getProfessores(req, res) {
  //   try {
  //     const professores = await DisciplinaModel.getProfessores();
  //     res.json(professores);
  //   } catch (error) {
  //     res.status(500).json({ error: 'Erro ao buscar professores', details: error.message });
  //   }
  // }
}

module.exports = DisciplinaController;