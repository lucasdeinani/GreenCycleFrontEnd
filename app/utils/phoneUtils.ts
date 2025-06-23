/**
 * Aplica máscara de telefone brasileiro
 * Suporta telefones fixos (10 dígitos) e celulares (11 dígitos)
 * @param value - Número de telefone sem formatação
 * @returns Telefone formatado
 */
export const formatPhone = (value: string): string => {
  // Remove todos os caracteres não numéricos e limita a 11 dígitos
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  
  let formattedPhone = '';
  
  if (cleaned.length === 0) {
      return '';
  } else if (cleaned.length === 1) {
      return `(${cleaned}`;
  } else if (cleaned.length === 2) {
      return `(${cleaned})`;
  } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  } else if (cleaned.length <= 10) {
      // Telefone fixo: (XX) XXXX-XXXX
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11) {
      // Celular: (XX) XXXXX-XXXX
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  
  return formattedPhone;
};

/**
 * Remove formatação do telefone
 * @param phone - Telefone formatado
 * @returns Apenas os números
 */
export const cleanPhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Valida se o telefone está em formato válido
 * @param phone - Telefone para validar
 * @returns true se válido, false caso contrário
 */
export const validatePhone = (phone: string): boolean => {
  const cleaned = cleanPhone(phone);
  
  // Deve ter 10 ou 11 dígitos
  if (cleaned.length !== 10 && cleaned.length !== 11) {
    return false;
  }
  
  // Se tem 11 dígitos (celular), deve começar com 9 após o DDD
  if (cleaned.length === 11 && cleaned[2] !== '9') {
    return false;
  }
  
  // Verifica se o DDD é válido (entre 11 e 99)
  const ddd = parseInt(cleaned.slice(0, 2));
  if (ddd < 11 || ddd > 99) {
    return false;
  }
  
  return true;
};

/**
 * Retorna mensagem de erro para telefone inválido
 * @param phone - Telefone para validar
 * @returns Mensagem de erro ou null se válido
 */
export const getPhoneError = (phone: string): string | null => {
  if (!phone || !phone.trim()) {
    return null; // Telefone é opcional na maioria dos casos
  }
  
  const cleaned = cleanPhone(phone);
  
  if (cleaned.length < 10) {
    return 'Telefone deve ter pelo menos 10 dígitos';
  }
  
  if (cleaned.length > 11) {
    return 'Telefone deve ter no máximo 11 dígitos';
  }
  
  if (cleaned.length === 11 && cleaned[2] !== '9') {
    return 'Número de celular deve começar com 9 após o DDD';
  }
  
  const ddd = parseInt(cleaned.slice(0, 2));
  if (isNaN(ddd) || ddd < 11 || ddd > 99) {
    return 'DDD inválido';
  }
  
  return null;
};

/**
 * Formata telefone em tempo real conforme o usuário digita
 * @param value - Valor atual do input
 * @returns Valor formatado
 */
export const formatPhoneInput = (value: string): string => {
  return formatPhone(value);
};

/* 
 * TESTES DE VALIDAÇÃO - Para depuração apenas
 * 
 * console.log('=== TESTES PHONE UTILS ===');
 * console.log('formatPhone("11999887766"):', formatPhone("11999887766")); // (11) 99988-7766
 * console.log('formatPhone("1133334444"):', formatPhone("1133334444"));   // (11) 3333-4444
 * console.log('cleanPhone("(11) 99988-7766"):', cleanPhone("(11) 99988-7766")); // 11999887766
 * console.log('validatePhone("(11) 99988-7766"):', validatePhone("(11) 99988-7766")); // true
 * console.log('getPhoneError("11999887766"):', getPhoneError("11999887766")); // null
 * console.log('getPhoneError("119998877"):', getPhoneError("119998877")); // Telefone deve ter...
 */ 