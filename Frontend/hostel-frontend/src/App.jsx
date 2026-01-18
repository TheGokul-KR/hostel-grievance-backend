import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import StudentNoticeBoard from "./pages/StudentNoticeBoard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import StudentDashboard from "./pages/StudentDashboard";
import StudentSubmitComplaint from "./pages/StudentSubmitComplaint";
import StudentComplaintHistory from "./pages/StudentComplaintHistory";
import StudentRaggingComplaint from "./pages/StudentRaggingComplaint";

import TechnicianDashboard from "./pages/TechnicianDashboard";
import TechnicianRadar from "./pages/TechnicianRadar";

import AdminDashboard from "./pages/AdminDashboard";
import AdminNotices from "./pages/AdminNotices";
import AdminManageStudents from "./pages/AdminManageStudents";
import AdminManageTechnicians from "./pages/AdminManageTechnicians";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ================= PROTECTED ROUTE =================
const ProtectedRoute = ({ children, allowed }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role")?.toLowerCase();

  if (!token) return <Navigate to="/" replace />;

  if (allowed && !allowed.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* STUDENT */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowed={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/submit"
          element={
            <ProtectedRoute allowed={["student"]}>
              <StudentSubmitComplaint />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/history"
          element={
            <ProtectedRoute allowed={["student"]}>
              <StudentComplaintHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/ragging"
          element={
            <ProtectedRoute allowed={["student"]}>
              <StudentRaggingComplaint />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/notices"
          element={
            <ProtectedRoute allowed={["student"]}>
              <StudentNoticeBoard />
            </ProtectedRoute>
          }
        />

        {/* TECHNICIAN */}
        <Route
          path="/technician"
          element={
            <ProtectedRoute allowed={["technician"]}>
              <TechnicianDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/technician/radar"
          element={
            <ProtectedRoute allowed={["technician"]}>
              <TechnicianRadar />
            </ProtectedRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowed={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/notices"
          element={
            <ProtectedRoute allowed={["admin"]}>
              <AdminNotices />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowed={["admin"]}>
              <AdminManageStudents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/technicians"
          element={
            <ProtectedRoute allowed={["admin"]}>
              <AdminManageTechnicians />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
