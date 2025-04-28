const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

mongoose.set("strictQuery", true);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/test", (req, res) => {
  console.log(`[${new Date().toISOString()}] Solicitud recibida en /test`);
  res.send("Servidor funcionando correctamente");
});

try {
  app.use(express.static("../templates"));
  console.log("Configurado para servir archivos estáticos desde ../templates");
} catch (err) {
  console.error("Error al configurar archivos estáticos:", err);
}

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => {
    console.error("Error MongoDB:", err);
    process.exit(1);
  });

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Ruta no encontrada: ${req.url}`);
  res.status(404).send("404: Recurso no encontrado");
});

app.use((err, req, res, next) => {
  console.error("Error del servidor:", err.stack);
  res.status(500).send("500: Error interno del servidor");
});

const players = {};

io.on("connection", (socket) => {
  console.log("Jugador conectado:", socket.id);

  socket.on("newPlayer", (data) => {
    players[socket.id] = { x: data.x, y: data.y, sprite: data.sprite || "player" };
    io.emit("updatePlayers", players);
  });

  socket.on("updatePosition", (position) => {
    if (players[socket.id]) {
      players[socket.id].x = position.x;
      players[socket.id].y = position.y;
      io.emit("updatePlayers", players);
    }
  });

  socket.on("collectCard", async (cardData) => {
    try {
      const Card = require("./models/Card");
      const Player = require("./models/Player");
      const card = new Card({
        cardId: cardData.cardId,
        name: cardData.name,
        attackLife: cardData.attackLife,
        owner: socket.id,
      });
      await card.save();
      await Player.findOneAndUpdate(
        { socketId: socket.id },
        { $push: { cards: card._id }, name: `Jugador${socket.id.slice(0, 4)}` },
        { upsert: true }
      );
    } catch (err) {
      console.error("Error al guardar carta:", err);
    }
  });

  socket.on("combatResult", async (data) => {
    try {
      const Card = require("./models/Card");
      const card = await Card.findOne({ cardId: data.winner.cardId, owner: socket.id });
      if (card) {
        card.experience += data.expGained;
        if (card.experience >= 600) card.level = 4;
        else if (card.experience >= 300) card.level = 3;
        else if (card.experience >= 100) card.level = 2;
        card.attackLife = card.attackLife + (card.level - 1) * 10;
        await card.save();
      }
    } catch (err) {
      console.error("Error al actualizar carta:", err);
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("updatePlayers", players);
    console.log("Jugador desconectado:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});

process.on("uncaughtException", (err) => {
  console.error("Error no capturado:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Promesa rechazada no manejada:", err);
});
