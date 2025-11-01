import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, AuthResponse } from "../types";
import apiClient from "../services/api";
import { initSocket, disconnectSocket } from "../services/socket";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (student_id: string, password: string) => Promise<void>;
  register: (
    student_id: string,
    password: string,
    name: string,
    role?: string
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      initSocket(storedToken);
    }
  }, []);

  const login = async (student_id: string, password: string) => {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/login", {
        student_id,
        password,
      });

      const { token: newToken, user: newUser } = response.data;

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      initSocket(newToken);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Login failed");
    }
  };

  const register = async (
    student_id: string,
    password: string,
    name: string,
    role?: string
  ) => {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/register", {
        student_id,
        password,
        name,
        role,
      });

      const { token: newToken, user: newUser } = response.data;

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      initSocket(newToken);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Registration failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
