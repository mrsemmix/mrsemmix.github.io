const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

// Import modules
const RoomManager = require("./src/room-manager");
const socketHandlers = require("./src/socket-handlers");

// Simple timestamp utility for consistent logging
function timestamp() {
  return `[${new Date().toISOString()}]`;
}

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${timestamp()} HTTP ${req.method} ${req.url}`);
  next();
});

// Serve static files from the game directory
app.use(express.static("public"));

// Initialize room manager
const roomManager = new RoomManager();

// Wrap the socket handler initialization with tracing
console.log(`${timestamp()} Initializing socket handlers`);
socketHandlers.initialize(io, roomManager);

// Add socket connection/disconnection logging
io.on("connection", (socket) => {
  console.log(`${timestamp()} Socket connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`${timestamp()} Socket disconnected: ${socket.id}`);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`${timestamp()} Server running on port ${PORT}`);
  console.log(`${timestamp()} http://localhost:${PORT}`);
});

// Graceful shutdown handling
function gracefulShutdown(signal) {
  console.log(
    `\n${timestamp()} ${signal} received. Shutting down gracefully...`
  );

  // Close the HTTP server
  server.close(() => {
    console.log(`${timestamp()} HTTP server closed.`);

    // Close Socket.IO connections
    io.close(() => {
      console.log(`${timestamp()} Socket.IO connections closed.`);
      process.exit(0);
    });

    // Force exit after 3 seconds if socket.io is hanging
    setTimeout(() => {
      console.log(
        `${timestamp()} Could not close all connections in time. Forcefully shutting down`
      );
      process.exit(1);
    }, 3000);
  });
}

// Handle signals
process.on("SIGINT", () => gracefulShutdown("SIGINT")); // Ctrl+C
process.on("SIGTERM", () => gracefulShutdown("SIGTERM")); // Docker stop

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (err) => {
  console.error(`${timestamp()} Uncaught Exception:`, err);
  gracefulShutdown("Uncaught Exception");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(
    `${timestamp()} Unhandled Rejection at:`,
    promise,
    "reason:",
    reason
  );
  // Don't shut down for unhandled rejections, just log them
});
