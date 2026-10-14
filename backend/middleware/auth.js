const jwt = require('jsonwebtoken');

function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Please log in first.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token. Please log in again.'
    });
  }
}

function farmerOnly(req, res, next) {
  if (req.user.role !== 'Farmer') {
    return res.status(403).json({
      message: 'Only farmer accounts can create crop listings.'
    });
  }

  next();
}

module.exports = { protect, farmerOnly };
