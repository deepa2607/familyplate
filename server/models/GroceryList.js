// models/GroceryList.js
const mongoose = require("mongoose");

const groceryItemSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  quantity:   { type: Number, default: 1 },
  unit:       { type: String, default: "pcs" },
  category:   { type: String, default: "Grocery" },
  price:      { type: Number, default: 0 },
  checked:    { type: Boolean, default: false },
  addedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { _id: true });

const groceryListSchema = new mongoose.Schema({
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: "Household", required: true },
  name:        { type: String, default: "Weekly List" },
  items:       [groceryItemSchema],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

groceryListSchema.index({ householdId: 1, isActive: 1 });

module.exports = mongoose.model("GroceryList", groceryListSchema);