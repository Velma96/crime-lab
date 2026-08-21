const express = require("express");
const router = express.Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");
const {
  listBulletins,
  createBulletin,
  updateBulletin,
  deleteBulletin,
} = require("../controllers/bulletinController");

router.get("/", listBulletins); // public — shown on the front page
router.post("/", requireAuth, requireAdmin, createBulletin);
router.put("/:id", requireAuth, requireAdmin, updateBulletin);
router.delete("/:id", requireAuth, requireAdmin, deleteBulletin);

module.exports = router;
