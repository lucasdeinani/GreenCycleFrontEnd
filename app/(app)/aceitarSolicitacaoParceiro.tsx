import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useUser } from '../context/UserContext';
import axios from 'axios';

// URL base da API
import { API_BASE_URL } from '../configs'

// Tipos para a nova estrutura da API
interface ColetaPendente {
  id: number;
  cliente_nome: string;
  material_nome: string;
  peso_material: string;
  quantidade_material: string | number | null;
  endereco_completo: string;
  valor_pagamento: string | number;
  distancia_km: number | null;
  criado_em: string;
  observacoes_solicitacao?: string;
}

// Ícones e cores para cada material
const MATERIAL_ICONS: { [key: string]: { icon: string, color: string } } = {
  'Metal': { icon: "disc", color: "#607D8B" },
  'Papel': { icon: "file", color: "#795548" },
  'Plástico': { icon: "pocket", color: "#FF9800" },
  'Vidro': { icon: "aperture", color: "#00BCD4" },
  'Eletrônico': { icon: "cpu", color: "#9C27B0" },
  'Resíduo Orgânico': { icon: "coffee", color: "#8BC34A" },
  'Resíduo Hospitalar': { icon: "thermometer", color: "#F44336" }
};

export default function AceitarSolicitacoesScreen() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState<ColetaPendente[]>([]);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<ColetaPendente | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [aceitandoPedido, setAceitandoPedido] = useState(false);
  
  // Buscar solicitações disponíveis para o parceiro
  const fetchSolicitacoes = async () => {
    try {
      if (!user?.user_id) {
        console.warn('ID do usuário não encontrado');
        setIsLoading(false);
        return;
      }
      
      console.log('Buscando solicitações pendentes para parceiro:', user.user_id);
      
      // Usar o novo endpoint da API
      const response = await axios.get(`${API_BASE_URL}/coletas/pendentes-parceiro/${user.user_id}/`);
      
      console.log('Solicitações recebidas:', response.data);
      
      // Filtrar e validar dados antes de processar
      const solicitacoesValidas = response.data.filter((item: any) => {
        return item && item.id && item.material_nome && item.peso_material;
      }).map((item: any) => ({
        ...item,
        peso_material: item.peso_material || '0',
        valor_pagamento: item.valor_pagamento || 0,
        distancia_km: item.distancia_km || null,
        cliente_nome: item.cliente_nome || 'Nome não disponível',
        endereco_completo: item.endereco_completo || 'Endereço não disponível'
      }));
      
      // Ordenar por distância (mais próximas primeiro) e depois por data
      const solicitacoesOrdenadas = solicitacoesValidas.sort((a: ColetaPendente, b: ColetaPendente) => {
        // Primeiro por distância (se disponível)
        if (a.distancia_km !== null && b.distancia_km !== null) {
          if (a.distancia_km !== b.distancia_km) {
            return a.distancia_km - b.distancia_km;
          }
        }
        
        // Depois por data (mais recente primeiro)
        const dataA = new Date(a.criado_em || 0);
        const dataB = new Date(b.criado_em || 0);
        return dataB.getTime() - dataA.getTime();
      });
      
      setSolicitacoes(solicitacoesOrdenadas);
      
    } catch (error: any) {
      console.error('Erro ao buscar solicitações:', error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível carregar as solicitações disponíveis. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Carregar dados iniciais
  useEffect(() => {
    const loadSolicitacoes = async () => {
      if (!user?.user_id) {
        console.warn('ID do usuário não disponível ainda');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        await fetchSolicitacoes();
      } catch (error) {
        console.error('Erro ao carregar solicitações:', error);
        setIsLoading(false);
      }
    };

    loadSolicitacoes();
  }, [user?.user_id]);
  
  // Função para aceitar a solicitação
  const handleAceitarSolicitacao = async () => {
    if (!selectedSolicitacao?.id || !user?.user_id) {
      Alert.alert('Erro', 'Dados da solicitação ou usuário incompletos');
      return;
    }
    
    setAceitandoPedido(true);
    
    try {
      // Usar o novo endpoint de aceitar coleta
      await axios.post(`${API_BASE_URL}/coletas/${selectedSolicitacao.id}/aceitar-coleta/`, {
        parceiro_id: user.user_id
      });
      
      // Fechar o modal e atualizar a lista
      setModalVisible(false);
      setSelectedSolicitacao(null);
      
      Alert.alert(
        'Solicitação Aceita',
        'Você aceitou esta solicitação de coleta. Acesse o Dashboard de Pedidos para gerenciá-la.',
        [
          { 
            text: 'Ver Meus Pedidos', 
            onPress: () => router.push('/dashboardParceiro')
          },
          {
            text: 'Continuar',
            onPress: () => {
              fetchSolicitacoes(); // Recarregar a lista de solicitações
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Erro ao aceitar solicitação:', error.response?.data || error.message);
      
      let errorMessage = 'Não foi possível aceitar a solicitação.';
      
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || 'Esta solicitação não pode ser aceita no momento.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Solicitação não encontrada ou já foi aceita por outro parceiro.';
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setAceitandoPedido(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchSolicitacoes();
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
  
  const handleSolicitacaoPress = (solicitacao: ColetaPendente) => {
    if (!solicitacao) return;
    setSelectedSolicitacao(solicitacao);
    setModalVisible(true);
  };
  
  const getMaterialIcon = (materialNome: string) => {
    const defaultIcon = { icon: "box", color: "#607D8B" };
    return MATERIAL_ICONS[materialNome] || defaultIcon;
  };
  
  // Função para formatar valores monetários de forma segura
  const formatarValor = (valor: string | number | null | undefined): string => {
    if (!valor && valor !== 0) return '0.00';
    const numeroValor = typeof valor === 'string' ? parseFloat(valor) : valor;
    return isNaN(numeroValor) ? '0.00' : numeroValor.toFixed(2);
  };

  // Função para formatar peso de forma segura
  const formatarPeso = (peso: string | null | undefined): string => {
    if (!peso) return '0.00';
    const numeroPeso = parseFloat(peso);
    return isNaN(numeroPeso) ? '0.00' : numeroPeso.toFixed(2);
  };

  // Função para formatar distância de forma segura
  const formatarDistancia = (distancia: number | null | undefined): string => {
    if (!distancia && distancia !== 0) return '0.0';
    return isNaN(distancia) ? '0.0' : distancia.toFixed(1);
  };
  
  // Renderiza mensagem quando não há solicitações
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Feather name="inbox" size={60} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>Nenhuma solicitação disponível</Text>
      <Text style={styles.emptyText}>
        No momento não há solicitações de coleta disponíveis para você.
        {'\n\n'}Verifique se você possui materiais configurados em seu perfil.
      </Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={onRefresh}
      >
        <Text style={styles.refreshButtonText}>Atualizar</Text>
      </TouchableOpacity>
    </View>
  );
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Buscando solicitações disponíveis...</Text>
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
        <Text style={styles.title}>Solicitações Disponíveis</Text>
        <Text style={styles.subtitle}>
          Encontre e aceite solicitações de coleta próximas a você
        </Text>
      </View>
      
      <View style={styles.content}>
        {solicitacoes.length === 0 ? (
          renderEmptyList()
        ) : (
          solicitacoes.map((item) => {
            const materialIcon = getMaterialIcon(item.material_nome);
            
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.solicitacaoCard}
                onPress={() => handleSolicitacaoPress(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.materialIcon, { backgroundColor: materialIcon.color }]}>
                    <Feather name={materialIcon.icon as any} size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={styles.materialNome}>{item.material_nome || 'Material não especificado'}</Text>
                    <Text style={styles.solicitacaoData}>
                      Solicitado em: {formatarData(item.criado_em)}
                    </Text>
                  </View>
                  {item.distancia_km !== null && item.distancia_km !== undefined && (
                    <View style={styles.distanciaContainer}>
                      <Feather name="map-pin" size={14} color="#666666" />
                      <Text style={styles.distanciaText}>{formatarDistancia(item.distancia_km)} km</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Peso:</Text>
                    <Text style={styles.infoValue}>{formatarPeso(item.peso_material)} kg</Text>
                  </View>
                  
                  {item.quantidade_material && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Quantidade:</Text>
                      <Text style={styles.infoValue}>
                        {item.quantidade_material} {parseInt(String(item.quantidade_material)) > 1 ? 'itens' : 'item'}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Cliente:</Text>
                    <Text style={styles.infoValue}>{item.cliente_nome || 'Nome não disponível'}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Endereço:</Text>
                    <Text style={styles.infoValue} numberOfLines={2}>
                      {item.endereco_completo || 'Endereço não disponível'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.cardFooter}>
                  <Text style={styles.valorEstimado}>
                    Ganho: R$ {formatarValor(item.valor_pagamento)}
                  </Text>
                  <TouchableOpacity 
                    style={styles.detalhesButton}
                    onPress={() => handleSolicitacaoPress(item)}
                  >
                    <Text style={styles.detalhesButtonText}>Ver Detalhes</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
      
      <View style={styles.footer}>
        <FontAwesome5 name="leaf" size={40} color="#4CAF50" />
        <Text style={styles.footerText}>Green Cycle</Text>
      </View>
      
      {/* Modal de detalhes da solicitação */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes da Solicitação</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Feather name="x" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            {selectedSolicitacao && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Material</Text>
                  <View style={styles.materialDetail}>
                    <View style={[styles.materialIconLarge, { 
                      backgroundColor: getMaterialIcon(selectedSolicitacao.material_nome).color 
                    }]}>
                      <Feather 
                        name={getMaterialIcon(selectedSolicitacao.material_nome).icon as any} 
                        size={32} 
                        color="#FFFFFF" 
                      />
                    </View>
                    <View style={styles.materialInfo}>
                      <Text style={styles.materialNomeModal}>{selectedSolicitacao.material_nome || 'Material não especificado'}</Text>
                      <Text style={styles.materialDescricao}>
                        Material reciclável para coleta seletiva
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Peso:</Text>
                    <Text style={styles.detailValue}>
                      {formatarPeso(selectedSolicitacao.peso_material)} kg
                    </Text>
                  </View>
                  
                  {selectedSolicitacao.quantidade_material && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Quantidade:</Text>
                      <Text style={styles.detailValue}>
                        {selectedSolicitacao.quantidade_material} {parseInt(String(selectedSolicitacao.quantidade_material)) > 1 ? 'itens' : 'item'}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Data:</Text>
                    <Text style={styles.detailValue}>
                      {formatarData(selectedSolicitacao.criado_em)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Endereço de Coleta</Text>
                  <View style={styles.enderecoDetail}>
                    <Feather name="map-pin" size={24} color="#4CAF50" style={styles.enderecoIcon} />
                    <View style={styles.enderecoTextos}>
                      <Text style={styles.enderecoTexto}>
                        {selectedSolicitacao.endereco_completo || 'Endereço não disponível'}
                      </Text>
                    </View>
                  </View>
                  
                  {selectedSolicitacao.distancia_km !== null && selectedSolicitacao.distancia_km !== undefined && (
                    <View style={styles.distanciaDetail}>
                      <Feather name="navigation" size={16} color="#666666" />
                      <Text style={styles.distanciaDetailText}>
                        Aproximadamente {formatarDistancia(selectedSolicitacao.distancia_km)} km de distância
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Cliente</Text>
                  <Text style={styles.clienteNome}>{selectedSolicitacao.cliente_nome || 'Nome não disponível'}</Text>
                </View>
                
                {selectedSolicitacao.observacoes_solicitacao && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Observações</Text>
                    <Text style={styles.observacoesText}>
                      {selectedSolicitacao.observacoes_solicitacao}
                    </Text>
                  </View>
                )}
                
                <View style={styles.valorContainer}>
                  <Text style={styles.valorLabel}>Ganho estimado:</Text>
                  <Text style={styles.valorTotal}>
                    R$ {formatarValor(selectedSolicitacao.valor_pagamento)}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.aceitarButton}
                  onPress={handleAceitarSolicitacao}
                  disabled={aceitandoPedido}
                >
                  {aceitandoPedido ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="check-circle" size={18} color="#FFFFFF" />
                      <Text style={styles.aceitarButtonText}>Aceitar Solicitação</Text>
                    </>
                  )}
                </TouchableOpacity>
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
    height: 500,
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
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  },
  solicitacaoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  materialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  materialNome: {
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginBottom: 4,
  },
  solicitacaoData: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  distanciaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanciaText: {
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
    color: '#666666',
    marginLeft: 4,
  },
  cardBody: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 90,
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#666666',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  valorEstimado: {
    fontSize: 14,
    fontFamily: 'Roboto-Bold',
    color: '#4CAF50',
  },
  detalhesButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  detalhesButtonText: {
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
    color: '#666666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
  },
  footer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 16,
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
    width: '100%',
    maxWidth: 450,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
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
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  materialDetail: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  materialIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  materialInfo: {
    flex: 1,
  },
  materialNomeModal: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginBottom: 6,
  },
  materialDescricao: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    lineHeight: 20,
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
  enderecoDetail: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  enderecoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  enderecoTextos: {
    flex: 1,
  },
  enderecoTexto: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
    lineHeight: 20,
  },
  distanciaDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
  },
  distanciaDetailText: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginLeft: 8,
  },
  clienteNome: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
  },
  observacoesText: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
    lineHeight: 20,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  valorContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valorLabel: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#666666',
  },
  valorTotal: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#4CAF50',
  },
  aceitarButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  aceitarButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    marginLeft: 8,
  },
});