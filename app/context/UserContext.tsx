import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext } from 'react';

type User = {
    id: number;
    usuario: string;
    nome: string;
    email: string;
    tipo: 'client' | 'partner';
    // Campos específicos de cliente
    cpf?: string;
    sexo?: string;
    data_nascimento?: string;
    // Campos específicos de parceiro
    cnpj?: string;
    materiais?: Array<{
      id: number;
      nome: string;
      descricao?: string;
      preco?: string;
    }>;
  };

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (userData: any, type: 'client' | 'partner') => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Carrega o usuário do AsyncStorage ao iniciar
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    };
    loadUser();
  }, []);

  const login = async (apiResponse: any, type: 'client' | 'partner') => {
    const baseUser = {
      id: apiResponse.id_usuarios.id,
      usuario: apiResponse.id_usuarios.usuario,
      nome: apiResponse.id_usuarios.nome,
      email: apiResponse.id_usuarios.email,
      tipo: type,
    };
  
    const userToStore = type === 'client' 
      ? {
          ...baseUser,
          cpf: apiResponse.cpf,
          sexo: apiResponse.sexo,
          data_nascimento: apiResponse.data_nascimento
        }
      : {
          ...baseUser,
          cnpj: apiResponse.cnpj,
          materiais: apiResponse.materiais.map((m: any) => ({
            id: m.id,
            nome: m.nome,
            descricao: m.descricao,
            preco: m.preco
          }))
        };
  
    await AsyncStorage.setItem('user', JSON.stringify(userToStore));
    setUser(userToStore);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout, isAuthenticated }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default function DummyComponent() {
    return null;
};