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
  RefreshControl,
  Linking
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

// Mapa de status de solicitação
const STATUS_MAP = {
  "1": { label: "Pendente", color: "#FFC107", icon: "clock" },
  "2": { label: "Aprovado", color: "#2196F3", icon: "check-circle" },
  "3": { label: "Em coleta", color: "#9C27B0", icon: "truck" },
  "4": { label: "Finalizado", color: "#4CAF50", icon: "check" },
  "5": { label: "Cancelado", color: "#F44336", icon: "x-circle" },
  "6": { label: "Falha", color: "#FF5722", icon: "alert-triangle" },
};

export default function DashboardPedidosScreen() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);
  const [estatisticas, setEstatisticas] = useState({
    emColeta: 0,
    aprovados: 0,
    finalizados: 0,
    pesoTotal: 0,
    ganhoTotal: 0
  });
  
  // Buscar pedidos do parceiro
  const fetchPedidos = async () => {
    try {
      setIsLoading(true);
      
      if (!user.user_id) {
        console.warn('ID do usuário não encontrado');
        setIsLoading(false);
        return;
      }
      
      // Buscar coletas do parceiro
      const coletasResponse = await axios.get(`${API_BASE_URL}/coletas?id_parceiros=${user.id}`);
      
      if (coletasResponse.data.length === 0) {
        setIsLoading(false);
        setRefreshing(false);
        setPedidos([]);
        setEstatisticas({
          emColeta: 0,
          aprovados: 0,
          finalizados: 0,
          pesoTotal: 0,
          ganhoTotal: 0
        });
        return;
      }
      
      // Para cada coleta, buscar os detalhes relacionados
      const pedidosCompletos = await Promise.all(
        coletasResponse.data.map(async (coleta) => {
          try {
            // Validação básica dos dados da coleta
            if (!coleta || !coleta.id_materiais || !coleta.id_solicitacoes) {
              console.warn('Dados de coleta inválidos:', coleta);
              return null;
            }

            // Buscar material
            const materialResponse = await axios.get(`${API_BASE_URL}/materiais/${coleta.id_materiais}`);
            
            // Buscar solicitação
            const solicitacaoResponse = await axios.get(`${API_BASE_URL}/solicitacoes/${coleta.id_solicitacoes}`);
            
            // Buscar cliente
            const clienteResponse = await axios.get(`${API_BASE_URL}/clientes/${coleta.id_clientes}`);
            
            // Buscar dados do usuário do cliente
            const usuarioResponse = await axios.get(`${API_BASE_URL}/usuarios/${clienteResponse.data.id_usuarios}`);
            
            // Buscar endereço
            const enderecoResponse = await axios.get(`${API_BASE_URL}/enderecos/${coleta.id_enderecos}`);
            
            // Buscar telefone do cliente (simulado, pois não está no banco de dados)
            const telefone = "+5554" + Math.floor(Math.random() * 90000000 + 10000000);
            
            return {
              coleta,
              material: materialResponse.data || {},
              solicitacao: solicitacaoResponse.data || {},
              cliente: {
                ...clienteResponse.data,
                usuario: usuarioResponse.data || {},
                telefone
              },
              endereco: enderecoResponse.data || {},
              ganhoEstimado: parseFloat(coleta.peso_material || 0) * parseFloat(materialResponse.data?.preco || 1)
            };
          } catch (itemError) {
            // Apenas para o vídeo
            // console.error('Erro ao buscar detalhes de pedido individual:', itemError);
            // Alert.alert('Erro', 'Você não possui pedidos pendentes');
            return null;
          }
        })
      );
      
      // Filtrar pedidos nulos
      const pedidosValidos = pedidosCompletos.filter(pedido => pedido !== null);
      
      // Ordenar pedidos por status e data
      const pedidosOrdenados = pedidosValidos.sort((a, b) => {
        // Primeiro, ordenar por prioridade de status
        const prioridadeStatus = {
          "3": 1, // Em coleta (prioridade máxima)
          "2": 2, // Aprovado
          "4": 3, // Finalizado
          "6": 4, // Falha
          "5": 5, // Cancelado (prioridade mínima)
          "1": 6  // Pendente
        };
        
        const statusA = prioridadeStatus[a.solicitacao?.estado_solicitacao] || 99;
        const statusB = prioridadeStatus[b.solicitacao?.estado_solicitacao] || 99;
        
        if (statusA !== statusB) {
          return statusA - statusB;
        }
        
        // Em caso de empate no status, ordenar por data (mais recente primeiro)
        const dataA = new Date(a.coleta?.criado_em || 0);
        const dataB = new Date(b.coleta?.criado_em || 0);
        return dataB - dataA;
      });
      
      setPedidos(pedidosOrdenados);
      
      // Calcular estatísticas
      const stats = pedidosOrdenados.reduce((acc, pedido) => {
        const status = pedido.solicitacao?.estado_solicitacao;
        
        if (status === "2") acc.aprovados++; // Aprovado
        if (status === "3") acc.emColeta++;  // Em coleta
        if (status === "4") acc.finalizados++; // Finalizado
        
        // Só considerar peso e ganho para pedidos não cancelados
        if (status !== "5") {
          acc.pesoTotal += parseFloat(pedido.coleta?.peso_material || 0);
          acc.ganhoTotal += pedido.ganhoEstimado || 0;
        }
        
        return acc;
      }, {
        emColeta: 0,
        aprovados: 0,
        finalizados: 0,
        pesoTotal: 0,
        ganhoTotal: 0
      });
      
      setEstatisticas(stats);
      
    } catch (error) {
      //('Erro ao buscar pedidos:', error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível carregar seus pedidos. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Carregar dados iniciais
  useEffect(() => {
    const loadPedidos = async () => {
        if (!user.user_id) {
            console.warn('ID do usuário não disponível ainda, aguardando...');
            return;
        }

        console.log('Carregando pedidos para user.id =', user.id);

        setIsLoading(true);

        try {
            await fetchPedidos();
        } catch (error) {
            console.error('Erro inesperado no loadPedidos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    loadPedidos();
}, [user.user_id]); // ATENÇÃO → dependência direta de user.user_id
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchPedidos();
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
  
  // Atualizar status da solicitação
  const handleAtualizarStatus = async (novoStatus) => {
    if (!selectedPedido?.solicitacao?.id) return;
    
    setAtualizandoStatus(true);
    
    try {
      // Atualizar o status da solicitação
      await axios.patch(`${API_BASE_URL}/solicitacoes/${selectedPedido.solicitacao.id}`, {
        estado_solicitacao: novoStatus
      });
      
      // Se o status for "Finalizado", atualizar a data de finalização
      if (novoStatus === "4") {
        await axios.patch(`${API_BASE_URL}/solicitacoes/${selectedPedido.solicitacao.id}`, {
          finalizado_em: new Date().toISOString()
        });
      }
      
      // Atualizar o pedido na lista local
      setPedidos(pedidos.map(pedido => {
        if (pedido.solicitacao?.id === selectedPedido.solicitacao.id) {
          return {
            ...pedido,
            solicitacao: {
              ...pedido.solicitacao,
              estado_solicitacao: novoStatus
            }
          };
        }
        return pedido;
      }));
      
      // Atualizar o pedido selecionado no modal
      setSelectedPedido({
        ...selectedPedido,
        solicitacao: {
          ...selectedPedido.solicitacao,
          estado_solicitacao: novoStatus
        }
      });
      
      // Atualizar estatísticas
      fetchPedidos();
      
      Alert.alert('Sucesso', 'Status atualizado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao atualizar status:', error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível atualizar o status. Tente novamente.');
    } finally {
      setAtualizandoStatus(false);
    }
  };
  
  // Iniciar conversa no WhatsApp
  const iniciarConversaWhatsApp = (telefone) => {
    if (!telefone) {
      Alert.alert('Erro', 'Telefone não disponível');
      return;
    }
    
    const mensagem = `Olá! Sou o parceiro de coleta da Green Cycle e estou entrando em contato sobre sua solicitação de coleta.`;
    const url = `whatsapp://send?phone=${telefone}&text=${encodeURIComponent(mensagem)}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Erro', 'WhatsApp não está instalado neste dispositivo.');
        }
      })
      .catch((err) => {
        console.error('Erro ao abrir WhatsApp:', err);
        Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
      });
  };
  
  const handlePedidoPress = (pedido) => {
    if (!pedido) return;
    setSelectedPedido(pedido);
    setModalVisible(true);
  };
  
  const getStatusInfo = (statusCode) => {
    return STATUS_MAP[statusCode] || { label: "Desconhecido", color: "#9E9E9E", icon: "help-circle" };
  };
  
  const getMaterialIcon = (materialId) => {
    const defaultIcon = { icon: "box", color: "#607D8B" };
    return MATERIAL_ICONS[materialId] || defaultIcon;
  };
  
  // Renderiza mensagem quando não há pedidos
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Feather name="inbox" size={60} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>Nenhum pedido encontrado</Text>
      <Text style={styles.emptyText}>
        Você ainda não aceitou nenhuma solicitação de coleta.
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => router.push('/aceitarSolicitacaoParceiro')} 
      >
        <Text style={styles.emptyButtonText}>Buscar Solicitações</Text>
      </TouchableOpacity>
    </View>
  );
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Carregando seus pedidos...</Text>
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
        <Text style={styles.title}>Dashboard de Pedidos</Text>
        <Text style={styles.subtitle}>
          Gerencie suas coletas em andamento
        </Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{estatisticas.emColeta + estatisticas.aprovados}</Text>
            <Text style={styles.statLabel}>Coletas Pendentes</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{estatisticas.finalizados}</Text>
            <Text style={styles.statLabel}>Coletas Concluídas</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{estatisticas.pesoTotal.toFixed(2)}kg</Text>
            <Text style={styles.statLabel}>Material Coletado</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>R$ {estatisticas.ganhoTotal.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Ganhos Totais</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Suas Coletas</Text>
        
        {pedidos.length === 0 ? (
          renderEmptyList()
        ) : (
          pedidos.map((pedido) => {
            const statusInfo = getStatusInfo(pedido.solicitacao?.estado_solicitacao);
            const materialIcon = getMaterialIcon(pedido.material?.id);
            
            return (
              <TouchableOpacity
                key={pedido.coleta?.id}
                style={styles.pedidoCard}
                onPress={() => handlePedidoPress(pedido)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.statusIcon, { backgroundColor: statusInfo.color }]}>
                    <Feather name={statusInfo.icon} size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statusText}>{statusInfo.label}</Text>
                  <Text style={styles.pedidoId}>#{pedido.coleta?.id}</Text>
                </View>
                
                <View style={styles.cardBody}>
                  <View style={styles.materialRow}>
                    <View style={[styles.materialIcon, { backgroundColor: materialIcon.color }]}>
                      <Feather name={materialIcon.icon} size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.materialInfo}>
                      <Text style={styles.materialNome}>{pedido.material?.nome || 'Material não especificado'}</Text>
                      <Text style={styles.materialDetalhes}>
                        {parseFloat(pedido.coleta?.peso_material || 0).toFixed(2)} kg - {pedido.coleta?.quantidade_material || 0} {parseInt(pedido.coleta?.quantidade_material || 0) > 1 ? 'itens' : 'item'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Feather name="user" size={16} color="#666666" />
                    <Text style={styles.infoText}>{pedido.cliente?.usuario?.nome || 'Cliente não especificado'}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Feather name="map-pin" size={16} color="#666666" />
                    <Text style={styles.infoText} numberOfLines={1}>
                      {pedido.endereco?.bairro || 'Endereço'}, {pedido.endereco?.cidade || 'não disponível'}
                    </Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Feather name="calendar" size={16} color="#666666" />
                    <Text style={styles.infoText}>
                      {formatarData(pedido.coleta?.criado_em)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.cardFooter}>
                  <Text style={styles.valorEstimado}>
                    Ganho: R$ {(pedido.ganhoEstimado || 0).toFixed(2)}
                  </Text>
                  
                  {pedido.solicitacao?.estado_solicitacao === "2" && (
                    <TouchableOpacity 
                      style={styles.iniciarButton}
                      onPress={() => handlePedidoPress(pedido)}
                    >
                      <Text style={styles.iniciarButtonText}>Iniciar Coleta</Text>
                    </TouchableOpacity>
                  )}
                  
                  {pedido.solicitacao?.estado_solicitacao === "3" && (
                    <TouchableOpacity 
                      style={styles.finalizarButton}
                      onPress={() => handlePedidoPress(pedido)}
                    >
                      <Text style={styles.finalizarButtonText}>Finalizar</Text>
                    </TouchableOpacity>
                  )}
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
              <Text style={styles.modalTitle}>Detalhes do Pedido #{selectedPedido?.coleta?.id}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Feather name="x" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            {selectedPedido && (
              <ScrollView style={styles.modalBody}>
                <View style={[styles.statusBanner, { backgroundColor: getStatusInfo(selectedPedido.solicitacao?.estado_solicitacao).color }]}>
                  <Feather name={getStatusInfo(selectedPedido.solicitacao?.estado_solicitacao).icon} size={24} color="#FFFFFF" />
                  <Text style={styles.statusBannerText}>{getStatusInfo(selectedPedido.solicitacao?.estado_solicitacao).label}</Text>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Material</Text>
                  <View style={styles.materialDetail}>
                    <View style={[styles.materialIconLarge, { 
                      backgroundColor: getMaterialIcon(selectedPedido.material?.id).color 
                    }]}>
                      <Feather 
                        name={getMaterialIcon(selectedPedido.material?.id).icon} 
                        size={32} 
                        color="#FFFFFF" 
                      />
                    </View>
                    <View style={styles.materialInfoModal}>
                      <Text style={styles.materialNomeModal}>{selectedPedido.material?.nome || 'Material não especificado'}</Text>
                      <Text style={styles.materialDescricao}>
                        {selectedPedido.material?.descricao || 'Descrição não disponível'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Peso:</Text>
                    <Text style={styles.detailValue}>
                      {parseFloat(selectedPedido.coleta?.peso_material || 0).toFixed(2)} kg
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Quantidade:</Text>
                    <Text style={styles.detailValue}>
                      {selectedPedido.coleta?.quantidade_material || 0} {parseInt(selectedPedido.coleta?.quantidade_material || 0) > 1 ? 'itens' : 'item'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Data:</Text>
                    <Text style={styles.detailValue}>
                      {formatarData(selectedPedido.coleta?.criado_em)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Cliente</Text>
                  <View style={styles.clienteDetail}>
                    <Feather name="user" size={24} color="#4CAF50" style={styles.clienteIcon} />
                    <View>
                      <Text style={styles.clienteNome}>{selectedPedido.cliente?.usuario?.nome || 'Nome não disponível'}</Text>
                      <Text style={styles.clienteEmail}>{selectedPedido.cliente?.usuario?.email || 'Email não disponível'}</Text>
                      <Text style={styles.clienteTelefone}>{selectedPedido.cliente?.telefone || 'Telefone não disponível'}</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.whatsappButton}
                    onPress={() => iniciarConversaWhatsApp(selectedPedido.cliente?.telefone)}
                  >
                    <FontAwesome5 name="whatsapp" size={20} color="#FFFFFF" />
                    <Text style={styles.whatsappButtonText}>Contatar pelo WhatsApp</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Endereço de Coleta</Text>
                  <View style={styles.enderecoDetail}>
                    <Feather name="map-pin" size={24} color="#4CAF50" style={styles.enderecoIcon} />
                    <View>
                      <Text style={styles.enderecoTexto}>
                        {selectedPedido.endereco?.rua || 'Endereço não disponível'}, {selectedPedido.endereco?.numero || 'S/N'}
                      </Text>
                      <Text style={styles.enderecoTexto}>
                        {selectedPedido.endereco?.bairro || ''}
                      </Text>
                      <Text style={styles.enderecoTexto}>
                        {selectedPedido.endereco?.cidade || ''} - {selectedPedido.endereco?.estado || ''}
                      </Text>
                      <Text style={styles.enderecoTexto}>
                        CEP: {selectedPedido.endereco?.cep || 'Não informado'}
                      </Text>
                      {selectedPedido.endereco?.complemento && (
                        <Text style={styles.enderecoTexto}>
                          Complemento: {selectedPedido.endereco.complemento}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.mapaButton}
                    onPress={() => {
                      const latitude = selectedPedido.endereco?.latitude || 0;
                      const longitude = selectedPedido.endereco?.longitude || 0;
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
                      Linking.openURL(url);
                    }}
                  >
                    <Feather name="map" size={18} color="#FFFFFF" />
                    <Text style={styles.mapaButtonText}>Abrir no Mapa</Text>
                  </TouchableOpacity>
                </View>
                
                {selectedPedido.solicitacao?.observacoes && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Observações</Text>
                    <Text style={styles.observacoesText}>
                      {selectedPedido.solicitacao.observacoes}
                    </Text>
                  </View>
                )}
                
                <View style={styles.valorContainer}>
                  <Text style={styles.valorLabel}>Ganho estimado:</Text>
                  <Text style={styles.valorTotal}>
                    R$ {(selectedPedido.ganhoEstimado || 0).toFixed(2)}
                  </Text>
                </View>
                
                {/* Botões de ação baseados no status atual */}
                {selectedPedido.solicitacao?.estado_solicitacao === "2" && (
                  <TouchableOpacity
                    style={styles.acaoButton}
                    onPress={() => handleAtualizarStatus("3")}
                    disabled={atualizandoStatus}
                  >
                    {atualizandoStatus ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="truck" size={18} color="#FFFFFF" />
                        <Text style={styles.acaoButtonText}>Iniciar Coleta</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                
                {selectedPedido.solicitacao?.estado_solicitacao === "3" && (
                  <TouchableOpacity
                    style={styles.acaoButton}
                    onPress={() => handleAtualizarStatus("4")}
                    disabled={atualizandoStatus}
                  >
                    {atualizandoStatus ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="check-circle" size={18} color="#FFFFFF" />
                        <Text style={styles.acaoButtonText}>Finalizar Coleta</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                
                {["2", "3"].includes(selectedPedido.solicitacao?.estado_solicitacao) && (
                  <TouchableOpacity
                    style={styles.cancelarButton}
                    onPress={() => handleAtualizarStatus("5")}
                    disabled={atualizandoStatus}
                  >
                    {atualizandoStatus ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="x-circle" size={18} color="#FFFFFF" />
                        <Text style={styles.cancelarButtonText}>Cancelar Coleta</Text>
                      </>
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
// Definição de estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginLeft: 16,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333333',
    fontFamily: 'Roboto-Medium',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginTop: 16,
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    elevation: 2,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginBottom: 16,
  },
  pedidoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
  },
  pedidoId: {
    marginLeft: 'auto',
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  cardBody: {
    padding: 16,
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  materialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  materialInfo: {
    flex: 1,
  },
  materialNome: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
  },
  materialDetalhes: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    padding: 12,
  },
  valorEstimado: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#4CAF50',
  },
  iniciarButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  iniciarButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
  },
  finalizarButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  finalizarButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#4CAF50',
    marginTop: 8,
  },
  // Estilos para o modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusBannerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    marginLeft: 8,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginBottom: 12,
  },
  materialDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  materialIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  materialInfoModal: {
    flex: 1,
  },
  materialNomeModal: {
    fontSize: 18,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
  },
  materialDescricao: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginTop: 4,
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
  clienteDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  clienteIcon: {
    marginRight: 16,
  },
  clienteNome: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
  },
  clienteEmail: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginTop: 2,
  },
  clienteTelefone: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginTop: 2,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
  },
  enderecoDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  enderecoIcon: {
    marginRight: 16,
  },
  enderecoTexto: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
    marginBottom: 2,
  },
  mapaButton: {
    backgroundColor: '#4285F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  mapaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
  },
  observacoesText: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  valorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
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
  acaoButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  acaoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
  cancelarButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  cancelarButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
});