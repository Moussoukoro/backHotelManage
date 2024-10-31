const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Routes d'authentification
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.post('/logout', authController.logout);

// Routes protégées
router.use(authController.protect); // Middleware de protection

router.get('/me', authController.getMe, authController.getUser); // Récupérer les informations de l'utilisateur actuel
router.get('/user', authController.getUser); // Récupérer les informations de l'utilisateur par ID (ou par token)
router.patch('/update-password', authController.updatePassword);
router.patch('/update-me', authController.updateMe);
router.delete('/delete-me', authController.deleteMe);

// Routes admin (restreintes)
router.use(authController.restrictTo('admin'));

router.route('/users')
  .get(authController.getAllUsers)
  .post(authController.createUser);

router.route('/users/:id')
  .get(authController.getUser)
  .patch(authController.updateUser)
  .delete(authController.deleteUser);

module.exports = router;
