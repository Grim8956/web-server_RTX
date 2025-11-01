import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { initSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = initSocket(token);
      setSocket(newSocket);

      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    } else {
      setSocket(null);
    }
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
