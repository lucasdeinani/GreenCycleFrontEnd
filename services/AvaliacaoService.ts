import axios from 'axios';
import { API_BASE_URL } from '../app/configs';

// Tipos para as avaliações
export interface Avaliacao {
  id: number;
  id_coletas: number;
  cliente_id: number;
  cliente_nome: string;
  parceiro_id: number;
  parceiro_nome: string;
  material_nome: string;
  nota_parceiros: number;
  descricao_parceiros?: string;
  nota_clientes: number;
  descricao_clientes?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface EstatisticasCliente {
  cliente_id: number;
  cliente_nome: string;
  total_avaliacoes: number;
  media_notas: number;
  notas_detalhadas: {
    [key: string]: number;
  };
  total_coletas_finalizadas: number;
}

export interface EstatisticasParceiro {
  parceiro_id: number;
  parceiro_nome: string;
  total_avaliacoes: number;
  media_notas: number;
  notas_detalhadas: {
    [key: string]: number;
  };
  total_coletas_finalizadas: number;
}

export interface AvaliarParceiroRequest {
  coleta_id: number;
  cliente_id: number;
  nota_parceiros: number;
  descricao_parceiros?: string;
}

export interface AvaliarClienteRequest {
  coleta_id: number;
  parceiro_id: number;
  nota_clientes: number;
  descricao_clientes?: string;
}

export class AvaliacaoService {
  // Cliente avalia parceiro
  static async avaliarParceiro(dados: AvaliarParceiroRequest): Promise<{ message: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/avaliacoes/avaliar-parceiro/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao avaliar parceiro:', error);
      throw error;
    }
  }

  // Parceiro avalia cliente
  static async avaliarCliente(dados: AvaliarClienteRequest): Promise<{ message: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/avaliacoes/avaliar-cliente/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao avaliar cliente:', error);
      throw error;
    }
  }

  // Buscar estatísticas do cliente
  static async buscarEstatisticasCliente(clienteId: number): Promise<EstatisticasCliente> {
    try {
      console.log(`📊 [AvaliacaoService] Buscando estatísticas do cliente ID: ${clienteId}`);
      console.log(`🌐 [AvaliacaoService] URL: ${API_BASE_URL}/avaliacoes/estatisticas-cliente/${clienteId}/`);
      
      const response = await axios.get(`${API_BASE_URL}/avaliacoes/estatisticas-cliente/${clienteId}/`);
      
      console.log('✅ [AvaliacaoService] Estatísticas do cliente recebidas:', response.data);
      console.log(`📈 [AvaliacaoService] Média de notas: ${response.data.media_notas}`);
      console.log(`🔢 [AvaliacaoService] Total de avaliações: ${response.data.total_avaliacoes}`);
      
      return response.data;
    } catch (error) {
      console.error('❌ [AvaliacaoService] Erro ao buscar estatísticas do cliente:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('📡 [AvaliacaoService] Status da resposta:', axiosError.response?.status);
        console.error('📡 [AvaliacaoService] Dados da resposta:', axiosError.response?.data);
        console.error('📡 [AvaliacaoService] URL chamada:', axiosError.config?.url);
      }
      throw error;
    }
  }

  // Buscar estatísticas do parceiro
  static async buscarEstatisticasParceiro(parceiroId: number): Promise<EstatisticasParceiro> {
    try {
      console.log(`📊 [AvaliacaoService] Buscando estatísticas do parceiro ID: ${parceiroId}`);
      console.log(`🌐 [AvaliacaoService] URL: ${API_BASE_URL}/avaliacoes/estatisticas-parceiro/${parceiroId}/`);
      
      const response = await axios.get(`${API_BASE_URL}/avaliacoes/estatisticas-parceiro/${parceiroId}/`);
      
      console.log('✅ [AvaliacaoService] Estatísticas do parceiro recebidas:', response.data);
      console.log(`📈 [AvaliacaoService] Média de notas: ${response.data.media_notas}`);
      console.log(`🔢 [AvaliacaoService] Total de avaliações: ${response.data.total_avaliacoes}`);
      
      return response.data;
    } catch (error) {
      console.error('❌ [AvaliacaoService] Erro ao buscar estatísticas do parceiro:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('📡 [AvaliacaoService] Status da resposta:', axiosError.response?.status);
        console.error('📡 [AvaliacaoService] Dados da resposta:', axiosError.response?.data);
        console.error('📡 [AvaliacaoService] URL chamada:', axiosError.config?.url);
      }
      throw error;
    }
  }

  // Listar todas as avaliações com paginação
  static async listarAvaliacoes(page: number = 1): Promise<{ 
    count: number; 
    next: string | null; 
    previous: string | null; 
    results: Avaliacao[] 
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/avaliacoes/`, {
        params: { page }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao listar avaliações:', error);
      throw error;
    }
  }

  // Buscar avaliação por ID
  static async buscarAvaliacaoPorId(id: number): Promise<Avaliacao> {
    try {
      const response = await axios.get(`${API_BASE_URL}/avaliacoes/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar avaliação por ID:', error);
      throw error;
    }
  }

  // Buscar avaliações por cliente (para que cliente veja suas avaliações feitas)
  static async buscarAvaliacoesPorCliente(clienteId: number): Promise<Avaliacao[]> {
    try {
      console.log(`🔍 [AvaliacaoService] Buscando avaliações do cliente ID: ${clienteId}`);
      const response = await axios.get(`${API_BASE_URL}/avaliacoes/`);
      console.log('📊 [AvaliacaoService] Resposta completa da API:', response.data);
      
      // Verificar se a resposta tem a estrutura esperada
      let avaliacoes: Avaliacao[] = [];
      if (response.data && Array.isArray(response.data.results)) {
        avaliacoes = response.data.results;
        console.log(`📋 [AvaliacaoService] Total de avaliações encontradas: ${avaliacoes.length}`);
      } else if (response.data && Array.isArray(response.data)) {
        avaliacoes = response.data;
        console.log(`📋 [AvaliacaoService] Resposta é array direto, total: ${avaliacoes.length}`);
      } else {
        console.warn('⚠️ [AvaliacaoService] Estrutura de resposta inesperada:', response.data);
        return [];
      }
      
      const avaliacoesCliente = avaliacoes.filter((avaliacao: Avaliacao) => 
        avaliacao.cliente_id === clienteId
      );
      console.log(`✅ [AvaliacaoService] Avaliações do cliente ${clienteId}: ${avaliacoesCliente.length}`);
      
      return avaliacoesCliente;
    } catch (error) {
      console.error('❌ [AvaliacaoService] Erro ao buscar avaliações do cliente:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('📡 [AvaliacaoService] Status da resposta:', axiosError.response?.status);
        console.error('📡 [AvaliacaoService] Dados da resposta:', axiosError.response?.data);
      }
      throw error;
    }
  }

  // Buscar avaliações por parceiro (para que parceiro veja suas avaliações feitas)
  static async buscarAvaliacoesPorParceiro(parceiroId: number): Promise<Avaliacao[]> {
    try {
      console.log(`🔍 [AvaliacaoService] Buscando avaliações do parceiro ID: ${parceiroId}`);
      const response = await axios.get(`${API_BASE_URL}/avaliacoes/`);
      console.log('📊 [AvaliacaoService] Resposta completa da API:', response.data);
      
      // Verificar se a resposta tem a estrutura esperada
      let avaliacoes: Avaliacao[] = [];
      if (response.data && Array.isArray(response.data.results)) {
        avaliacoes = response.data.results;
        console.log(`📋 [AvaliacaoService] Total de avaliações encontradas: ${avaliacoes.length}`);
      } else if (response.data && Array.isArray(response.data)) {
        avaliacoes = response.data;
        console.log(`📋 [AvaliacaoService] Resposta é array direto, total: ${avaliacoes.length}`);
      } else {
        console.warn('⚠️ [AvaliacaoService] Estrutura de resposta inesperada:', response.data);
        return [];
      }
      
      const avaliacoesParceiro = avaliacoes.filter((avaliacao: Avaliacao) => 
        avaliacao.parceiro_id === parceiroId
      );
      console.log(`✅ [AvaliacaoService] Avaliações do parceiro ${parceiroId}: ${avaliacoesParceiro.length}`);
      
      return avaliacoesParceiro;
    } catch (error) {
      console.error('❌ [AvaliacaoService] Erro ao buscar avaliações do parceiro:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('📡 [AvaliacaoService] Status da resposta:', axiosError.response?.status);
        console.error('📡 [AvaliacaoService] Dados da resposta:', axiosError.response?.data);
      }
      throw error;
    }
  }

  // Buscar coletas finalizadas disponíveis para avaliação (cliente)
  static async buscarColetasParaAvaliacaoCliente(clienteId: number): Promise<Avaliacao[]> {
    try {
      console.log(`🔍 [AvaliacaoService] Buscando coletas para avaliação do cliente ID: ${clienteId}`);
      const response = await axios.get(`${API_BASE_URL}/avaliacoes/`);
      console.log('📊 [AvaliacaoService] Resposta completa da API:', response.data);
      
      // Verificar se a resposta tem a estrutura esperada
      let avaliacoes: Avaliacao[] = [];
      if (response.data && Array.isArray(response.data.results)) {
        avaliacoes = response.data.results;
        console.log(`📋 [AvaliacaoService] Total de avaliações encontradas: ${avaliacoes.length}`);
      } else if (response.data && Array.isArray(response.data)) {
        avaliacoes = response.data;
        console.log(`📋 [AvaliacaoService] Resposta é array direto, total: ${avaliacoes.length}`);
      } else {
        console.warn('⚠️ [AvaliacaoService] Estrutura de resposta inesperada:', response.data);
        return [];
      }
      
      const coletasPendentes = avaliacoes.filter((avaliacao: Avaliacao) => 
        avaliacao.cliente_id === clienteId && avaliacao.nota_parceiros === 0
      );
      console.log(`✅ [AvaliacaoService] Coletas pendentes para avaliação do cliente ${clienteId}: ${coletasPendentes.length}`);
      
      return coletasPendentes;
    } catch (error) {
      console.error('❌ [AvaliacaoService] Erro ao buscar coletas para avaliação do cliente:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('📡 [AvaliacaoService] Status da resposta:', axiosError.response?.status);
        console.error('📡 [AvaliacaoService] Dados da resposta:', axiosError.response?.data);
      }
      throw error;
    }
  }

  // Buscar coletas finalizadas disponíveis para avaliação (parceiro)
  static async buscarColetasParaAvaliacaoParceiro(parceiroId: number): Promise<Avaliacao[]> {
    try {
      console.log(`🔍 [AvaliacaoService] Buscando coletas para avaliação do parceiro ID: ${parceiroId}`);
      const response = await axios.get(`${API_BASE_URL}/avaliacoes/`);
      console.log('📊 [AvaliacaoService] Resposta completa da API:', response.data);
      
      // Verificar se a resposta tem a estrutura esperada
      let avaliacoes: Avaliacao[] = [];
      if (response.data && Array.isArray(response.data.results)) {
        avaliacoes = response.data.results;
        console.log(`📋 [AvaliacaoService] Total de avaliações encontradas: ${avaliacoes.length}`);
      } else if (response.data && Array.isArray(response.data)) {
        avaliacoes = response.data;
        console.log(`📋 [AvaliacaoService] Resposta é array direto, total: ${avaliacoes.length}`);
      } else {
        console.warn('⚠️ [AvaliacaoService] Estrutura de resposta inesperada:', response.data);
        return [];
      }
      
      const coletasPendentes = avaliacoes.filter((avaliacao: Avaliacao) => 
        avaliacao.parceiro_id === parceiroId && avaliacao.nota_clientes === 0
      );
      console.log(`✅ [AvaliacaoService] Coletas pendentes para avaliação do parceiro ${parceiroId}: ${coletasPendentes.length}`);
      
      return coletasPendentes;
    } catch (error) {
      console.error('❌ [AvaliacaoService] Erro ao buscar coletas para avaliação do parceiro:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('📡 [AvaliacaoService] Status da resposta:', axiosError.response?.status);
        console.error('📡 [AvaliacaoService] Dados da resposta:', axiosError.response?.data);
      }
      throw error;
    }
  }
}