import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { api, setToken, getStoredToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    (async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user } = await api.me();
        setUser(user);
        connectSocket(token);
      } catch (e) {
        setToken(null);
      }
      setLoading(false);
    })();
    return () => socketRef.current?.disconnect();
  }, []);

  function connectSocket(token) {
    socketRef.current?.disconnect();
    socketRef.current = io(api.API_URL, { auth: { token } });
  }

  function login(token, user) {
    setToken(token);
    setUser(user);
    connectSocket(token);
  }

  function logout() {
    setToken(null);
    setUser(null);
    socketRef.current?.disconnect();
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, socket: socketRef }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
