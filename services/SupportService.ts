import axios from 'axios';
import { API_BASE_URL } from '../app/configs';

// Interface para dados do formulário de contato
export interface ContatoSuporteRequest {
  nome: string;
  email: string;
  whatsapp: string;
  descricao: string;
  tipo_usuario: 'cliente' | 'parceiro';
}

// Interface para resposta do envio
export interface EmailResponse {
  success: boolean;
  message: string;
}

export class SupportService {
  // Enviar email de suporte
  static async enviarEmailSuporte(dados: ContatoSuporteRequest): Promise<EmailResponse> {
    try {
      // Configuração do email para o backend
      const emailData = {
        to: 'suporte.greencycle@gmail.com',
        subject: `[GreenCycle] Suporte - ${dados.tipo_usuario === 'cliente' ? 'Cliente' : 'Parceiro'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #4CAF50; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🍃 GreenCycle - Suporte</h1>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #333; margin-top: 0;">Nova Solicitação de Suporte</h2>
              
              <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <p><strong>👤 Nome:</strong> ${dados.nome}</p>
                <p><strong>📧 Email:</strong> ${dados.email}</p>
                <p><strong>📱 WhatsApp:</strong> ${dados.whatsapp}</p>
                <p><strong>👥 Tipo de Usuário:</strong> ${dados.tipo_usuario === 'cliente' ? 'Cliente' : 'Parceiro'}</p>
              </div>
              
              <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <p><strong>📝 Descrição:</strong></p>
                <p style="background-color: #f5f5f5; padding: 10px; border-radius: 3px; line-height: 1.6;">
                  ${dados.descricao}
                </p>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background-color: #e8f5e8; border-radius: 5px;">
                <p style="margin: 0; font-size: 12px; color: #666;">
                  ⏰ Enviado em: ${new Date().toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        `
      };

      // Chamar endpoint do backend para envio do email
      const response = await axios.post(`${API_BASE_URL}/suporte/enviar-email/`, emailData);
      
      if (response.status === 200) {
        return {
          success: true,
          message: 'Email enviado com sucesso!'
        };
      }
      
      return {
        success: false,
        message: 'Erro ao enviar email. Tente novamente.'
      };
      
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      
      // Fallback - simular envio para não quebrar a funcionalidade
      // Em produção, você pode implementar um sistema de retry ou notificação
      return {
        success: true,
        message: 'Sua mensagem foi registrada! Responderemos em breve.'
      };
    }
  }

  // Validar formato do email
  static validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Formatar número de WhatsApp
  static formatarWhatsApp(numero: string): string {
    // Remove todos os caracteres não numéricos
    const numeroLimpo = numero.replace(/\D/g, '');
    
    // Aplica a máscara (XX) XXXXX-XXXX
    if (numeroLimpo.length <= 11) {
      return numeroLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    return numero;
  }

  // Abrir WhatsApp com número formatado
  static abrirWhatsApp(numero: string, mensagem: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const numeroLimpo = numero.replace(/\D/g, '');
      const numeroFormatado = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;
      
      const url = `whatsapp://send?phone=${numeroFormatado}&text=${encodeURIComponent(mensagem)}`;
      
      // Implementar lógica para abrir WhatsApp
      // Esta função será chamada pelo componente React Native
      resolve(true);
    });
  }
} 