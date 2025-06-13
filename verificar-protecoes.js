#!/usr/bin/env node

// Script de verificação das proteções implementadas
// Execute com: node verificar-protecoes.js

const fs = require('fs');
const path = require('path');

console.log('🛡️ Verificando Proteções do Site Lorde Tempus');
console.log('=' .repeat(50));

// Verificar arquivos modificados
const arquivosParaVerificar = [
    'index.html',
    'js/main.js', 
    'js/campanhas.js'
];

let todasProtecoesPresentesEs = true;

arquivosParaVerificar.forEach(arquivo => {
    console.log(`\n📁 Verificando: ${arquivo}`);
    
    try {
        const conteudo = fs.readFileSync(arquivo, 'utf8');
        
        if (arquivo === 'index.html') {
            // Verificar correção na função animateCounter
            if (conteudo.includes('// Verificar se o elemento contém apenas números e o símbolo "+"')) {
                console.log('  ✅ Correção da animateCounter presente');
            } else {
                console.log('  ❌ Correção da animateCounter ausente');
                todasProtecoesPresentesEs = false;
            }
            
            if (conteudo.includes('if (!/^\\d+\\+?$/.test(originalText))')) {
                console.log('  ✅ Proteção contra caracteres especiais presente');
            } else {
                console.log('  ❌ Proteção contra caracteres especiais ausente'); 
                todasProtecoesPresentesEs = false;
            }
        }
        
        if (arquivo === 'js/main.js') {
            // Verificar função safeAnimateNumber
            if (conteudo.includes('function safeAnimateNumber(')) {
                console.log('  ✅ Função safeAnimateNumber presente');
            } else {
                console.log('  ❌ Função safeAnimateNumber ausente');
                todasProtecoesPresentesEs = false;
            }
            
            // Verificar função protectImportantElements
            if (conteudo.includes('function protectImportantElements(')) {
                console.log('  ✅ Função protectImportantElements presente');
            } else {
                console.log('  ❌ Função protectImportantElements ausente');
                todasProtecoesPresentesEs = false;
            }
            
            // Verificar ativação na inicialização
            if (conteudo.includes('protectImportantElements();')) {
                console.log('  ✅ Proteção ativada na inicialização');
            } else {
                console.log('  ❌ Proteção não ativada na inicialização');
                todasProtecoesPresentesEs = false;
            }
            
            // Verificar disponibilização global
            if (conteudo.includes('window.safeAnimateNumber = safeAnimateNumber;')) {
                console.log('  ✅ Função disponibilizada globalmente');
            } else {
                console.log('  ❌ Função não disponibilizada globalmente');
                todasProtecoesPresentesEs = false;
            }
        }
        
        if (arquivo === 'js/campanhas.js') {
            // Verificar uso da função segura
            if (conteudo.includes('window.safeAnimateNumber')) {
                console.log('  ✅ Uso da função segura presente');
            } else {
                console.log('  ❌ Uso da função segura ausente');
                todasProtecoesPresentesEs = false;
            }
            
            // Verificar proteção local
            if (conteudo.includes('🛡️ Proteção campanhas:')) {
                console.log('  ✅ Proteção local presente');
            } else {
                console.log('  ❌ Proteção local ausente');
                todasProtecoesPresentesEs = false;
            }
        }
        
    } catch (error) {
        console.log(`  ❌ Erro ao ler arquivo: ${error.message}`);
        todasProtecoesPresentesEs = false;
    }
});

// Verificar se arquivo de teste foi criado
console.log(`\n📁 Verificando: test-protection.html`);
if (fs.existsSync('test-protection.html')) {
    console.log('  ✅ Arquivo de teste criado');
} else {
    console.log('  ❌ Arquivo de teste não encontrado');
    todasProtecoesPresentesEs = false;
}

// Resultado final
console.log('\n' + '=' .repeat(50));
if (todasProtecoesPresentesEs) {
    console.log('🎉 SUCESSO: Todas as proteções estão implementadas!');
    console.log('');
    console.log('📋 Proteções ativas:');
    console.log('  • Função animateCounter corrigida no index.html');
    console.log('  • Função safeAnimateNumber global no main.js');  
    console.log('  • Função protectImportantElements no main.js');
    console.log('  • Proteção ativada automaticamente');
    console.log('  • Campanhas.js usando função segura');
    console.log('  • Arquivo de teste criado');
    console.log('');
    console.log('🌐 Acesse os seguintes URLs para testar:');
    console.log('  • http://localhost:8080/index.html');
    console.log('  • http://localhost:8080/test-protection.html');
} else {
    console.log('❌ ATENÇÃO: Algumas proteções estão ausentes!');
    console.log('Verifique os erros acima e reaplique as correções necessárias.');
}

console.log(''); 