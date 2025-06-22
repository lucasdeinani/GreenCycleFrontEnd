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
import { Feather } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../configs'; 
import axios from 'axios';

// Declaração global para TypeScript
declare global {
  var refreshHistoric: (() => void) | undefined;
}

interface Material {
  id: number;
  nome: string;
}

interface Endereco {
  id: number;
  rua: string;
  numero?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  complemento?: string;
}

interface FormData {
  id_materiais: number | '';
  peso_material: string;
  quantidade_material: string;
  id_enderecos: number | '';
  observacoes: string;
}

export default function SolicitarColetaScreen() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [countdownValue, setCountdownValue] = useState(5);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    id_materiais: '',
    peso_material: '',
    quantidade_material: '',
    id_enderecos: '',
    observacoes: ''
  });

  // Carregar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Buscar materiais da API
        const materiaisResponse = await axios.get(`${API_BASE_URL}/materiais`);
        setMateriais(materiaisResponse.data);
        
        // Buscar endereços do usuário
        if (user?.client_id) {
          const enderecosResponse = await axios.get(`${API_BASE_URL}/enderecos?id_usuarios=${user.client_id}`);
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
    let intervalId: ReturnType<typeof setInterval>;
    
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

  const handleChange = (name: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectMaterial = (materialId: number) => {
    setFormData(prev => ({ ...prev, id_materiais: materialId }));
  };

  const handleSelectEndereco = (enderecoId: number) => {
    setFormData(prev => ({ ...prev, id_enderecos: enderecoId }));
  };

  // Função para converter vírgula para ponto
  const handlePesoChange = (value: string) => {
    // Converter vírgula para ponto
    const valorConvertido = value.replace(',', '.');
    handleChange('peso_material', valorConvertido);
    
    // Se preencheu peso, limpar quantidade
    if (valorConvertido && parseFloat(valorConvertido) > 0) {
      setFormData(prev => ({ ...prev, quantidade_material: '' }));
    }
  };

  const handleQuantidadeChange = (value: string) => {
    handleChange('quantidade_material', value);
    
    // Se preencheu quantidade, limpar peso
    if (value && parseInt(value) > 0) {
      setFormData(prev => ({ ...prev, peso_material: '' }));
    }
  };

  const handleConfirmShow = () => {
    // Validação dos campos obrigatórios
    if (!formData.id_materiais) {
      Alert.alert('Erro', 'Por favor, selecione um material.');
      return;
    }
    
    // Validação: aceitar apenas peso OU quantidade (não ambos)
    const temPeso = formData.peso_material && parseFloat(formData.peso_material) > 0;
    const temQuantidade = formData.quantidade_material && parseInt(formData.quantidade_material) > 0;
    
    if (!temPeso && !temQuantidade) {
      Alert.alert('Erro', 'Por favor, informe pelo menos o peso ou a quantidade.');
      return;
    }
    
    if (temPeso && temQuantidade) {
      Alert.alert('Erro', 'Por favor, informe apenas o peso OU a quantidade (não ambos).');
      return;
    }
    
    if (!formData.id_enderecos) {
      Alert.alert(
        'Erro', 
        'Por favor, selecione um endereço para coleta.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Cadastrar Endereço', 
            onPress: () => router.push('/(app)/address_register' as any) 
          }
        ]
      );
      return;
    }

    setConfirmVisible(true);
    setIsCountdownActive(true);
  };

  const handleSubmit = async () => {
    if (!user?.client_id) {
      Alert.alert('Erro', 'Dados do usuário não encontrados.');
      return;
    }

    setIsSending(true);
    
    try {
      // Novo formato da API - criar coleta diretamente
      // Apenas peso OU quantidade, nunca ambos
      const temPeso = formData.peso_material && parseFloat(formData.peso_material) > 0;
      const temQuantidade = formData.quantidade_material && parseInt(formData.quantidade_material) > 0;
      
      const coletaData: any = {
        id_clientes: user.client_id,
        id_materiais: Number(formData.id_materiais),
        id_enderecos: Number(formData.id_enderecos),
        dados_solicitacao: {
          observacoes: formData.observacoes || null
        },
        dados_pagamento: {
          valor_pagamento: "0.00", // Será calculado no backend
          saldo_pagamento: "0.00"
        }
      };

      // Adicionar apenas peso OU quantidade
      if (temPeso) {
        coletaData.peso_material = parseFloat(formData.peso_material).toFixed(4);
      } else if (temQuantidade) {
        coletaData.quantidade_material = parseInt(formData.quantidade_material);
      }

      console.log('Enviando coleta:', coletaData);

      const response = await axios.post(`${API_BASE_URL}/coletas/`, coletaData);

      console.log('Coleta criada:', response.data);

      // Limpar formulário e fechar modal
      setFormData({
        id_materiais: '',
        peso_material: '',
        quantidade_material: '',
        id_enderecos: '',
        observacoes: ''
      });
      
      setConfirmVisible(false);
      
      // Mostrar mensagem de sucesso
      Alert.alert(
        'Solicitação Enviada',
        'Sua solicitação de coleta foi registrada com sucesso! Em breve um parceiro entrará em contato.',
        [{ 
          text: 'OK', 
          onPress: () => {
            // Verificar se veio do histórico e recarregar forçando refresh
            if (router.canGoBack()) {
              // Navegar de volta e forçar refresh da tela anterior
              router.back();
              // Pequeno delay para garantir que a tela anterior já carregou
              setTimeout(() => {
                // Dispatch um evento customizado para forçar refresh
                if (global.refreshHistoric) {
                  global.refreshHistoric();
                }
              }, 100);
            } else {
              router.push('/(app)/home' as any);
            }
          }
        }]
      );
      
    } catch (error: any) {
      console.error('Erro ao enviar solicitação:', error.response?.data || error.message);
      
      // Mensagem de erro mais específica
      let errorMessage = 'Não foi possível enviar sua solicitação de coleta.';
      
      if (error.response?.status === 400) {
        errorMessage += ' Verifique se todos os dados estão corretos.';
      } else if (error.response?.status === 500) {
        errorMessage += ' Erro no servidor. Tente novamente mais tarde.';
      } else {
        errorMessage += ' Verifique sua conexão e tente novamente.';
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const getMaterialNome = (id: number | string) => {
    const material = materiais.find(m => m.id === Number(id));
    return material ? material.nome : '';
  };

  const getEnderecoString = (id: number | string) => {
    const endereco = enderecos.find(e => e.id === Number(id));
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
        <Feather name="arrow-left" size={24} color="#333333" />
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
          <Text style={styles.helperText}>Informe apenas o peso OU a quantidade abaixo</Text>
          <TextInput
            style={styles.input}
            value={formData.peso_material}
            onChangeText={handlePesoChange}
            placeholder="Ex: 5.5"
            placeholderTextColor="#999999"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantidade de itens</Text>
          <Text style={styles.helperText}>Alternativa ao peso (não preencha ambos)</Text>
          <TextInput
            style={styles.input}
            value={formData.quantidade_material}
            onChangeText={handleQuantidadeChange}
            placeholder="Ex: 10"
            placeholderTextColor="#999999"
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
                    <Feather name="check" size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          {enderecos.length === 0 && (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => router.push('/(app)/address_register' as any)}
            >
              <Feather name="plus" size={20} color="#4CAF50" />
              <Text style={styles.addAddressText}>Cadastrar Novo Endereço</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Observações</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.observacoes}
            onChangeText={(value) => handleChange('observacoes', value)}
            placeholder="Informações adicionais para a coleta"
            placeholderTextColor="#999999"
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
        <FontAwesome5 name="leaf" size={40} color="#4CAF50" />
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
                  <Feather name="clock" size={24} color="#666666" />
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
  helperText: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
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
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  addAddressText: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#4CAF50',
    marginLeft: 8,
  },
});