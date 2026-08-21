require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth.routes");
const reportRoutes = require("./routes/reports.routes");
const bulletinRoutes = require("./routes/bulletins.routes");
const { initSockets } = require("./sockets/index");

const app = express();
const server = http.createServer(app);

const clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",");

const io = new Server(server, {
  cors: { origin: clientOrigins, credentials: true },
});
initSockets(io);

app.use(cors({ origin: clientOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded evidence (images/videos) as static files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/bulletins", bulletinRoutes);

// Central error handler — Multer file-type/size errors land here too.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Something went wrong." });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Beacon API listening on http://localhost:${PORT}`);
});
