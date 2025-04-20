import axios from 'axios';
import { API_BASE_URL } from '../configs';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const fetchPontosColeta = async () => {
  try {
    const response = await api.get('/pontos-coleta/');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar pontos de coleta:', error);
    throw error;
  }
};

export const fetchMateriais = async () => {
  try {
    const response = await api.get('/materiais/');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar materiais:', error);
    throw error;
  }
};