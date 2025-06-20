import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext } from 'react';
import { API_BASE_URL } from '../configs'
import axios from 'axios';
import { ImageService } from '../../services/ImageService';

type User = {
  // Dados básicos do usuário (tabela usuarios)
  user_id: number;          // ID da tabela usuarios
  usuario: string;
  nome: string;
  email: string;
  tipo: 'client' | 'partner';
  id_endereco?: number | null;  // FK para tabela enderecos
  
  // IDs das tabelas relacionadas
  client_id?: number;       // ID da tabela clientes (se tipo = 'client')
  partner_id?: number;      // ID da tabela parceiros (se tipo = 'partner')
  
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
  
  // Imagem de perfil
  profileImageUri?: string;   // URI da imagem de perfil atual
  
  // Endereço
  endereco?: {
    id: number;
    cep: string;
    estado: string;
    cidade: string;
    bairro: string;
    rua: string;
    numero: number | null;
    complemento?: string | null;
    latitude: number;
    longitude: number;
  };
};

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (userData: any, type: 'client' | 'partner') => Promise<void>;
  logout: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  updateProfileImage: (imageUri: string) => void;
  clearProfileImage: () => void;
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
        
        // Inicializar cache de imagens quando carregar usuário
        try {
          await ImageService.initializeCache();
        } catch (error) {
          console.error('Erro ao inicializar cache de imagens:', error);
        }
      }
    };
    loadUser();
  }, []);

  const login = async (apiResponse: any, type: 'client' | 'partner') => {
    // ===== LOGS DE DEBUG ADICIONADOS =====
    console.log('=== LOGIN DEBUG ===');
    console.log('Tipo de usuário:', type);
    console.log('Resposta da API:', JSON.stringify(apiResponse, null, 2));
    // ===== FIM DOS LOGS ADICIONADOS =====

    const baseUser = {
      user_id: apiResponse.id_usuarios.id,
      usuario: apiResponse.id_usuarios.usuario,
      nome: apiResponse.id_usuarios.nome,
      email: apiResponse.id_usuarios.email,
      tipo: type,
    };
  
    const userToStore = type === 'client' 
      ? {
          ...baseUser,
          client_id: apiResponse.id, // campo adicionado do id do cliente
          cpf: apiResponse.cpf,
          sexo: apiResponse.sexo,
          data_nascimento: apiResponse.data_nascimento
        }
      : {
          ...baseUser,
          partner_id: apiResponse.id, // campo adicionado do id do parceiro
          cnpj: apiResponse.cnpj,
          materiais: apiResponse.materiais.map((m: any) => ({
            id: m.id,
            nome: m.nome,
            descricao: m.descricao,
            preco: m.preco
          }))
        };

    console.log('Objeto userToStore que será salvo:', JSON.stringify(userToStore, null, 2));
    
    // ===== LOGS DE DEBUG ADICIONADOS =====
    console.log('Usuário salvo no contexto:', JSON.stringify(userToStore, null, 2));
    console.log('=== FIM LOGIN DEBUG ===');
    // ===== FIM DOS LOGS ADICIONADOS =====
  
    await AsyncStorage.setItem('user', JSON.stringify(userToStore));
    setUser(userToStore);
    setIsAuthenticated(true);

    // Inicializar cache de imagens após login
    try {
      await ImageService.initializeCache();
    } catch (error) {
      console.error('Erro ao inicializar cache de imagens:', error);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return false;
  
    try {
      const endpoint = user.tipo === 'client' 
        ? `${API_BASE_URL}/clientes/${user.client_id}/` 
        : `${API_BASE_URL}/parceiros/${user.partner_id}/`;
      
      const response = await axios.put(
        endpoint,
        {
          senha_atual: currentPassword,
          nova_senha: newPassword
        }
      );
  
      return response.status === 200;
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      return false;
    }
  };

  const updateProfileImage = (imageUri: string) => {
    if (user) {
      const updatedUser = { ...user, profileImageUri: imageUri };
      setUser(updatedUser);
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const clearProfileImage = () => {
    if (user) {
      const updatedUser = { ...user, profileImageUri: undefined };
      setUser(updatedUser);
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <UserContext.Provider value={
      { user, setUser, login, logout, updatePassword, updateProfileImage, clearProfileImage, isAuthenticated }
      }>
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
}