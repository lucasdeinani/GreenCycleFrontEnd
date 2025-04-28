import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Leaf, Clock, Check } from 'lucide-react-native';
import { useUser } from '../context/UserContext';
import axios from 'axios';

// URL base da API
const API_BASE_URL = 'http://192.168.0.86:8000/v1';

export default function SolicitarColetaScreen() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [materiais, setMateriais] = useState([]);
  const [enderecos, setEnderecos] = useState([]);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [countdownValue, setCountdownValue] = useState(5);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  
  const [formData, setFormData] = useState({
    id_materiais: '',
    peso_material: '',
    quantidade_material: '1',
    id_enderecos: '',
    observacoes: ''
  });

  // Carregar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Definir materiais estaticamente conforme solicitado
        setMateriais([
          { id: 1, nome: 'Metal' },
          { id: 2, nome: 'Papel' },
          { id: 3, nome: 'Plástico' },
          { id: 4, nome: 'Vidro' },
          { id: 5, nome: 'Eletrônico' },
        ]);
        
        // Buscar endereços do usuário
        if (user?.id) {
          const enderecosResponse = await axios.get(`${API_BASE_URL}/enderecos?id_usuarios=${user.id_usuarios}`);
          setEnderecos(enderecosResponse.data);
          
          // Verificar se o usuário não tem endereços cadastrados
          if (enderecosResponse.data.length === 0) {
            setTimeout(() => {
              Alert.alert(
                "Sem endereços cadastrados",
                "Você não possui nenhum endereço cadastrado, faça o registro para criar uma solicitação de coleta",
                [{ text: "OK", onPress: () => router.back() }]
              );
            }, 500);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        Alert.alert('Erro', 'Não foi possível carregar os dados necessários. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Gerenciar o countdown
  useEffect(() => {
    let intervalId;
    
    if (isCountdownActive && countdownValue > 0) {
      intervalId = setInterval(() => {
        setCountdownValue((prev) => prev - 1);
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isCountdownActive, countdownValue]);

  // Reset do countdown quando o modal é fechado
  useEffect(() => {
    if (!confirmVisible) {
      setCountdownValue(5);
      setIsCountdownActive(false);
    }
  }, [confirmVisible]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectMaterial = (materialId) => {
    setFormData(prev => ({ ...prev, id_materiais: materialId }));
  };

  const handleSelectEndereco = (enderecoId) => {
    setFormData(prev => ({ ...prev, id_enderecos: enderecoId }));
  };

  const handleConfirmShow = () => {
    // Validação dos campos obrigatórios
    if (!formData.id_materiais) {
      Alert.alert('Erro', 'Por favor, selecione um material.');
      return;
    }
    
    if (!formData.peso_material) {
      Alert.alert('Erro', 'Por favor, informe o peso do material.');
      return;
    }
    
    if (!formData.id_enderecos) {
      Alert.alert('Erro', 'Por favor, selecione um endereço para coleta.');
      return;
    }

    setConfirmVisible(true);
    setIsCountdownActive(true);
  };

  const handleSubmit = async () => {
    setIsSending(true);
    
    try {
      // 1. Criar pagamento
      const pagamentoResponse = await axios.post(`${API_BASE_URL}/pagamentos`, {
        valor_pagamento: 0,
        saldo_pagamento: 0,
        estado_pagamento: "1" // Pendente
      });

      // 2. Criar solicitação
      const solicitacaoResponse = await axios.post(`${API_BASE_URL}/solicitacoes`, {
        estado_solicitacao: "1", // Pendente
        observacoes: formData.observacoes || null,
        latitude: 0, // Seria obtido do endereço ou GPS
        longitude: 0 // Seria obtido do endereço ou GPS
      });

      // 3. Criar coleta
      await axios.post(`${API_BASE_URL}/coletas`, {
        id_clientes: user.id,
        id_parceiros: null, // Será atribuído posteriormente
        id_materiais: formData.id_materiais,
        peso_material: formData.peso_material,
        quantidade_material: formData.quantidade_material,
        id_enderecos: formData.id_enderecos,
        id_solicitacoes: solicitacaoResponse.data.id,
        id_pagamentos: pagamentoResponse.data.id
      });

      // Limpar formulário e fechar modal
      setFormData({
        id_materiais: '',
        peso_material: '',
        quantidade_material: '1',
        id_enderecos: '',
        observacoes: ''
      });
      
      setConfirmVisible(false);
      
      // Mostrar mensagem de sucesso
      Alert.alert(
        'Solicitação Enviada',
        'Sua solicitação de coleta foi registrada com sucesso!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      Alert.alert('Erro', 'Não foi possível enviar sua solicitação de coleta. Tente novamente.');
    } finally {
      setIsSending(false);
    }
  };

  const getMaterialNome = (id) => {
    const material = materiais.find(m => m.id === id);
    return material ? material.nome : '';
  };

  const getEnderecoString = (id) => {
    const endereco = enderecos.find(e => e.id === parseInt(id));
    if (!endereco) return '';
    
    return `${endereco.rua}, ${endereco.numero || 'S/N'} - ${endereco.bairro}, ${endereco.cidade}`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color="#333333" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
      
      <View style={styles.header}>
        <Text style={styles.title}>Nova Solicitação</Text>
        <Text style={styles.subtitle}>Preencha os dados para solicitar uma coleta</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecione o Material</Text>
          <View style={styles.materiaisGrid}>
            {materiais.map((material) => (
              <TouchableOpacity
                key={material.id}
                style={[
                  styles.materialButton,
                  formData.id_materiais === material.id && styles.materialButtonActive
                ]}
                onPress={() => handleSelectMaterial(material.id)}
              >
                <Text 
                  style={[
                    styles.materialButtonText,
                    formData.id_materiais === material.id && styles.materialButtonTextActive
                  ]}
                >
                  {material.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Peso estimado (kg) *</Text>
          <TextInput
            style={styles.input}
            value={formData.peso_material}
            onChangeText={(value) => handleChange('peso_material', value)}
            placeholder="Ex: 5.5"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantidade de itens</Text>
          <TextInput
            style={styles.input}
            value={formData.quantidade_material}
            onChangeText={(value) => handleChange('quantidade_material', value)}
            placeholder="Ex: 10"
            keyboardType="number-pad"
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecione o Endereço</Text>
          <ScrollView style={styles.enderecosContainer}>
            {enderecos.map((endereco) => (
              <TouchableOpacity
                key={endereco.id}
                style={[
                  styles.enderecoCard,
                  formData.id_enderecos === endereco.id && styles.enderecoCardActive
                ]}
                onPress={() => handleSelectEndereco(endereco.id)}
              >
                <View style={styles.enderecoContent}>
                  <Text style={styles.enderecoRua}>
                    {endereco.rua}, {endereco.numero || 'S/N'}
                  </Text>
                  <Text style={styles.enderecoBairro}>
                    {endereco.bairro}, {endereco.cidade} - {endereco.estado}
                  </Text>
                  <Text style={styles.enderecoCep}>
                    CEP: {endereco.cep}
                  </Text>
                </View>
                {formData.id_enderecos === endereco.id && (
                  <View style={styles.enderecoCheckmark}>
                    <Check size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Observações</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.observacoes}
            onChangeText={(value) => handleChange('observacoes', value)}
            placeholder="Informações adicionais para a coleta"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleConfirmShow}
        >
          <Text style={styles.submitButtonText}>Solicitar Coleta</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Leaf size={40} color="#4CAF50" />
        <Text style={styles.footerText}>Green Cycle</Text>
      </View>
      
      {/* Modal de confirmação */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !isSending && setConfirmVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar Solicitação</Text>
            
            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoLabel}>Material:</Text>
              <Text style={styles.modalInfoValue}>{getMaterialNome(formData.id_materiais)}</Text>
            </View>
            
            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoLabel}>Peso:</Text>
              <Text style={styles.modalInfoValue}>{formData.peso_material} kg</Text>
            </View>
            
            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoLabel}>Quantidade:</Text>
              <Text style={styles.modalInfoValue}>{formData.quantidade_material} itens</Text>
            </View>
            
            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoLabel}>Endereço:</Text>
              <Text style={styles.modalInfoValue}>{getEnderecoString(formData.id_enderecos)}</Text>
            </View>
            
            {formData.observacoes && (
              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoLabel}>Obs:</Text>
                <Text style={styles.modalInfoValue}>{formData.observacoes}</Text>
              </View>
            )}
            
            <View style={styles.countdownContainer}>
              {countdownValue > 0 ? (
                <>
                  <Clock size={24} color="#666666" />
                  <Text style={styles.countdownText}>
                    Aguarde {countdownValue} segundos para confirmar
                  </Text>
                </>
              ) : (
                <Text style={styles.countdownComplete}>
                  Pronto para confirmar!
                </Text>
              )}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => !isSending && setConfirmVisible(false)}
                disabled={isSending}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (countdownValue > 0 || isSending) && styles.confirmButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={countdownValue > 0 || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginBottom: 12,
  },
  materiaisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  materialButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',  // Aproximadamente metade da largura com espaço entre
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  materialButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  materialButtonText: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
  },
  materialButtonTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  enderecosContainer: {
    maxHeight: 200,
  },
  enderecoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  enderecoCardActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  enderecoContent: {
    flex: 1,
  },
  enderecoRua: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
  },
  enderecoBairro: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  enderecoCep: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginTop: 4,
  },
  enderecoCheckmark: {
    backgroundColor: '#4CAF50',
    borderRadius: 50,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
  footer: {
    alignItems: 'center',
    padding: 16,
    paddingTop: 16,
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
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  modalInfoLabel: {
    width: 80,
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#666666',
  },
  modalInfoValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  countdownText: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#666666',
    marginLeft: 8,
  },
  countdownComplete: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#4CAF50',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#9E9E9E',
    opacity: 0.7,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
  },
});