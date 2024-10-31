const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

// Configuration
dotenv.config();
const app = express();

// Configuration CORS détaillée
const corsOptions = {
  origin: 'http://localhost:3000', // Remplacez par l'URL de votre frontend
  credentials: true, // Permettre l'envoi de cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight request pour 10 minutes
};

// Middleware de base
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// URL de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotels';

// Connexion à MongoDB avec options de configuration
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connexion à MongoDB réussie !');
  const db = mongoose.connection;
  console.log('📁 Nom de la base de données:', db.name);
  console.log('🌐 Hôte:', db.host);
  console.log('🚪 Port:', db.port);
})
.catch((err) => {
  console.error('❌ Erreur de connexion MongoDB:', err.message);
  process.exit(1);
});

// Routes
const hotelRoutes = require('./src/routes/hotelRoutes');
const authRoutes = require('./src/routes/authRoutes');

// Routes de base
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\'API de gestion hôtelière',
    status: 'active',
    version: '1.0.0'
  });
});

// Route de test pour vérifier la connexion à la base de données
app.get('/api/test-db', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: "Déconnecté",
      1: "Connecté",
      2: "En cours de connexion",
      3: "En cours de déconnexion"
    };
    res.json({
      status: 'success',
      message: 'Test de connexion à la base de données',
      connectionState: states[dbState],
      databaseName: mongoose.connection.name
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Montage des routes API
app.use('/api/hotels', hotelRoutes);
app.use('/api/auth', authRoutes);
app.use('/uploads', express.static('public/uploads'));

// Middleware de gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: err.message
  });
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({ status: 'error', message: 'Route non trouvée' });
});

// Configuration du port
const PORT = process.env.PORT || 5000;

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`
🏨 API de Gestion Hôtelière
--------------------------
🚀 Serveur démarré sur: http://localhost:${PORT}
📝 API Documentation: http://localhost:${PORT}/api
⚡ Environnement: ${process.env.NODE_ENV || 'development'}
  `);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});