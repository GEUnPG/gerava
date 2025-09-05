const express = require('express');
const router = express.Router();
const ModuloController = require('../controllers/ModuloController');

router.get('/', ModuloController.getAll);
router.get('/:id', ModuloController.getById);
router.post('/', ModuloController.create);
router.put('/:id', ModuloController.update);
router.delete('/:id', ModuloController.delete);

module.exports = router;