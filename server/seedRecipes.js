// server/seedRecipes.js
// Run this ONCE to populate your recipe database:
//   node seedRecipes.js

require("dotenv").config();
const mongoose = require("mongoose");
const Recipe = require("./models/Recipe");

const recipes = [

  // ─── BREAKFAST ───────────────────────────────────────────

  {
    name: "Oats Banana Protein Pancake",
    ingredients: [
      { name: "oats", quantity: 1, unit: "cup" },
      { name: "banana", quantity: 1, unit: "piece" },
      { name: "egg", quantity: 2, unit: "piece" },
      { name: "milk", quantity: 0.25, unit: "cup" }
    ],
    calories: 320,
    protein: 18,
    carbs: 42,
    fat: 8,
    tags: ["veg", "gym", "weightloss"],
    mealType: "breakfast"
  },

  {
    name: "Poha",
    ingredients: [
      { name: "poha", quantity: 1, unit: "cup" },
      { name: "onion", quantity: 1, unit: "piece" },
      { name: "oil", quantity: 1, unit: "tbsp" },
      { name: "mustard seeds", quantity: 0.5, unit: "tsp" },
      { name: "curry leaves", quantity: 5, unit: "piece" }
    ],
    calories: 250,
    protein: 5,
    carbs: 45,
    fat: 6,
    tags: ["veg", "normal", "jain"],
    mealType: "breakfast"
  },

  {
    name: "Besan Cheela",
    ingredients: [
      { name: "besan", quantity: 1, unit: "cup" },
      { name: "onion", quantity: 0.5, unit: "piece" },
      { name: "tomato", quantity: 0.5, unit: "piece" },
      { name: "oil", quantity: 1, unit: "tsp" }
    ],
    calories: 200,
    protein: 12,
    carbs: 28,
    fat: 5,
    tags: ["veg", "gym", "diabetic", "weightloss"],
    mealType: "breakfast"
  },

  {
    name: "Upma",
    ingredients: [
      { name: "semolina", quantity: 1, unit: "cup" },
      { name: "onion", quantity: 1, unit: "piece" },
      { name: "oil", quantity: 2, unit: "tbsp" },
      { name: "mustard seeds", quantity: 0.5, unit: "tsp" }
    ],
    calories: 280,
    protein: 7,
    carbs: 48,
    fat: 7,
    tags: ["veg", "normal"],
    mealType: "breakfast"
  },

  {
    name: "Moong Dal Chilla",
    ingredients: [
      { name: "moong dal", quantity: 1, unit: "cup" },
      { name: "ginger", quantity: 0.5, unit: "tsp" },
      { name: "green chilli", quantity: 1, unit: "piece" },
      { name: "oil", quantity: 1, unit: "tsp" }
    ],
    calories: 190,
    protein: 14,
    carbs: 26,
    fat: 3,
    tags: ["veg", "gym", "diabetic", "thyroid", "weightloss"],
    mealType: "breakfast"
  },

  {
    name: "Boiled Egg with Toast",
    ingredients: [
      { name: "egg", quantity: 3, unit: "piece" },
      { name: "bread", quantity: 2, unit: "slice" },
      { name: "butter", quantity: 1, unit: "tsp" }
    ],
    calories: 310,
    protein: 22,
    carbs: 28,
    fat: 12,
    tags: ["nonveg", "gym"],
    mealType: "breakfast"
  },

  // ─── LUNCH ───────────────────────────────────────────────

  {
    name: "Dal Tadka with Rice",
    ingredients: [
      { name: "dal", quantity: 1, unit: "cup" },
      { name: "rice", quantity: 1, unit: "cup" },
      { name: "onion", quantity: 1, unit: "piece" },
      { name: "tomato", quantity: 1, unit: "piece" },
      { name: "oil", quantity: 2, unit: "tbsp" },
      { name: "turmeric", quantity: 0.5, unit: "tsp" }
    ],
    calories: 420,
    protein: 16,
    carbs: 72,
    fat: 8,
    tags: ["veg", "normal", "thyroid"],
    mealType: "lunch"
  },

  {
    name: "Rajma Chawal",
    ingredients: [
      { name: "rajma", quantity: 1, unit: "cup" },
      { name: "rice", quantity: 1, unit: "cup" },
      { name: "onion", quantity: 1, unit: "piece" },
      { name: "tomato", quantity: 2, unit: "piece" },
      { name: "oil", quantity: 2, unit: "tbsp" }
    ],
    calories: 460,
    protein: 18,
    carbs: 76,
    fat: 9,
    tags: ["veg", "normal", "gym"],
    mealType: "lunch"
  },

  {
    name: "Palak Paneer with Roti",
    ingredients: [
      { name: "paneer", quantity: 200, unit: "g" },
      { name: "spinach", quantity: 2, unit: "cup" },
      { name: "flour", quantity: 1, unit: "cup" },
      { name: "onion", quantity: 1, unit: "piece" },
      { name: "tomato", quantity: 1, unit: "piece" },
      { name: "oil", quantity: 2, unit: "tbsp" }
    ],
    calories: 480,
    protein: 22,
    carbs: 52,
    fat: 18,
    tags: ["veg", "gym", "thyroid"],
    mealType: "lunch"
  },

  {
    name: "Chicken Curry with Rice",
    ingredients: [
      { name: "chicken", quantity: 250, unit: "g" },
      { name: "rice", quantity: 1, unit: "cup" },
      { name: "onion", quantity: 2, unit: "piece" },
      { name: "tomato", quantity: 2, unit: "piece" },
      { name: "oil", quantity: 3, unit: "tbsp" }
    ],
    calories: 520,
    protein: 38,
    carbs: 60,
    fat: 14,
    tags: ["nonveg", "gym", "normal"],
    mealType: "lunch"
  },

  {
    name: "Chole Bhature",
    ingredients: [
      { name: "chickpeas", quantity: 1, unit: "cup" },
      { name: "flour", quantity: 2, unit: "cup" },
      { name: "onion", quantity: 1, unit: "piece" },
      { name: "tomato", quantity: 2, unit: "piece" },
      { name: "oil", quantity: 4, unit: "tbsp" }
    ],
    calories: 620,
    protein: 18,
    carbs: 90,
    fat: 22,
    tags: ["veg", "normal"],
    mealType: "lunch"
  },

  {
    name: "Diabetic-Friendly Dal Khichdi",
    ingredients: [
      { name: "moong dal", quantity: 0.5, unit: "cup" },
      { name: "rice", quantity: 0.5, unit: "cup" },
      { name: "turmeric", quantity: 0.5, unit: "tsp" },
      { name: "oil", quantity: 1, unit: "tsp" },
      { name: "ginger", quantity: 0.5, unit: "tsp" }
    ],
    calories: 300,
    protein: 12,
    carbs: 52,
    fat: 4,
    tags: ["veg", "diabetic", "thyroid", "weightloss"],
    mealType: "lunch"
  },

  {
    name: "Egg Fried Rice",
    ingredients: [
      { name: "rice", quantity: 1, unit: "cup" },
      { name: "egg", quantity: 3, unit: "piece" },
      { name: "onion", quantity: 1, unit: "piece" },
      { name: "oil", quantity: 2, unit: "tbsp" }
    ],
    calories: 420,
    protein: 20,
    carbs: 58,
    fat: 12,
    tags: ["nonveg", "gym", "normal"],
    mealType: "lunch"
  },

  {
    name: "Aloo Gobi with Roti",
    ingredients: [
      { name: "potato", quantity: 2, unit: "piece" },
      { name: "cauliflower", quantity: 1, unit: "cup" },
      { name: "flour", quantity: 1, unit: "cup" },
      { name: "oil", quantity: 2, unit: "tbsp" },
      { name: "turmeric", quantity: 0.5, unit: "tsp" }
    ],
    calories: 380,
    protein: 9,
    carbs: 65,
    fat: 10,
    tags: ["veg", "normal", "jain"],
    mealType: "lunch"
  },

  {
    name: "Tofu Stir Fry with Rice",
    ingredients: [
      { name: "tofu", quantity: 200, unit: "g" },
      { name: "rice", quantity: 1, unit: "cup" },
      { name: "onion", quantity: 1, unit: "piece" },
      { name: "oil", quantity: 2, unit: "tbsp" }
    ],
    calories: 370,
    protein: 20,
    carbs: 52,
    fat: 10,
    tags: ["vegan", "gym", "weightloss"],
    mealType: "lunch"
  },

  // ─── DINNER ───────────────────────────────────────────────

  {
    name: "Dal Makhani",
    ingredients: [
      { name: "urad dal", quantity: 1, unit: "cup" },
      { name: "rajma", quantity: 0.25, unit: "cup" },
      { name: "butter", quantity: 2, unit: "tbsp" },
      { name: "tomato", quantity: 2, unit: "piece" },
      { name: "onion", quantity: 1, unit: "piece" },
      { name: "milk", quantity: 0.5, unit: "cup" }
    ],
    calories: 400,
    protein: 18,
    carbs: 58,
    fat: 12,
    tags: ["veg", "normal", "gym"],
    mealType: "dinner"
  },

  {
    name: "Grilled Chicken with Salad",
    ingredients: [
      { name: "chicken", quantity: 250, unit: "g" },
      { name: "tomato", quantity: 1, unit: "piece" },
      { name: "onion", quantity: 0.5, unit: "piece" },
      { name: "oil", quantity: 1, unit: "tbsp" }
    ],
    calories: 320,
    protein: 42,
    carbs: 8,
    fat: 12,
    tags: ["nonveg", "gym", "diabetic", "weightloss"],
    mealType: "dinner"
  },

  {
    name: "Paneer Bhurji with Roti",
    ingredients: [
      { name: "paneer", quantity: 200, unit: "g" },
      { name: "onion", quantity: 1, unit: "piece" },
      { name: "tomato", quantity: 1, unit: "piece" },
      { name: "flour", quantity: 1, unit: "cup" },
      { name: "oil", quantity: 2, unit: "tbsp" }
    ],
    calories: 450,
    protein: 24,
    carbs: 48,
    fat: 18,
    tags: ["veg", "gym", "normal"],
    mealType: "dinner"
  },

  {
    name: "Vegetable Soup",
    ingredients: [
      { name: "tomato", quantity: 2, unit: "piece" },
      { name: "carrot", quantity: 1, unit: "piece" },
      { name: "onion", quantity: 1, unit: "piece" },
      { name: "oil", quantity: 1, unit: "tsp" }
    ],
    calories: 120,
    protein: 4,
    carbs: 20,
    fat: 3,
    tags: ["veg", "vegan", "diabetic", "thyroid", "weightloss"],
    mealType: "dinner"
  },

  {
    name: "Fish Curry with Rice",
    ingredients: [
      { name: "fish", quantity: 250, unit: "g" },
      { name: "rice", quantity: 1, unit: "cup" },
      { name: "tomato", quantity: 2, unit: "piece" },
      { name: "onion", quantity: 1, unit: "piece" },
      { name: "oil", quantity: 3, unit: "tbsp" }
    ],
    calories: 480,
    protein: 34,
    carbs: 58,
    fat: 12,
    tags: ["nonveg", "thyroid", "normal"],
    mealType: "dinner"
  },

  {
    name: "Mixed Vegetable Sabzi with Roti",
    ingredients: [
      { name: "potato", quantity: 1, unit: "piece" },
      { name: "onion", quantity: 1, unit: "piece" },
      { name: "tomato", quantity: 1, unit: "piece" },
      { name: "flour", quantity: 1, unit: "cup" },
      { name: "oil", quantity: 2, unit: "tbsp" }
    ],
    calories: 340,
    protein: 8,
    carbs: 60,
    fat: 8,
    tags: ["veg", "normal", "jain"],
    mealType: "dinner"
  },

  {
    name: "Egg Curry with Roti",
    ingredients: [
      { name: "egg", quantity: 3, unit: "piece" },
      { name: "onion", quantity: 1, unit: "piece" },
      { name: "tomato", quantity: 2, unit: "piece" },
      { name: "flour", quantity: 1, unit: "cup" },
      { name: "oil", quantity: 2, unit: "tbsp" }
    ],
    calories: 390,
    protein: 22,
    carbs: 50,
    fat: 12,
    tags: ["nonveg", "normal", "gym"],
    mealType: "dinner"
  },

  {
    name: "Masoor Dal with Brown Rice",
    ingredients: [
      { name: "masoor dal", quantity: 1, unit: "cup" },
      { name: "rice", quantity: 1, unit: "cup" },
      { name: "onion", quantity: 1, unit: "piece" },
      { name: "tomato", quantity: 1, unit: "piece" },
      { name: "turmeric", quantity: 0.5, unit: "tsp" }
    ],
    calories: 380,
    protein: 18,
    carbs: 66,
    fat: 4,
    tags: ["veg", "diabetic", "thyroid", "weightloss"],
    mealType: "dinner"
  },

  {
    name: "Chicken Tikka (Grilled)",
    ingredients: [
      { name: "chicken", quantity: 300, unit: "g" },
      { name: "curd", quantity: 0.5, unit: "cup" },
      { name: "oil", quantity: 1, unit: "tbsp" }
    ],
    calories: 280,
    protein: 44,
    carbs: 4,
    fat: 10,
    tags: ["nonveg", "gym", "diabetic", "weightloss"],
    mealType: "dinner"
  },

  {
    name: "Kadhi Pakora with Rice",
    ingredients: [
      { name: "curd", quantity: 1, unit: "cup" },
      { name: "besan", quantity: 0.5, unit: "cup" },
      { name: "rice", quantity: 1, unit: "cup" },
      { name: "oil", quantity: 2, unit: "tbsp" },
      { name: "onion", quantity: 1, unit: "piece" }
    ],
    calories: 420,
    protein: 14,
    carbs: 64,
    fat: 12,
    tags: ["veg", "normal"],
    mealType: "dinner"
  }

];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ MongoDB Connected");

    await Recipe.deleteMany({});
    console.log("🗑  Cleared old recipes");

    await Recipe.insertMany(recipes);
    console.log(`🌱 Seeded ${recipes.length} recipes successfully`);

    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Seed error:", err);
    mongoose.disconnect();
  }
}

seed();