import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";      // Admin
import UserDashboard from "./pages/UserDashboard"; // Usuario

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Dashboard ADMIN */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Dashboard USER */}
        <Route path="/user-dashboard" element={<UserDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
