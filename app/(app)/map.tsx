import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Modal, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Leaf, X, Info } from 'lucide-react-native';
import { MATERIALS } from '../configs'
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker } from 'react-native-maps';

// Tipagem para os pontos de coleta
interface Material {
    id: number;
    name: string;
}

interface Endereco {
    id: number;
    cep: string;
    estado: string;
    cidade: string;
    bairro: string;
    rua: string;
    numero: number;
    complemento?: string;
    latitude?: number;
    longitude?: number;
}

interface Parceiro {
    id: number;
    cnpj: string;
    id_usuarios: number;
}

interface PontoColeta {
    id: number;
    nome: string;
    id_enderecos: Endereco; 
    descricao: string;
    horario_funcionamento: string;
    id_parceiros: Parceiro;
    materiais: Material[];
}

export default function MapScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [pontosColeta, setPontosColeta] = useState<PontoColeta[]>([]);
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [filtroMateriais, setFiltroMateriais] = useState<number[]>([]);
    const [pontoSelecionado, setPontoSelecionado] = useState<PontoColeta | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [geocodingError, setGeocodingError] = useState<string | null>(null);
    const mapRef = useRef<MapView>(null);

    const CACHE_KEYS = {
        PONTOS_COLETA: 'pontosColeta',
        LAST_FETCH: 'lastFetch',
    };


    const geocodificarComOSM = async (endereco: Endereco): Promise<{ latitude: number; longitude: number } | null> => {
        try {
            setGeocodingError(null);
          // Formata o endereço para a API Nominatim
            const enderecoFormatado = [
                endereco.numero,
                endereco.rua,
                endereco.bairro,
                endereco.cidade,
                endereco.estado,
                'Brasil'
            ].filter(Boolean).join(', ');
      
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoFormatado)}`
          );
          
          const data = await response.json();
          
          if (data && data.length > 0) {
            return {
              latitude: parseFloat(data[0].lat),
              longitude: parseFloat(data[0].lon)
            };
          }
          return null;
        } catch (error) {
            setGeocodingError('Erro ao converter endereços em coordenadas');
            return null;
        }
    };

    useEffect(() => {
        (async () => {
            // Solicitar permissão de localização
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            // Obter localização atual
            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);

            // Buscar materiais disponíveis da API
            fetchMateriais();

            // Buscar pontos de coleta da API
            fetchPontosColeta();
        })();
    }, []);

    // Função para buscar materiais da API
    const fetchMateriais = async () => {
        try {
            const response = await fetch('http://localhost:8000/v1/materiais/');
            const data = await response.json();
            setMateriais(data);
        } catch (error) {
            console.error('Erro ao buscar materiais:', error);
            // Fallback para MATERIALS de configs.tsx
            setMateriais(MATERIALS);
        }
    };

    // Função para buscar pontos de coleta da API
    const fetchPontosColeta = async () => {
        try {
            const response = await fetch('http://localhost:8000/v1/pontos-coleta/');
            const pontosData: PontoColeta[] = await response.json();

            // Processar cada ponto para obter coordenadas
            const pontosComCoordenadas = await Promise.all(
            pontosData.map(async (ponto) => {
                // Se já tiver coordenadas, retorna como está
                if (ponto.id_enderecos.latitude && ponto.id_enderecos.longitude) {
                return ponto;
                }
                
                // Geocodifica com OpenStreetMap
                const coordenadas = await geocodificarComOSM(ponto.id_enderecos);
                
                if (!coordenadas) {
                console.warn(`Não foi possível geocodificar: ${ponto.id_enderecos.rua}, ${ponto.id_enderecos.numero}`);
                return null; // Retorna null para pontos sem coordenadas
                }
                
                return {
                ...ponto,
                id_enderecos: {
                    ...ponto.id_enderecos,
                    latitude: coordenadas.latitude,
                    longitude: coordenadas.longitude
                }
                };
            })
            );

            // Filtra apenas pontos válidos (não nulos)
            const pontosValidos = pontosComCoordenadas.filter(Boolean) as PontoColeta[];
            
            console.log('Pontos processados:', pontosValidos);
            setPontosColeta(pontosValidos);

            // Salva no AsyncStorage para uso offline
            await AsyncStorage.setItem('pontosColeta', JSON.stringify(pontosValidos));

        } catch (error) {
            console.error('Erro ao buscar pontos de coleta:', error);

            // Fallback para dados locais em caso de erro
            const pontosExemplo: PontoColeta[] = [
                {
                    id: 1,
                    nome: "Ponto Coleta 1",
                    id_enderecos: {
                        id: 1,
                        cep: "95072000",
                        estado: "RS",
                        cidade: "Caxias do Sul",
                        bairro: "Centro",
                        rua: "Rua Principal",
                        numero: 123,
                        latitude: -29.1634,
                        longitude: -51.1795
                    },
                    descricao: "Ponto de coleta principal",
                    horario_funcionamento: "9h - 18h | seg - sex",
                    id_parceiros: {
                        id: 12,
                        cnpj: "56.150.612/0001-15",
                        id_usuarios: 53
                    },
                    materiais: MATERIALS.slice(0, 3)
                },
                {
                    id: 2,
                    nome: "Ponto Coleta 2",
                    id_enderecos: {
                        id: 2,
                        cep: "95072001",
                        estado: "RS",
                        cidade: "Caxias do Sul",
                        bairro: "Bela Vista",
                        rua: "Rua Bortolo Zani",
                        numero: 821,
                        latitude: -29.1734,
                        longitude: -51.1895
                    },
                    descricao: "Ponto Coleta 2 - Teste",
                    horario_funcionamento: "10h - 12h | 14h - 16h | ter - sex",
                    id_parceiros: {
                        id: 13,
                        cnpj: "57.393.898/0001-22",
                        id_usuarios: 56
                    },
                    materiais: MATERIALS.slice(0, 3)
                },
                {
                    id: 3,
                    nome: "Ponto Coleta 3",
                    id_enderecos: {
                        id: 3,
                        cep: "95072002",
                        estado: "RS",
                        cidade: "Caxias do Sul",
                        bairro: "São Pelegrino",
                        rua: "Avenida São Leopoldo",
                        numero: 456,
                        latitude: -29.1534,
                        longitude: -51.1695
                    },
                    descricao: "Coleta de materiais eletrônicos e pilhas",
                    horario_funcionamento: "13h - 19h | seg - sáb",
                    id_parceiros: {
                        id: 14,
                        cnpj: "21.191.799/0001-10",
                        id_usuarios: 58
                    },
                    materiais: MATERIALS.slice(0, 3)
                }
            ];

            setPontosColeta(pontosExemplo);
        }
    };

    // Função para obter os nomes dos materiais de um ponto específico
    const getNomesMateriais = (ponto: PontoColeta) => {
        return ponto.materiais.map(m => m.nome).join(', ');
    };

    // Função para alternar o filtro de materiais
    const toggleFiltroMaterial = (materialId: number) => {
        if (filtroMateriais.includes(materialId)) {
            setFiltroMateriais(filtroMateriais.filter(id => id !== materialId));
        } else {
            setFiltroMateriais([...filtroMateriais, materialId]);
        }
    };

    // Filtrar pontos de coleta com base nos materiais selecionados
    const pontosFiltrados = filtroMateriais.length > 0
        ? pontosColeta.filter(ponto =>
            ponto.materiais.some(material => 
                filtroMateriais.includes(material.id) // Comparar com material.id
            )
        )
        : pontosColeta;

    // Função para abrir o modal com detalhes do ponto
    const abrirDetalhesPonto = (ponto: PontoColeta) => {
        setPontoSelecionado(ponto);
        setModalVisible(true);
    };

    // Função para geocodificar um endereço
    const geocodificarEndereco = async (endereco: Endereco): Promise<{ latitude: number, longitude: number } | null> => {
        try {
            // Formatar o endereço para a API de geocodificação
            const enderecoFormatado = `${endereco.rua}, ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade}, ${endereco.estado}, ${endereco.cep}, Brasil`;
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(enderecoFormatado)}&key=YOUR_API_KEY`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'OK' && data.results && data.results.length > 0) {
                const { lat, lng } = data.results[0].geometry.location;
                return { latitude: lat, longitude: lng };
            }
            return null;
        } catch (error) {
            console.error('Erro na geocodificação:', error);
            return null;
        }
    };

    if (errorMsg) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{errorMsg}</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color="#333333" />
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const renderMapContent = () => {
        if (Platform.OS === 'web') {
            return (
                <iframe
                    src={`https://www.google.com/maps/embed/v1/view?key=YOUR_API_KEY&center=${location?.coords.latitude},${location?.coords.longitude}&zoom=15`}
                    style={{
                        border: 0,
                        width: '100%',
                        height: '100%',
                        minHeight: 400,
                    }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            );
        } else if (location && MapView) {
            return (
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: location?.coords.latitude || -14.2350, // Fallback para Brasil
                        longitude: location?.coords.longitude || -51.9253,
                        latitudeDelta: 0.5, // Zoom mais amplo inicial
                        longitudeDelta: 0.5
                    }}
                    ref={mapRef}
                    >
                    {/* Marcador do usuário */}
                    {location && (
                        <Marker
                        coordinate={{
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude
                        }}
                        title="Sua localização"
                        pinColor="#4CAF50"
                        />
                    )}

                    {/* Marcadores dos pontos de coleta */}
                    {pontosFiltrados.map((ponto) => (
                        <Marker
                        key={`${ponto.id}-${ponto.id_enderecos.latitude}-${ponto.id_enderecos.longitude}`}
                        coordinate={{
                            latitude: ponto.id_enderecos.latitude,
                            longitude: ponto.id_enderecos.longitude
                        }}
                        title={ponto.nome}
                        description={getNomesMateriais(ponto)}
                        onPress={() => abrirDetalhesPonto(ponto)}
                        >
                        <View style={styles.customMarker}>
                            <Leaf size={16} color="white" />
                        </View>
                        </Marker>
                    ))}
                </MapView>
            );
        }

        return (
            <View style={[styles.mapContainer, styles.loadingContainer]}>
                <Text>Carregando mapa...</Text>
            </View>
        );
    };

    useEffect(() => {
        if (mapRef.current && pontosFiltrados.length > 0 && location) {
          const coordinates = [
            {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            },
            ...pontosFiltrados.map(p => ({
              latitude: p.id_enderecos.latitude,
              longitude: p.id_enderecos.longitude
            }))
          ];
      
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
            animated: true
          });
        }
      }, [pontosFiltrados, location]);

    return (
        <ScrollView style={styles.container}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <ArrowLeft size={24} color="#333333" />
                <Text style={styles.backButtonText}>Voltar</Text>
            </TouchableOpacity>

            {/* Filtros de materiais */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtrosContainer}
                contentContainerStyle={styles.filtrosContent}
            >
                {materiais.map(material => (
                    <TouchableOpacity
                        key={material.id}
                        style={[
                            styles.filtroBtn,
                            filtroMateriais.includes(material.id) && styles.filtroBtnActive
                        ]}
                        onPress={() => toggleFiltroMaterial(material.id)}
                    >
                        <Text
                            style={[
                                styles.filtroBtnText,
                                filtroMateriais.includes(material.id) && styles.filtroBtnTextActive
                            ]}
                        >
                            {material.nome}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Mapa */}
            <View style={styles.mapContainer}>
                {renderMapContent()}
            </View>

            {/* Lista de pontos de coleta */}
            <View style={styles.listaContainer}>
                <Text style={styles.listaTitle}>Pontos de Coleta</Text>
                {pontosFiltrados.length === 0 ? (
                    <Text style={styles.emptyListText}>
                        Nenhum ponto de coleta encontrado para os filtros selecionados
                    </Text>
                ) : (
                    pontosFiltrados.map(ponto => (
                        <TouchableOpacity
                            key={ponto.id}
                            style={styles.pontoItem}
                            onPress={() => abrirDetalhesPonto(ponto)}
                        >
                            <View style={styles.pontoItemContent}>
                                <Text style={styles.pontoNome}>{ponto.nome}</Text>
                                <Text style={styles.pontoMateriais}>
                                    Materiais: {getNomesMateriais(ponto)}
                                </Text>
                            </View>
                            <Info size={24} color="#4CAF50" />
                        </TouchableOpacity>
                    ))
                )}
            </View>

            {/* Modal de detalhes do ponto */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                    {pontoSelecionado?.nome || 'Ponto de Coleta'}
                    </Text>
                    <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                    >
                    <X size={24} color="#333333" />
                    </TouchableOpacity>
                </View>

                {pontoSelecionado && (
                    <ScrollView style={styles.modalBody}>
                    {/* Descrição */}
                    <View style={styles.modalSection}>
                        <Text style={styles.modalSubtitle}>Descrição</Text>
                        <Text style={styles.modalText}>
                        {pontoSelecionado.descricao || 'Nenhuma descrição disponível'}
                        </Text>
                    </View>

                    {/* Materiais */}
                    <View style={styles.modalSection}>
                        <Text style={styles.modalSubtitle}>Materiais</Text>
                        <Text style={styles.modalText}>
                        {pontoSelecionado.materiais?.length > 0 
                            ? pontoSelecionado.materiais.map(m => m.nome).join(', ')
                            : 'Nenhum material listado'}
                        </Text>
                    </View>

                    {/* Horário */}
                    <View style={styles.modalSection}>
                        <Text style={styles.modalSubtitle}>Horário de Funcionamento</Text>
                        <Text style={styles.modalText}>
                        {pontoSelecionado.horario_funcionamento || 'Horário não informado'}
                        </Text>
                    </View>

                    {/* Endereço */}
                    <View style={styles.modalSection}>
                        <Text style={styles.modalSubtitle}>Endereço</Text>
                        {pontoSelecionado.id_enderecos ? (
                        <>
                            <Text style={styles.modalText}>
                            {[pontoSelecionado.id_enderecos.rua, pontoSelecionado.id_enderecos.numero]
                                .filter(Boolean).join(', ')}
                            </Text>
                            {pontoSelecionado.id_enderecos.complemento && (
                            <Text style={styles.modalText}>
                                {pontoSelecionado.id_enderecos.complemento}
                            </Text>
                            )}
                            <Text style={styles.modalText}>
                            {[
                                pontoSelecionado.id_enderecos.bairro,
                                pontoSelecionado.id_enderecos.cidade,
                                pontoSelecionado.id_enderecos.estado
                            ].filter(Boolean).join(', ')}
                            </Text>
                            <Text style={styles.modalText}>
                            CEP: {pontoSelecionado.id_enderecos.cep || 'Não informado'}
                            </Text>
                        </>
                        ) : (
                        <Text style={styles.modalText}>Endereço não disponível</Text>
                        )}
                    </View>
                    </ScrollView>
                )}

                <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => setModalVisible(false)}
                >
                    <Text style={styles.closeModalButtonText}>Fechar</Text>
                </TouchableOpacity>
                </View>
            </View>
            </Modal>

            <View style={styles.footer}>
                <Leaf size={40} color="#4CAF50" />
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
    errorText: {
        padding: 16,
        color: 'red',
        textAlign: 'center',
    },
    mapContainer: {
        height: 400,
        marginBottom: 16,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    filtrosContainer: {
        maxHeight: 60,
        marginBottom: 10,
    },
    filtrosContent: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    filtroBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#EEEEEE',
        marginRight: 8,
    },
    filtroBtnActive: {
        backgroundColor: '#4CAF50',
    },
    filtroBtnText: {
        fontSize: 14,
        color: '#333333',
    },
    filtroBtnTextActive: {
        color: '#FFFFFF',
    },
    listaContainer: {
        padding: 16,
    },
    listaTitle: {
        fontSize: 18,
        fontFamily: 'Roboto-Medium',
        marginBottom: 8,
        color: '#333333',
    },
    emptyListText: {
        textAlign: 'center',
        padding: 16,
        color: '#666666',
    },
    pontoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
    pontoItemContent: {
        flex: 1,
    },
    pontoNome: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        color: '#333333',
        marginBottom: 4,
    },
    pontoMateriais: {
        fontSize: 14,
        color: '#666666',
    },
    footer: {
        alignItems: 'center',
        padding: 16,
    },
    footerText: {
        marginTop: 8,
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        color: '#4CAF50',
    },
    // Estilos para o modal
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        maxWidth: 500,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Roboto-Medium',
        color: '#333333',
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        maxHeight: 400,
    },
    modalSubtitle: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        color: '#4CAF50',
        marginTop: 12,
        marginBottom: 4,
    },
    modalSection: {
        marginBottom: 16,
      },
    modalText: {
        fontSize: 14,
        color: '#333333',
        marginBottom: 4,
    },
    closeModalButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    closeModalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
    },
    customMarker: {
        backgroundColor: '#2196F3',
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'white'
    },
});