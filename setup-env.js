// ==================== SCRIPT DE CONFIGURAÇÃO DO .ENV ==================== //
// Este script ajuda a configurar o arquivo .env necessário para o Firebase
// Execute este arquivo no Node.js ou copie o conteúdo manualmente

const fs = require('fs');
const path = require('path');

const envContent = `# ==================== CONFIGURAÇÃO DO FIREBASE - LORDE TEMPUS ==================== #
# Este arquivo contém as configurações necessárias para conectar com o Firebase
# IMPORTANTE: Nunca commite este arquivo no Git (deve estar no .gitignore)

# Configurações do Firebase Project: lordetempus-3be20
VITE_FIREBASE_API_KEY=AIzaSyD5v8k9kC3m7XHT2oN6uP4qL8sF1vB9cE
VITE_FIREBASE_AUTH_DOMAIN=lordetempus-3be20.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=lordetempus-3be20
VITE_FIREBASE_STORAGE_BUCKET=lordetempus-3be20.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=759824598929
VITE_FIREBASE_APP_ID=1:759824598929:web:995369b4c76dab2d777c30
VITE_FIREBASE_MEASUREMENT_ID=G-R710NDR8Q9

# ==================== INSTRUÇÕES ==================== #
# 1. Se você está vendo este arquivo, significa que o .env não existe
# 2. As configurações acima são baseadas nas encontradas no console
# 3. Após criar o .env, teste recarregando a página
# 4. Se houver problemas, verifique o console do navegador

# Configurações Opcionais
# NODE_ENV=development
`;

const envPath = path.join(process.cwd(), '.env');

try {
    // Verificar se .env já existe
    if (fs.existsSync(envPath)) {
        console.log('⚠️  Arquivo .env já existe!');
        console.log('📍 Localização:', envPath);
        
        // Ler conteúdo atual
        const currentContent = fs.readFileSync(envPath, 'utf8');
        console.log('📄 Conteúdo atual do .env:');
        console.log('--- INÍCIO ---');
        console.log(currentContent);
        console.log('--- FIM ---');
        
        // Verificar se VITE_FIREBASE_API_KEY existe
        if (!currentContent.includes('VITE_FIREBASE_API_KEY')) {
            console.log('❌ VITE_FIREBASE_API_KEY não encontrada no .env');
            console.log('💡 Adicione esta linha ao seu .env:');
            console.log('VITE_FIREBASE_API_KEY=AIzaSyD5v8k9kC3m7XHT2oN6uP4qL8sF1vB9cE');
        } else {
            console.log('✅ VITE_FIREBASE_API_KEY encontrada no .env');
        }
        
    } else {
        // Criar arquivo .env
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log('✅ Arquivo .env criado com sucesso!');
        console.log('📍 Localização:', envPath);
        console.log('🚀 Agora você pode recarregar a página para testar');
    }
    
} catch (error) {
    console.error('❌ Erro ao criar/verificar .env:', error.message);
    console.log('');
    console.log('🛠️  SOLUÇÃO MANUAL:');
    console.log('1. Crie um arquivo chamado ".env" na raiz do projeto');
    console.log('2. Adicione este conteúdo:');
    console.log('');
    console.log('--- COPIE O CONTEÚDO ABAIXO ---');
    console.log(envContent);
    console.log('--- FIM DO CONTEÚDO ---');
}

console.log('');
console.log('📋 PRÓXIMOS PASSOS:');
console.log('1. Verifique se o arquivo .env foi criado na raiz do projeto');
console.log('2. Recarregue a página do site');
console.log('3. Verifique o console do navegador para ver se o Firebase inicializou');
console.log('4. Se ainda houver problemas, verifique se o servidor de desenvolvimento está rodando'); 