"use client";

import { createContext, useContext } from "react";

const AuthContext = createContext<string | null>(null);

export function AuthProvider({
  userEmail,
  children,
}: {
  userEmail: string | null;
  children: React.ReactNode;
}) {
  return (
    <AuthContext.Provider value={userEmail}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
