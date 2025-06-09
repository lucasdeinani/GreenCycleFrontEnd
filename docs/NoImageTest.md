# Teste para Usuários sem Imagem de Perfil

## Cenário

Quando um usuário não possui imagem de perfil cadastrada, a API retorna:
```json
{
    "detail": "No ImagemPerfil matches the given query."
}
```

## Comportamento Esperado

✅ **Sistema deve automaticamente usar imagem padrão**
✅ **Não deve mostrar erro para o usuário**
✅ **Deve fazer log informativo no console**

## Implementação

### 1. **Detecção da Resposta**
```typescript
// No ImageService.getProfileImage()
const response = await axios.get(`${API_BASE_URL}/imagens-perfil/${userId}/`);

// Verificar se não há imagem cadastrada
if (response.data?.detail === "No ImagemPerfil matches the given query.") {
  console.log('📷 Usuário não possui imagem de perfil cadastrada');
  return DEFAULT_PROFILE_IMAGES[userType];
}
```

### 2. **Tratamento em Diferentes Cenários**
```typescript
// Cenário 1: Resposta com detail
response.data = {
  "detail": "No ImagemPerfil matches the given query."
}
// → Usar imagem padrão

// Cenário 2: Erro 404  
error.response.status = 404
// → Usar imagem padrão

// Cenário 3: Resposta com imagem
response.data = {
  "id_usuarios": 46,
  "imagem": "https://ik.imagekit.io/...",
  "file_id": "68462965b13a102537a489a7"
}
// → Usar imagem da API
```

## Como Testar

### **Teste 1: Usuário Novo (Sem Imagem)**
1. Criar um usuário novo na API
2. Fazer login no app
3. ✅ **Verificar**: Imagem padrão é exibida
4. ✅ **Verificar**: Console mostra: "📷 Usuário não possui imagem de perfil cadastrada"
5. ✅ **Verificar**: Não há erros ou crashes

### **Teste 2: Usuário com Imagem Deletada**
1. Usuário que tinha imagem, mas foi deletada
2. Tentar carregar a imagem
3. ✅ **Verificar**: API retorna `detail` com a mensagem
4. ✅ **Verificar**: Sistema usa imagem padrão
5. ✅ **Verificar**: UX permanece fluída

### **Teste 3: Transição Sem Imagem → Com Imagem**
1. Usuário inicialmente sem imagem (padrão)
2. Fazer upload de nova imagem
3. ✅ **Verificar**: Imagem atualiza de padrão para personalizada
4. ✅ **Verificar**: Sincronização funciona entre componentes

### **Teste 4: Transição Com Imagem → Sem Imagem**
1. Usuário com imagem personalizada
2. Deletar a imagem via API
3. Recarregar app ou componente
4. ✅ **Verificar**: Volta para imagem padrão
5. ✅ **Verificar**: Console mostra detecção correta

## Logs de Debug

### **Console quando não há imagem:**
```typescript
📷 Usuário não possui imagem de perfil cadastrada
```

### **Console quando há erro 404:**
```typescript
📷 Usuário não possui imagem de perfil (404)
```

### **Console quando há imagem:**
```typescript
✅ Upload bem-sucedido: {
  id_usuarios: 46,
  imagem: "https://ik.imagekit.io/9bdssn5scf/foto_perfil_lucas.cliente.jpg",
  file_id: "68462965b13a102537a489a7"
}
```

## Tratamento de Diferentes Tipos de Usuário

### **Cliente sem imagem:**
```typescript
// Retorna
return DEFAULT_PROFILE_IMAGES['client'];
// "https://images.unsplash.com/photo-1494790108377-be9c29b29330..."
```

### **Parceiro sem imagem:**
```typescript
// Retorna  
return DEFAULT_PROFILE_IMAGES['partner'];
// "https://images.unsplash.com/photo-1534528741775-53994a69daeb..."
```

## Interface Atualizada

### **ProfileImage com campo detail:**
```typescript
export interface ProfileImage {
  id?: number;
  id_usuarios: number;
  imagem: string;
  file_id: string;
  created_at?: string;
  updated_at?: string;
  detail?: string;  // 🆕 Campo para mensagens da API
}
```

## Fluxo Completo

### **Busca de Imagem:**
```
1. Verificar cache local
   ↓
2. Cache não existe → Buscar na API
   ↓
3. API Response Options:
   ├── { imagem: "url", file_id: "id" } → Usar imagem da API
   ├── { detail: "No ImagemPerfil matches..." } → Usar padrão
   └── 404 Error → Usar padrão
   ↓
4. Exibir resultado final
```

## Cenários de Erro vs Sem Imagem

### **❌ Erro Real (Rede/Server):**
- Conectividade perdida
- Servidor fora do ar
- Timeout de requisição
→ **Comportamento**: Usar cache local se existir, senão imagem padrão

### **✅ Sem Imagem (Normal):**
- `{ "detail": "No ImagemPerfil matches the given query." }`
- `404 Not Found`
→ **Comportamento**: Usar imagem padrão (comportamento esperado)

## Vantagens da Implementação

### ✅ **Robustez**
- Trata tanto resposta com `detail` quanto erro 404
- Logs informativos para debug
- Fallback consistente para imagem padrão

### ✅ **UX**
- Usuário nunca vê tela branca ou erro
- Imagem padrão sempre disponível
- Transições suaves entre estados

### ✅ **Manutenibilidade**
- Código claro e bem documentado
- Fácil debug com logs específicos
- Interface flexível para futuras mudanças

## Status: ✅ Implementado

O sistema agora detecta corretamente quando um usuário não possui imagem de perfil e automaticamente usa a imagem padrão apropriada, seja através da resposta `detail` ou erro 404. 