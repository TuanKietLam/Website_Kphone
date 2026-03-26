
const jwt = require('jsonwebtoken');


const authenticate = (req, res, next) => {
  try {
  
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided or invalid format' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
   
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'customer' 
    };

    next(); 
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
};

module.exports = { authenticate, isAdmin };










