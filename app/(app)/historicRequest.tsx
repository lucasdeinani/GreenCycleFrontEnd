import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Leaf, Check, X, Clock, AlertTriangle, Info } from 'lucide-react-native';
import { useUser } from '../context/UserContext';
import axios from 'axios';

// URL base da API
const API_BASE_URL = 'http://192.168.0.86:8000/v1';

// Status map para tradução e cores
const STATUS_MAP = {
  "1": { label: "Pendente", color: "#FFC107", icon: Clock },
  "2": { label: "Aprovado", color: "#2196F3", icon: Info },
  "3": { label: "Em coleta", color: "#9C27B0", icon: Info },
  "4": { label: "Finalizado", color: "#4CAF50", icon: Check },
  "5": { label: "Cancelado", color: "#F44336", icon: X },
  "6": { label: "Falha", color: "#FF5722", icon: AlertTriangle },
};

export default function HistoricoColetasScreen() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coletas, setColetas] = useState([]);
  const [selectedColeta, setSelectedColeta] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  const fetchColetas = async () => {
    try {
      // Buscando coletas do cliente
      const response = await axios.get(`${API_BASE_URL}/coletas?id_clientes=${user.id}`);
      
      // Para cada coleta, buscar os detalhes relacionados
      const coletasDetalhadas = await Promise.all(
        response.data.map(async (coleta) => {
          // Buscar material
          const materialResponse = await axios.get(`${API_BASE_URL}/materiais/${coleta.id_materiais}`);
          
          // Buscar solicitação
          const solicitacaoResponse = await axios.get(`${API_BASE_URL}/solicitacoes/${coleta.id_solicitacoes}`);
          
          // Buscar endereço
          const enderecoResponse = await axios.get(`${API_BASE_URL}/enderecos/${coleta.id_enderecos}`);
          
          // Buscar pagamento
          const pagamentoResponse = await axios.get(`${API_BASE_URL}/pagamentos/${coleta.id_pagamentos}`);
          
          // Combinar todos os dados
          return {
            ...coleta,
            material: materialResponse.data,
            solicitacao: solicitacaoResponse.data,
            endereco: enderecoResponse.data,
            pagamento: pagamentoResponse.data,
          };
        })
      );
      
      // Ordenar primeiro por prioridade de status, depois por data de criação
      const getPrioridade = (status) => {
        const prioridades = {
          "3": 1, // Em coleta (maior prioridade)
          "1": 2, // Pendente
          "2": 3, // Aprovado
          "6": 4, // Falha
          "4": 5, // Finalizado
          "5": 6, // Cancelado (menor prioridade)
        };
        return prioridades[status] || 99; // Status desconhecidos ficam por último
      };
      
      const coletasOrdenadas = coletasDetalhadas.sort((a, b) => {
        // Primeiro ordenar por prioridade de status
        const prioridadeA = getPrioridade(a.solicitacao.estado_solicitacao);
        const prioridadeB = getPrioridade(b.solicitacao.estado_solicitacao);
        
        if (prioridadeA !== prioridadeB) {
          return prioridadeA - prioridadeB;
        }
        
        // Se o status for o mesmo, ordenar por data (mais recente primeiro)
        return new Date(b.criado_em) - new Date(a.criado_em);
      });
      
      setColetas(coletasOrdenadas);
    } catch (error) {
      console.error('Erro ao buscar coletas:', error);
      Alert.alert('Erro', 'Não foi possível carregar seu histórico de coletas.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchColetas();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchColetas();
  };

  const handleColetaPress = (coleta) => {
    setSelectedColeta(coleta);
    setModalVisible(true);
  };

  const handleCancelarColeta = async () => {
    if (!selectedColeta) return;
    
    // Verificar se a solicitação está pendente
    if (selectedColeta.solicitacao.estado_solicitacao !== "1") {
      Alert.alert(
        'Não é possível cancelar', 
        'Apenas solicitações pendentes podem ser canceladas.'
      );
      return;
    }
    
    setCancelLoading(true);
    
    try {
      // Atualizar o status da solicitação para "Cancelado"
      await axios.patch(
        `${API_BASE_URL}/solicitacoes/${selectedColeta.id_solicitacoes}`,
        { estado_solicitacao: "5" }  // 5 = Cancelado
      );
      
      // Atualizar a lista de coletas
      await fetchColetas();
      
      // Fechar o modal
      setModalVisible(false);
      setSelectedColeta(null);
      
      Alert.alert('Sucesso', 'Sua solicitação foi cancelada com sucesso.');
    } catch (error) {
      console.error('Erro ao cancelar solicitação:', error);
      Alert.alert('Erro', 'Não foi possível cancelar sua solicitação. Tente novamente.');
    } finally {
      setCancelLoading(false);
    }
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR') + ' às ' + 
           data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
  };
  
  const renderStatusBadge = (status) => {
    const statusInfo = STATUS_MAP[status] || { 
      label: "Desconhecido", 
      color: "#9E9E9E", 
      icon: Info 
    };
    const StatusIcon = statusInfo.icon;
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
        <StatusIcon size={14} color="#FFFFFF" />
        <Text style={styles.statusText}>{statusInfo.label}</Text>
      </View>
    );
  };

  // Renderizar mensagem quando não há coletas
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Leaf size={60} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>Nenhuma solicitação</Text>
      <Text style={styles.emptyText}>
        Você ainda não realizou nenhuma solicitação de coleta.
      </Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => router.push('/(app)/request')}
      >
        <Text style={styles.createButtonText}>Criar Nova Solicitação</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Carregando seu histórico...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#4CAF50"]}
        />
      }
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color="#333333" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
      
      <View style={styles.header}>
        <Text style={styles.title}>Meus Pedidos</Text>
        <Text style={styles.subtitle}>
          Acompanhe o status das suas solicitações de coleta
        </Text>
      </View>
      
      <View style={styles.content}>
        {coletas.length === 0 ? (
          renderEmptyList()
        ) : (
          <>
            {coletas.map((coleta) => (
              <TouchableOpacity
                key={coleta.id}
                style={styles.coletaCard}
                onPress={() => handleColetaPress(coleta)}
              >
                <View style={styles.coletaHeader}>
                  <Text style={styles.coletaId}>Pedido #{coleta.id}</Text>
                  {renderStatusBadge(coleta.solicitacao.estado_solicitacao)}
                </View>
                
                <View style={styles.coletaInfo}>
                  <Text style={styles.coletaInfoLabel}>Material:</Text>
                  <Text style={styles.coletaInfoValue}>{coleta.material.nome}</Text>
                </View>
                
                <View style={styles.coletaInfo}>
                  <Text style={styles.coletaInfoLabel}>Quantidade:</Text>
                  <Text style={styles.coletaInfoValue}>
                    {parseFloat(coleta.peso_material).toFixed(2)} kg ({coleta.quantidade_material} itens)
                  </Text>
                </View>
                
                <View style={styles.coletaInfo}>
                  <Text style={styles.coletaInfoLabel}>Solicitado em:</Text>
                  <Text style={styles.coletaInfoValue}>
                    {formatarData(coleta.criado_em)}
                  </Text>
                </View>
                
                <View style={styles.coletaFooter}>
                  <Text style={styles.coletaValor}>
                    Valor estimado: R$ {(parseFloat(coleta.peso_material) * parseFloat(coleta.material.preco || 1)).toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.newButton}
              onPress={() => router.push('/(app)/solicitar-coleta')}
            >
              <Text style={styles.newButtonText}>Nova Solicitação</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      
      <View style={styles.footer}>
        <Leaf size={40} color="#4CAF50" />
        <Text style={styles.footerText}>Green Cycle</Text>
      </View>
      
      {/* Modal de detalhes do pedido */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes do Pedido</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <X size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            {selectedColeta && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Informações Gerais</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pedido #:</Text>
                    <Text style={styles.detailValue}>{selectedColeta.id}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={styles.detailValue}>
                      {renderStatusBadge(selectedColeta.solicitacao.estado_solicitacao)}
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Data:</Text>
                    <Text style={styles.detailValue}>
                      {formatarData(selectedColeta.criado_em)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Material</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tipo:</Text>
                    <Text style={styles.detailValue}>{selectedColeta.material.nome}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Peso:</Text>
                    <Text style={styles.detailValue}>
                      {parseFloat(selectedColeta.peso_material).toFixed(2)} kg
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Quantidade:</Text>
                    <Text style={styles.detailValue}>
                      {selectedColeta.quantidade_material} itens
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Preço/kg:</Text>
                    <Text style={styles.detailValue}>
                      R$ {parseFloat(selectedColeta.material.preco || 1).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Valor total:</Text>
                    <Text style={[styles.detailValue, styles.valorTotal]}>
                      R$ {(parseFloat(selectedColeta.peso_material) * parseFloat(selectedColeta.material.preco || 1)).toFixed(2)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Endereço de Coleta</Text>
                  <Text style={styles.enderecoText}>
                    {selectedColeta.endereco.rua}, {selectedColeta.endereco.numero || 'S/N'}{'\n'}
                    {selectedColeta.endereco.bairro}{'\n'}
                    {selectedColeta.endereco.cidade} - {selectedColeta.endereco.estado}{'\n'}
                    CEP: {selectedColeta.endereco.cep}
                  </Text>
                </View>
                
                {selectedColeta.solicitacao.observacoes && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Observações</Text>
                    <Text style={styles.observacoesText}>
                      {selectedColeta.solicitacao.observacoes}
                    </Text>
                  </View>
                )}
                
                {selectedColeta.solicitacao.estado_solicitacao === "1" && (
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={handleCancelarColeta}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.cancelButtonText}>Cancelar Solicitação</Text>
                    )}
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    minHeight: 500,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
  },
  header: {
    padding: 16,
    paddingTop: 0,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  coletaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  coletaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  coletaId: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
    color: '#FFFFFF',
  },
  coletaInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  coletaInfoLabel: {
    width: 100,
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#666666',
  },
  coletaInfoValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
  },
  coletaFooter: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
    marginTop: 4,
  },
  coletaValor: {
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    color: '#4CAF50',
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '80%',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
  newButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
  footer: {
    alignItems: 'center',
    padding: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  footerText: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#4CAF50',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxWidth: 450,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    color: '#4CAF50',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#666666',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
  },
  valorTotal: {
    fontFamily: 'Roboto-Bold',
    color: '#4CAF50',
    fontSize: 16,
  },
  enderecoText: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
    lineHeight: 22,
  },
  observacoesText: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
    lineHeight: 22,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  }
});