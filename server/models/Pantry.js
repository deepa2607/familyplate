// models/Pantry.js
const mongoose = require("mongoose");

const pantrySchema = new mongoose.Schema({
  householdId:  { type: mongoose.Schema.Types.ObjectId, ref: "Household", required: true },
  name:         { type: String, required: true, trim: true },
  quantity:     { type: Number, default: 0, min: 0 },
  unit:         { type: String, default: "pcs" },
  category:     { type: String, default: "Other" },
  minQuantity:  { type: Number, default: 2 },  // threshold for low-stock alert
  price:        { type: Number, default: 0 },
  expiryDate:   { type: Date, default: null },
  brand:        { type: String, default: "" },
  notes:        { type: String, default: "" },
  addedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

// Compound index - fast per-household queries
pantrySchema.index({ householdId: 1, name: 1 });

module.exports = mongoose.model("Pantry", pantrySchema);