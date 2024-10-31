const express = require('express');
const hotelController = require('../controllers/hotelController');
const authController = require('../controllers/authController');
const router = express.Router();

// Routes publiques
router.get('/', hotelController.getAllHotels); // Obtenir tous les hôtels
router.get('/:id', hotelController.getHotel); // Obtenir un hôtel spécifique

// Middleware de protection
router.use(authController.protect);

// Routes CRUD pour les hôtels
router.post('/', authController.restrictTo('admin'), hotelController.createHotel); // Créer un hôtel
router.route('/:id')
  .patch(authController.restrictTo('admin'), hotelController.updateHotel) // Mettre à jour un hôtel
  .delete(authController.restrictTo('admin'), hotelController.deleteHotel); // Supprimer un hôtel
module.exports = router;
