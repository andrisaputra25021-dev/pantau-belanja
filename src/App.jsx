import { Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Recap from "./pages/Recap";
import AddTransaction from "./pages/AddTransaction";
import Category from "./pages/Category";
import Profile from "./pages/Profile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/recap" element={<Recap />} />
      <Route path="/add" element={<AddTransaction />} />
      <Route path="/category" element={<Category />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;
