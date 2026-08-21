const express = require("express");
const router = express.Router();
const { signup, login, adminLogin, me } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

router.post("/signup", signup);
router.post("/login", login);
router.post("/admin-login", adminLogin);
router.get("/me", requireAuth, me);

module.exports = router;
