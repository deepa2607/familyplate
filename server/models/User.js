// models/User.js
const mongoose = require("mongoose");

const securityQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer:   { type: String, required: true }, // stored lowercase trimmed
}, { _id: false });

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ["admin", "member"], default: "member" },
  household: { type: mongoose.Schema.Types.ObjectId, ref: "Household", default: null },
  phone:     { type: String, default: "" },
  avatar:    { type: String, default: "" },
  status: { type: String, default: 'active', enum: ['pending', 'active'] },


  securityQuestions: [securityQuestionSchema],
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);