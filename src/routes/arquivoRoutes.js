const express = require('express');
const router = express.Router();
const ArquivoController = require('../controllers/ArquivoController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, ArquivoController.listDeleted);
router.post('/restore/:id', isAuthenticated, ArquivoController.restore);
router.delete('/delete/:id', isAuthenticated, ArquivoController.deletePermanently);

module.exports = router;