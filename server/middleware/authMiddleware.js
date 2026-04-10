// middleware/authMiddleware.js
const jwt  = require('jsonwebtoken');

function protect(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role } now available in every route
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Role checker — use like: allowRoles('admin', 'manager')
function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ message: 'Access denied' });
    next();
  };
}

module.exports = { protect, allowRoles };