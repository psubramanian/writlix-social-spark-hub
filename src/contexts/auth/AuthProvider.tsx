
import React from "react";
import AuthContext from "./AuthContext";
import { useAuthProvider } from "./useAuthProvider";

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const authValues = useAuthProvider();

  return (
    <AuthContext.Provider value={authValues}>
      {children}
    </AuthContext.Provider>
  );
};
