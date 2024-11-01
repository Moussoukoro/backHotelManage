const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const sendEmail = require('../services/emailService'); 


// Générer le token JWT
const signToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Envoyer la réponse avec le token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    },
  });
};

exports.signup = async (req, res) => {
  try {
    const newUser = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
      hotelId: req.body.hotelId,
    });

    createSendToken(newUser, 201, res);
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Veuillez fournir email et mot de passe' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ status: 'error', message: 'Email ou mot de passe incorrect' });
    }

    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// authController.js

// Ajouter cette fonction avec les autres exports dans authController.js

exports.logout = async (req, res) => {
  try {
    // Envoyer une réponse avec un token vide et une courte durée d'expiration
    res.status(200).json({
      status: 'success',
      token: 'logged_out',
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de la déconnexion'
    });
  }
};



exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Vérifiez que req.user est défini
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Utilisateur non authentifié',
      });
    }

    // Vérifiez que le rôle de l'utilisateur est inclus dans les rôles autorisés
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'avez pas la permission d\'effectuer cette action',
      });
    }
    next();
  };
};


// Middleware d'authentification
exports.protect = async (req, res, next) => {
  try {
    // 1. Vérifier si le token existe
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Vous n\'êtes pas connecté'
      });
    }

    // 2. Vérifier si le token est valide
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Vérifier si l'utilisateur existe toujours
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'L\'utilisateur de ce token n\'existe plus'
      });
    }

    // 4. Stocker l'utilisateur dans req.user
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Token invalide ou expiré'
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(200).json({
        status: 'success',
        message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // const resetURL = `${req.protocol}://${req.get('host')}/resetmotdepass/${resetToken}`;
    // Remplace 'http://ton-domaine-frontend.com' par l'URL de ton application frontend
const resetURL = `http://localhost:3000/resetPass?token=${resetToken}`;


    await sendEmail({
      email: user.email,
      subject: 'Réinitialisation de mot de passe',
      message: `Pour réinitialiser votre mot de passe, cliquez ici : ${resetURL}`
    });

    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Erreur forgotPassword:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.' 
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, passwordConfirm } = req.body;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    console.log("Token brut reçu :", token);
    console.log("Token hashé attendu :", hashedToken);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+password +passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Le lien est invalide ou a expiré'
      });
    }

    console.log("Token de la base de données :", user.passwordResetToken);
    console.log("Token expiré :", Date.now() > user.passwordResetExpires);

    // Vérifiez que le mot de passe actuel ne correspond pas au nouveau
    const isCurrentPassword = await user.comparePassword(password);
    if (isCurrentPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Le nouveau mot de passe ne peut pas être identique à l\'ancien'
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        status: 'error',
        message: 'Les mots de passe ne correspondent pas'
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Erreur resetPassword:', error.message || error);
    res.status(400).json({ 
      status: 'error', 
      message: 'Erreur lors de la réinitialisation' 
    });
  }
};


// Cette route doit être protégée
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, passwordConfirm } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }

    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 'error',
        message: 'Mot de passe actuel incorrect'
      });
    }

    if (newPassword !== passwordConfirm) {
      return res.status(400).json({
        status: 'error',
        message: 'Les nouveaux mots de passe ne correspondent pas'
      });
    }

    user.password = newPassword;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Erreur updatePassword:', error);
    res.status(400).json({ 
      status: 'error', 
      message: 'Erreur lors du changement de mot de passe' 
    });
  }
};


exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getUser = async (req, res) => {
  try {
    const user = req.user; // Utilisez l'utilisateur trouvé dans le middleware protect
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error', 
      message: 'Erreur lors de la récupération de l\'utilisateur' 
    });
  }
};


exports.updateMe = async (req, res) => {
  // Implémentation à faire
  res.status(200).json({ status: 'success', message: 'updateMe route' });
};

exports.deleteMe = async (req, res) => {
  // Implémentation à faire
  res.status(200).json({ status: 'success', message: 'deleteMe route' });
};

exports.getAllUsers = async (req, res) => {
  // Implémentation à faire
  res.status(200).json({ status: 'success', message: 'getAllUsers route' });
};

exports.createUser = async (req, res) => {
  // Implémentation à faire
  res.status(200).json({ status: 'success', message: 'createUser route' });
};

exports.updateUser = async (req, res) => {
  // Implémentation à faire
  res.status(200).json({ status: 'success', message: 'updateUser route' });
};

exports.deleteUser = async (req, res) => {
  // Implémentation à faire
  res.status(200).json({ status: 'success', message: 'deleteUser route' });
};