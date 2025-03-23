import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Camera, Check } from 'lucide-react-native';

const MATERIAL_OPTIONS = [
  'Metais',
  'Papeis',
  'Plastico',
  'Residuo Organico',
  'Residuo Hospitalar'
];

export default function ProfileParceiroScreen() {
  const [formData, setFormData] = useState({
    fullName: 'Nome Parceiro',
    email: 'parceiro@email.com',
    document: '12.345.678/0001-90',
    username: 'parceiro123',
    collectionMaterials: ['Metais', 'Papeis'] as string[],
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMaterialToggle = (material: string) => {
    setFormData(prev => {
      const materials = prev.collectionMaterials.includes(material)
        ? prev.collectionMaterials.filter(m => m !== material)
        : [...prev.collectionMaterials, material];
      return { ...prev, collectionMaterials: materials };
    });
  };

  const handleTakePicture = () => {
    console.log('Open camera');
  };

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
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=180&h=180&fit=crop&q=80&auto=format' }}
            style={styles.profileImage}
          />
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={handleTakePicture}
          >
            <Camera size={20} color="#FFFFFF" />
            <Text style={styles.changePhotoText}>Trocar foto</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome da Empresa</Text>
          <TextInput
            style={styles.input}
            value={formData.fullName}
            onChangeText={(value) => handleChange('fullName', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>CNPJ</Text>
          <TextInput
            style={styles.input}
            value={formData.document}
            onChangeText={(value) => handleChange('document', value)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Materiais que coleta</Text>
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
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Usuário</Text>
          <TextInput
            style={styles.input}
            value={formData.username}
            onChangeText={(value) => handleChange('username', value)}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Salvar Alterações</Text>
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
    color: '#333333',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    alignItems: 'center',
    gap: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
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
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
});