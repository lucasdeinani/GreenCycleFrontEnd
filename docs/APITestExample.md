# Teste da API de Imagens de Perfil

## Formato Correto de Upload

### FormData Esperado pela API:
```json
{
    "id_usuarios": "123",
    "imagem": [arquivo_binario]
}
```

### Resposta da API após Upload:
```json
{
    "id_usuarios": 46,
    "imagem": "https://ik.imagekit.io/9bdssn5scf/foto_perfil_lucas.cliente.jpg",
    "file_id": "68462965b13a102537a489a7"
}
```

**Campos na resposta:**
- `id_usuarios`: ID do usuário (number)
- `imagem`: URL da imagem hospedada no ImageKit (string)
- `file_id`: ID único do arquivo no ImageKit (string)

### Implementação no ImageService:
```typescript
// services/ImageService.ts - uploadProfileImage()
const formData = new FormData();
formData.append('id_usuarios', userId.toString()); // ✅ Campo correto (plural)
formData.append('imagem', {
  uri: imageUri,
  type: 'image/jpeg',
  name: `profile_${userId}.jpg`,
} as any);
```

### Exemplo de Teste Manual:

```typescript
// Para testar o upload manualmente
import { ImageService } from '../services/ImageService';

const testUpload = async () => {
  const userId = 123; // ID do usuário
  const imageUri = 'file:///path/to/image.jpg'; // URI da imagem
  
  console.log('Testando upload para usuário:', userId);
  console.log('URI da imagem:', imageUri);
  
  try {
    const success = await ImageService.uploadProfileImage(userId, imageUri);
    
    if (success) {
      console.log('✅ Upload realizado com sucesso!');
    } else {
      console.log('❌ Falha no upload');
    }
  } catch (error) {
    console.error('❌ Erro durante upload:', error);
  }
};
```

### Headers da Requisição:
```typescript
{
  'Content-Type': 'multipart/form-data',
}
```

### Endpoints da API:
- **POST** `/v1/imagens-perfil/` - Upload de nova imagem
- **DELETE** `/v1/imagens-perfil/{id_usuario}/` - Deletar imagem existente
- **GET** `/v1/imagens-perfil/{id_usuario}/` - Buscar imagem específica

### Fluxo de Atualização:
1. **DELETE** - Remove imagem existente (se houver)
2. **POST** - Faz upload da nova imagem
3. **Cache** - Limpa cache local
4. **Reload** - Recarrega imagem na interface

### Debug de Upload:
```typescript
// Adicionar logs para debug
console.log('FormData fields:');
console.log('- id_usuarios:', userId);
console.log('- imagem type:', 'image/jpeg');
console.log('- imagem name:', `profile_${userId}.jpg`);
console.log('- endpoint:', `${API_BASE_URL}/imagens-perfil/`);
```

### Possíveis Erros e Soluções:

1. **400 Bad Request** - Campo `id_usuarios` ausente ou formato incorreto
2. **413 Payload Too Large** - Imagem muito grande (reduzir quality)
3. **415 Unsupported Media Type** - Content-Type incorreto
4. **500 Internal Server Error** - Verificar logs do backend

### Teste de Conectividade:
```bash
# Testar se a API está rodando
curl -X GET http://192.168.0.86:8000/v1/imagens-perfil/

# Testar upload via curl (exemplo)
curl -X POST http://192.168.0.86:8000/v1/imagens-perfil/ \
  -F "id_usuarios=123" \
  -F "imagem=@/path/to/image.jpg"
```

## Status: ✅ Corrigido

O formato de upload foi atualizado para usar `id_usuarios` (plural) conforme especificação da API. 