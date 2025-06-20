import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import { API_BASE_URL } from '../configs';

export default function AddressRegisterScreen() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    cep: '',
    estado: '',
    cidade: '',
    bairro: '',
    rua: '',
    numero: '',
    complemento: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatCEP = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handleCepChange = async (cep: string) => {
    const formattedCep = formatCEP(cep);
    handleChange('cep', formattedCep);

    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length === 8) {
      try {
        setIsLoading(true);
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            cep: formattedCep,
            estado: data.uf || '',
            cidade: data.localidade || '',
            bairro: data.bairro || '',
            rua: data.logradouro || ''
          }));
        } else {
          Alert.alert('Aviso', 'CEP não encontrado. Preencha os dados manualmente.');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        Alert.alert('Erro', 'Não foi possível buscar o CEP. Preencha os dados manualmente.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cep) newErrors.cep = 'CEP é obrigatório';
    else if (formData.cep.replace(/\D/g, '').length !== 8) newErrors.cep = 'CEP inválido';

    if (!formData.estado) newErrors.estado = 'Estado é obrigatório';
    if (!formData.cidade) newErrors.cidade = 'Cidade é obrigatória';
    if (!formData.bairro) newErrors.bairro = 'Bairro é obrigatório';
    if (!formData.rua) newErrors.rua = 'Rua é obrigatória';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    if (!user?.user_id) {
      Alert.alert('Erro', 'Usuário não encontrado. Faça login novamente.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        id_usuarios: user.user_id,
        cep: formData.cep.replace(/\D/g, ''),
        estado: formData.estado.trim(),
        cidade: formData.cidade.trim(),
        bairro: formData.bairro.trim(),
        rua: formData.rua.trim(),
        numero: formData.numero ? parseInt(formData.numero) : null,
        complemento: formData.complemento.trim() || null,
        latitude: 0, // TODO: Implementar geolocalização
        longitude: 0 // TODO: Implementar geolocalização
      };

      console.log('Criando endereço:', payload);

      const response = await axios.post(`${API_BASE_URL}/enderecos/`, payload);

      console.log('Endereço criado:', response.data);

      Alert.alert(
        'Sucesso', 
        'Endereço cadastrado com sucesso!',
        [{ text: 'OK', onPress: () => router.back() }]
      );

    } catch (error) {
      console.error('Erro ao cadastrar endereço:', error.response?.data || error.message);
      
      let errorMessage = 'Não foi possível cadastrar o endereço.';
      
      if (error.response?.status === 400) {
        errorMessage += ' Verifique se todos os dados estão corretos.';
      } else if (error.response?.status === 500) {
        errorMessage += ' Erro no servidor. Tente novamente mais tarde.';
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Feather name="arrow-left" size={24} color="#333333" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Cadastrar Endereço</Text>
        <Text style={styles.subtitle}>Adicione um novo endereço para coletas</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>CEP *</Text>
          <TextInput
            style={[styles.input, errors.cep && styles.inputError]}
            value={formData.cep}
            onChangeText={handleCepChange}
            placeholder="00000-000"
            keyboardType="numeric"
            maxLength={9}
            editable={!isLoading}
          />
          {errors.cep && <Text style={styles.errorText}>{errors.cep}</Text>}
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Estado *</Text>
            <TextInput
              style={[styles.input, errors.estado && styles.inputError]}
              value={formData.estado}
              onChangeText={(value) => handleChange('estado', value.toUpperCase())}
              placeholder="UF"
              maxLength={2}
              editable={!isLoading}
            />
            {errors.estado && <Text style={styles.errorText}>{errors.estado}</Text>}
          </View>
          <View style={[styles.inputGroup, { flex: 2 }]}>
            <Text style={styles.label}>Cidade *</Text>
            <TextInput
              style={[styles.input, errors.cidade && styles.inputError]}
              value={formData.cidade}
              onChangeText={(value) => handleChange('cidade', value)}
              placeholder="Nome da cidade"
              editable={!isLoading}
            />
            {errors.cidade && <Text style={styles.errorText}>{errors.cidade}</Text>}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bairro *</Text>
          <TextInput
            style={[styles.input, errors.bairro && styles.inputError]}
            value={formData.bairro}
            onChangeText={(value) => handleChange('bairro', value)}
            placeholder="Nome do bairro"
            editable={!isLoading}
          />
          {errors.bairro && <Text style={styles.errorText}>{errors.bairro}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Rua *</Text>
          <TextInput
            style={[styles.input, errors.rua && styles.inputError]}
            value={formData.rua}
            onChangeText={(value) => handleChange('rua', value)}
            placeholder="Nome da rua"
            editable={!isLoading}
          />
          {errors.rua && <Text style={styles.errorText}>{errors.rua}</Text>}
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Número</Text>
            <TextInput
              style={styles.input}
              value={formData.numero}
              onChangeText={(value) => handleChange('numero', value.replace(/\D/g, ''))}
              placeholder="123"
              keyboardType="numeric"
              editable={!isLoading}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 2 }]}>
            <Text style={styles.label}>Complemento</Text>
            <TextInput
              style={styles.input}
              value={formData.complemento}
              onChangeText={(value) => handleChange('complemento', value)}
              placeholder="Apto, bloco, etc."
              editable={!isLoading}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Cadastrar Endereço</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <FontAwesome5 name="leaf" size={40} color="#4CAF50" />
        <Text style={styles.footerText}>Green Cycle</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  inputError: {
    borderColor: '#F44336',
    borderWidth: 2,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
  buttonDisabled: {
    backgroundColor: '#9E9E9E',
    opacity: 0.7,
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
});