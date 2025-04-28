const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  cardId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  attackLife: { type: Number, required: true },
  experience: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  owner: { type: String },
});

module.exports = mongoose.model("Card", cardSchema);
