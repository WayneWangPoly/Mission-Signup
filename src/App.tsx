
import { Routes, Route, Navigate } from "react-router-dom"
import DriverSignup from "./pages/DriverSignup"
import AdminMap from "./pages/AdminMap"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/driver-signup" />} />
      <Route path="/driver-signup" element={<DriverSignup />} />
      <Route path="/admin/reward-map" element={<AdminMap />} />
    </Routes>
  )
}
