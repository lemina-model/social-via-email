"use client";

import { createContext, useContext } from "react";
import type { Person } from "../types";

const AuthContext = createContext<Person | null>(null);

export function AuthProvider({
  person,
  children,
}: {
  person: Person | null;
  children: React.ReactNode;
}) {
  return (
    <AuthContext.Provider value={person}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
