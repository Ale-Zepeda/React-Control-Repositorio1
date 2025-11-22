const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST - Login de usuario
router.post('/login', authController.login);

module.exports = router;