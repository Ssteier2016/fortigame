const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  socketId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  cards: [{ type: mongoose.Schema.Types.ObjectId, ref: "Card" }],
  x: { type: Number, default: 100 },
  y: { type: Number, default: 100 },
});

module.exports = mongoose.model("Player", playerSchema);
