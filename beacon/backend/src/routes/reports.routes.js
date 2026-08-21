const express = require("express");
const router = express.Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  listReports,
  getReport,
  createReport,
  updateStatus,
  addMessage,
  markSeen,
} = require("../controllers/reportController");

router.get("/", requireAuth, listReports);
router.get("/:id", requireAuth, getReport);
router.post("/", requireAuth, upload.single("media"), createReport);
router.patch("/:id/status", requireAuth, requireAdmin, updateStatus);
router.post("/:id/messages", requireAuth, addMessage);
router.post("/:id/seen", requireAuth, markSeen);

module.exports = router;
