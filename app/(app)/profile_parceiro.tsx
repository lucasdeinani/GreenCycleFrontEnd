import React, { useState, useEffect } from 'react';
import { 
  View, Text, Image, TouchableOpacity, TextInput, StyleSheet, ScrollView, 
  Platform, ActivityIndicator, Alert
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { PasswordResetModal } from './password_reset_modal';
import { REGISTER_MATERIALS } from '../configs';
import axios from 'axios';
import { API_BASE_URL } from '../configs';

export default function ProfileParceiroScreen() {
  const { user, setUser } = useUser();
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    document: '',
    username: '',
    collectionMaterials: [] as string[],
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.nome || '',
        email: user.email || '',
        document: user.cnpj || '',
        username: user.usuario || '',
        collectionMaterials: user.materiais?.map(m => m.nome) || [],
      });
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome da empresa é obrigatório';
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

  const handleMaterialToggle = (materialName: string) => {
    if (!isEditing) return;
    
    setFormData(prev => {
      const materials = prev.collectionMaterials.includes(materialName)
        ? prev.collectionMaterials.filter(m => m !== materialName)
        : [...prev.collectionMaterials, materialName];
      return { ...prev, collectionMaterials: materials };
    });
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) return;
    if (!user?.partner_id) return;

    setIsSaving(true);
    
    try {
      const payload = {
        nome: formData.fullName.trim(),
        email: formData.email.trim(),
        usuario: formData.username.trim(),
        materiais: formData.collectionMaterials.map(materialName => {
          const material = REGISTER_MATERIALS.find(m => m.nome === materialName);
          return material ? material.id : null;
        }).filter(id => id !== null)
      };

      const response = await axios.put(
        `${API_BASE_URL}/parceiros/${user.partner_id}/`, 
        payload
      );

      // Atualizar contexto com os novos dados
      const updatedUser = {
        ...user,
        nome: formData.fullName,
        email: formData.email,
        usuario: formData.username,
        materiais: formData.collectionMaterials.map(materialName => {
          const material = REGISTER_MATERIALS.find(m => m.nome === materialName);
          return {
            id: material?.id || 0,
            nome: materialName,
            descricao: '',
            preco: '0.00'
          };
        })
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
    if (user) {
      setFormData({
        fullName: user.nome || '',
        email: user.email || '',
        document: user.cnpj || '',
        username: user.usuario || '',
        collectionMaterials: user.materiais?.map(m => m.nome) || [],
      });
    }
    setIsEditing(false);
    setErrors({});
  };

  const handlePasswordReset = async (currentPassword: string, newPassword: string) => {
    try {
      const endpoint = `${API_BASE_URL}/parceiros/${user?.partner_id}/`;
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

  const isMaterialSelected = (materialName: string) => {
    return formData.collectionMaterials.includes(materialName);
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
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=180&h=180&fit=crop&q=80&auto=format' }}
            style={styles.profileImage}
          />
          {isEditing && (
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={() => console.log('Open camera')}
            >
              <Feather name="camera" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.form}>
        {/* Nome da Empresa */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome da Empresa</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={formData.fullName}
              onChangeText={(value) => handleChange('fullName', value)}
              editable={isEditing}
              placeholder="Nome da sua empresa"
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
              placeholder="Email da empresa"
            />
            {isEditing && <Feather name="edit" size={18} color="#666" style={styles.inputIcon} />}
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        {/* CNPJ (não editável) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>CNPJ</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={formData.document}
              editable={false}
              placeholder="CNPJ da empresa"
            />
            <Feather name="lock" size={18} color="#999" style={styles.inputIcon} />
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
              placeholder="Nome de usuário"
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

        {/* Materiais que coleta */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Materiais que coleta</Text>
          <View style={styles.materialContainer}>
            {REGISTER_MATERIALS.map((material) => (
              <TouchableOpacity
                key={material.id}
                style={[
                  styles.materialButton,
                  isMaterialSelected(material.nome) && styles.materialButtonActive,
                  !isEditing && styles.disabledButton
                ]}
                onPress={() => handleMaterialToggle(material.nome)}
                disabled={!isEditing}
              >
                <View style={styles.materialButtonContent}>
                  <View style={[
                    styles.checkbox,
                    isMaterialSelected(material.nome) && styles.checkboxActive
                  ]}>
                    {isMaterialSelected(material.nome) && (
                      <Feather name="check" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={[
                    styles.materialButtonText,
                    isMaterialSelected(material.nome) && styles.materialButtonTextActive
                  ]}>
                    {material.nome}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
    borderColor: '#FFC107',
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
  resetPasswordButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
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
  disabledButton: {
    opacity: 0.7,
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
});