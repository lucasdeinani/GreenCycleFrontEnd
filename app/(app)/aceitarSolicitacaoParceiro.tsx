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

// Ícones e cores para cada material
const MATERIAL_ICONS = {
  1: { icon: "disc", color: "#607D8B" },       // Metal
  2: { icon: "file", color: "#795548" },       // Papel
  3: { icon: "pocket", color: "#FF9800" },     // Plástico
  4: { icon: "aperture", color: "#00BCD4" },   // Vidro
  5: { icon: "cpu", color: "#9C27B0" },        // Eletrônico
  6: { icon: "coffee", color: "#8BC34A" },     // Resíduo Orgânico
  7: { icon: "thermometer", color: "#F44336" } // Resíduo Hospitalar
};

export default function AceitarSolicitacoesScreen() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [aceitandoPedido, setAceitandoPedido] = useState(false);
  const [materiais, setMateriais] = useState({});
  const [materiaisParceiro, setMateriaisParceiro] = useState([]);
  const [loadingMateriais, setLoadingMateriais] = useState(false);
  
  // Buscar lista de materiais para exibição
  const fetchMateriais = async () => {
    try {
      setLoadingMateriais(true);
      const response = await axios.get(`${API_BASE_URL}/materiais`);
      const materiaisObj = {};
      response.data.forEach(material => {
        materiaisObj[material.id] = material;
      });
      setMateriais(materiaisObj);
    } catch (error) {
      console.error('Erro ao buscar materiais:', error.response?.data || error.message);
    } finally {
      setLoadingMateriais(false);
    }
  };
  
  // Buscar materiais que o parceiro trabalha
  const fetchMateriaisParceiro = async () => {
    try {
      if (!user.user_id) {
        console.warn('ID do usuário não encontrado');
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/materiais-parceiros?id_parceiros=${user.id}`);
      const materiaisIds = response.data.map(mp => mp.id_materiais);
      setMateriaisParceiro(materiaisIds);
      
      console.log('Materiais do parceiro:', materiaisIds);
    } catch (error) {
      console.error('Erro ao buscar materiais do parceiro:', error.response?.data || error.message);
      // Se der erro, definir array vazio para permitir todos os materiais
      setMateriaisParceiro([]);
    }
  };
  
  // Buscar solicitações disponíveis (estado_solicitacao = 1)
  const fetchSolicitacoes = async () => {
    try {
      // Aguardar que os materiais estejam carregados
      if (loadingMateriais) {
        console.log('Aguardando carregamento dos materiais...');
        return;
      }
      
      setIsLoading(true);
      
      // Buscar solicitações pendentes
      const solicitacoesResponse = await axios.get(`${API_BASE_URL}/solicitacoes?estado_solicitacao=1`);
      
      if (solicitacoesResponse.data.length === 0) {
        setSolicitacoes([]);
        setIsLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Para cada solicitação, buscar os dados completos da coleta
      const solicitacoesDetalhadas = await Promise.all(
        solicitacoesResponse.data.map(async (solicitacao) => {
          try {
            // Validação básica da solicitação
            if (!solicitacao || !solicitacao.id) {
              console.warn('Dados de solicitação inválidos:', solicitacao);
              return null;
            }

            // Buscar coleta relacionada à solicitação
            const coletaResponse = await axios.get(`${API_BASE_URL}/coletas?id_solicitacoes=${solicitacao.id}`);
            
            if (coletaResponse.data.length === 0) {
              console.warn('Solicitação sem coleta:', solicitacao.id);
              return null; // Solicitação sem coleta, pular
            }
            
            const coleta = coletaResponse.data[0];
            
            // Validação dos dados da coleta
            if (!coleta || !coleta.id_materiais || !coleta.id_clientes) {
              console.warn('Dados de coleta inválidos:', coleta);
              return null;
            }
            
            // Verificar se o material dessa coleta está entre os que o parceiro trabalha
            // Se materiaisParceiro estiver vazio, aceitar todos os materiais
            if (materiaisParceiro.length > 0 && !materiaisParceiro.includes(coleta.id_materiais)) {
              console.log(`Material ${coleta.id_materiais} não está na lista do parceiro:`, materiaisParceiro);
              return null; // Parceiro não trabalha com esse material, pular
            }
            
            // Buscar cliente 
            const clienteResponse = await axios.get(`${API_BASE_URL}/clientes/${coleta.id_clientes}`);
            
            // Buscar dados do usuário do cliente
            const usuarioResponse = await axios.get(`${API_BASE_URL}/usuarios/${clienteResponse.data.id_usuarios}`);
            
            // Buscar endereço da coleta
            const enderecoResponse = await axios.get(`${API_BASE_URL}/enderecos/${coleta.id_enderecos}`);
            
            // Buscar material
            let materialInfo = materiais[coleta.id_materiais] || {};
            if (!materialInfo.nome) {
              try {
                const materialResponse = await axios.get(`${API_BASE_URL}/materiais/${coleta.id_materiais}`);
                materialInfo = materialResponse.data;
              } catch (materialError) {
                console.error('Erro ao buscar material individual:', materialError);
                materialInfo = { nome: 'Material não especificado', preco: 1 };
              }
            }
            
            // Calcular distância (em uma implementação real, usaríamos geolocalização)
            // Aqui estamos simulando uma distância aleatória
            const distancia = (Math.random() * 10 + 0.5).toFixed(1);
            
            return {
              solicitacao,
              coleta,
              cliente: {
                ...clienteResponse.data,
                usuario: usuarioResponse.data || {}
              },
              endereco: enderecoResponse.data || {},
              material: materialInfo,
              distancia
            };
          } catch (error) {
            console.error('Erro ao buscar detalhes da solicitação:', error);
            return null;
          }
        })
      );
      
      // Filtrar solicitações nulas e ordenar por proximidade
      const solicitacoesValidas = solicitacoesDetalhadas
        .filter(sol => sol !== null)
        .sort((a, b) => parseFloat(a.distancia) - parseFloat(b.distancia));
      
      console.log(`${solicitacoesValidas.length} solicitações carregadas para o parceiro`);
      setSolicitacoes(solicitacoesValidas);
      
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível carregar as solicitações disponíveis. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Carregar dados iniciais - corrigido o problema de dependência circular
  useEffect(() => {
    const fetchAll = async () => {
        setIsLoading(true);

        try {
            await Promise.all([fetchMateriais(), fetchSolicitacoes()]);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchAll();
}, [user]);
  
  // Separar useEffect para carregar solicitações após materiais estarem prontos
  useEffect(() => {
    // Só carregar solicitações se os materiais já foram carregados
    if (!loadingMateriais && Object.keys(materiais).length > 0) {
      fetchSolicitacoes();
    }
  }, [materiais, materiaisParceiro, loadingMateriais]);
  
  // Função para aceitar a solicitação
  const handleAceitarSolicitacao = async () => {
    if (!selectedSolicitacao?.solicitacao?.id || !selectedSolicitacao?.coleta?.id) {
      Alert.alert('Erro', 'Dados da solicitação incompletos');
      return;
    }
    
    setAceitandoPedido(true);
    
    try {
      // 1. Atualizar a solicitação para "Aprovado" (estado_solicitacao = 2)
      await axios.patch(`${API_BASE_URL}/solicitacoes/${selectedSolicitacao.solicitacao.id}`, {
        estado_solicitacao: "2" // Aprovado
      });
      
      // 2. Atualizar a coleta com o ID do parceiro
      await axios.patch(`${API_BASE_URL}/coletas/${selectedSolicitacao.coleta.id}`, {
        id_parceiros: user.user_id
      });
      
      // 3. Fechar o modal e atualizar a lista
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
            onPress: () => fetchSolicitacoes()
          }
        ]
      );
      
    } catch (error) {
      console.error('Erro ao aceitar solicitação:', error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível aceitar a solicitação. Tente novamente.');
    } finally {
      setAceitandoPedido(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchSolicitacoes();
  };
  
  const formatarData = (dataString) => {
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
  
  const handleSolicitacaoPress = (solicitacao) => {
    if (!solicitacao) return;
    setSelectedSolicitacao(solicitacao);
    setModalVisible(true);
  };
  
  const getMaterialIcon = (materialId) => {
    const defaultIcon = { icon: "box", color: "#607D8B" };
    return MATERIAL_ICONS[materialId] || defaultIcon;
  };
  
  // Renderiza mensagem quando não há solicitações
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Feather name="inbox" size={60} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>Nenhuma solicitação disponível</Text>
      <Text style={styles.emptyText}>
        No momento não há solicitações de coleta disponíveis para você.
        {materiaisParceiro.length === 0 && '\n\nConfigure seus materiais de trabalho para ver mais solicitações.'}
      </Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={onRefresh}
      >
        <Text style={styles.refreshButtonText}>Atualizar</Text>
      </TouchableOpacity>
    </View>
  );
  
  if (isLoading || loadingMateriais) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>
          {loadingMateriais ? 'Carregando materiais...' : 'Buscando solicitações disponíveis...'}
        </Text>
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
            const materialIcon = getMaterialIcon(item.material?.id);
            
            return (
              <TouchableOpacity
                key={item.solicitacao.id}
                style={styles.solicitacaoCard}
                onPress={() => handleSolicitacaoPress(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.materialIcon, { backgroundColor: materialIcon.color }]}>
                    <Feather name={materialIcon.icon} size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={styles.materialNome}>{item.material?.nome || 'Material não especificado'}</Text>
                    <Text style={styles.solicitacaoData}>
                      Solicitado em: {formatarData(item.solicitacao?.criado_em)}
                    </Text>
                  </View>
                  <View style={styles.distanciaContainer}>
                    <Feather name="map-pin" size={14} color="#666666" />
                    <Text style={styles.distanciaText}>{item.distancia} km</Text>
                  </View>
                </View>
                
                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Peso:</Text>
                    <Text style={styles.infoValue}>{parseFloat(item.coleta?.peso_material || 0).toFixed(2)} kg</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Quantidade:</Text>
                    <Text style={styles.infoValue}>
                      {item.coleta?.quantidade_material || 0} {parseInt(item.coleta?.quantidade_material || 0) > 1 ? 'itens' : 'item'}
                    </Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Endereço:</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {item.endereco?.bairro || 'Endereço'}, {item.endereco?.cidade || 'não disponível'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.cardFooter}>
                  <Text style={styles.valorEstimado}>
                    Ganho estimado: R$ {(parseFloat(item.coleta?.peso_material || 0) * parseFloat(item.material?.preco || 1)).toFixed(2)}
                  </Text>
                  <TouchableOpacity style={styles.detalhesButton}>
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
                      backgroundColor: getMaterialIcon(selectedSolicitacao.material?.id).color 
                    }]}>
                      <Feather 
                        name={getMaterialIcon(selectedSolicitacao.material?.id).icon} 
                        size={32} 
                        color="#FFFFFF" 
                      />
                    </View>
                    <View style={styles.materialInfo}>
                      <Text style={styles.materialNomeModal}>{selectedSolicitacao.material?.nome || 'Material não especificado'}</Text>
                      <Text style={styles.materialDescricao}>
                        {selectedSolicitacao.material?.descricao || 'Descrição não disponível'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Peso:</Text>
                    <Text style={styles.detailValue}>
                      {parseFloat(selectedSolicitacao.coleta?.peso_material || 0).toFixed(2)} kg
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Quantidade:</Text>
                    <Text style={styles.detailValue}>
                      {selectedSolicitacao.coleta?.quantidade_material || 0} {parseInt(selectedSolicitacao.coleta?.quantidade_material || 0) > 1 ? 'itens' : 'item'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Data:</Text>
                    <Text style={styles.detailValue}>
                      {formatarData(selectedSolicitacao.solicitacao?.criado_em)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Endereço de Coleta</Text>
                  <View style={styles.enderecoDetail}>
                    <Feather name="map-pin" size={24} color="#4CAF50" style={styles.enderecoIcon} />
                    <View>
                      <Text style={styles.enderecoTexto}>
                        {selectedSolicitacao.endereco?.rua || 'Endereço não disponível'}, {selectedSolicitacao.endereco?.numero || 'S/N'}
                      </Text>
                      <Text style={styles.enderecoTexto}>
                        {selectedSolicitacao.endereco?.bairro || ''}
                      </Text>
                      <Text style={styles.enderecoTexto}>
                        {selectedSolicitacao.endereco?.cidade || ''} - {selectedSolicitacao.endereco?.estado || ''}
                      </Text>
                      <Text style={styles.enderecoTexto}>
                        CEP: {selectedSolicitacao.endereco?.cep || 'Não informado'}
                      </Text>
                      {selectedSolicitacao.endereco?.complemento && (
                        <Text style={styles.enderecoTexto}>
                          Complemento: {selectedSolicitacao.endereco.complemento}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.distanciaDetail}>
                    <Feather name="navigation" size={16} color="#666666" />
                    <Text style={styles.distanciaDetailText}>
                      Aproximadamente {selectedSolicitacao.distancia} km de distância
                    </Text>
                  </View>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Cliente</Text>
                  <Text style={styles.clienteNome}>{selectedSolicitacao.cliente?.usuario?.nome || 'Nome não disponível'}</Text>
                </View>
                
                {selectedSolicitacao.solicitacao?.observacoes && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Observações</Text>
                    <Text style={styles.observacoesText}>
                      {selectedSolicitacao.solicitacao.observacoes}
                    </Text>
                  </View>
                )}
                
                <View style={styles.valorContainer}>
                  <Text style={styles.valorLabel}>Ganho estimado:</Text>
                  <Text style={styles.valorTotal}>
                    R$ {(parseFloat(selectedSolicitacao.coleta?.peso_material || 0) * parseFloat(selectedSolicitacao.material?.preco || 1)).toFixed(2)}
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