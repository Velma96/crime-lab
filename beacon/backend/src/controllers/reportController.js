const prisma = require("../config/db");
const { notifyAdmins, notifyUser } = require("../sockets/index");

const STATUS_LABELS = {
  received: "Received",
  reviewing: "Under Review",
  assigned: "Officer Assigned",
  resolved: "Resolved",
};

// Citizens see only their own reports; admins see everything (optionally filtered by status).
async function listReports(req, res) {
  const where =
    req.user.role === "ADMIN"
      ? req.query.status
        ? { status: req.query.status }
        : {}
      : { reporterId: req.user.id };

  const reports = await prisma.report.findMany({
    where,
    include: { messages: { orderBy: { createdAt: "asc" } }, reporter: { select: { name: true, username: true, phone: true } } },
    orderBy: { updatedAt: "desc" },
  });

  res.json({ reports });
}

async function getReport(req, res) {
  const report = await prisma.report.findUnique({
    where: { id: req.params.id },
    include: { messages: { orderBy: { createdAt: "asc" } }, reporter: { select: { name: true, username: true, phone: true } } },
  });
  if (!report) return res.status(404).json({ error: "Report not found." });
  if (req.user.role !== "ADMIN" && report.reporterId !== req.user.id) {
    return res.status(403).json({ error: "You can't view this report." });
  }
  res.json({ report });
}

async function createReport(req, res) {
  const { category, urgency, description, latitude, longitude, accuracy } = req.body;
  if (!category || !urgency || !description?.trim()) {
    return res.status(400).json({ error: "Category, urgency, and a description are required." });
  }

  const media = req.file
    ? {
        mediaUrl: `/uploads/${req.file.filename}`,
        mediaType: req.file.mimetype.startsWith("video/") ? "video" : "image",
      }
    : {};

  const report = await prisma.report.create({
    data: {
      category,
      urgency,
      description: description.trim(),
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      accuracy: accuracy ? parseFloat(accuracy) : null,
      reporterId: req.user.id,
      ...media,
    },
    include: { messages: true, reporter: { select: { name: true, username: true, phone: true } } },
  });

  notifyAdmins("new-report", { report });
  res.status(201).json({ report });
}

async function updateStatus(req, res) {
  const { status } = req.body;
  if (!STATUS_LABELS[status]) {
    return res.status(400).json({ error: "Invalid status." });
  }

  const existing = await prisma.report.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Report not found." });

  const report = await prisma.report.update({
    where: { id: req.params.id },
    data: {
      status,
      citizenUnread: true,
      messages: { create: { text: `Status updated: ${STATUS_LABELS[status]}.`, from: "admin" } },
    },
    include: { messages: { orderBy: { createdAt: "asc" } }, reporter: { select: { name: true, username: true, phone: true } } },
  });

  notifyUser(report.reporterId, "report-updated", { report });
  res.json({ report });
}

async function addMessage(req, res) {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "Message can't be empty." });

  const existing = await prisma.report.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Report not found." });
  if (req.user.role !== "ADMIN" && existing.reporterId !== req.user.id) {
    return res.status(403).json({ error: "You can't message on this report." });
  }

  const from = req.user.role === "ADMIN" ? "admin" : "citizen";
  const report = await prisma.report.update({
    where: { id: req.params.id },
    data: {
      messages: { create: { text: text.trim(), from } },
      ...(from === "admin" ? { citizenUnread: true } : { adminUnread: true }),
    },
    include: { messages: { orderBy: { createdAt: "asc" } }, reporter: { select: { name: true, username: true, phone: true } } },
  });

  if (from === "admin") notifyUser(report.reporterId, "report-updated", { report });
  else notifyAdmins("report-updated", { report });

  res.json({ report });
}

// Marks a report as seen by whoever is viewing it, clearing the "unread" pulse.
async function markSeen(req, res) {
  const existing = await prisma.report.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Report not found." });

  const data = req.user.role === "ADMIN" ? { adminUnread: false } : { citizenUnread: false };
  if (req.user.role !== "ADMIN" && existing.reporterId !== req.user.id) {
    return res.status(403).json({ error: "You can't view this report." });
  }

  const report = await prisma.report.update({
    where: { id: req.params.id },
    data,
    include: { messages: { orderBy: { createdAt: "asc" } }, reporter: { select: { name: true, username: true, phone: true } } },
  });
  res.json({ report });
}

module.exports = { listReports, getReport, createReport, updateStatus, addMessage, markSeen };
