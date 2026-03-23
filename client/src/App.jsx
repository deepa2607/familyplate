import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import GetStarted from "./pages/GetStarted";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Purchases from "./pages/Purchases";
import Pantry from "./pages/Pantry";
import Recipes from "./pages/Recipes";
import AIChat from "./pages/AIChat";
import Settings from "./pages/Settings";
import SetupHousehold from "./pages/SetupHousehold";
import Analytics from "./pages/Analytics";
import MealPlanner from "./pages/MealPlanner";
import GroceryList from "./pages/GroceryList";
import SmartCart from "./pages/SmartCart";
import AdminPanel from "./pages/AdminPanel";
import JoinHousehold from "./pages/JoinHousehold";
import NutritionDietPlan from "./pages/NutritionDietPlan";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
}

// Admin route — checks token AND role === "admin"
function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const u = user?.user || user;
    if (u?.role !== "admin") return <Navigate to="/dashboard" />;
  } catch {
    return <Navigate to="/login" />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GetStarted />} />
        <Route path="/login" element={<Login />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/register" element={<Register />} />
        <Route path="/setup" element={<PrivateRoute><SetupHousehold /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
        <Route path="/members" element={<PrivateRoute><Layout><Members /></Layout></PrivateRoute>} />
        <Route path="/purchases" element={<PrivateRoute><Layout><Purchases /></Layout></PrivateRoute>} />
        <Route path="/pantry" element={<PrivateRoute><Layout><Pantry /></Layout></PrivateRoute>} />
        <Route path="/recipes" element={<PrivateRoute><Layout><Recipes /></Layout></PrivateRoute>} />
        <Route path="/grocery" element={<PrivateRoute><Layout><GroceryList /></Layout></PrivateRoute>} />
        <Route path="/cart" element={<PrivateRoute><Layout><SmartCart /></Layout></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><Layout><AIChat /></Layout></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><Layout><Analytics /></Layout></PrivateRoute>} />
        <Route path="/planner" element={<PrivateRoute><Layout><MealPlanner /></Layout></PrivateRoute>} />
        <Route path="/nutrition" element={<PrivateRoute><Layout><NutritionDietPlan /></Layout></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Layout><Settings /></Layout></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        <Route path="/join" element={<JoinHousehold />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;