const jwt = require("jsonwebtoken");

let ioInstance = null;

// Wires up Socket.io. Each client authenticates with the same JWT it uses
// for the REST API, then joins a room based on who it is:
//   - admins join the "admins" room -> get notified the instant any report is filed
//   - citizens join a "user:<id>" room -> get notified about updates to their own reports
function initSockets(io) {
  ioInstance = io;

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No auth token provided."));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token."));
    }
  });

  io.on("connection", (socket) => {
    if (socket.user.role === "ADMIN") {
      socket.join("admins");
    } else {
      socket.join(`user:${socket.user.id}`);
    }

    socket.on("disconnect", () => {
      // no-op — rooms are cleaned up automatically
    });
  });
}

// Call these from controllers after a DB write to push a live event.
function notifyAdmins(event, payload) {
  ioInstance?.to("admins").emit(event, payload);
}

function notifyUser(userId, event, payload) {
  ioInstance?.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initSockets, notifyAdmins, notifyUser };
