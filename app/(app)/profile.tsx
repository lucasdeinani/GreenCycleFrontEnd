import React, { useState } from 'react';
import { 
  View, Text, Image, TouchableOpacity, TextInput, StyleSheet, ScrollView, 
  Platform, ActivityIndicator, Alert
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUser } from '../context/UserContext';
import { PasswordResetModal } from './password_reset_modal';
import { useProfileImage } from '../../hooks/useProfileImage';
import axios from 'axios';
import { API_BASE_URL } from '../configs';

export default function ProfileScreen() {
  const { user, setUser } = useUser();
  const { imageUri, isLoading: imageLoading, isUpdating: imageUpdating, updateImage } = useProfileImage();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getFullGenderName = (initial?: string | null): string => {
    switch (initial?.toUpperCase()) {
      case 'M': return 'Masculino';
      case 'F': return 'Feminino';
      case 'O': return 'Outro';
      default: return 'Masculino';
    }
  };

  const [formData, setFormData] = useState({
    fullName: user?.nome || '',
    email: user?.email || '',
    document: user?.cpf || '',
    gender: getFullGenderName(user?.sexo),
    birthday: user?.data_nascimento ? new Date(user.data_nascimento) : new Date('1990-01-01'),
    username: user?.usuario || '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, birthday: selectedDate }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Usuário é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) return;
    if (!user?.client_id) return;

    setIsSaving(true);
    
    try {
      const payload = {
        nome: formData.fullName.trim(),
        email: formData.email.trim(),
        usuario: formData.username.trim(),
        sexo: formData.gender[0].toUpperCase(),
        data_nascimento: formData.birthday.toISOString().split('T')[0]
      };

      const response = await axios.put(
        `${API_BASE_URL}/clientes/${user.client_id}/`, 
        payload
      );

      // Atualizar contexto com os novos dados
      const updatedUser = {
        ...user,
        nome: formData.fullName,
        email: formData.email,
        usuario: formData.username,
        sexo: formData.gender[0].toUpperCase(),
        data_nascimento: formData.birthday.toISOString().split('T')[0]
      };

      setUser(updatedUser);
      setIsEditing(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reverter para os dados originais do usuário
    setFormData({
      fullName: user?.nome || '',
      email: user?.email || '',
      document: user?.cpf || '',
      gender: getFullGenderName(user?.sexo),
      birthday: user?.data_nascimento ? new Date(user.data_nascimento) : new Date('1990-01-01'),
      username: user?.usuario || '',
    });
    setIsEditing(false);
    setErrors({});
  };

  const handlePasswordReset = async (currentPassword: string, newPassword: string) => {
    try {
      const endpoint = `${API_BASE_URL}/clientes/${user?.client_id}/`;
      const response = await axios.patch(endpoint, {
        senha_atual: currentPassword,
        nova_senha: newPassword
      });
      return response.status === 200;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="#333333" />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>

        {isEditing ? (
          <View style={styles.editActions}>
            <TouchableOpacity onPress={handleCancelEdit} disabled={isSaving}>
              <Feather name="x" size={24} color="#F44336" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveChanges} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color="#4CAF50" />
              ) : (
                <Feather name="save" size={24} color="#4CAF50" />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Feather name="edit" size={24} color="#2196F3" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          {imageLoading ? (
            <View style={[styles.profileImage, styles.loadingContainer]}>
              <ActivityIndicator size="large" color="#4CAF50" />
            </View>
          ) : (
            <Image
              source={{ uri: imageUri }}
              style={styles.profileImage}
            />
          )}
          {isEditing && (
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={updateImage}
              disabled={imageUpdating}
            >
              {imageUpdating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="camera" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.form}>
        {/* Nome Completo */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome Completo</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={formData.fullName}
              onChangeText={(value) => handleChange('fullName', value)}
              editable={isEditing}
              placeholder="Digite seu nome completo"
            />
            {isEditing && <Feather name="edit" size={18} color="#666" style={styles.inputIcon} />}
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={isEditing}
              placeholder="Digite seu email"
            />
            {isEditing && <Feather name="edit" size={18} color="#666" style={styles.inputIcon} />}
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        {/* CPF (não editável) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>CPF</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={formData.document}
              editable={false}
              placeholder="Seu CPF"
            />
            <Feather name="lock" size={18} color="#999" style={styles.inputIcon} />
        </View>

        {/* Sexo */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sexo</Text>
          <View style={styles.genderContainer}>
            {['Masculino', 'Feminino', 'Outro'].map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.genderButton,
                  formData.gender === gender && styles.genderButtonActive,
                  !isEditing && styles.disabledButton
                ]}
                onPress={() => isEditing && handleChange('gender', gender)}
                disabled={!isEditing}
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
        </View>

        {/* Aniversário */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Aniversário</Text>
          <TouchableOpacity
            style={[styles.input, styles.dateInput, !isEditing && styles.disabledInput]}
            onPress={() => isEditing && setShowDatePicker(true)}
            disabled={!isEditing}
          >
            <Text style={styles.dateText}>
              {formData.birthday.toLocaleDateString('pt-BR')}
            </Text>
            {isEditing && <Feather name="edit" size={18} color="#666" style={styles.inputIcon} />}
          </TouchableOpacity>
          {showDatePicker && isEditing && (
            <DateTimePicker
              value={formData.birthday}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Usuário */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Usuário</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={formData.username}
              onChangeText={(value) => handleChange('username', value)}
              autoCapitalize="none"
              editable={isEditing}
              placeholder="Digite seu nome de usuário"
            />
            {isEditing && <Feather name="edit" size={18} color="#666" style={styles.inputIcon} />}
          {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
        </View>

        {/* Botão de redefinir senha */}
        <TouchableOpacity 
          style={styles.resetPasswordButton}
          onPress={() => setResetModalVisible(true)}
        >
          <View style={styles.resetPasswordButtonContent}>
            <Feather name="lock" size={20} color="#FFFFFF" />
            <Text style={styles.resetPasswordButtonText}>Redefinir Senha</Text>
          </View>
        </TouchableOpacity>

        <PasswordResetModal
          visible={resetModalVisible}
          onClose={() => setResetModalVisible(false)}
          onConfirm={handlePasswordReset}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  backButton: {
    paddingTop: 16,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
  },
  editActions: {
    flexDirection: 'row',
    gap: 16,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileImageContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2196F3',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  form: {
    padding: 16,
    gap: 16,
    marginTop: 8,
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
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    paddingRight: 40,
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  disabledInput: {
    backgroundColor: '#FAFAFA',
    color: '#666666',
  },
  dateInput: {
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
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
  disabledButton: {
    opacity: 0.7,
  },
  genderButtonText: {
    color: '#666666',
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  resetPasswordButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  resetPasswordButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetPasswordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
});