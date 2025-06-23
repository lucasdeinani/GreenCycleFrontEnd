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
import { router, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import { useCallback } from 'react';
import { fetchColetaDetalhes, ColetaDetalhes } from '../services/coletaService';

// URL base da API
import { API_BASE_URL } from '../configs'

// Tipos para a nova estrutura da API
interface ColetaParceiro {
  id: number;
  cliente_id: number;
  cliente_nome: string;
  parceiro_nome: string | null;
  material_nome: string;
  peso_material: string;
  quantidade_material: string | number | null;
  endereco_completo: string;
  status_solicitacao: string;
  observacoes_solicitacao: string | null;
  status_pagamento: string;
  valor_pagamento: string | number;
  criado_em: string;
  atualizado_em: string;
  finalizado_em?: string;
  imagens_coletas: any[];
  // Dados adicionais do cliente
  cliente_email?: string;
  cliente_telefone?: string;
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

// Status map para tradução e cores
const STATUS_MAP = {
  // Estados de Solicitação
  "pendente": { label: "Pendente", color: "#FFC107", icon: "clock" },
  "aceitado": { label: "Aceito", color: "#2196F3", icon: "check-circle" },
  "coletado": { label: "Coletado", color: "#FF9800", icon: "truck" },
  "finalizado": { label: "Finalizado", color: "#4CAF50", icon: "check" },
  "cancelado": { label: "Cancelado", color: "#F44336", icon: "x-circle" },
};

export default function DashboardPedidosScreen() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pedidos, setPedidos] = useState<ColetaParceiro[]>([]);
  const [selectedPedido, setSelectedPedido] = useState<ColetaParceiro | null>(null);
  const [coletaDetalhes, setColetaDetalhes] = useState<ColetaDetalhes | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);
  const [buscandoDetalhes, setBuscandoDetalhes] = useState(false);
  const [estatisticas, setEstatisticas] = useState({
    emAndamento: 0,
    aceitos: 0,
    finalizados: 0,
    pesoTotal: 0,
    ganhoTotal: 0
  });
  
  // Buscar pedidos do parceiro
  const fetchPedidos = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.user_id) {
        console.warn('ID do usuário não encontrado');
        setIsLoading(false);
        return;
      }
      
      console.log('Buscando coletas para parceiro:', user.user_id);
      
      // Usar o novo endpoint da API
      const response = await axios.get(`${API_BASE_URL}/coletas/minhas-coletas-parceiro/${user.user_id}/`);
      
      console.log('Coletas recebidas:', response.data);
      
      // Ordenar pedidos por status e data
      const pedidosOrdenados = response.data.sort((a: ColetaParceiro, b: ColetaParceiro) => {
        // Primeiro, ordenar por prioridade de status
        const prioridadeStatus: { [key: string]: number } = {
          "aceitado": 1,    // Aceito (prioridade máxima para parceiro)
          "coletado": 2,    // Coletado 
          "finalizado": 3,  // Finalizado
          "cancelado": 4,   // Cancelado (prioridade mínima)
        };
        
        const statusA = prioridadeStatus[a.status_solicitacao] || 99;
        const statusB = prioridadeStatus[b.status_solicitacao] || 99;
        
        if (statusA !== statusB) {
          return statusA - statusB;
        }
        
        // Em caso de empate no status, ordenar por data (mais recente primeiro)
        const dataA = new Date(a.criado_em || 0);
        const dataB = new Date(b.criado_em || 0);
        return dataB.getTime() - dataA.getTime();
      });
      
      setPedidos(pedidosOrdenados);
      
      // Calcular estatísticas
      const stats = pedidosOrdenados.reduce((acc: {
        emAndamento: number;
        aceitos: number;
        finalizados: number;
        pesoTotal: number;
        ganhoTotal: number;
      }, pedido: ColetaParceiro) => {
        const status = pedido.status_solicitacao;
        
        if (status === "aceitado") acc.aceitos++; // Aceito
        if (status === "coletado") acc.emAndamento++;  // Coletado (aguardando finalização)
        if (status === "finalizado") acc.finalizados++; // Finalizado
        
        // Só considerar peso e ganho para pedidos não cancelados
        if (status !== "cancelado") {
          const peso = parseFloat(pedido.peso_material || '0');
          const ganho = parseFloat(String(pedido.valor_pagamento) || '0');
          
          if (!isNaN(peso)) acc.pesoTotal += peso;
          if (!isNaN(ganho)) acc.ganhoTotal += ganho;
        }
        
        return acc;
      }, {
        emAndamento: 0,
        aceitos: 0,
        finalizados: 0,
        pesoTotal: 0,
        ganhoTotal: 0
      });
      
      setEstatisticas(stats);
      
    } catch (error: any) {
      console.error('Erro ao buscar pedidos:', error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível carregar seus pedidos. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Carregar dados iniciais
  useEffect(() => {
    const loadPedidos = async () => {
      if (!user?.user_id) {
        console.warn('ID do usuário não disponível ainda, aguardando...');
        setIsLoading(false);
        return;
      }

      console.log('Carregando pedidos para user_id =', user.user_id);

      setIsLoading(true);

      try {
        await fetchPedidos();
      } catch (error) {
        console.error('Erro inesperado no loadPedidos:', error);
        setIsLoading(false);
      }
    };

    loadPedidos();
  }, [user?.user_id]);
  
  // Recarregar dados quando a tela ganha foco (volta de outra tela)
  useFocusEffect(
    useCallback(() => {
      if (user?.user_id) {
        console.log('Dashboard ganhou foco - recarregando pedidos');
        fetchPedidos();
      }
    }, [user?.user_id])
  );
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchPedidos();
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
  
  const handlePedidoPress = async (pedido: ColetaParceiro) => {
    if (!pedido) return;
    
    setSelectedPedido(pedido);
    setModalVisible(true);
    setColetaDetalhes(null);
    
    // Buscar detalhes completos da coleta
    setBuscandoDetalhes(true);
    try {
      console.log(`Buscando detalhes da coleta ${pedido.id}`);
      const detalhes = await fetchColetaDetalhes(pedido.id);
      setColetaDetalhes(detalhes);
    } catch (error) {
      console.error('Erro ao buscar detalhes da coleta:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da coleta.');
    } finally {
      setBuscandoDetalhes(false);
    }
  };
  
  // Função para fechar modal e limpar estados
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedPedido(null);
    setColetaDetalhes(null);
    setBuscandoDetalhes(false);
  };
  
  // Iniciar conversa no WhatsApp - com código do Brasil (+55)
  const iniciarConversaWhatsApp = (telefone?: string | null, clienteNome?: string) => {
    // Verificar se há telefone cadastrado
    if (!telefone || telefone.trim() === '' || telefone === 'Telefone não cadastrado') {
      Alert.alert(
        'Telefone não disponível', 
        'Este cliente ainda não cadastrou um telefone. Não é possível iniciar conversa no WhatsApp.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    let telefoneParaUsar: string;
    
    // Remove todos os caracteres não numéricos
    const telefoneNumerico = telefone.replace(/\D/g, '');
    
    // Verificar se o telefone tem pelo menos 10 dígitos (DDD + número)
    if (telefoneNumerico.length < 10) {
      Alert.alert(
        'Telefone inválido', 
        'O telefone cadastrado parece estar incompleto. Verifique com o cliente.',
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
    
    const mensagem = `Olá ${clienteNome || 'cliente'}! Sou o parceiro de coleta da Green Cycle e estou entrando em contato sobre sua solicitação de coleta.`;
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
  
  const getStatusInfo = (statusCode: string) => {
    // Normalizar o status para garantir correspondência
    const normalizedStatus = statusCode ? statusCode.toLowerCase().trim() : '';
    return STATUS_MAP[normalizedStatus as keyof typeof STATUS_MAP] || { label: statusCode || "Desconhecido", color: "#9E9E9E", icon: "help-circle" };
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
  
  // Função para marcar como coletado
  const handleMarcarColetado = async () => {
    if (!selectedPedido?.id) return;
    
    setAtualizandoStatus(true);
    
    try {
      await axios.post(`${API_BASE_URL}/coletas/${selectedPedido.id}/marcar-coletado/`);
      await fetchPedidos(); // Recarregar dados
      Alert.alert('Sucesso', 'Coleta marcada como realizada! Aguarde o cliente finalizar o processo.');
    } catch (error: any) {
      console.error('Erro ao marcar como coletado:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o status. Tente novamente.');
    } finally {
      setAtualizandoStatus(false);
    }
  };
  
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
        <Text style={styles.title}>Dashboard de Coletas</Text>
        <Text style={styles.subtitle}>
          Gerencie suas coletas em andamento
        </Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{estatisticas.aceitos}</Text>
            <Text style={styles.statLabel}>Para Coletar</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{estatisticas.emAndamento}</Text>
            <Text style={styles.statLabel}>Aguardando Finalização</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{estatisticas.finalizados}</Text>
            <Text style={styles.statLabel}>Coletas Finalizadas</Text>
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
            const statusInfo = getStatusInfo(pedido.status_solicitacao);
            const materialIcon = getMaterialIcon(pedido.material_nome);
            
            return (
              <TouchableOpacity
                key={pedido.id}
                style={styles.pedidoCard}
                onPress={() => handlePedidoPress(pedido)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.statusIcon, { backgroundColor: statusInfo.color }]}>
                    <Feather name={statusInfo.icon as any} size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statusText}>{statusInfo.label}</Text>
                  <Text style={styles.pedidoId}>#{pedido.id}</Text>
                </View>
                
                <View style={styles.cardBody}>
                  <View style={styles.materialRow}>
                    <View style={[styles.materialIcon, { backgroundColor: materialIcon.color }]}>
                      <Feather name={materialIcon.icon as any} size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.materialInfo}>
                      <Text style={styles.materialNome}>{pedido.material_nome || 'Material não especificado'}</Text>
                      <Text style={styles.materialDetalhes}>
                        {formatarPeso(pedido.peso_material)} kg
                        {pedido.quantidade_material && ` - ${pedido.quantidade_material} ${parseInt(String(pedido.quantidade_material)) > 1 ? 'itens' : 'item'}`}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Feather name="user" size={16} color="#666666" />
                    <Text style={styles.infoText}>{pedido.cliente_nome || 'Cliente não especificado'}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Feather name="map-pin" size={16} color="#666666" />
                    <Text style={styles.infoText} numberOfLines={1}>
                      {pedido.endereco_completo || 'Endereço não disponível'}
                    </Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Feather name="calendar" size={16} color="#666666" />
                    <Text style={styles.infoText}>
                      {formatarData(pedido.criado_em)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.cardFooter}>
                  <Text style={styles.valorEstimado}>
                    Ganho: R$ {formatarValor(pedido.valor_pagamento)}
                  </Text>
                  
                  {pedido.status_solicitacao === "aceitado" && (
                    <TouchableOpacity 
                      style={styles.coletarButton}
                      onPress={handleMarcarColetado}
                      disabled={atualizandoStatus}
                    >
                      {atualizandoStatus ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Feather name="check" size={14} color="#FFFFFF" />
                          <Text style={styles.coletarButtonText}>Marcar Coletado</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  
                  {pedido.status_solicitacao === "coletado" && (
                    <View style={styles.aguardandoContainerCard}>
                      <Feather name="clock" size={14} color="#FFFFFF" />
                      <Text style={styles.aguardandoTextCard}>Aguardando cliente</Text>
                    </View>
                  )}

                  {pedido.status_solicitacao === "finalizado" && (
                    <View style={styles.finalizadoContainerCard}>
                      <Feather name="check-circle" size={14} color="#FFFFFF" />
                      <Text style={styles.finalizadoTextCard}>Finalizado</Text>
                    </View>
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
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes da Coleta #{selectedPedido?.id}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <Feather name="x" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            {selectedPedido && (
              <ScrollView style={styles.modalBody}>
                <View style={[styles.statusBanner, { backgroundColor: getStatusInfo(selectedPedido.status_solicitacao).color }]}>
                  <Feather name={getStatusInfo(selectedPedido.status_solicitacao).icon as any} size={24} color="#FFFFFF" />
                  <Text style={styles.statusBannerText}>{getStatusInfo(selectedPedido.status_solicitacao).label}</Text>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Material</Text>
                  <View style={styles.materialDetail}>
                    <View style={[styles.materialIconLarge, { 
                      backgroundColor: getMaterialIcon(selectedPedido.material_nome).color 
                    }]}>
                      <Feather 
                        name={getMaterialIcon(selectedPedido.material_nome).icon as any} 
                        size={32} 
                        color="#FFFFFF" 
                      />
                    </View>
                    <View style={styles.materialInfoModal}>
                      <Text style={styles.materialNomeModal}>{selectedPedido.material_nome || 'Material não especificado'}</Text>
                      <Text style={styles.materialDescricao}>
                        Material reciclável para coleta seletiva
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Peso:</Text>
                    <Text style={styles.detailValue}>
                      {formatarPeso(selectedPedido.peso_material)} kg
                    </Text>
                  </View>
                  
                  {selectedPedido.quantidade_material && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Quantidade:</Text>
                      <Text style={styles.detailValue}>
                        {selectedPedido.quantidade_material} {parseInt(String(selectedPedido.quantidade_material)) > 1 ? 'itens' : 'item'}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Data:</Text>
                    <Text style={styles.detailValue}>
                      {formatarData(selectedPedido.criado_em)}
                    </Text>
                  </View>
                </View>
                
                {/* Renderizar ações baseadas no status - Versão robusta */}
                {(() => {
                  // Normalizar o status para garantir comparação correta
                  const statusNormalizado = String(selectedPedido.status_solicitacao || '').toLowerCase().trim();
                  
                  console.log('Status normalizado:', statusNormalizado);
                  console.log('Status original:', selectedPedido.status_solicitacao);
                  
                  // Renderizar baseado no status
                  if (statusNormalizado === 'aceitado' || statusNormalizado === 'aceito') {
                    return (
                      <View style={styles.acaoButtonContainer}>
                        <TouchableOpacity
                          style={styles.acaoButtonDestaque}
                          onPress={handleMarcarColetado}
                          disabled={atualizandoStatus}
                        >
                          {atualizandoStatus ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Feather name="check-circle" size={20} color="#FFFFFF" />
                              <Text style={styles.acaoButtonDestagueText}>Marcar como coletado</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <Text style={styles.acaoButtonHelper}>
                          Clique aqui quando terminar a coleta
                        </Text>
                      </View>
                    );
                  }
                  
                  if (statusNormalizado === 'coletado') {
                    return (
                      <View style={styles.statusDestaque}>
                        <View style={styles.aguardandoContainerDestaque}>
                          <Feather name="clock" size={20} color="#FFFFFF" />
                          <Text style={styles.aguardandoTextDestaque}>Aguardando cliente finalizar</Text>
                        </View>
                        <Text style={styles.statusHelperText}>
                          O cliente precisa confirmar o recebimento
                        </Text>
                      </View>
                    );
                  }
                  
                  if (statusNormalizado === 'finalizado') {
                    return (
                      <View style={styles.statusDestaque}>
                        <View style={styles.finalizadoContainerDestaque}>
                          <Feather name="check-circle" size={20} color="#FFFFFF" />
                          <Text style={styles.finalizadoTextDestaque}>Coleta finalizada!</Text>
                        </View>
                        <Text style={styles.statusHelperText}>
                          Parabéns! Coleta concluída com sucesso
                        </Text>
                      </View>
                    );
                  }
                  
                  if (statusNormalizado === 'cancelado') {
                    return (
                      <View style={styles.statusDestaque}>
                        <View style={styles.canceladoContainerDestaque}>
                          <Feather name="x" size={20} color="#FFFFFF" />
                          <Text style={styles.canceladoTextDestaque}>Coleta cancelada</Text>
                        </View>
                        <Text style={styles.statusHelperText}>
                          Esta coleta foi cancelada
                        </Text>
                      </View>
                    );
                  }
                  
                  // Status desconhecido - mostrar informação genérica
                  return (
                    <View style={styles.statusDestaque}>
                      <View style={styles.statusGenericoContainer}>
                        <Feather name="info" size={20} color="#666666" />
                        <Text style={styles.statusGenericoText}>Status: {selectedPedido.status_solicitacao}</Text>
                      </View>
                      <Text style={styles.statusHelperText}>
                        Status não reconhecido pelo sistema
                      </Text>
                    </View>
                  );
                })()}
                
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
                          <Text style={styles.clienteTelefone}>
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
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Endereço de Coleta</Text>
                  <View style={styles.enderecoDetail}>
                    <Feather name="map-pin" size={24} color="#4CAF50" style={styles.enderecoIcon} />
                    <View>
                      <Text style={styles.enderecoTexto}>
                        {selectedPedido.endereco_completo || 'Endereço não disponível'}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.mapaButton}
                    onPress={() => {
                      // Como não temos coordenadas específicas, usar busca por endereço
                      const enderecoEncoded = encodeURIComponent(selectedPedido.endereco_completo || '');
                      const url = `https://www.google.com/maps/search/?api=1&query=${enderecoEncoded}`;
                      Linking.openURL(url);
                    }}
                  >
                    <Feather name="map" size={18} color="#FFFFFF" />
                    <Text style={styles.mapaButtonText}>Abrir no Mapa</Text>
                  </TouchableOpacity>
                </View>
                
                {selectedPedido.observacoes_solicitacao && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Observações</Text>
                    <Text style={styles.observacoesText}>
                      {selectedPedido.observacoes_solicitacao}
                    </Text>
                  </View>
                )}
                
                <View style={styles.valorContainer}>
                  <Text style={styles.valorLabel}>Ganho:</Text>
                  <Text style={styles.valorTotal}>
                    R$ {formatarValor(selectedPedido.valor_pagamento)}
                  </Text>
                </View>
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
  coletarButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coletarButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
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
  clienteDescricao: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginTop: 2,
  },
  clienteTelefone: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
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
  acaoButtonContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  acaoButtonDestaque: {
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
  },
  acaoButtonDestagueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    marginLeft: 10,
    textAlign: 'center',
  },
  acaoButtonHelper: {
    color: '#4CAF50',
    fontSize: 13,
    fontFamily: 'Roboto-Medium',
    textAlign: 'center',
    marginTop: 12,
  },
  statusDestaque: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  aguardandoContainerDestaque: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#FF9800',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minWidth: 250,
  },
  aguardandoTextDestaque: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    marginLeft: 10,
    textAlign: 'center',
  },
  statusHelperText: {
    color: '#666666',
    fontSize: 13,
    fontFamily: 'Roboto-Medium',
    textAlign: 'center',
    marginTop: 12,
  },
  finalizadoContainerDestaque: {
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
  finalizadoTextDestaque: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    marginLeft: 10,
    textAlign: 'center',
  },
  
  // Estilos para status nos cards da lista
  aguardandoContainerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  aguardandoTextCard: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
  },
  finalizadoContainerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  finalizadoTextCard: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
  },
  
  // Estilos para containers de status adicionais
  canceladoContainerDestaque: {
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
  canceladoTextDestaque: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    marginLeft: 10,
    textAlign: 'center',
  },
  statusGenericoContainer: {
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
  statusGenericoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    marginLeft: 10,
    textAlign: 'center',
  },
  loadingDetalhes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingDetalhesText: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginLeft: 8,
  },
  erroDetalhes: {
    color: '#F44336',
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
  },
 });