const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
  
    unique: true
  },
  address: {
    type: String,
    
  },
  devise: {
    type: String,
    enum: ['F XOF', 'Euro', 'Dollar'],
    default: 'F XOF'
    
  },
  price: {  // Nouvelle définition pour le prix
    type: Number,
   
    min: 0  // Le prix ne peut pas être négatif
  },
  
  images: [{
    type: String
  }],
  contactInfo: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Active', 'Closed', 'Renovating'],
    default: 'Active'
  }
}, {
  timestamps: true
});

const Hotel = mongoose.model('Hotel', hotelSchema);
module.exports = Hotel;
