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
  RefreshControl,
  Linking
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import { useCallback } from 'react';
import { fetchColetaDetalhes, ColetaDetalhes } from '../services/coletaService';

// URL base da API
import { API_BASE_URL } from '../configs'

// Declaração global para TypeScript
declare global {
  var refreshHistoric: (() => void) | undefined;
}

// Tipos para a nova estrutura da API
interface ColetaCompleta {
  id: number;
  cliente_id: number;
  cliente_nome: string;
  parceiro_nome: string | null;
  parceiro_id?: number; // ID do parceiro na tabela parceiros
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
  const [coletaDetalhes, setColetaDetalhes] = useState<ColetaDetalhes | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [userType, setUserType] = useState<'cliente' | 'parceiro' | null>(null);
  const [buscandoDetalhes, setBuscandoDetalhes] = useState(false);
  
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

  const handleColetaPress = async (coleta: ColetaCompleta) => {
    if (!coleta) return;
    
    setSelectedColeta(coleta);
    setModalVisible(true);
    setColetaDetalhes(null);
    
    // Buscar detalhes completos da coleta
    setBuscandoDetalhes(true);
    try {
      console.log(`Buscando detalhes da coleta ${coleta.id}`);
      const detalhes = await fetchColetaDetalhes(coleta.id);
      setColetaDetalhes(detalhes);
    } catch (error) {
      console.error('Erro ao buscar detalhes da coleta:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da coleta.');
    } finally {
      setBuscandoDetalhes(false);
    }
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

  // Iniciar conversa no WhatsApp - com código do Brasil (+55)
  const iniciarConversaWhatsApp = (telefone?: string | null, nome?: string | null) => {
    // Verificar se há telefone cadastrado
    if (!telefone || telefone.trim() === '' || telefone === 'Telefone não cadastrado') {
      const tipoContato = userType === 'cliente' ? 'parceiro' : 'cliente';
      Alert.alert(
        'Telefone não disponível', 
        `Este ${tipoContato} ainda não cadastrou um telefone. Não é possível iniciar conversa no WhatsApp.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    let telefoneParaUsar: string;
    
    // Remove todos os caracteres não numéricos
    const telefoneNumerico = telefone.replace(/\D/g, '');
    
    // Verificar se o telefone tem pelo menos 10 dígitos (DDD + número)
    if (telefoneNumerico.length < 10) {
      const tipoContato = userType === 'cliente' ? 'parceiro' : 'cliente';
      Alert.alert(
        'Telefone inválido', 
        `O telefone cadastrado do ${tipoContato} parece estar incompleto.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    // Se não começar com 55, adiciona o código do Brasil
    if (!telefoneNumerico.startsWith('55')) {
      telefoneParaUsar = '55' + telefoneNumerico;
    } else {
      telefoneParaUsar = telefoneNumerico;
    }
    
    const tipoContato = userType === 'cliente' ? 'parceiro' : 'cliente';
    const mensagem = userType === 'cliente' 
      ? `Olá ${nome || 'parceiro'}! Sou o cliente da Green Cycle e gostaria de conversar sobre minha coleta.`
      : `Olá ${nome || 'cliente'}! Sou o parceiro da Green Cycle e estou entrando em contato sobre sua coleta.`;
    
    const url = `whatsapp://send?phone=${telefoneParaUsar}&text=${encodeURIComponent(mensagem)}`;
    
    console.log(`📱 Abrindo WhatsApp para: +${telefoneParaUsar}`);
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          const webUrl = `https://wa.me/${telefoneParaUsar}?text=${encodeURIComponent(mensagem)}`;
          return Linking.openURL(webUrl);
        }
      })
      .catch((err) => {
        console.error('Erro ao abrir WhatsApp:', err);
        Alert.alert('Erro', 'Não foi possível abrir o WhatsApp. Verifique se o aplicativo está instalado.');
      });
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

  // Configurar refresh global para poder ser chamado de outras telas
  useEffect(() => {
    // Definir função global para refresh
    global.refreshHistoric = () => {
      console.log('Refresh forçado do histórico');
      if (user?.user_id && userType) {
        fetchColetas();
      }
    };

    // Cleanup na desmontagem do componente
    return () => {
      if (global.refreshHistoric) {
        delete global.refreshHistoric;
      }
    };
  }, [user?.user_id, userType]);

  // Função para fechar modal e limpar estados
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedColeta(null);
    setColetaDetalhes(null);
    setBuscandoDetalhes(false);
  };

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

                {/* Botão de finalizar para coletas coletadas (apenas para clientes) */}
                {userType === 'cliente' && coleta.status_solicitacao === "coletado" && 
                 coleta.status_pagamento === "pendente" && (
                  <View style={styles.acaoCardContainer}>
                    <TouchableOpacity 
                      style={styles.finalizarCardButton}
                      onPress={(e) => {
                        e.stopPropagation(); // Impedir que abra o modal
                        Alert.alert(
                          'Confirmar Finalização',
                          'Confirma que recebeu a coleta e deseja finalizar o pagamento?',
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            { 
                              text: 'Confirmar', 
                              onPress: async () => {
                                setActionLoading(true);
                                try {
                                  await axios.post(`${API_BASE_URL}/coletas/${coleta.id}/finalizar-coleta/`);
                                  await fetchColetas();
                                  Alert.alert('Sucesso', 'Coleta finalizada com sucesso! O pagamento foi processado.');
                                } catch (error: any) {
                                  console.error('Erro ao finalizar coleta:', error);
                                  Alert.alert('Erro', 'Não foi possível finalizar a coleta. Tente novamente.');
                                } finally {
                                  setActionLoading(false);
                                }
                              }
                            }
                          ]
                        );
                      }}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Feather name="check-circle" size={16} color="#FFFFFF" />
                          <Text style={styles.finalizarCardButtonText}>Confirmar pagamento e finalizar</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
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
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes da Coleta</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
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

                {userType === 'cliente' && (selectedColeta?.parceiro_nome || buscandoDetalhes) && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Parceiro</Text>
                    {buscandoDetalhes ? (
                      <View style={styles.loadingDetalhes}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={styles.loadingDetalhesText}>Carregando informações do parceiro...</Text>
                      </View>
                    ) : coletaDetalhes ? (
                      <>
                        <View style={styles.parceiroDetail}>
                          <Feather name="user" size={24} color="#4CAF50" style={styles.parceiroIcon} />
                          <View>
                            <Text style={styles.parceiroNome}>{coletaDetalhes.parceiro_nome || 'Nome não disponível'}</Text>
                            <Text style={styles.parceiroDescricao}>Parceiro responsável pela coleta</Text>
                            <Text style={styles.parceiroTelefone}>
                              {coletaDetalhes.parceiro_telefone || 'Telefone não cadastrado'}
                            </Text>
                          </View>
                        </View>
                        
                        <TouchableOpacity
                          style={styles.whatsappButton}
                          onPress={() => iniciarConversaWhatsApp(coletaDetalhes.parceiro_telefone, coletaDetalhes.parceiro_nome)}
                        >
                          <FontAwesome5 name="whatsapp" size={20} color="#FFFFFF" />
                          <Text style={styles.whatsappButtonText}>Contatar pelo WhatsApp</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <Text style={styles.erroDetalhes}>Não foi possível carregar as informações do parceiro.</Text>
                    )}
                  </View>
                )}

                {userType === 'parceiro' && (selectedColeta?.cliente_nome || buscandoDetalhes) && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Cliente</Text>
                    {buscandoDetalhes ? (
                      <View style={styles.loadingDetalhes}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={styles.loadingDetalhesText}>Carregando informações do cliente...</Text>
                      </View>
                    ) : coletaDetalhes ? (
                      <>
                        <View style={styles.clienteDetail}>
                          <Feather name="user" size={24} color="#4CAF50" style={styles.clienteIcon} />
                          <View>
                            <Text style={styles.clienteNome}>{coletaDetalhes.cliente_nome || 'Nome não disponível'}</Text>
                            <Text style={styles.clienteDescricao}>Cliente da coleta</Text>
                            <Text style={styles.parceiroTelefone}>
                              {coletaDetalhes.cliente_telefone || 'Telefone não cadastrado'}
                            </Text>
                          </View>
                        </View>
                        
                        <TouchableOpacity
                          style={styles.whatsappButton}
                          onPress={() => iniciarConversaWhatsApp(coletaDetalhes.cliente_telefone, coletaDetalhes.cliente_nome)}
                        >
                          <FontAwesome5 name="whatsapp" size={20} color="#FFFFFF" />
                          <Text style={styles.whatsappButtonText}>Contatar pelo WhatsApp</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <Text style={styles.erroDetalhes}>Não foi possível carregar as informações do cliente.</Text>
                    )}
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
                
                {/* Renderizar ações baseadas no status - Versão robusta */}
                {(() => {
                  // Normalizar o status para garantir comparação correta
                  const statusNormalizado = String(selectedColeta.status_solicitacao || '').toLowerCase().trim();
                  const statusPagamento = String(selectedColeta.status_pagamento || '').toLowerCase().trim();
                  
                  console.log('Status normalizado:', statusNormalizado);
                  console.log('Status pagamento:', statusPagamento);
                  console.log('Tipo de usuário:', userType);
                  
                  // Renderizar baseado no status para clientes
                  if (userType === 'cliente') {
                    // Botão de cancelar para coletas pendentes
                    if (statusNormalizado === 'pendente' && statusPagamento === 'pendente') {
                      return (
                        <View style={styles.acaoModalContainer}>
                          <TouchableOpacity 
                            style={styles.cancelarModalButton}
                            onPress={handleCancelarColeta}
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <>
                                <Feather name="x-circle" size={18} color="#FFFFFF" />
                                <Text style={styles.cancelarModalButtonText}>Cancelar Coleta</Text>
                              </>
                            )}
                          </TouchableOpacity>
                          <Text style={styles.acaoModalHelper}>
                            Você pode cancelar esta coleta enquanto ela estiver pendente
                          </Text>
                        </View>
                      );
                    }
                    
                    // Botão de finalizar para coletas coletadas
                    if (statusNormalizado === 'coletado' && statusPagamento === 'pendente') {
                      return (
                        <View style={styles.acaoModalContainer}>
                          <TouchableOpacity 
                            style={styles.finalizarModalButton}
                            onPress={handleFinalizarColeta}
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <>
                                <Feather name="check-circle" size={18} color="#FFFFFF" />
                                <Text style={styles.finalizarModalButtonText}>Confirmar pagamento e finalizar</Text>
                              </>
                            )}
                          </TouchableOpacity>
                          <Text style={styles.acaoModalHelper}>
                            Confirme que recebeu a coleta para finalizar o pagamento
                          </Text>
                        </View>
                      );
                    }
                    
                    // Status finalizado
                    if (statusNormalizado === 'finalizado') {
                      return (
                        <View style={styles.statusModalDestaque}>
                          <View style={styles.finalizadoModalContainer}>
                            <Feather name="check-circle" size={20} color="#FFFFFF" />
                            <Text style={styles.finalizadoModalText}>Coleta finalizada!</Text>
                          </View>
                          <Text style={styles.statusModalHelper}>
                            Parabéns! Sua coleta foi concluída com sucesso
                          </Text>
                        </View>
                      );
                    }
                    
                    // Status cancelado
                    if (statusNormalizado === 'cancelado') {
                      return (
                        <View style={styles.statusModalDestaque}>
                          <View style={styles.canceladoModalContainer}>
                            <Feather name="x" size={20} color="#FFFFFF" />
                            <Text style={styles.canceladoModalText}>Coleta cancelada</Text>
                          </View>
                          <Text style={styles.statusModalHelper}>
                            Esta coleta foi cancelada
                          </Text>
                        </View>
                      );
                    }
                    
                    // Status aceito (aguardando coleta)
                    if (statusNormalizado === 'aceitado' || statusNormalizado === 'aceito') {
                      return (
                        <View style={styles.statusModalDestaque}>
                          <View style={styles.aceitoModalContainer}>
                            <Feather name="clock" size={20} color="#FFFFFF" />
                            <Text style={styles.aceitoModalText}>Aguardando coleta</Text>
                          </View>
                          <Text style={styles.statusModalHelper}>
                            O parceiro irá realizar a coleta em breve
                          </Text>
                        </View>
                      );
                    }
                  }
                
                  // Status desconhecido
                  return (
                    <View style={styles.statusModalDestaque}>
                      <View style={styles.statusGenericoModalContainer}>
                        <Feather name="info" size={20} color="#FFFFFF" />
                        <Text style={styles.statusGenericoModalText}>Status: {selectedColeta.status_solicitacao}</Text>
                      </View>
                      <Text style={styles.statusModalHelper}>
                        Status não reconhecido pelo sistema
                      </Text>
                    </View>
                  );
                })()}
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


  acaoCardContainer: {
    padding: 12,
    marginTop: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  finalizarCardButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 8,
  },
  finalizarCardButtonText: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#FFFFFF',
  },
  acaoModalContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  cancelarModalButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    minWidth: 250,
    marginBottom: 8,
  },
  cancelarModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    marginLeft: 8,
    textAlign: 'center',
  },
  acaoModalHelper: {
    color: '#F44336',
    fontSize: 13,
    fontFamily: 'Roboto-Medium',
    textAlign: 'center',
    marginTop: 12,
  },
  finalizarModalButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    minWidth: 250,
    marginBottom: 8,
  },
  finalizarModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    marginLeft: 8,
    textAlign: 'center',
  },
  statusModalDestaque: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  finalizadoModalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minWidth: 250,
  },
  finalizadoModalText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    marginLeft: 10,
    textAlign: 'center',
  },
  statusModalHelper: {
    color: '#666666',
    fontSize: 13,
    fontFamily: 'Roboto-Medium',
    textAlign: 'center',
    marginTop: 12,
  },
  canceladoModalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#F44336',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minWidth: 250,
  },
  canceladoModalText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    marginLeft: 10,
    textAlign: 'center',
  },
  aceitoModalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#2196F3',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minWidth: 250,
  },
  aceitoModalText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    marginLeft: 10,
    textAlign: 'center',
  },
  parceiroModalInfo: {
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
  parceiroModalInfoText: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
    lineHeight: 22,
  },
  statusGenericoModalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#9E9E9E',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minWidth: 250,
  },
  statusGenericoModalText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    marginLeft: 10,
    textAlign: 'center',
  },
  parceiroDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  parceiroIcon: {
    marginRight: 16,
  },
  parceiroNome: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
  },
  parceiroDescricao: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginTop: 2,
  },

  parceiroTelefone: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
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
  clienteDescricao: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginTop: 2,
  },
  loadingDetalhes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingDetalhesText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  erroDetalhes: {
    color: '#F44336',
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
  },
});