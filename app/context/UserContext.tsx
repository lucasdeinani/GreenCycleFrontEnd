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
  
  // Telefone
  telefone?: string;        // Número de telefone formatado
  
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
  fetchUserPhone: () => Promise<string | null>;
  updateUserPhone: (phone: string) => Promise<boolean>;
  fetchOtherUserPhone: (userId: number) => Promise<string | null>;
  fetchPhoneByRelatedUserId: (relatedId: number, type: 'client' | 'partner') => Promise<string | null>;
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
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Inicializar cache de imagens quando carregar usuário
        try {
          await ImageService.initializeCache();
        } catch (error) {
          console.error('Erro ao inicializar cache de imagens:', error);
        }

        // Buscar telefone do usuário após carregar
        try {
          const phone = await fetchUserPhoneFromAPI(userData.user_id);
          if (phone && phone !== userData.telefone) {
            const updatedUser = { ...userData, telefone: phone };
            setUser(updatedUser);
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.log('Usuário ainda não possui telefone cadastrado');
        }
      }
    };
    loadUser();
  }, []);

  const fetchUserPhoneFromAPI = async (userId: number): Promise<string | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/telefones/${userId}/`);
      return response.data.numero;
    } catch (error) {
      console.log('Telefone não encontrado para o usuário');
      return null;
    }
  };

  // Nova função para buscar telefone de qualquer usuário (para WhatsApp)
  const fetchPhoneByUserId = async (userId: number): Promise<string | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/telefones/${userId}/`);
      return response.data.numero;
    } catch (error) {
      console.log('Telefone não encontrado para o usuário ID:', userId);
      return null;
    }
  };

  // Nova função para buscar user_id do cliente a partir do client_id
  const fetchClientUserId = async (clientId: number): Promise<number | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clientes/${clientId}/`);
      return response.data.id_usuarios?.id || response.data.id_usuarios || null;
    } catch (error) {
      console.log('Erro ao buscar user_id do cliente:', error);
      return null;
    }
  };

  // Nova função para buscar user_id do parceiro a partir do partner_id
  const fetchPartnerUserId = async (partnerId: number): Promise<number | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/parceiros/${partnerId}/`);
      return response.data.id_usuarios?.id || response.data.id_usuarios || null;
    } catch (error) {
      console.log('Erro ao buscar user_id do parceiro:', error);
      return null;
    }
  };

  // Nova função combinada para buscar telefone por client_id ou partner_id
  const fetchPhoneByRelatedId = async (relatedId: number, type: 'client' | 'partner'): Promise<string | null> => {
    try {
      const userId = type === 'client' 
        ? await fetchClientUserId(relatedId) 
        : await fetchPartnerUserId(relatedId);
      
      if (userId) {
        return await fetchPhoneByUserId(userId);
      }
      return null;
    } catch (error) {
      console.log(`Erro ao buscar telefone via ${type}_id:`, error);
      return null;
    }
  };

  const fetchUserPhone = async (): Promise<string | null> => {
    if (!user) return null;
    return await fetchUserPhoneFromAPI(user.user_id);
  };

  // Nova função exportada para buscar telefone de outros usuários
  const fetchOtherUserPhone = async (userId: number): Promise<string | null> => {
    return await fetchPhoneByUserId(userId);
  };

  // Nova função exportada para buscar telefone por client_id ou partner_id
  const fetchPhoneByRelatedUserId = async (relatedId: number, type: 'client' | 'partner'): Promise<string | null> => {
    return await fetchPhoneByRelatedId(relatedId, type);
  };

  const updateUserPhone = async (phone: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Remove formatação do telefone para enviar à API
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Primeiro, tenta atualizar o telefone
      try {
        await axios.put(`${API_BASE_URL}/telefones/${user.user_id}/`, {
          numero: cleanPhone
        });
      } catch (error: any) {
        // Se falhar (404), tenta criar um novo telefone
        if (error.response?.status === 404) {
          await axios.post(`${API_BASE_URL}/telefones/`, {
            id_usuarios: user.user_id,
            numero: cleanPhone
          });
        } else {
          throw error;
        }
      }

      // Busca o telefone atualizado/criado para obter o formato correto
      const updatedPhone = await fetchUserPhoneFromAPI(user.user_id);
      if (updatedPhone) {
        const updatedUser = { ...user, telefone: updatedPhone };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar telefone:', error);
      return false;
    }
  };

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

    // Buscar telefone do usuário após login
    try {
      const phone = await fetchUserPhoneFromAPI(userToStore.user_id);
      if (phone) {
        const updatedUser = { ...userToStore, telefone: phone };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.log('Usuário ainda não possui telefone cadastrado');
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
      { user, setUser, login, logout, updatePassword, updateProfileImage, clearProfileImage, fetchUserPhone, updateUserPhone, fetchOtherUserPhone, fetchPhoneByRelatedUserId, isAuthenticated }
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