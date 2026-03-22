// models/Purchase.js
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name:     { type: String },
  quantity: { type: Number, default: 1 },
  unit:     { type: String, default: "pcs" },
  price:    { type: Number, default: 0 },
  category: { type: String, default: "Grocery" },
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  householdId:       { type: mongoose.Schema.Types.ObjectId, ref: "Household", required: true },
  description:       { type: String, default: "" },
  category:          { type: String, default: "Grocery" },
  paidBy:            { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  paidByName:        { type: String, default: "" },
  // KEY: "shared" = split among members, "individual" = personal, never appears in pending
  splitType:         { type: String, enum: ["shared", "individual"], default: "shared" },
  amount:            { type: Number, required: true, min: 0 },
  totalAmount:       { type: Number, required: true, min: 0 },
  items:             [itemSchema],
  sharedBy:          [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  date:              { type: Date, default: Date.now },
  settled:           { type: Boolean, default: false },
  settledAt:         { type: Date, default: null },
  paymentMethod:     { type: String, default: "cash" },
  razorpayPaymentId: { type: String, default: null },
}, { timestamps: true });

// Index for fast household queries
purchaseSchema.index({ householdId: 1, createdAt: -1 });
purchaseSchema.index({ householdId: 1, settled: 1 });

module.exports = mongoose.model("Purchase", purchaseSchema);