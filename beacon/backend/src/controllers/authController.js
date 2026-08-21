const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

function makeToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

function publicUser(user) {
  const { password, ...rest } = user;
  return rest;
}

async function signup(req, res) {
  const { name, username, phone, password } = req.body;
  if (!name?.trim() || !username?.trim() || !password) {
    return res.status(400).json({ error: "Name, username, and password are required." });
  }

  const existing = await prisma.user.findUnique({ where: { username: username.trim().toLowerCase() } });
  if (existing) {
    return res.status(409).json({ error: "That username is already taken." });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      username: username.trim().toLowerCase(),
      phone: phone?.trim() || null,
      password: hashed,
      role: "CITIZEN",
    },
  });

  const token = makeToken(user);
  res.status(201).json({ token, user: publicUser(user) });
}

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const user = await prisma.user.findUnique({ where: { username: username.trim().toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  const token = makeToken(user);
  res.json({ token, user: publicUser(user) });
}

async function adminLogin(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const user = await prisma.user.findUnique({ where: { username: username.trim().toLowerCase() } });
  if (!user || user.role !== "ADMIN" || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Incorrect admin username or password." });
  }

  const token = makeToken(user);
  res.json({ token, user: publicUser(user) });
}

async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user: publicUser(user) });
}

module.exports = { signup, login, adminLogin, me };
