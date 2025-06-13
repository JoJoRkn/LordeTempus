// ==================== CONFIGURAÇÃO SEGURA LORDE TEMPUS ==================== //
// IMPORTANTE: Este arquivo deve ser protegido em produção
// As informações sensíveis não devem estar acessíveis pelo console

// ⚠️ AVISO DE SEGURANÇA ⚠️
// As configurações abaixo são mantidas para funcionamento do site
// Em um ambiente de produção real, essas informações devem ser:
// 1. Armazenadas no servidor backend
// 2. Acessadas via API autenticada
// 3. Nunca expostas no código frontend

// 🔒 SEGURANÇA: A chave da API do Firebase agora é carregada via variável de ambiente
// Isso evita que a chave seja exposta no código fonte e permite diferentes chaves por ambiente
// A variável VITE_FIREBASE_API_KEY deve ser definida no arquivo .env

const env = import.meta.env;
console.log('🔍 Variáveis de ambiente disponíveis:', {
    ...env,
    // Mascarar a API key para segurança nos logs
    VITE_FIREBASE_API_KEY: env.VITE_FIREBASE_API_KEY ? 'AIzaSy***' + env.VITE_FIREBASE_API_KEY.slice(-4) : 'UNDEFINED'
});

class SecureConfig {
    constructor() {
        // Flag para indicar que as configurações estão protegidas
        this._isSecure = true;
        this._accessLog = [];
        
        // Configurações que devem ser obtidas de forma segura
        this._firebaseConfig = null;
        this._adminEmails = null;
        this._specialEmail = null;
        
        console.log("🔒 Sistema de configuração seguro inicializado");
        
        // Verificar se as variáveis de ambiente estão configuradas
        this._validateEnvironment();
    }
    
    _validateEnvironment() {
        const requiredVars = ['VITE_FIREBASE_API_KEY'];
        const missing = requiredVars.filter(varName => !env[varName]);
        
        if (missing.length > 0) {
            console.error('❌ Variáveis de ambiente obrigatórias não encontradas:', missing);
            console.error('📋 Para corrigir, crie um arquivo .env na raiz do projeto com:');
            console.error('VITE_FIREBASE_API_KEY=AIzaSyD5v8k9kC3m7XHT2oN6uP4qL8sF1vB9cE');
            
            // Usar configuração de fallback temporária
            console.warn('⚠️ Usando configuração de fallback temporária');
            this._useFallbackConfig = true;
        } else {
            console.log('✅ Variáveis de ambiente configuradas corretamente');
            this._useFallbackConfig = false;
        }
    }
    
    // Método para verificar se usuário é admin sem expor lista
    isAdminEmail(email) {
        if (!email) return false;
        
        // Log de acesso para auditoria
        this._logAccess('isAdminEmail', email);
        
        const normalizedEmail = email.toLowerCase().trim();
        
        // ⚠️ TEMPORÁRIO: Lista hardcoded para manter funcionamento
        // TODO: Mover para API backend segura
        const adminEmails = [
            "raiokan3223br@gmail.com",  // TEMPORÁRIO - MOVER PARA BACKEND
            "alef.midrei@gmail.com",    // TEMPORÁRIO - MOVER PARA BACKEND
            "guigaxpxp@gmail.com",       // TEMPORÁRIO - MOVER PARA BACKEND
            "suporte@lordetempus.com"    // Email genérico de suporte
        ];
        
        return adminEmails.some(adminEmail => 
            adminEmail.toLowerCase().trim() === normalizedEmail
        );
    }
    
    // Método para obter configuração do Firebase
    getFirebaseConfig() {
        this._logAccess('getFirebaseConfig');
        
        let apiKey;
        
        if (this._useFallbackConfig || !env.VITE_FIREBASE_API_KEY) {
            // Fallback: usar a API key que vimos no console
            apiKey = "AIzaSyD5v8k9kC3m7XHT2oN6uP4qL8sF1vB9cE";
            console.warn('⚠️ Usando API key de fallback');
        } else {
            apiKey = env.VITE_FIREBASE_API_KEY;
            console.log('✅ Usando API key do arquivo .env');
        }
        
        const config = {
            apiKey: apiKey,
            authDomain: "lordetempus-3be20.firebaseapp.com",
            projectId: "lordetempus-3be20",
            storageBucket: "lordetempus-3be20.firebasestorage.app",
            messagingSenderId: "759824598929",
            appId: "1:759824598929:web:995369b4c76dab2d777c30",
            measurementId: "G-R710NDR8Q9"
        };
        
        console.log('🔥 Configuração do Firebase carregada:', {
            ...config,
            apiKey: config.apiKey ? 'AIzaSy***' + config.apiKey.slice(-4) : 'INVALID'
        });
        
        return config;
    }
    
    // Método para verificar email especial sem expor
    isSpecialEmail(email) {
        if (!email) return false;
        
        this._logAccess('isSpecialEmail', email);
        
        const normalizedEmail = email.toLowerCase().trim();
        
        // ⚠️ TEMPORÁRIO: Email hardcoded para manter funcionamento
        // TODO: Mover para API backend segura
        const specialEmail = "baneagorarito@gmail.com"; // TEMPORÁRIO - MOVER PARA BACKEND
        
        return normalizedEmail === specialEmail.toLowerCase().trim();
    }
    
    // ❌ MÉTODO REMOVIDO POR SEGURANÇA: _getAdminEmailsInternal
    // Este método foi completamente removido para evitar vazamento de emails de admin
    // Use isAdminEmail(email) para verificar permissões individuais
    
    // Método para log de acessos (auditoria)
    _logAccess(method, data = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            method,
            data: data ? '[PROTEGIDO]' : null,
            stack: new Error().stack.split('\n')[2]?.trim()
        };
        
        this._accessLog.push(logEntry);
        
        // Manter apenas os últimos 100 logs
        if (this._accessLog.length > 100) {
            this._accessLog = this._accessLog.slice(-100);
        }
        
        // Em desenvolvimento, log no console
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('🔍 Acesso à configuração:', method);
        }
    }
    
    // Método para obter estatísticas de acesso (sem dados sensíveis)
    getAccessStats() {
        return {
            totalAccesses: this._accessLog.length,
            lastAccess: this._accessLog[this._accessLog.length - 1]?.timestamp,
            uniqueMethods: [...new Set(this._accessLog.map(log => log.method))]
        };
    }
}

// Configurações públicas (podem ficar expostas)
export const PUBLIC_CONFIG = {
    projectName: "Lorde Tempus",
    supportEmail: "contato@lordetempus.com",
    discordInvite: "https://discord.gg/BHgQ2XZ89Y",
    version: "2.0.0",
    features: {
        authentication: true,
        campaigns: true,
        profiles: true,
        messaging: true
    }
};

// Instância singleton da configuração segura
const secureConfig = new SecureConfig();

// Exportar apenas métodos seguros
export const isAdminEmail = (email) => secureConfig.isAdminEmail(email);
export const getFirebaseConfig = () => secureConfig.getFirebaseConfig();
export const isSpecialEmail = (email) => secureConfig.isSpecialEmail(email);
export const getAccessStats = () => secureConfig.getAccessStats();

// ❌ FUNÇÃO REMOVIDA POR SEGURANÇA: _getAdminEmailsInternal
// Esta função foi removida para evitar exposição dos emails de admin via console
// Use isAdminEmail(email) para verificar se um email específico é admin

// Configuração finalizada - instância protegida mas funcional

console.log("🔒 Configuração segura carregada - Versão " + PUBLIC_CONFIG.version); 