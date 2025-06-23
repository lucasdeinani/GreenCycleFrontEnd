import axios from 'axios';
import { API_BASE_URL } from '../configs';

// Interface completa para os detalhes da coleta
export interface ColetaDetalhes {
  id: number;
  cliente_id: number;
  cliente_nome: string;
  parceiro_id: number | null;
  parceiro_nome: string | null;
  material_nome: string;
  peso_material: string;
  quantidade_material: number | null;
  endereco_completo: string;
  status_solicitacao: string;
  observacoes_solicitacao: string | null;
  status_pagamento: string;
  valor_pagamento: number;
  criado_em: string;
  atualizado_em: string;
  imagens_coletas: any[];
  // Campos adicionais para cache de telefones
  cliente_telefone?: string | null;
  parceiro_telefone?: string | null;
  // Timestamps para controle de cache
  cache_timestamp?: number;
}

// Cache em memória para os detalhes das coletas
const coletasCache = new Map<number, ColetaDetalhes>();
const telefoneCache = new Map<number, string | null>();

// Tempo de validade do cache (5 minutos)
const CACHE_DURATION = 5 * 60 * 1000;

// Função para buscar telefone por user_id
const fetchTelefoneByUserId = async (userId: number): Promise<string | null> => {
  // Verificar cache de telefone primeiro
  if (telefoneCache.has(userId)) {
    return telefoneCache.get(userId) || null;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/telefones/${userId}/`);
    const telefone = response.data.numero;
    
    // Armazenar no cache
    telefoneCache.set(userId, telefone);
    
    return telefone;
  } catch (error) {
    console.log(`Telefone não encontrado para usuário ${userId}`);
    telefoneCache.set(userId, null);
    return null;
  }
};

// Função para buscar user_id do cliente
const fetchClienteUserId = async (clienteId: number): Promise<number | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/clientes/${clienteId}/`);
    return response.data.id_usuarios?.id || response.data.id_usuarios || null;
  } catch (error) {
    console.error('Erro ao buscar user_id do cliente:', error);
    return null;
  }
};

// Função para buscar user_id do parceiro
const fetchParceiroUserId = async (parceiroId: number): Promise<number | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/parceiros/${parceiroId}/`);
    return response.data.id_usuarios?.id || response.data.id_usuarios || null;
  } catch (error) {
    console.error('Erro ao buscar user_id do parceiro:', error);
    return null;
  }
};

// Função principal para buscar detalhes completos da coleta
export const fetchColetaDetalhes = async (coletaId: number, forceRefresh: boolean = false): Promise<ColetaDetalhes | null> => {
  // Verificar cache primeiro (se não for refresh forçado)
  if (!forceRefresh && coletasCache.has(coletaId)) {
    const cached = coletasCache.get(coletaId)!;
    const now = Date.now();
    
    // Verificar se o cache ainda é válido
    if (cached.cache_timestamp && (now - cached.cache_timestamp < CACHE_DURATION)) {
      console.log(`✅ Usando cache para coleta ${coletaId}`);
      return cached;
    }
  }

  try {
    console.log(`🔍 Buscando detalhes da coleta ${coletaId} na API`);
    
    // Buscar detalhes da coleta
    const response = await axios.get(`${API_BASE_URL}/coletas/${coletaId}/`);
    const coletaData: ColetaDetalhes = {
      ...response.data,
      cache_timestamp: Date.now()
    };

    console.log(`📋 Dados da coleta recebidos:`, {
      id: coletaData.id,
      cliente_id: coletaData.cliente_id,
      parceiro_id: coletaData.parceiro_id,
      cliente_nome: coletaData.cliente_nome,
      parceiro_nome: coletaData.parceiro_nome
    });

    // Buscar telefones - primeira tentativa: assumir que os IDs são user_ids diretamente
    const promises: Promise<void>[] = [];

    // Buscar telefone do cliente
    if (coletaData.cliente_id) {
      promises.push(
        (async () => {
          try {
            console.log(`📞 Tentando buscar telefone do cliente (user_id: ${coletaData.cliente_id})`);
            // Primeira tentativa: usar cliente_id como user_id diretamente
            if(coletaData.cliente_id) {
              coletaData.cliente_telefone = await fetchTelefoneByUserId(coletaData.cliente_id);
            }
            console.log(`✅ Telefone do cliente encontrado: ${coletaData.cliente_telefone}`);
          } catch (error) {
            console.log(`❌ Falha ao buscar telefone direto, tentando via endpoint de cliente...`);
            try {
              // Segunda tentativa: buscar user_id via endpoint de cliente
              if (coletaData.cliente_id) {
                const clienteUserId = await fetchClienteUserId(coletaData.cliente_id);
                if (clienteUserId) {
                  console.log(`🔍 User ID do cliente encontrado: ${clienteUserId}`);
                  coletaData.cliente_telefone = await fetchTelefoneByUserId(clienteUserId);
                  console.log(`✅ Telefone do cliente via user_id: ${coletaData.cliente_telefone}`);
                } else {
                  console.log(`❌ Não foi possível obter user_id do cliente`);
                  coletaData.cliente_telefone = null;
                }
              } else {
                console.log(`❌ Cliente ID não disponível`);
                coletaData.cliente_telefone = null;
              }
            } catch (secondError) {
              console.error('❌ Erro final ao buscar telefone do cliente:', secondError);
              coletaData.cliente_telefone = null;
            }
          }
        })()
      );
    }

    // Buscar telefone do parceiro
    if (coletaData.parceiro_id) {
      promises.push(
        (async () => {
          try {
            console.log(`📞 Tentando buscar telefone do parceiro (user_id: ${coletaData.parceiro_id})`);
            // Primeira tentativa: usar parceiro_id como user_id diretamente
            if(coletaData.parceiro_id) {
              coletaData.parceiro_telefone = await fetchTelefoneByUserId(coletaData.parceiro_id);
            }
            console.log(`✅ Telefone do parceiro encontrado: ${coletaData.parceiro_telefone}`);
          } catch (error) {
            console.log(`❌ Falha ao buscar telefone direto, tentando via endpoint de parceiro...`);
            try {
                             // Segunda tentativa: buscar user_id via endpoint de parceiro
               if (coletaData.parceiro_id) {
                 const parceiroUserId = await fetchParceiroUserId(coletaData.parceiro_id);
                 if (parceiroUserId) {
                   console.log(`🔍 User ID do parceiro encontrado: ${parceiroUserId}`);
                   coletaData.parceiro_telefone = await fetchTelefoneByUserId(parceiroUserId);
                   console.log(`✅ Telefone do parceiro via user_id: ${coletaData.parceiro_telefone}`);
                 } else {
                   console.log(`❌ Não foi possível obter user_id do parceiro`);
                   coletaData.parceiro_telefone = null;
                 }
               } else {
                 console.log(`❌ Parceiro ID não disponível`);
                 coletaData.parceiro_telefone = null;
               }
            } catch (secondError) {
              console.error('❌ Erro final ao buscar telefone do parceiro:', secondError);
              coletaData.parceiro_telefone = null;
            }
          }
        })()
      );
    }

    // Aguardar todas as buscas de telefone
    await Promise.all(promises);

    console.log(`📞 Resultado final dos telefones:`, {
      cliente_telefone: coletaData.cliente_telefone,
      parceiro_telefone: coletaData.parceiro_telefone
    });

    // Armazenar no cache
    coletasCache.set(coletaId, coletaData);

    return coletaData;
  } catch (error) {
    console.error('❌ Erro ao buscar detalhes da coleta:', error);
    return null;
  }
};

// Função para limpar cache
export const clearColetaCache = (coletaId?: number) => {
  if (coletaId) {
    coletasCache.delete(coletaId);
  } else {
    coletasCache.clear();
  }
};

// Função para limpar cache de telefones
export const clearTelefoneCache = (userId?: number) => {
  if (userId) {
    telefoneCache.delete(userId);
  } else {
    telefoneCache.clear();
  }
};

// Função para obter status do cache
export const getCacheStatus = () => {
  return {
    coletasCount: coletasCache.size,
    telefonesCount: telefoneCache.size,
    coletas: Array.from(coletasCache.keys()),
    telefones: Array.from(telefoneCache.keys())
  };
}; 