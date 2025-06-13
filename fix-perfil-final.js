// Script para corrigir duplicações e chamadas diretas restantes no perfil.js
const fs = require('fs');

// Ler o arquivo perfil.js
let conteudo = fs.readFileSync('js/perfil.js', 'utf8');

console.log('🔧 Corrigindo duplicações e chamadas diretas...');

// 1. Corrigir duplicações firebaseModules.firebaseModules
const duplicacoes = [
    { de: /firebaseModules\.firebaseModules\./g, para: 'firebaseModules.' }
];

// 2. Corrigir chamadas diretas restantes
const chamadas_diretas = [
    { de: /\bdoc\(db,/g, para: 'firebaseModules.doc(db,' },
    { de: /\bdoc\(firebaseModules\.collection/g, para: 'firebaseModules.doc(firebaseModules.collection' },
    { de: /await updateDoc\(/g, para: 'await firebaseModules.updateDoc(' },
    { de: /await setDoc\(/g, para: 'await firebaseModules.setDoc(' },
    { de: /await addDoc\(/g, para: 'await firebaseModules.addDoc(' },
    { de: /await deleteDoc\(/g, para: 'await firebaseModules.deleteDoc(' }
];

let totalCorrecoes = 0;

// Aplicar correções de duplicação
duplicacoes.forEach((correcao, index) => {
    const matches = conteudo.match(correcao.de);
    if (matches) {
        console.log(`${index + 1}. Corrigindo ${matches.length} duplicações de "firebaseModules.firebaseModules"`);
        conteudo = conteudo.replace(correcao.de, correcao.para);
        totalCorrecoes += matches.length;
    }
});

// Aplicar correções de chamadas diretas
chamadas_diretas.forEach((correcao, index) => {
    const matches = conteudo.match(correcao.de);
    if (matches) {
        console.log(`${index + 3}. Corrigindo ${matches.length} chamadas diretas de "${correcao.de.source}"`);
        conteudo = conteudo.replace(correcao.de, correcao.para);
        totalCorrecoes += matches.length;
    }
});

// Salvar o arquivo corrigido
fs.writeFileSync('js/perfil.js', conteudo, 'utf8');

console.log(`✅ Arquivo corrigido! Total de ${totalCorrecoes} correções feitas.`);

// Verificar se ainda há problemas
const problemas = [
    'firebaseModules.firebaseModules.',
    'doc(db,',
    'doc(firebaseModules.collection',
    'await updateDoc(',
    'await setDoc(',
    'await addDoc(',
    'await deleteDoc('
];

console.log('\n🔍 Verificando se ainda há problemas...');
let encontrouProblemas = false;

problemas.forEach(problema => {
    if (conteudo.includes(problema)) {
        // Verificar se não é uma chamada correta
        if (problema === 'doc(firebaseModules.collection' || 
            problema.startsWith('await ') && conteudo.includes(`firebaseModules.${problema.replace('await ', '')}`)) {
            return; // Pular verificação se já está correto
        }
        console.log(`⚠️  Ainda há "${problema}" no código`);
        encontrouProblemas = true;
    }
});

if (!encontrouProblemas) {
    console.log('✅ Nenhum problema encontrado! O arquivo deve estar totalmente corrigido.');
    console.log('🚀 Agora teste o login novamente!');
} else {
    console.log('❌ Ainda há alguns problemas que precisam ser verificados.');
} 