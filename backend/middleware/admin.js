const ensureAdmin = (req, res, next) => {
  const u = req.user || {};
  if (u.email === 'omrtalokar146@gmail.com' || u.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
};

module.exports = { ensureAdmin };
