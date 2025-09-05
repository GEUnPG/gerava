const express = require('express');
const router = express.Router();
const SituacaoAvalController = require('../controllers/SituacaoAvalController');

router.get('/', SituacaoAvalController.getAll);
router.get('/:id', SituacaoAvalController.getById);
router.post('/', SituacaoAvalController.create);
router.put('/:id', SituacaoAvalController.update);
router.delete('/:id', SituacaoAvalController.delete);

module.exports = router;