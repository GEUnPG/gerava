const express = require('express');
const router = express.Router();
const TipoAvalController = require('../controllers/TipoAvalController');

router.get('/', TipoAvalController.getAll);
router.get('/:id', TipoAvalController.getById);
router.post('/', TipoAvalController.create);
router.put('/:id', TipoAvalController.update);
router.delete('/:id', TipoAvalController.delete);

module.exports = router;