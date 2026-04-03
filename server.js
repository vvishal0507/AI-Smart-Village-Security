const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let latestEvent = {
  id: 0,
  status: "SAFE",
  score: 0,
  message: "System started. Waiting for activity...",
  location: "Village Entrance",
  timestamp: new Date().toISOString()
};

const history = [];

function saveEvent(event) {
  latestEvent = event;
  history.push(event);

  if (history.length > 100) {
    history.shift();
  }

  io.emit("security_event", event);
}

function buildManualEvent(type) {
  const now = new Date().toISOString();

  if (type === "ALERT") {
    return {
      id: Date.now(),
      status: "ALERT",
      score: 96.5,
      message: "Manual demo alert triggered. Suspicious activity detected near Village Entrance.",
      location: "Village Entrance",
      rawData: {
        source: "manual-control",
        demoMode: true
      },
      timestamp: now
    };
  }

  return {
    id: Date.now(),
    status: "SAFE",
    score: 22.4,
    message: "Manual demo safe event triggered. Normal village activity detected.",
    location: "Temple Street",
    rawData: {
      source: "manual-control",
      demoMode: true
    },
    timestamp: now
  };
}

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AI Smart Village Security backend running"
  });
});

app.get("/api/latest", (req, res) => {
  res.json({
    success: true,
    event: latestEvent,
    history: history.slice(-20).reverse()
  });
});

app.post("/api/detect", (req, res) => {
  const { status, score, message, location, rawData } = req.body;

  if (!status || typeof score !== "number" || !message) {
    return res.status(400).json({
      success: false,
      message: "status, score, and message are required"
    });
  }

  const event = {
    id: Date.now(),
    status,
    score,
    message,
    location: location || "Village Entrance",
    rawData: rawData || {},
    timestamp: new Date().toISOString()
  };

  saveEvent(event);

  res.json({
    success: true,
    message: "Detection event received",
    event
  });
});

app.post("/api/manual/safe", (req, res) => {
  const event = buildManualEvent("SAFE");
  saveEvent(event);

  res.json({
    success: true,
    message: "Manual SAFE event triggered",
    event
  });
});

app.post("/api/manual/alert", (req, res) => {
  const event = buildManualEvent("ALERT");
  saveEvent(event);

  res.json({
    success: true,
    message: "Manual ALERT event triggered",
    event
  });
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.emit("security_event", latestEvent);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});