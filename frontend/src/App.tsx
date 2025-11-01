import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { LoginForm } from "./components/Auth/LoginForm";
import { RegisterForm } from "./components/Auth/RegisterForm";
import { Header } from "./components/Layout/Header";
import { Dashboard } from "./pages/Dashboard";
import { ClassroomManagement } from "./components/Classroom/ClassroomManagement";
import { ClassroomTimeline } from "./components/Classroom/ClassroomTimeline";
import { MyReservations } from "./pages/MyReservations";
import { Search } from "./pages/Search";
import { Notifications } from "./pages/Notifications";
import { Statistics } from "./pages/Statistics";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== "admin") return <Navigate to="/" />;
  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    {children}
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/classrooms"
              element={
                <AdminRoute>
                  <Layout>
                    <ClassroomManagement />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/statistics"
              element={
                <AdminRoute>
                  <Layout>
                    <Statistics />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/classrooms/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <ClassroomTimeline />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/reservations"
              element={
                <PrivateRoute>
                  <Layout>
                    <MyReservations />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/search"
              element={
                <PrivateRoute>
                  <Layout>
                    <Search />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <Layout>
                    <Notifications />
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
