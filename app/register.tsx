import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Leaf, Check } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const MATERIAL_OPTIONS = [
  'Metais',
  'Papeis',
  'Plastico',
  'Residuo Organico',
  'Residuo Hospitalar'
];

export default function RegisterScreen() {
  const [userType, setUserType] = useState<'client' | 'partner'>('client');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    document: '', // CPF or CNPJ
    gender: '',
    birthday: new Date(),
    username: '',
    password: '',
    confirmPassword: '',
    collectionMaterials: [] as string[], // Changed to array for multiple selections
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleMaterialToggle = (material: string) => {
    setFormData(prev => {
      const materials = prev.collectionMaterials.includes(material)
        ? prev.collectionMaterials.filter(m => m !== material)
        : [...prev.collectionMaterials, material];
      
      return { ...prev, collectionMaterials: materials };
    });
    if (errors.collectionMaterials) {
      setErrors(prev => ({ ...prev, collectionMaterials: null }));
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, birthday: selectedDate }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName) newErrors.fullName = 'Nome é obrigatório';
    if (!formData.email) newErrors.email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';
    
    if (!formData.document) {
      newErrors.document = userType === 'client' ? 'CPF é obrigatório' : 'CNPJ é obrigatório';
    } else {
      const cleanDoc = formData.document.replace(/\D/g, '');
      if (userType === 'client' && cleanDoc.length !== 11) {
        newErrors.document = 'CPF inválido';
      } else if (userType === 'partner' && cleanDoc.length !== 14) {
        newErrors.document = 'CNPJ inválido';
      }
    }
    
    if (userType === 'client' && !formData.gender) {
      newErrors.gender = 'Sexo é obrigatório';
    }

    if (userType === 'partner' && formData.collectionMaterials.length === 0) {
      newErrors.collectionMaterials = 'Selecione pelo menos um material para coleta';
    }
    
    if (!formData.username) newErrors.username = 'Usuário é obrigatório';
    
    if (!formData.password) newErrors.password = 'Senha é obrigatória';
    else if (formData.password.length < 8) newErrors.password = 'Senha deve ter no mínimo 8 caracteres';
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não conferem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log('Form submitted:', formData);
      router.replace('/login');
    }
  };

  const handleUserTypeChange = (type: 'client' | 'partner') => {
    setUserType(type);
    // Reset material selections when switching user types
    if (type === 'client') {
      setFormData(prev => ({ ...prev, collectionMaterials: [] }));
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color="#4CAF50" />
        <Text style={styles.backButtonText}>Retorne ao Login</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Leaf size={40} color="#4CAF50" />
        <Text style={styles.title}>Crie sua conta</Text>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, userType === 'client' && styles.toggleButtonActive]}
          onPress={() => handleUserTypeChange('client')}
        >
          <Text style={[styles.toggleText, userType === 'client' && styles.toggleTextActive]}>
            Cliente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, userType === 'partner' && styles.toggleButtonActive]}
          onPress={() => handleUserTypeChange('partner')}
        >
          <Text style={[styles.toggleText, userType === 'partner' && styles.toggleTextActive]}>
            Parceiro
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput
            style={[styles.input, errors.fullName && styles.inputError]}
            placeholder="Escreva seu nome completo"
            value={formData.fullName}
            onChangeText={(value) => handleChange('fullName', value)}
          />
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Escreva seu email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{userType === 'client' ? 'CPF' : 'CNPJ'}</Text>
          <TextInput
            style={[styles.input, errors.document && styles.inputError]}
            placeholder={`Escreva seu ${userType === 'client' ? 'CPF' : 'CNPJ'}`}
            keyboardType="numeric"
            value={formData.document}
            onChangeText={(value) => handleChange('document', value)}
            maxLength={userType === 'client' ? 14 : 18}
          />
          {errors.document && <Text style={styles.errorText}>{errors.document}</Text>}
        </View>

        {userType === 'client' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sexo</Text>
            <View style={styles.genderContainer}>
              {['Masculino', 'Feminino', 'Outro'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderButton,
                    formData.gender === gender && styles.genderButtonActive
                  ]}
                  onPress={() => handleChange('gender', gender)}
                >
                  <Text style={[
                    styles.genderButtonText,
                    formData.gender === gender && styles.genderButtonTextActive
                  ]}>
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
          </View>
        )}

        {userType === 'partner' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Materiais que deseja coletar</Text>
            <View style={styles.materialContainer}>
              {MATERIAL_OPTIONS.map((material) => (
                <TouchableOpacity
                  key={material}
                  style={[
                    styles.materialButton,
                    formData.collectionMaterials.includes(material) && styles.materialButtonActive
                  ]}
                  onPress={() => handleMaterialToggle(material)}
                >
                  <View style={styles.materialButtonContent}>
                    <View style={[
                      styles.checkbox,
                      formData.collectionMaterials.includes(material) && styles.checkboxActive
                    ]}>
                      {formData.collectionMaterials.includes(material) && (
                        <Check size={16} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={[
                      styles.materialButtonText,
                      formData.collectionMaterials.includes(material) && styles.materialButtonTextActive
                    ]}>
                      {material}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            {errors.collectionMaterials && (
              <Text style={styles.errorText}>{errors.collectionMaterials}</Text>
            )}
          </View>
        )}

        {userType === 'client' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Aniversário</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {formData.birthday.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.birthday}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Usuário</Text>
          <TextInput
            style={[styles.input, errors.username && styles.inputError]}
            placeholder="Escreva um nome de usuário"
            autoCapitalize="none"
            value={formData.username}
            onChangeText={(value) => handleChange('username', value)}
          />
          {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="Digite sua senha"
            secureTextEntry
            value={formData.password}
            onChangeText={(value) => handleChange('password', value)}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirme a Senha</Text>
          <TextInput
            style={[styles.input, errors.confirmPassword && styles.inputError]}
            placeholder="Confirme sua senha"
            secureTextEntry
            value={formData.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
          />
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
        </View>

        <TouchableOpacity style={styles.registerButton} onPress={handleSubmit}>
          <Text style={styles.registerButtonText}>Finalizar Cadastro</Text>
        </TouchableOpacity>
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
    color: '#4CAF50',
  },
  header: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginTop: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    margin: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#FFC107',
  },
  toggleText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: '#666666',
  },
  toggleTextActive: {
    color: '#333333',
  },
  form: {
    padding: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#666666',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputError: {
    borderColor: '#FF5252',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  genderButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  genderButtonText: {
    color: '#666666',
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  materialContainer: {
    gap: 8,
  },
  materialButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  materialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  materialButtonActive: {
    borderColor: '#4CAF50',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  materialButtonText: {
    color: '#666666',
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
  },
  materialButtonTextActive: {
    color: '#333333',
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
});