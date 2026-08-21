const jwt = require("jsonwebtoken");

// Verifies the JWT sent in the Authorization header and attaches
// { id, username, role } to req.user. Rejects the request otherwise.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "You must be logged in." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Your session has expired. Please log in again." });
  }
}

// Use after requireAuth to restrict a route to admins only.
function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
