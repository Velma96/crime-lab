const prisma = require("../config/db");

async function listBulletins(req, res) {
  const bulletins = await prisma.bulletin.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ bulletins });
}

async function createBulletin(req, res) {
  const { title, category, summary, body } = req.body;
  if (!title?.trim() || !summary?.trim() || !body?.trim()) {
    return res.status(400).json({ error: "Title, summary, and body are required." });
  }
  const bulletin = await prisma.bulletin.create({
    data: { title: title.trim(), category: category || "Safety", summary: summary.trim(), body: body.trim() },
  });
  res.status(201).json({ bulletin });
}

async function updateBulletin(req, res) {
  const { title, category, summary, body } = req.body;
  const bulletin = await prisma.bulletin.update({
    where: { id: req.params.id },
    data: { title, category, summary, body },
  });
  res.json({ bulletin });
}

async function deleteBulletin(req, res) {
  await prisma.bulletin.delete({ where: { id: req.params.id } });
  res.status(204).end();
}

module.exports = { listBulletins, createBulletin, updateBulletin, deleteBulletin };
