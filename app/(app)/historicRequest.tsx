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
import { router, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import { useCallback } from 'react';

// URL base da API
import { API_BASE_URL } from '../configs'

// Tipos para a nova estrutura da API
interface ColetaCompleta {
  id: number;
  cliente_id: number;
  cliente_nome: string;
  parceiro_nome: string | null;
  material_nome: string;
  peso_material: string;
  quantidade_material: string | null;
  endereco_completo: string;
  status_solicitacao: string;
  observacoes_solicitacao: string | null;
  status_pagamento: string;
  valor_pagamento: string;
  criado_em: string;
  atualizado_em: string;
  finalizado_em?: string;
  imagens_coletas: any[];
}

// Status map para tradução e cores
const STATUS_MAP = {
  // Estados de Solicitação
  "pendente": { label: "Pendente", color: "#FFC107", icon: { lib: Feather, name: "clock" } },
  "aceitado": { label: "Aceito", color: "#2196F3", icon: { lib: Feather, name: "check-circle" } },
  "coletado": { label: "Coletado", color: "#FF9800", icon: { lib: Feather, name: "truck" } },
  "finalizado": { label: "Finalizado", color: "#4CAF50", icon: { lib: Feather, name: "check" } },
  "cancelado": { label: "Cancelado", color: "#F44336", icon: { lib: Feather, name: "x" } },
};

export default function HistoricoColetasScreen() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coletas, setColetas] = useState<ColetaCompleta[]>([]);
  const [selectedColeta, setSelectedColeta] = useState<ColetaCompleta | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [userType, setUserType] = useState<'cliente' | 'parceiro' | null>(null);
  
  // Determinar tipo de usuário baseado nas propriedades disponíveis
  useEffect(() => {
    if (user) {
      if (user.client_id) {
        setUserType('cliente');
      } else if (user.partner_id) {
        setUserType('parceiro');
      }
    }
  }, [user]);
  
  const fetchColetas = async () => {
    try {
      if (!user?.user_id || !userType) {
        console.warn('ID do usuário ou tipo não encontrado');
        setIsLoading(false);
        return;
      }

      console.log('Buscando coletas para user_id:', user.user_id, 'tipo:', userType);

      let response;
      
      // Usar endpoint correto baseado no tipo de usuário
      if (userType === 'cliente') {
        response = await axios.get(`${API_BASE_URL}/coletas/minhas-coletas-cliente/${user.user_id}/`);
      } else if (userType === 'parceiro') {
        response = await axios.get(`${API_BASE_URL}/coletas/minhas-coletas-parceiro/${user.user_id}/`);
      } else {
        throw new Error('Tipo de usuário não identificado');
      }
      
      console.log('Coletas recebidas:', response.data);
      
      // Ordenar primeiro por prioridade de status, depois por data de criação
      const getPrioridade = (status: string) => {
        const prioridades: { [key: string]: number } = {
          "pendente": 1,     // Pendente (maior prioridade)
          "aceitado": 2,     // Aceito
          "coletado": 3,     // Coletado
          "finalizado": 4,   // Finalizado
          "cancelado": 5,    // Cancelado (menor prioridade)
        };
        return prioridades[status] || 99;
      };
              
      const coletasOrdenadas = response.data.sort((a: ColetaCompleta, b: ColetaCompleta) => {
        // Primeiro ordenar por prioridade de status
        const prioridadeA = getPrioridade(a.status_solicitacao);
        const prioridadeB = getPrioridade(b.status_solicitacao);
        
        if (prioridadeA !== prioridadeB) {
          return prioridadeA - prioridadeB;
        }
        
        // Se o status for o mesmo, ordenar por data (mais recente primeiro)
        const dataA = new Date(a.criado_em || 0);
        const dataB = new Date(b.criado_em || 0);
        return dataB.getTime() - dataA.getTime();
      });
      
      setColetas(coletasOrdenadas);
    } catch (error: any) {
      console.error('Erro ao buscar coletas:', error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível carregar seu histórico de coletas. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadColetas = async () => {
      // Verifica se o usuário e tipo estão disponíveis
      if (!user?.user_id || !userType) {
        console.warn('Usuário ou tipo não disponível ainda');
        setIsLoading(false);
        return;
      }
  
      console.log('Carregando coletas para user_id =', user.user_id, 'tipo =', userType);
  
      setIsLoading(true);
  
      try {
        await fetchColetas();
      } catch (error) {
        console.error('Erro inesperado no loadColetas:', error);
        setIsLoading(false);
        Alert.alert('Erro', 'Não foi possível carregar as coletas. Tente novamente.');
      }
    };
  
    // Adiciona um timeout de segurança
    const timeoutId = setTimeout(() => {
      loadColetas();
    }, 100);
  
    // Limpeza do timeout se o componente desmontar
    return () => clearTimeout(timeoutId);
  }, [user?.user_id, userType]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchColetas();
  };

  const handleColetaPress = (coleta: ColetaCompleta) => {
    if (!coleta) return;
    setSelectedColeta(coleta);
    setModalVisible(true);
  };

  const handleCancelarColeta = async () => {
    if (!selectedColeta) return;
    
    // Verificar se a coleta pode ser cancelada (pendente)
    if (selectedColeta.status_solicitacao !== "pendente") {
      Alert.alert(
        'Não é possível cancelar', 
        'Apenas coletas pendentes podem ser canceladas.'
      );
      return;
    }
    
    if (selectedColeta.status_pagamento !== "pendente") {
      Alert.alert(
        'Não é possível cancelar', 
        'Apenas coletas com pagamento pendente podem ser canceladas.'
      );
      return;
    }
    
    setActionLoading(true);
    
    try {
      // Usar o novo endpoint de cancelamento
      await axios.post(`${API_BASE_URL}/coletas/${selectedColeta.id}/cancelar-coleta/`);
      
      // Atualizar a lista de coletas
      await fetchColetas();
      
      // Fechar o modal
      setModalVisible(false);
      setSelectedColeta(null);
      
      Alert.alert('Sucesso', 'Sua coleta foi cancelada com sucesso.');
    } catch (error: any) {
      console.error('Erro ao cancelar coleta:', error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível cancelar sua coleta. Tente novamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalizarColeta = async () => {
    if (!selectedColeta) return;
    
    // Verificar se a coleta pode ser finalizada (coletado)
    if (selectedColeta.status_solicitacao !== "coletado") {
      Alert.alert(
        'Não é possível finalizar', 
        'Apenas coletas já coletadas podem ser finalizadas.'
      );
      return;
    }
    
    if (selectedColeta.status_pagamento !== "pendente") {
      Alert.alert(
        'Não é possível finalizar', 
        'Apenas coletas com pagamento pendente podem ser finalizadas.'
      );
      return;
    }
    
    setActionLoading(true);
    
    try {
      // Usar o novo endpoint de finalização
      await axios.post(`${API_BASE_URL}/coletas/${selectedColeta.id}/finalizar-coleta/`);
      
      // Atualizar a lista de coletas
      await fetchColetas();
      
      // Fechar o modal
      setModalVisible(false);
      setSelectedColeta(null);
      
      Alert.alert('Sucesso', 'Sua coleta foi finalizada com sucesso. O pagamento foi processado.');
    } catch (error: any) {
      console.error('Erro ao finalizar coleta:', error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível finalizar sua coleta. Tente novamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatarData = (dataString: string) => {
    if (!dataString) return 'Data não disponível';
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR') + ' às ' + 
             data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };
  
  const renderStatusBadge = (status: string) => {
    // Normalizar o status para garantir correspondência
    const normalizedStatus = status ? status.toLowerCase().trim() : '';
    
    const statusInfo = STATUS_MAP[normalizedStatus as keyof typeof STATUS_MAP] || { 
      label: status || "Desconhecido", 
      color: "#9E9E9E", 
      icon: { lib: Feather, name: "help-circle" as any }
    };
    const StatusIcon = statusInfo.icon.lib;
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
        <StatusIcon name={statusInfo.icon.name as any} size={14} color="#FFFFFF" />
        <Text style={styles.statusText}>{statusInfo.label}</Text>
      </View>
    );
  };

  // Renderizar mensagem quando não há coletas
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5 name="leaf" size={60} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>Nenhuma coleta</Text>
      <Text style={styles.emptyText}>
        {userType === 'cliente' 
          ? 'Você ainda não realizou nenhuma solicitação de coleta.'
          : 'Você ainda não aceitou nenhuma solicitação de coleta.'
        }
      </Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => router.push(userType === 'cliente' ? '/(app)/request' : '/(app)/aceitarSolicitacaoParceiro')}
      >
        <Text style={styles.createButtonText}>
          {userType === 'cliente' ? 'Criar Nova Solicitação' : 'Buscar Solicitações'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Recarregar dados quando a tela ganha foco (volta de outra tela)
  useFocusEffect(
    useCallback(() => {
      if (user?.user_id && userType) {
        console.log('Tela ganhou foco - recarregando coletas');
        fetchColetas();
      }
    }, [user?.user_id, userType])
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
        <Feather name="arrow-left" size={24} color="#333333" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
      
      <View style={styles.header}>
        <Text style={styles.title}>
          {userType === 'cliente' ? 'Minhas Coletas' : 'Coletas Aceitas'}
        </Text>
        <Text style={styles.subtitle}>
          {userType === 'cliente' 
            ? 'Acompanhe o status das suas solicitações de coleta'
            : 'Gerencie as coletas que você aceitou'
          }
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
                  <Text style={styles.coletaId}>Coleta #{coleta.id}</Text>
                  {renderStatusBadge(coleta.status_solicitacao)}
                </View>
                
                <View style={styles.coletaInfo}>
                  <Text style={styles.coletaInfoLabel}>Material:</Text>
                  <Text style={styles.coletaInfoValue}>{coleta.material_nome || 'Material não especificado'}</Text>
                </View>
                
                <View style={styles.coletaInfo}>
                  <Text style={styles.coletaInfoLabel}>Peso:</Text>
                  <Text style={styles.coletaInfoValue}>
                    {parseFloat(coleta.peso_material || '0').toFixed(2)} kg
                    {coleta.quantidade_material && ` (${coleta.quantidade_material} itens)`}
                  </Text>
                </View>
                
                <View style={styles.coletaInfo}>
                  <Text style={styles.coletaInfoLabel}>Endereço:</Text>
                  <Text style={styles.coletaInfoValue} numberOfLines={2}>
                    {coleta.endereco_completo || 'Endereço não disponível'}
                  </Text>
                </View>
                
                <View style={styles.coletaInfo}>
                  <Text style={styles.coletaInfoLabel}>Solicitado em:</Text>
                  <Text style={styles.coletaInfoValue}>
                    {formatarData(coleta.criado_em)}
                  </Text>
                </View>

                {coleta.parceiro_nome && (
                  <View style={styles.coletaInfo}>
                    <Text style={styles.coletaInfoLabel}>Parceiro:</Text>
                    <Text style={styles.coletaInfoValue}>{coleta.parceiro_nome}</Text>
                  </View>
                )}
                
                <View style={styles.coletaFooter}>
                  <Text style={styles.coletaValor}>
                    Valor: R$ {parseFloat(coleta.valor_pagamento || '0').toFixed(2)}
                  </Text>
                  <View style={styles.statusContainer}>
                    <Text style={[styles.statusLabel, { color: STATUS_MAP[coleta.status_pagamento as keyof typeof STATUS_MAP]?.color || "#666" }]}>
                      Pagamento: {coleta.status_pagamento}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.newButton}
              onPress={() => router.push(userType === 'cliente' ? '/(app)/request' : '/(app)/aceitarSolicitacaoParceiro')} 
            >
              <Text style={styles.newButtonText}>
                {userType === 'cliente' ? 'Nova Solicitação' : 'Buscar Solicitações'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      
      <View style={styles.footer}>
        <FontAwesome5 name="leaf" size={40} color="#4CAF50" />
        <Text style={styles.footerText}>Green Cycle</Text>
      </View>
      
      {/* Modal de detalhes da coleta */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes da Coleta</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Feather name="x" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            {selectedColeta && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Informações Gerais</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Coleta #:</Text>
                    <Text style={styles.detailValue}>{selectedColeta.id}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={styles.detailValue}>
                      {renderStatusBadge(selectedColeta.status_solicitacao)}
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Data:</Text>
                    <Text style={styles.detailValue}>
                      {formatarData(selectedColeta.criado_em)}
                    </Text>
                  </View>
                  {selectedColeta.finalizado_em && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Finalizado:</Text>
                      <Text style={styles.detailValue}>
                        {formatarData(selectedColeta.finalizado_em)}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Material</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tipo:</Text>
                    <Text style={styles.detailValue}>{selectedColeta.material_nome || 'Não especificado'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Peso:</Text>
                    <Text style={styles.detailValue}>
                      {parseFloat(selectedColeta.peso_material || '0').toFixed(2)} kg
                    </Text>
                  </View>
                  {selectedColeta.quantidade_material && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Quantidade:</Text>
                      <Text style={styles.detailValue}>
                        {selectedColeta.quantidade_material} itens
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Endereço de Coleta</Text>
                  <Text style={styles.enderecoText}>
                    {selectedColeta.endereco_completo || 'Endereço não disponível'}
                  </Text>
                </View>

                {selectedColeta.parceiro_nome && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Parceiro</Text>
                    <Text style={styles.parceiroText}>
                      {selectedColeta.parceiro_nome}
                    </Text>
                  </View>
                )}
                
                {selectedColeta.observacoes_solicitacao && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Observações</Text>
                    <Text style={styles.observacoesText}>
                      {selectedColeta.observacoes_solicitacao}
                    </Text>
                  </View>
                )}

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Pagamento</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Valor:</Text>
                    <Text style={[styles.detailValue, styles.valorTotal]}>
                      R$ {parseFloat(selectedColeta.valor_pagamento || '0').toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[styles.detailValue, { 
                      color: STATUS_MAP[selectedColeta.status_pagamento as keyof typeof STATUS_MAP]?.color || "#666",
                      fontWeight: 'bold'
                    }]}>
                      {selectedColeta.status_pagamento}
                    </Text>
                  </View>
                </View>
                
                {/* Botões de ação baseados no status e tipo de usuário */}
                {userType === 'cliente' && selectedColeta.status_solicitacao === "pendente" && 
                 selectedColeta.status_pagamento === "pendente" && (
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={handleCancelarColeta}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.cancelButtonText}>Cancelar Coleta</Text>
                    )}
                  </TouchableOpacity>
                )}

                {userType === 'cliente' && selectedColeta.status_solicitacao === "coletado" && 
                 selectedColeta.status_pagamento === "pendente" && (
                  <TouchableOpacity 
                    style={styles.finalizeButton}
                    onPress={handleFinalizarColeta}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.finalizeButtonText}>Finalizar Coleta</Text>
                    )}
                  </TouchableOpacity>
                )}

                {/* Informações para parceiros */}
                {userType === 'parceiro' && (
                  <View style={styles.parceiroInfo}>
                    <Text style={styles.parceiroInfoText}>
                      Status: {STATUS_MAP[selectedColeta.status_solicitacao as keyof typeof STATUS_MAP]?.label || selectedColeta.status_solicitacao}
                    </Text>
                    {selectedColeta.status_solicitacao === "coletado" && (
                      <Text style={styles.parceiroInfoText}>
                        Aguardando cliente finalizar a coleta
                      </Text>
                    )}
                  </View>
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
  },
  finalizeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  finalizeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#666666',
  },
  parceiroText: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
    lineHeight: 22,
  },
  parceiroInfo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  parceiroInfoText: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
    lineHeight: 22,
  },
});