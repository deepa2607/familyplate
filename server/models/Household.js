// models/Household.js
const mongoose = require("mongoose");

const householdSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  inviteCode:     { type: String, required: true, unique: true, uppercase: true },
  admin:          { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members:        [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  mode:           { type: String, enum: ["family", "split"], default: "family" },
  foodPreference: { type: String, default: "veg" },
  healthMode:     { type: String, default: "normal" },
  monthlyBudget:  { type: Number, default: 0 },
  currency:       { type: String, default: "INR" },
}, { timestamps: true });

module.exports = mongoose.model("Household", householdSchema);