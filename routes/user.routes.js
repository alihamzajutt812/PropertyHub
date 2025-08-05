const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const upload = require('../utils/multer');

// GET register form
router.get('/register', userController.getRegisterForm);

// POST handle registration
router.post('/register', upload.single('agencyLogo'), userController.registerUser);

router.get('/login', userController.showLoginForm);
router.post('/login', userController.handleLogin);
router.get('/search', userController.searchProperties);
// Logout
router.get('/logout', userController.logout);

// About Page
router.get('/about', userController.aboutPage);
router.get('/', userController.home);

module.exports = router;