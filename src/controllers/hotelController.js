const express = require('express');
const multer = require('multer');
const path = require('path');

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/hotels');  // Assurez-vous que ce dossier existe
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Le fichier doit être une image'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter
});


const Hotel = require('../models/Hotel');

// Créer un nouvel hôtel
exports.createHotel = async (req, res) => {
  try {
    // Traitement de l'upload d'image
    upload.single('images')(req, res, async function(err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const hotelData = {
        name: req.body.name,
        address: req.body.address,
        description: req.body.description,
        price: req.body.price,
        contactInfo: req.body.contactInfo,
        status: req.body.status,
      };

      // Ajout du chemin de l'image si une image a été uploadée
      if (req.file) {
        hotelData.images = [`uploads/hotels/${req.file.filename}`];
      }

      const hotel = new Hotel(hotelData);
      const newHotel = await hotel.save();
      res.status(201).json(newHotel);
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtenir tous les hôtels
exports.getAllHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find();
    res.status(200).json(hotels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir un hôtel spécifique
exports.getHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hôtel non trouvé' });
    }
    res.status(200).json(hotel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un hôtel
exports.updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!hotel) {
      return res.status(404).json({ message: 'Hôtel non trouvé' });
    }
    res.status(200).json(hotel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer un hôtel
exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hôtel non trouvé' });
    }
    res.status(200).json({ message: 'Hôtel supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
