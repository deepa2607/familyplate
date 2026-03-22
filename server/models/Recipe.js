const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema({

  name: String,

  ingredients: [
    {
      name: String,
      quantity: Number,
      unit: String
    }
  ],

  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,

  tags: [String], // veg, gym, diabetic

  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "dinner"]
  }

}, { timestamps: true });

module.exports = mongoose.model("Recipe", recipeSchema);