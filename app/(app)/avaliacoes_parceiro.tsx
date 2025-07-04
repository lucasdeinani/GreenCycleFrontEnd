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
  TextInput,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useUser } from '../context/UserContext';
import { AvaliacaoService, Avaliacao, EstatisticasCliente, EstatisticasParceiro } from '../../services/AvaliacaoService';
import StarRating from '../../components/StarRating';

export default function AvaliacoesParceiroScreen() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avaliacoesPendentes, setAvaliacoesPendentes] = useState<Avaliacao[]>([]);
  const [avaliacoesRealizadas, setAvaliacoesRealizadas] = useState<Avaliacao[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEstatisticas, setModalEstatisticas] = useState(false);
  const [modalPerfilCliente, setModalPerfilCliente] = useState(false);
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<Avaliacao | null>(null);
  const [estatisticasParceiro, setEstatisticasParceiro] = useState<EstatisticasParceiro | null>(null);
  const [estatisticasCliente, setEstatisticasCliente] = useState<EstatisticasCliente | null>(null);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [salvandoAvaliacao, setSalvandoAvaliacao] = useState(false);
  const [carregandoPerfilCliente, setCarregandoPerfilCliente] = useState<number | null>(null);
  const [carregandoEstatisticas, setCarregandoEstatisticas] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    console.log('🔄 [AvaliacoesParceiro] useEffect executado');
    console.log('👤 [AvaliacoesParceiro] Usuário completo:', user);
    console.log('🆔 [AvaliacoesParceiro] User ID:', user?.user_id);
    console.log('🔑 [AvaliacoesParceiro] Tipo do usuário:', user?.tipo);
    
    if (user?.user_id) {
      console.log('✅ [AvaliacoesParceiro] User ID válido, carregando dados...');
      carregarDados();
    } else {
      console.warn('⚠️ [AvaliacoesParceiro] User ID não encontrado!');
    }
  }, [user?.user_id]);

  const carregarDados = async () => {
    if (!user?.user_id) {
      console.error('❌ [AvaliacoesParceiro] User ID não disponível');
      return;
    }

    try {
      console.log(`🚀 [AvaliacoesParceiro] Iniciando carregamento de dados para parceiro ${user.user_id}`);
      setIsLoading(true);
      
      // Buscar coletas pendentes para avaliação
      console.log('📥 [AvaliacoesParceiro] Buscando coletas pendentes...');
      const pendentes = await AvaliacaoService.buscarColetasParaAvaliacaoParceiro(user.user_id);
      console.log(`📊 [AvaliacoesParceiro] Coletas pendentes encontradas: ${pendentes.length}`);
      setAvaliacoesPendentes(pendentes);

      // Buscar avaliações já realizadas
      console.log('📥 [AvaliacoesParceiro] Buscando avaliações realizadas...');
      const realizadas = await AvaliacaoService.buscarAvaliacoesPorParceiro(user.user_id);
      console.log(`📊 [AvaliacoesParceiro] Total de avaliações do parceiro: ${realizadas.length}`);
      
      const realizadasFiltradas = realizadas.filter(av => av.nota_clientes > 0);
      console.log(`📊 [AvaliacoesParceiro] Avaliações com nota > 0: ${realizadasFiltradas.length}`);
      setAvaliacoesRealizadas(realizadasFiltradas);

      console.log('✅ [AvaliacoesParceiro] Carregamento concluído com sucesso');
    } catch (error) {
      console.error('❌ [AvaliacoesParceiro] Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados de avaliações.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    carregarDados();
  };

  const handleAvaliarCliente = (avaliacao: Avaliacao) => {
    setSelectedAvaliacao(avaliacao);
    setRating(avaliacao.nota_clientes);
    setComentario(avaliacao.descricao_clientes || '');
    setModalVisible(true);
  };

  const salvarAvaliacao = async () => {
    if (!selectedAvaliacao || !user?.user_id) return;
    
    if (rating === 0) {
      Alert.alert('Aviso', 'Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    try {
      setSalvandoAvaliacao(true);
      
      await AvaliacaoService.avaliarCliente({
        coleta_id: selectedAvaliacao.id_coletas,
        parceiro_id: user.user_id,
        nota_clientes: rating,
        descricao_clientes: comentario || undefined,
      });

      Alert.alert('Sucesso', 'Avaliação salva com sucesso!');
      setModalVisible(false);
      resetModal();
      carregarDados();

    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      Alert.alert('Erro', 'Não foi possível salvar a avaliação. Tente novamente.');
    } finally {
      setSalvandoAvaliacao(false);
    }
  };

  const resetModal = () => {
    setSelectedAvaliacao(null);
    setRating(0);
    setComentario('');
  };

  const carregarEstatisticasParceiro = async () => {
    if (!user?.user_id) {
      console.error('❌ [AvaliacoesParceiro] User ID não disponível para estatísticas');
      Alert.alert('Erro', 'ID do parceiro não encontrado');
      return;
    }

    if (carregandoEstatisticas) return; // Evita múltiplos cliques

    try {
      setCarregandoEstatisticas(true);
      console.log(`📊 [AvaliacoesParceiro] Carregando estatísticas do parceiro ${user.user_id}`);
      const stats = await AvaliacaoService.buscarEstatisticasParceiro(user.user_id);
      console.log('✅ [AvaliacoesParceiro] Estatísticas carregadas:', stats);
      setEstatisticasParceiro(stats);
      setModalEstatisticas(true);
    } catch (error) {
      console.error('❌ [AvaliacoesParceiro] Erro ao carregar estatísticas do parceiro:', error);
      Alert.alert('Erro', 'Não foi possível carregar suas estatísticas. Verifique se há dados de avaliação.');
    } finally {
      setCarregandoEstatisticas(false);
    }
  };

  const verPerfilCliente = async (clienteId: number) => {
    if (carregandoPerfilCliente === clienteId) return; // Evita múltiplos cliques
    
    try {
      setCarregandoPerfilCliente(clienteId);
      const stats = await AvaliacaoService.buscarEstatisticasCliente(clienteId);
      setEstatisticasCliente(stats);
      setModalPerfilCliente(true);
    } catch (error) {
      console.error('Erro ao carregar estatísticas do cliente:', error);
      Alert.alert('Erro', 'Não foi possível carregar o perfil do cliente.');
    } finally {
      setCarregandoPerfilCliente(null);
    }
  };

  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR');
    } catch (error) {
      return 'Data inválida';
    }
  };

  const renderAvaliacaoPendente = (avaliacao: Avaliacao) => (
    <View key={avaliacao.id} style={styles.avaliacaoCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.clienteNome}>{avaliacao.cliente_nome}</Text>
          <Text style={styles.materialNome}>{avaliacao.material_nome}</Text>
          <Text style={styles.dataColeta}>{formatarData(avaliacao.criado_em)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.infoButton, carregandoPerfilCliente === avaliacao.cliente_id && styles.infoButtonLoading]}
          onPress={() => verPerfilCliente(avaliacao.cliente_id)}
          disabled={carregandoPerfilCliente === avaliacao.cliente_id}
        >
          {carregandoPerfilCliente === avaliacao.cliente_id ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : (
            <Feather name="help-circle" size={20} color="#4CAF50" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.avaliarButton}
          onPress={() => handleAvaliarCliente(avaliacao)}
        >
          <Feather name="star" size={16} color="#FFFFFF" />
          <Text style={styles.avaliarButtonText}>Avaliar Cliente</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAvaliacaoRealizada = (avaliacao: Avaliacao) => (
    <View key={avaliacao.id} style={styles.avaliacaoCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.clienteNome}>{avaliacao.cliente_nome}</Text>
          <Text style={styles.materialNome}>{avaliacao.material_nome}</Text>
          <Text style={styles.dataColeta}>{formatarData(avaliacao.criado_em)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.infoButton, carregandoPerfilCliente === avaliacao.cliente_id && styles.infoButtonLoading]}
          onPress={() => verPerfilCliente(avaliacao.cliente_id)}
          disabled={carregandoPerfilCliente === avaliacao.cliente_id}
        >
          {carregandoPerfilCliente === avaliacao.cliente_id ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : (
            <Feather name="help-circle" size={20} color="#4CAF50" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.avaliacaoRealizada}>
        <Text style={styles.avaliacaoLabel}>Sua avaliação:</Text>
        <StarRating rating={avaliacao.nota_clientes} disabled size={20} />
        {avaliacao.descricao_clientes && (
          <Text style={styles.comentarioRealizado}>{avaliacao.descricao_clientes}</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.editarButton}
        onPress={() => handleAvaliarCliente(avaliacao)}
      >
        <Feather name="edit-2" size={14} color="#4CAF50" />
        <Text style={styles.editarButtonText}>Editar Avaliação</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Carregando avaliações...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Feather name="arrow-left" size={24} color="#333333" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Avaliações</Text>
        <Text style={styles.subtitle}>Avalie os clientes das suas coletas</Text>
      </View>

      <TouchableOpacity
        style={[styles.estatisticasButton, carregandoEstatisticas && styles.estatisticasButtonLoading]}
        onPress={carregarEstatisticasParceiro}
        disabled={carregandoEstatisticas}
      >
        {carregandoEstatisticas ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Feather name="bar-chart-2" size={20} color="#FFFFFF" />
        )}
        <Text style={styles.estatisticasButtonText}>
          {carregandoEstatisticas ? 'Carregando...' : 'Ver Minhas Estatísticas'}
        </Text>
      </TouchableOpacity>

      {/* Avaliações Pendentes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pendentes para Avaliação</Text>
        {avaliacoesPendentes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="check-circle" size={60} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>Tudo em dia!</Text>
            <Text style={styles.emptyText}>Você não possui avaliações pendentes.</Text>
          </View>
        ) : (
          avaliacoesPendentes.map(renderAvaliacaoPendente)
        )}
      </View>

      {/* Avaliações Realizadas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avaliações Realizadas</Text>
        {avaliacoesRealizadas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="star" size={60} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>Nenhuma avaliação</Text>
            <Text style={styles.emptyText}>Você ainda não fez nenhuma avaliação.</Text>
          </View>
        ) : (
          avaliacoesRealizadas.map(renderAvaliacaoRealizada)
        )}
      </View>

      <View style={styles.footer}>
        <FontAwesome5 name="leaf" size={40} color="#4CAF50" />
        <Text style={styles.footerText}>Green Cycle</Text>
      </View>

      {/* Modal de Avaliação */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Avaliar Cliente</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetModal(); }}>
                <Feather name="x" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            {selectedAvaliacao && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalClienteNome}>{selectedAvaliacao.cliente_nome}</Text>
                <Text style={styles.modalMaterial}>{selectedAvaliacao.material_nome}</Text>
                
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingLabel}>Sua avaliação:</Text>
                  <StarRating rating={rating} onRatingChange={setRating} size={32} />
                </View>

                <View style={styles.comentarioContainer}>
                  <Text style={styles.comentarioLabel}>Comentário (opcional):</Text>
                  <TextInput
                    style={styles.comentarioInput}
                    value={comentario}
                    onChangeText={setComentario}
                    placeholder="Digite seu comentário sobre o cliente..."
                    multiline
                    maxLength={300}
                  />
                </View>

                <TouchableOpacity
                  style={styles.salvarButton}
                  onPress={salvarAvaliacao}
                  disabled={salvandoAvaliacao}
                >
                  {salvandoAvaliacao ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="check" size={20} color="#FFFFFF" />
                      <Text style={styles.salvarButtonText}>Salvar Avaliação</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Estatísticas do Parceiro */}
      <Modal visible={modalEstatisticas} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Minhas Estatísticas</Text>
              <TouchableOpacity onPress={() => setModalEstatisticas(false)}>
                <Feather name="x" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            {estatisticasParceiro && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{estatisticasParceiro.media_notas.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Média das Avaliações Recebidas</Text>
                  <StarRating rating={Math.round(estatisticasParceiro.media_notas)} disabled size={24} />
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{estatisticasParceiro.total_avaliacoes}</Text>
                    <Text style={styles.statText}>Avaliações Recebidas</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{estatisticasParceiro.total_coletas_finalizadas}</Text>
                    <Text style={styles.statText}>Coletas Realizadas</Text>
                  </View>
                </View>

                <View style={styles.detalhesNotas}>
                  <Text style={styles.detalhesTitle}>Distribuição das Notas:</Text>
                  {Object.entries(estatisticasParceiro.notas_detalhadas).map(([nota, quantidade]) => (
                    <View key={nota} style={styles.notaItem}>
                      <StarRating rating={parseInt(nota)} disabled size={16} />
                      <Text style={styles.notaQuantidade}>{quantidade} avaliações</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Perfil do Cliente */}
      <Modal visible={modalPerfilCliente} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Perfil do Cliente</Text>
              <TouchableOpacity onPress={() => setModalPerfilCliente(false)}>
                <Feather name="x" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            {estatisticasCliente && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalClienteNome}>{estatisticasCliente.cliente_nome}</Text>
                
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{estatisticasCliente.media_notas.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Média das Avaliações</Text>
                  <StarRating rating={Math.round(estatisticasCliente.media_notas)} disabled size={24} />
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{estatisticasCliente.total_avaliacoes}</Text>
                    <Text style={styles.statText}>Avaliações Recebidas</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{estatisticasCliente.total_coletas_finalizadas}</Text>
                    <Text style={styles.statText}>Coletas Solicitadas</Text>
                  </View>
                </View>

                <View style={styles.detalhesNotas}>
                  <Text style={styles.detalhesTitle}>Distribuição das Notas:</Text>
                  {Object.entries(estatisticasCliente.notas_detalhadas).map(([nota, quantidade]) => (
                    <View key={nota} style={styles.notaItem}>
                      <StarRating rating={parseInt(nota)} disabled size={16} />
                      <Text style={styles.notaQuantidade}>{quantidade} avaliações</Text>
                    </View>
                  ))}
                </View>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 50,
    marginLeft: 16,
    marginBottom: 10,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333333',
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  estatisticasButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
  },
  estatisticasButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  estatisticasButtonLoading: {
    opacity: 0.6,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  avaliacaoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  clienteNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  materialNome: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 2,
  },
  dataColeta: {
    fontSize: 12,
    color: '#999999',
  },
  infoButton: {
    padding: 8,
  },
  infoButtonLoading: {
    opacity: 0.6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  avaliarButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  avaliarButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  avaliacaoRealizada: {
    marginBottom: 12,
  },
  avaliacaoLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
  },
  comentarioRealizado: {
    fontSize: 14,
    color: '#333333',
    fontStyle: 'italic',
    marginTop: 8,
    backgroundColor: '#F8F8F8',
    padding: 8,
    borderRadius: 6,
  },
  editarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editarButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 32,
  },
  footerText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  modalBody: {
    padding: 16,
  },
  modalClienteNome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMaterial: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 24,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 12,
  },
  comentarioContainer: {
    marginBottom: 24,
  },
  comentarioLabel: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  comentarioInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333333',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  salvarButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  salvarButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Statistics styles
  statCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  statText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  detalhesNotas: {
    marginTop: 16,
  },
  detalhesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  notaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 6,
    marginBottom: 6,
  },
  notaQuantidade: {
    fontSize: 14,
    color: '#666666',
  },
});