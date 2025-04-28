import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Leaf, Check } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react-native';
import { useUser } from './context/UserContext';
import { REGISTER_MATERIALS } from './configs';

// URL base da API
const API_BASE_URL = '192.168.1.145';

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
    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [isLoading, setIsLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { login } = useUser();

    const handleChange = (field: string, value: any) => {
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

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFormData(prev => ({ ...prev, birthday: selectedDate }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string | null> = {};

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

    // Formatação do CPF
    const formatCPF = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})$/);
        if (!match) return value;
        
        return [match[1], match[2], match[3], match[4]]
            .filter(group => group)
            .join('.')
            .replace(/\.(\d{2})$/, '-$1');
    };

    // Formatação do CNPJ
    const formatCNPJ = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})$/);
        if (!match) return value;
        
        return [match[1], match[2], match[3], match[4], match[5]]
            .filter(group => group)
            .join('.')
            .replace(/\.(\d{4})\.(\d{2})$/, '/$1-$2');
    };
    
    // Escolhe a formatação com base na opção selecionada
    const handleDocumentChange = (value: string) => {
        const formattedValue = userType === 'client' 
            ? formatCPF(value) 
            : formatCNPJ(value);
        
        handleChange('document', formattedValue);
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            setIsLoading(true);
            
            try {
              // CORREÇÃO: Preparar payload ANTES da chamada à API
              let payload: any;
              const endpoint = userType === 'client' ? 'clientes' : 'parceiros';
        
              if (userType === 'client') {
                payload = {
                  usuario: formData.username.trim(),
                  cpf: formData.document.replace(/\D/g, ''), // Remove formatação
                  data_nascimento: formData.birthday.toISOString().split('T')[0],
                  sexo: formData.gender[0].toUpperCase(), // Pega primeira letra (M/F/O)
                  nome: formData.fullName,
                  email: formData.email.trim(),
                  senha: formData.password,
                  id_endereco: null
                };
              } else {
                payload = {
                  usuario: formData.username.trim(),
                  cnpj: formData.document.replace(/\D/g, ''), // Remove formatação
                  nome: formData.fullName,
                  email: formData.email.trim(),
                  senha: formData.password,
                  id_endereco: null,
                  materiais: formData.collectionMaterials.map(materialName => {
                    const material = REGISTER_MATERIALS.find(m => m.nome === materialName);
                    return material ? material.id : 0;
                  }).filter(id => id !== 0)
                };
              }
        
              console.log('Payload sendo enviado:', payload); // Para debug
        
              await axios.post(`${API_BASE_URL}/${endpoint}/`, payload);
        
              Alert.alert(
                'Sucesso',
                'Cadastro realizado com sucesso!',
                [{ text: 'OK', onPress: () => router.replace('/login') }]
              );
            } catch (error: any) {
                console.error('Erro ao criar cadastro:', error);
    
                let errorMessage = 'Não foi possível realizar o cadastro. Tente novamente.';
                if (error.response?.status === 400 && error.response.data) {
                    const errorDetails = Object.entries(error.response.data)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join('\n');
                    errorMessage += `\n\n${errorDetails}`;
                }
                Alert.alert('Erro', errorMessage);
            } finally {
                setIsLoading(false);
            }
        }
    };



    const handleUserTypeChange = (type: 'client' | 'partner') => {
        // Limpa todos os campos do formulário
        setFormData({
            fullName: '',
            email: '',
            document: '',
            gender: '',
            birthday: new Date(),
            username: '',
            password: '',
            confirmPassword: '',
            collectionMaterials: [],
        });

        // Reseta os olhinhos para estado oculto
        setShowPassword(false);
        setShowConfirmPassword(false);
        
        // Limpa todos os erros
        setErrors({});
        
        // Atualiza o tipo de usuário
        setUserType(type);
    };

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                disabled={isLoading}
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
                    disabled={isLoading}
                >
                    <Text style={[styles.toggleText, userType === 'client' && styles.toggleTextActive]}>
                        Cliente
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, userType === 'partner' && styles.toggleButtonActive]}
                    onPress={() => handleUserTypeChange('partner')}
                    disabled={isLoading}
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
                        editable={!isLoading}
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
                        editable={!isLoading}
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
                        onChangeText={handleDocumentChange}
                        maxLength={userType === 'client' ? 14 : 18}
                        editable={!isLoading}
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
                                    disabled={isLoading}
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
                    {REGISTER_MATERIALS.map((material) => (
                        <TouchableOpacity
                        key={material.id}
                        style={[
                            styles.materialButton,
                            formData.collectionMaterials.includes(material.nome) && styles.materialButtonActive
                        ]}
                        onPress={() => handleMaterialToggle(material.nome)}
                        disabled={isLoading}
                        >
                        <View style={styles.materialButtonContent}>
                            <View style={[
                            styles.checkbox,
                            formData.collectionMaterials.includes(material.nome) && styles.checkboxActive
                            ]}>
                            {formData.collectionMaterials.includes(material.nome) && (
                                <Check size={16} color="#FFFFFF" />
                            )}
                            </View>
                            <Text style={[
                            styles.materialButtonText,
                            formData.collectionMaterials.includes(material.nome) && styles.materialButtonTextActive
                            ]}>
                            {material.nome}
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
                            onPress={() => !isLoading && setShowDatePicker(true)}
                            disabled={isLoading}
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
                        editable={!isLoading}
                    />
                    {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Senha</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={[styles.passwordInput, errors.password && styles.inputError]}
                            placeholder="Digite sua senha"
                            secureTextEntry={!showPassword}
                            value={formData.password}
                            onChangeText={(value) => handleChange('password', value)}
                            editable={!isLoading}
                        />
                        <TouchableOpacity 
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                        >
                            {showPassword ? (
                                <EyeOff size={20} color="#666" />
                            ) : (
                                <Eye size={20} color="#666" />
                            )}
                        </TouchableOpacity>
                    </View>
                    {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirme a Senha</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={[styles.passwordInput, errors.confirmPassword && styles.inputError]}
                            placeholder="Confirme sua senha"
                            secureTextEntry={!showConfirmPassword}
                            value={formData.confirmPassword}
                            onChangeText={(value) => handleChange('confirmPassword', value)}
                            editable={!isLoading}
                        />
                        <TouchableOpacity 
                            style={styles.eyeButton}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={isLoading}
                        >
                            {showConfirmPassword ? (
                                <EyeOff size={20} color="#666" />
                            ) : (
                                <Eye size={20} color="#666" />
                            )}
                        </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                </View>

                <TouchableOpacity
                    style={[styles.registerButton, isLoading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text style={styles.registerButtonText}>Cadastrando...</Text>
                        </View>
                    ) : (
                        <Text style={styles.registerButtonText}>Finalizar Cadastro</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: 16,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Roboto-Bold',
        color: '#4CAF50',
        marginTop: 8,
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
        marginBottom: 20,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#E0E0E0',
        borderRadius: 8,
        marginBottom: 24,
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
        color: '#666',
    },
    toggleTextActive: {
        color: '#333333',
    },
    form: {
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontFamily: 'Roboto-Medium',
        fontSize: 16,
        color: '#333333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#333333',
    },
    inputError: {
        borderColor: '#FF5252',
        borderWidth: 1,
    },
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    genderButton: {
        flex: 1,
        padding: 12,
        marginHorizontal: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 8,
        alignItems: 'center',
    },
    genderButtonActive: {
        backgroundColor: '#4CAF50',
    },
    genderButtonText: {
        color: '#333333',
        fontFamily: 'Roboto-Regular',
    },
    genderButtonTextActive: {
        color: '#FFFFFF',
        fontFamily: 'Roboto-Medium',
    },
    materialContainer: {
        flexDirection: 'column',
        gap: 8,
    },
    materialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
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
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonDisabled: {
        backgroundColor: '#9E9E9E',
        opacity: 0.7,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    passwordInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#333333',
    },
    eyeButton: {
        padding: 12,
    },
});
