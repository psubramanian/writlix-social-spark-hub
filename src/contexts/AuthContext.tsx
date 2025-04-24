
import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  linkedInConnected: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (provider: 'google' | 'linkedin') => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('writlix-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (provider: 'google' | 'linkedin') => {
    setIsLoading(true);
    try {
      // This is a mock login for demo purposes
      // In a real app, you would implement OAuth with the provider
      const mockUser = {
        id: `user-${Math.random().toString(36).substr(2, 9)}`,
        name: provider === 'google' ? 'Jane Doe' : 'John Smith',
        email: provider === 'google' ? 'jane@example.com' : 'john@example.com',
        avatar: `https://i.pravatar.cc/150?u=${Math.random()}`,
        linkedInConnected: provider === 'linkedin',
      };
      
      setUser(mockUser);
      localStorage.setItem('writlix-user', JSON.stringify(mockUser));
      
      console.log(`Logged in with ${provider}`);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    setIsLoading(true);
    try {
      setUser(null);
      localStorage.removeItem('writlix-user');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
