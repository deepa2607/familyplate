const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  household: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Household"
  },
  name: {
    type: String,
    required: true
  },
  age: Number,
  dietaryRestrictions: String
}, { timestamps: true });

module.exports = mongoose.model("Member", memberSchema);
